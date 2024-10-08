// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: user-secret;
/**
 * Scriptable scripts store
 *
 * @version 1.0.2
 * @author Honye
 */

/**
 * @file Scriptable WebView JSBridge native SDK
 * @version 1.0.3
 * @author Honye
 */

/**
 * @typedef Options
 * @property {Record<string, () => void>} methods
 */

const sendResult = (() => {
  let sending = false;
  /** @type {{ code: string; data: any }[]} */
  const list = [];

  /**
   * @param {WebView} webView
   * @param {string} code
   * @param {any} data
   */
  return async (webView, code, data) => {
    if (sending) return

    sending = true;
    list.push({ code, data });
    const arr = list.splice(0, list.length);
    for (const { code, data } of arr) {
      const eventName = `ScriptableBridge_${code}_Result`;
      const res = data instanceof Error ? { err: data.message } : data;
      await webView.evaluateJavaScript(
        `window.dispatchEvent(
          new CustomEvent(
            '${eventName}',
            { detail: ${JSON.stringify(res)} }
          )
        )`
      );
    }
    if (list.length) {
      const { code, data } = list.shift();
      sendResult(webView, code, data);
    } else {
      sending = false;
    }
  }
})();

/**
 * @param {WebView} webView
 * @param {Options} options
 */
const inject = async (webView, options) => {
  const js =
`(() => {
  const queue = window.__scriptable_bridge_queue
  if (queue && queue.length) {
    completion(queue)
  }
  window.__scriptable_bridge_queue = null

  if (!window.ScriptableBridge) {
    window.ScriptableBridge = {
      invoke(name, data, callback) {
        const detail = { code: name, data }

        const eventName = \`ScriptableBridge_\${name}_Result\`
        const controller = new AbortController()
        window.addEventListener(
          eventName,
          (e) => {
            callback && callback(e.detail)
            controller.abort()
          },
          { signal: controller.signal }
        )

        if (window.__scriptable_bridge_queue) {
          window.__scriptable_bridge_queue.push(detail)
          completion()
        } else {
          completion(detail)
          window.__scriptable_bridge_queue = []
        }
      }
    }
    window.dispatchEvent(
      new CustomEvent('ScriptableBridgeReady')
    )
  }
})()`;

  const res = await webView.evaluateJavaScript(js, true);
  if (!res) return inject(webView, options)

  const methods = options.methods || {};
  const events = Array.isArray(res) ? res : [res];
  // 同时执行多次 webView.evaluateJavaScript Scriptable 存在问题
  // 可能是因为 JavaScript 是单线程导致的
  const sendTasks = events.map(({ code, data }) => {
    return (() => {
      try {
        return Promise.resolve(methods[code](data))
      } catch (e) {
        return Promise.reject(e)
      }
    })()
      .then((res) => sendResult(webView, code, res))
      .catch((e) => {
        console.error(e);
        sendResult(webView, code, e instanceof Error ? e : new Error(e));
      })
  });
  await Promise.all(sendTasks);
  inject(webView, options);
};

/**
 * @param {WebView} webView
 * @param {string} url
 * @param {Options} options
 */
const loadURL = async (webView, url, options = {}) => {
  await webView.loadURL(url);
  inject(webView, options).catch((err) => console.error(err));
};

const filePath = module.filename;
const appRoot = filePath.substring(0, filePath.lastIndexOf('/'));
const iCloudManager = FileManager.iCloud();
const fs = iCloudManager.isFileStoredIniCloud(filePath) ? iCloudManager : FileManager.local();
const modulesRoot = fs.libraryDirectory();

const url = 'https://scriptore.imarkr.com/';

/**
 * @param {{[language: string]: string} | string[]} langs
 */
const i18n = (langs) => {
  const language = Device.language();
  if (Array.isArray(langs)) {
    langs = {
      en: langs[0],
      zh: langs[1],
      others: langs[0]
    };
  } else {
    langs.others = langs.others || langs.en;
  }
  return langs[language] || langs.others
};

/**
 * download and install script from the url
 *
 * @param {string} url url of the script
 * @param {object} options
 * @param {string} [options.name] file name with extension name
 * @param {boolean} [options.override] weather override the existed file
 * @param {string} [options.dir] where directory the file would save
 * @returns {Promise<boolean>} false: user canceled
 */
async function installByURL (url, options = {}) {
  const { override, name, dir } = {
    override: false,
    ...options
  };

  const blobRegxp = /^https:\/\/github\.com\/(.+)\/blob\/(.+\.js$)/;
  if (blobRegxp.test(url)) {
    url = url.replace(blobRegxp, 'https://raw.githubusercontent.com/$1/$2');
  }

  const request = new Request(url);
  const text = await request.loadString()
    .catch(async (e) => {
      console.error(e);
      const notification = new Notification();
      notification.title = Script.name();
      notification.body = e.toString();
      await notification.schedule();
      throw e
    });
  const fileName = name || decodeURIComponent(url.split('/').pop().replace(/([^?#]+)([?#].*)*/, '$1'));
  let filePath = `${dir || appRoot}/${fileName}`;
  if (fs.fileExists(filePath) && !override) {
    const alert = new Alert();
    alert.message = i18n([
      `${fileName} existed, please rename`,
      `${fileName} 已存在，请重命名`
    ]);
    alert.addTextField(
      i18n(['new file name', '新文件名']),
      fs.fileName(filePath) + '1'
    );
    alert.addAction(i18n(['Save', '保存']));
    alert.addCancelAction(i18n(['Cancel', '取消']));
    const num = await alert.present();
    if (num === -1) return false
    const newName = alert.textFieldValue(0);
    if (newName) {
      filePath = `${appRoot}/${newName}.js`;
    } else {
      return false
    }
  }
  fs.writeString(filePath, text);
  return true
}

/**
 * Install the script on Scriptore
 * @param {object} script
 * @param {string} script.name
 * @param {string[]} script.files
 * @param {Record<string, string>} [script.dependencies]
 * @param {object} options
 * @param {boolean} [options.update = false]
 */
const installScript = async (script, options = {}) => {
  const { files, dependencies = {} } = script;
  const { update = false } = options;
  /** @type {Promise[]} */
  const promises = [];
  // install dependencies
  for (const name in dependencies) {
    promises.push(
      installByURL(dependencies[name], {
        name: `${name}.js`,
        override: true,
        dir: modulesRoot
      })
    );
  }
  for (const url of files) {
    promises.push(
      installByURL(url, { override: update })
        .then((isOK) => isOK || Promise.reject(new Error('canceled')))
    );
  }
  await Promise.all(promises)
    .catch((e) => console.warn(e));
  return script
};

const webView = new WebView();

const methods = {
  install (data) {
    return installScript(data)
  },
  getInstalled () {
    const contents = fs.listContents(appRoot);
    const list = [];
    for (const name of contents) {
      if (name.match(/(.*)\.js$/)) {
        const content = fs.readString(fs.joinPath(appRoot, name));
        const matches = content.match(/@version\s(\d+.\d+.\d+)/);
        list.push({
          name,
          version: matches ? matches[1] : '0.0.0'
        });
        ({
          name,
          version: matches ? matches[1] : '0.0.0'
        });
      }
    }
    return list
  },
  updateScript (data) {
    return installScript(data, { update: true })
  },
  safari (url) {
    Safari.openInApp(url, true);
  }
};

const query = args.queryParameters;
const fileURL = query && query.url;
if (fileURL) {
  installByURL(fileURL);
} else {
  await loadURL(webView, url, { methods });
  webView.present(true);
}
