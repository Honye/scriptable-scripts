// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: folder-open; icon-color: red;
/**
 * Clean files
 *
 * @version 2.2.0
 * @author Honye
 */

/**
 * 多语言国际化
 * @param {{[language: string]: string} | [en:string, zh:string]} langs
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
 * @param {object} args
 * @param {string} args.html
 * @param {string} [args.baseURL]
 * @param {Options} options
 */
const loadHTML = async (webView, args, options = {}) => {
  const { html, baseURL } = args;
  await webView.loadHTML(html, baseURL);
  inject(webView, options).catch((err) => console.error(err));
};

const fm = FileManager.local();

/**
 * @param {string[]} fileURLs
 * @param {string} destPath
 */
const copyFiles = async (fileURLs, destPath) => {
  let isReplaceAll = false;
  const fm = FileManager.local();
  for (const fileURL of fileURLs) {
    const fileName = fm.fileName(fileURL, true);
    const filePath = fm.joinPath(destPath, fileName);
    if (fm.fileExists(filePath)) {
      if (isReplaceAll) {
        fm.remove(filePath);
      } else {
        const alert = new Alert();
        alert.message = `“${fileName}”已存在，是否替换？`;
        const actions = ['全是', '是', '否'];
        for (const action of actions) alert.addAction(action);
        alert.addCancelAction('取消');
        const value = await alert.present();
        switch (actions[value]) {
          case '全是':
            isReplaceAll = true;
            fm.remove(filePath);
            break
          case '是':
            fm.remove(filePath);
            break
          case '否':
            continue
          default: // 取消
            return
        }
      }
    }
    fm.copy(fileURL, filePath);
  }
  const alert = new Alert();
  alert.title = '导入成功';
  alert.message = '重新进入此目录可查看';
  alert.addCancelAction('好的');
  await alert.present();
};

/**
 * @param {string} destPath 输出目录
 */
const importFiles = async (destPath) => {
  let fileURLs = args.fileURLs;
  if (!fileURLs.length) {
    try {
      fileURLs = await DocumentPicker.open();
    } catch (e) {
      // 用户取消
      return
    }
  }
  await copyFiles(fileURLs, destPath);
};

/**
 * @param {object} options
 * @param {string} options.title
 * @param {File[]} options.list
 * @param {string} [options.directory]
 */
