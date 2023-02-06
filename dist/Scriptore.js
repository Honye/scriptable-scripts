// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: user-secret;
/**
 * Scriptable scripts store
 *
 * @version 0.2.1
 * @author Honye
 */

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

async function genAlert (message) {
  const _alert = new Alert();
  _alert.message = message;
  return _alert.presentAlert()
}

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
  const { name, files, dependencies = {} } = script;
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
    .then(() => {
      genAlert(i18n([
          `${name} installed success`,
          `${name} 安装成功`
      ]));
    })
    .catch((e) => console.warn(e));
  notifyWeb('install-success', script);
};

const webView = new WebView();

const notifyWeb = (code, data) => {
  webView.evaluateJavaScript(
    `window.dispatchEvent(
      new CustomEvent('JWeb', {
        detail: { code: '${code}', data: ${JSON.stringify(data)} }
      })
    )`,
    false
  );
};

const methods = {
  async install (data) {
    await installScript(data);
  },
  getInstalled () {
    const contents = fs.listContents(appRoot);
    const list = [];
    const map = {};
    for (const name of contents) {
      if (name.match(/(.*)\.js$/)) {
        const content = fs.readString(fs.joinPath(appRoot, name));
        const matches = content.match(/@version\s(\d+.\d+.\d+)/);
        list.push({
          name,
          version: matches ? matches[1] : '0.0.0'
        });
        map[name] = {
          name,
          version: matches ? matches[1] : '0.0.0'
        };
      }
    }
    webView.evaluateJavaScript(
      `window.dispatchEvent(
        new CustomEvent('postInstalled', {
          detail: ${JSON.stringify(list)}
        })
      )`
    );
    return map
  },
  async updateScript (data) {
    await installScript(data, { update: true });
  },
  safari (url) {
    Safari.openInApp(url, true);
  }
};

const injectListener = async () => {
  /** @type {{ code: string; data: any }} */
  const event = await webView.evaluateJavaScript(
    `(() => {
      const controller = new AbortController()
      const listener = (e) => {
        completion(e.detail)
        controller.abort()
      }
      window.addEventListener(
        'JBridge',
        listener,
        { signal: controller.signal }
      )
    })()`,
    true
  );
  const { code, data } = event;
  await methods[code]?.(data);
  injectListener();
};

await webView.loadURL(url);

injectListener().catch((e) => console.error(e));

webView.present(true);