const presentList = async (options) => {
  const { title, list, directory } = options;
  const webView = new WebView();
  const css =
  `:root {
    --color-primary: #007aff;
    --divider-color: rgba(60,60,67,0.36);
    --card-background: #fff;
    --card-radius: 10px;
    --list-header-color: rgba(60,60,67,0.6);
  }
  * {
    -webkit-user-select: none;
    user-select: none;
  }
  body {
    margin: 0;
    -webkit-font-smoothing: antialiased;
    font-family: "SF Pro Display","SF Pro Icons","Helvetica Neue","Helvetica","Arial",sans-serif;
    min-height: 100vh;
    box-sizing: border-box;
    accent-color: var(--color-primary);
    padding-top: env(safe-area-inset-top);
  }
  .header {
    position: sticky;
    z-index: 99;
    top: env(safe-area-inset-top);
    left: 0;
    right: 0;
    height: 3.5rem;
    text-align: center;
    background: var(--card-background);
    display: flex;
    align-items: center;
    padding: 0 1rem;
  }
  .header__left,
  .header__right {
    flex: 1;
    min-width: 6rem;
  }
  .header__left {
    text-align: left;
  }
  .header__right {
    text-align: right;
  }
  .header__btn,
  .select-all,
  .select {
    font-size: 0.875rem;
  }
  .title {
    font-size: 1.125rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .list {
    padding: 0;
    margin: 0;
    list-style: none;
  }
  .icon-yuan {
    color: #666;
  }
  .icon-gouxuan {
    color: var(--color-primary);
  }
  .item {
    padding-left: 1rem;
  }
  .item,
  .item__body {
    flex: 1;
    display: flex;
    align-items: center;
    overflow: hidden;
  }
  .item__selection {
    font-size: 0;
    transition: all .3s;
  }
  .item__icon {
    margin-right: 0.625rem;
    font-size: 2.5rem;
    color: var(--color-primary);
  }
  .item__name {
    color: #222;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .item[data-is-directory="1"] .item__name {
    color: var(--color-primary);
  }
  .item__content {
    flex: 1;
    padding: 0.75rem 0;
    border-bottom: 0.5px solid var(--divider-color);
  }
  .item__info {
    margin-top: 0.3rem;
    font-size: 0.75rem;
    color: #666;
  }
  .list-select .item__selection {
    margin-right: 0.5rem;
    font-size: 1.5rem;
  }
  .fixed-bottom {
    position: fixed;
    z-index: 10;
    bottom: 0;
    left: 0;
    right: 0;
    padding-bottom: env(safe-area-inset-bottom);
    background: indianred;
    transform: translateY(100%);
    transition: all 0.25s;
  }
  .btn-del {
    margin: 0;
    display: block;
    width: 100%;
    height: 2.75rem;
    border: none;
    font-size: 1.125rem;
    color: #fff;
    background: indianred;
    padding: 0;
  }
  .fixed-bottom.show {
    transform: translateY(0);
  }
  .bottom-holder {
    margin-top: 2rem;
    box-sizing: content-box;
    height: 2.75rem;
    padding-bottom: env(safe-area-inset-bottom);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --divider-color: rgba(84,84,88,0.65);
      --card-background: #1c1c1e;
      --list-header-color: rgba(235,235,245,0.6);
    }
    body {
      background: #000;
      color: #fff;
    }
    .item__name {
      color: white;
    }
    .item[data-is-directory="1"] .item__name {
      color: #8aefef;
    }
  }`;

  const js =
  `window.invoke = (code, data) => {
    ScriptableBridge.invoke(code, data)
  }

  const isSelectMode = () => {
    return document.querySelector('.list').classList.contains('list-select')
  }

  const removeItems = (items) => {
    const list = document.querySelector('.list')
    for (const item of items) {
      const el = document.querySelector(\`.item[data-name="\${item.name}"]\`)
      el.parentNode.remove()
    }
  }
  
  document.querySelector('.select').addEventListener('click', (e) => {
    /** @type {HTMLButtonElement} */
    const target = e.currentTarget
    target.innerText = target.innerText === '选择' ? '完成' : '选择'
  
    document.querySelector('.select-all').toggleAttribute('hidden')
    document.querySelector('#import')?.toggleAttribute('hidden')
    document.querySelector('.list').classList.toggle('list-select')
    document.querySelector('.fixed-bottom').classList.toggle('show')
  })
  
  document.querySelectorAll('.item')
    .forEach((el) => {
      el.addEventListener('click', (e) => {
        const target = e.currentTarget
        if (isSelectMode()) {
          /** @type {HTMLElement} */
          const selection = target.querySelector('.item__selection')
          const isSelected = selection.classList.contains('icon-gouxuan')
          if (isSelected) {
            selection.classList.replace('icon-gouxuan', 'icon-yuan')
          } else {
            selection.classList.replace('icon-yuan', 'icon-gouxuan')
          }
        } else {
          const { name } = target.dataset
          invoke('view', JSON.parse(JSON.stringify(target.dataset)))
        }
      })
    })

  document.querySelector('.select-all').addEventListener('click', (e) => {
    /** @type {HTMLButtonElement} */
    const target = e.currentTarget
    const isSelected = target.innerText === '取消全选'
    target.innerText = isSelected ? '全选' : '取消全选'
    document.querySelectorAll('.item__selection').forEach((e) => {
      if (isSelected) {
        e.classList.replace('icon-gouxuan', 'icon-yuan')
      } else {
        e.classList.replace('icon-yuan', 'icon-gouxuan')
      }
    })
  })

  document.querySelector('.fixed-bottom').addEventListener('click', () => {
    const selectedItems = []
    for (const el of document.querySelectorAll('.icon-gouxuan')) {
      selectedItems.push({ ...el.parentNode.dataset })
    }
    invoke('remove', selectedItems)
  })

  window.addEventListener('JWeb', (e) => {
    const { code, data } = e.detail
    switch (code) {
      case 'remove-success':
        removeItems(JSON.parse(data))
        break;
    }
  })`;

  const html =
  `<!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>${title}</title>
    <link rel="stylesheet" href="//at.alicdn.com/t/c/font_3772663_0lvf7sx0ati.css">
    <style>${css}</style>
  </head>
  <body>
    <div class="header">
      <div class="header__left">
        <button class="select-all" hidden>全选</button>
        ${directory
          ? '<button id="import" class="header__btn" onclick="invoke(\'import\')">导入</button>'
          : ''
        }
      </div>
      <h3 class="title">${title}</h3>
      <div class="header__right">
        <button class="select">选择</button>
      </div>
    </div>
    <ul class="list">
    ${list.map((file) => (
      `<li>
        <div class="item" data-name="${file.name}"
          data-is-directory="${Number(file.isDirectory)}"
          data-file-path="${file.filePath}"
        >
          <i class="iconfont icon-yuan item__selection"></i>
          <div class="item__body">
            <i class="iconfont ${file.isDirectory ? 'icon-folder-close' : 'icon-doc'} item__icon"></i>
            <div class="item__content">
              <div class="item__name">${file.name}</div>
              ${file.info ? `<div class="item__info">${file.info}</div>` : ''}
            </div>
          </div>
        </div>
      </li>`
    )).join('')}
    </ul>
    <div class="bottom-holder"></div>
    <div class="fixed-bottom">
      <button class="btn-del">删除</button>
    </div>
    <script>${js}</script>
  </body>
  </html>`;

  const view = async (data) => {
    const { isDirectory, filePath, name } = data;
    if (Number(isDirectory)) {
      const unit = i18n(['items', '项']);
      const list = fm.listContents(filePath)
        .map((name) => {
          const path = fm.joinPath(filePath, name);
          const isDirectory = fm.isDirectory(path);
          const date = fm.modificationDate(path).toLocaleDateString('zh-CN');
          const size = fm.fileSize(path);
          return {
            name,
            info: isDirectory
              ? `${date} - ${fm.listContents(path).length} ${unit}`
              : `${date} - ${size > 1024 ? `${(size / 1024).toFixed(1)} MB` : `${size} KB`}`,
            filePath: path,
            isDirectory
          }
        });
      presentList({
        title: name,
        list,
        directory: filePath
      });
    } else {
      if (!fm.isFileDownloaded(filePath)) {
        await fm.downloadFileFromiCloud(filePath);
      }
      if (/.(js|json)$/.test(filePath)) {
        QuickLook.present(filePath);
        return
      }
      if (/.(jpg|jpeg|gif|png|heic|heif|webp)$/i.test(filePath)) {
        QuickLook.present(filePath, false);
        return
      }
      try {
        const image = fm.readImage(filePath);
        QuickLook.present(image, false);
        return
      } catch (e) {
        console.warn(e);
      }
      try {
        const text = fm.readString(filePath);
        QuickLook.present(text);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const remove = async (list) => {
    for (const file of list) {
      fm.remove(file.filePath);
    }
    webView.evaluateJavaScript(
      `window.dispatchEvent(new CustomEvent(
        'JWeb',
        { detail: {
          code: 'remove-success',
          data: '${JSON.stringify(list)}'
        } }
      ))`,
      false
    );
  };

  await loadHTML(
    webView,
    {
      html,
      baseURL: 'https://www.imarkr.com'
    },
    {
      methods: {
        view,
        remove,
        import: () => importFiles(directory)
      }
    }
  );
  webView.present();
};

presentList({
  title: 'Clean Files',
  list: [
    {
      name: i18n(['Local cache directory', '本地缓存']),
      filePath: FileManager.local().cacheDirectory(),
      isDirectory: true
    },
    {
      name: i18n(['Local documents directory', '本地文件']),
      filePath: FileManager.local().documentsDirectory(),
      isDirectory: true
    },
    {
      name: i18n(['Local library directory', '本地库存']),
      filePath: FileManager.local().libraryDirectory(),
      isDirectory: true
    },
    {
      name: i18n(['Local temporary directory', '本地暂存']),
      filePath: FileManager.local().temporaryDirectory(),
      isDirectory: true
    },
    {
      name: i18n(['iCloud document directory', 'iCloud 文件']),
      filePath: FileManager.iCloud().documentsDirectory(),
      isDirectory: true
    },
    {
      name: i18n(['iCloud library directory', 'iCloud 库存']),
      filePath: FileManager.iCloud().libraryDirectory(),
      isDirectory: true
    }
  ]
});

/**
 * @typedef {object} File
 * @property {string} File.name
 * @property {string} [File.info]
 * @property {string} File.filePath
 * @property {boolean} File.isDirectory
 */
