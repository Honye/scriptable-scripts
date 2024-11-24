// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: mobile-alt; icon-color: red;
/**
 * 湖北联通余额信息展示
 * 原创 UI，修改套用请注明来源
 *
 * @version 2.0.0
 * @author Honye
 */

/**
 * @version 1.2.2
 */


/**
 * @returns {Record<'small'|'medium'|'large'|'extraLarge', number>}
 */
const widgetSize = () => {
  const phones = {
    /** 16 Pro Max */
    956: { small: 170, medium: 364, large: 382 },
    /** 16 Pro */
    874: { small: 162, medium: 344, large: 366 },
    /** 16 Plus, 15 Pro Max, 15 Plus, 14 Pro Max */
    932: { small: 170, medium: 364, large: 382 },
    /** 13 Pro Max, 12 Pro Max */
    926: { small: 170, medium: 364, large: 382 },
    /** 11 Pro Max, 11, XS Max, XR */
    896: { small: 169, medium: 360, large: 379 },
    /** Plus phones */
    736: { small: 157, medium: 348, large: 357 },
    /** 16, 15 Pro, 15, 14 Pro */
    852: { small: 158, medium: 338, large: 354 },
    /** 13, 13 Pro, 12, 12 Pro */
    844: { small: 158, medium: 338, large: 354 },
    /** 13 mini, 12 mini / 11 Pro, XS, X */
    812: { small: 155, medium: 329, large: 345 },
    /** SE2 and 6/6S/7/8 */
    667: { small: 148, medium: 321, large: 324 },
    /** iPad Pro 2 */
    1194: { small: 155, medium: 342, large: 342, extraLarge: 715.5 },
    /** iPad 6 */
    1024: { small: 141, medium: 305.5, large: 305.5, extraLarge: 634.5 }
  };
  let { width, height } = Device.screenSize();
  if (width > height) height = width;

  if (phones[height]) return phones[height]

  if (config.runsInWidget) {
    const pc = { small: 164, medium: 344, large: 344 };
    return pc
  }

  // in app screen fixed 375x812 pt
  return { small: 155, medium: 329, large: 329 }
};

/**
 * @param {number} num
 */
const vw = (num) => {
  const family = config.widgetFamily || 'small';
  if (!family) throw new Error('`vw` only work in widget')
  const size = widgetSize();
  const width = size[family === 'large' ? 'medium' : family];
  return num * width / 100
};

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
 * 获取网络图片
 * @param {string} url
 */
const getImage = async (url) => {
  const request = new Request(url);
  const image = await request.loadImage();
  return image
};

/**
 * @param {...string} paths
 */
const joinPath = (...paths) => {
  const fm = FileManager.local();
  return paths.reduce((prev, curr) => {
    return fm.joinPath(prev, curr)
  }, '')
};

/**
 * 规范使用 FileManager。每个脚本使用独立文件夹
 *
 * 注意：桌面组件无法写入 cacheDirectory 和 temporaryDirectory
 * @param {object} options
 * @param {boolean} [options.useICloud]
 * @param {string} [options.basePath]
 */
const useFileManager = (options = {}) => {
  const { useICloud, basePath } = options;
  const fm = useICloud ? FileManager.iCloud() : FileManager.local();
  const paths = [fm.documentsDirectory(), Script.name()];
  if (basePath) {
    paths.push(basePath);
  }
  const cacheDirectory = joinPath(...paths);
  /**
   * 删除路径末尾所有的 /
   * @param {string} filePath
   */
  const safePath = (filePath) => {
    return fm.joinPath(cacheDirectory, filePath).replace(/\/+$/, '')
  };
  /**
   * 如果上级文件夹不存在，则先创建文件夹
   * @param {string} filePath
   */
  const preWrite = (filePath) => {
    const i = filePath.lastIndexOf('/');
    const directory = filePath.substring(0, i);
    if (!fm.fileExists(directory)) {
      fm.createDirectory(directory, true);
    }
  };

  const writeString = (filePath, content) => {
    const nextPath = safePath(filePath);
    preWrite(nextPath);
    fm.writeString(nextPath, content);
  };

  /**
   * @param {string} filePath
   * @param {*} jsonData
   */
  const writeJSON = (filePath, jsonData) => writeString(filePath, JSON.stringify(jsonData));
  /**
   * @param {string} filePath
   * @param {Image} image
   */
  const writeImage = (filePath, image) => {
    const nextPath = safePath(filePath);
    preWrite(nextPath);
    return fm.writeImage(nextPath, image)
  };

  /**
   * 文件不存在时返回 null
   * @param {string} filePath
   * @returns {string|null}
   */
  const readString = (filePath) => {
    const fullPath = fm.joinPath(cacheDirectory, filePath);
    if (fm.fileExists(fullPath)) {
      return fm.readString(
        fm.joinPath(cacheDirectory, filePath)
      )
    }
    return null
  };

  /**
   * @param {string} filePath
   */
  const readJSON = (filePath) => JSON.parse(readString(filePath));

  /**
   * @param {string} filePath
   */
  const readImage = (filePath) => {
    const fullPath = safePath(filePath);
    if (fm.fileExists(fullPath)) {
      return fm.readImage(fullPath)
    }
    return null
  };

  return {
    cacheDirectory,
    writeString,
    writeJSON,
    writeImage,
    readString,
    readJSON,
    readImage
  }
};

/** 规范使用文件缓存。每个脚本使用独立文件夹 */
const useCache = () => useFileManager({ basePath: 'cache' });

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

/**
 * 轻松实现桌面组件可视化配置
 *
 * - 颜色选择器及更多表单控件
 * - 快速预览
 *
 * GitHub: https://github.com/honye
 *
 * @version 1.6.2
 * @author Honye
 */

const fm = FileManager.local();
const fileName = 'settings.json';

const toast = (message) => {
  const notification = new Notification();
  notification.title = Script.name();
  notification.body = message;
  notification.schedule();
};

const isUseICloud = () => {
  const ifm = useFileManager({ useICloud: true });
  const filePath = fm.joinPath(ifm.cacheDirectory, fileName);
  return fm.fileExists(filePath)
};

/**
 * @returns {Promise<Settings>}
 */
const readSettings = async () => {
  const useICloud = isUseICloud();
  console.log(`[info] use ${useICloud ? 'iCloud' : 'local'} settings`);
  const fm = useFileManager({ useICloud });
  const settings = fm.readJSON(fileName);
  return settings
};

/**
 * @param {Record<string, unknown>} data
 * @param {{ useICloud: boolean; }} options
 */
const writeSettings = async (data, { useICloud }) => {
  const fm = useFileManager({ useICloud });
  fm.writeJSON(fileName, data);
};

const removeSettings = async (settings) => {
  const cache = useFileManager({ useICloud: settings.useICloud });
  fm.remove(
    fm.joinPath(cache.cacheDirectory, fileName)
  );
};

const moveSettings = (useICloud, data) => {
  const localFM = useFileManager();
  const iCloudFM = useFileManager({ useICloud: true });
  const [i, l] = [
    fm.joinPath(iCloudFM.cacheDirectory, fileName),
    fm.joinPath(localFM.cacheDirectory, fileName)
  ];
  try {
    // 移动文件需要创建父文件夹，写入操作会自动创建文件夹
    writeSettings(data, { useICloud });
    if (useICloud) {
      if (fm.fileExists(l)) fm.remove(l);
    } else {
      if (fm.fileExists(i)) fm.remove(i);
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * @typedef {object} NormalFormItem
 * @property {string} name
 * @property {string} label
 * @property {'text'|'number'|'color'|'select'|'date'|'cell'} [type]
 *  - HTML <input> type 属性
 *  - `'cell'`: 可点击的
 * @property {'(prefers-color-scheme: light)'|'(prefers-color-scheme: dark)'} [media]
 * @property {{ label: string; value: unknown }[]} [options]
 * @property {unknown} [default]
 */
/**
 * @typedef {Pick<NormalFormItem, 'label'|'name'> & { type: 'group', items: FormItem[] }} GroupFormItem
 */
/**
 * @typedef {Omit<NormalFormItem, 'type'> & { type: 'page' } & Pick<Options, 'formItems'|'onItemClick'>} PageFormItem 单独的页面
 */
/**
 * @typedef {NormalFormItem|GroupFormItem|PageFormItem} FormItem
 */
/**
 * @typedef {object} CommonSettings
 * @property {boolean} useICloud
 * @property {string} [backgroundImage] 背景图路径
 * @property {string} [backgroundColorLight]
 * @property {string} [backgroundColorDark]
 */
/**
 * @typedef {CommonSettings & Record<string, unknown>} Settings
 */
/**
 * @typedef {object} Options
 * @property {(data: {
 *  settings: Settings;
 *  family?: typeof config.widgetFamily;
 * }) => ListWidget | Promise<ListWidget>} render
 * @property {string} [head] 顶部插入 HTML
 * @property {FormItem[]} [formItems]
 * @property {(item: FormItem) => void} [onItemClick]
 * @property {string} [homePage] 右上角分享菜单地址
 * @property {(data: any) => void} [onWebEvent]
 */
/**
 * @template T
 * @typedef {T extends infer O ? {[K in keyof O]: O[K]} : never} Expand
 */

const previewsHTML =
`<div class="actions">
  <button class="preview" data-size="small"><i class="iconfont icon-yingyongzhongxin"></i>${i18n(['Small', '预览小号'])}</button>
  <button class="preview" data-size="medium"><i class="iconfont icon-daliebiao"></i>${i18n(['Medium', '预览中号'])}</button>
  <button class="preview" data-size="large"><i class="iconfont icon-dantupailie"></i>${i18n(['Large', '预览大号'])}</button>
</div>`;

const copyrightHTML =
`<footer>
  <div class="copyright">© UI powered by <a href="javascript:invoke('safari','https://www.imarkr.com');">iMarkr</a>.</div>
</footer>`;

/**
 * @param {Expand<Options>} options
 * @param {boolean} [isFirstPage]
 * @param {object} [others]
 * @param {Settings} [others.settings]
 * @returns {Promise<ListWidget|undefined>} 仅在 Widget 中运行时返回 ListWidget
 */
const present = async (options, isFirstPage, others = {}) => {
  const {
    formItems = [],
    onItemClick,
    render,
    head,
    homePage = 'https://www.imarkr.com',
    onWebEvent
  } = options;
  const cache = useCache();

  const settings = others.settings || await readSettings() || {};

  /**
   * @param {Parameters<Options['render']>[0]} param
   */
  const getWidget = async (param) => {
    const widget = await render(param);
    const { backgroundImage, backgroundColorLight, backgroundColorDark } = settings;
    if (backgroundImage && fm.fileExists(backgroundImage)) {
      widget.backgroundImage = fm.readImage(backgroundImage);
    }
    if (!widget.backgroundColor || backgroundColorLight || backgroundColorDark) {
      widget.backgroundColor = Color.dynamic(
        new Color(backgroundColorLight || '#ffffff'),
        new Color(backgroundColorDark || '#242426')
      );
    }
    return widget
  };

  if (config.runsInWidget) {
    const widget = await getWidget({ settings });
    Script.setWidget(widget);
    return widget
  }

  // ====== web start =======
  const style =
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
  margin: 10px 0;
  -webkit-font-smoothing: antialiased;
  font-family: "SF Pro Display","SF Pro Icons","Helvetica Neue","Helvetica","Arial",sans-serif;
  accent-color: var(--color-primary);
}
input {
  -webkit-user-select: auto;
  user-select: auto;
}
body {
  background: #f2f2f7;
}
button {
  font-size: 16px;
  background: var(--color-primary);
  color: #fff;
  border-radius: 8px;
  border: none;
  padding: 0.24em 0.5em;
}
button .iconfont {
  margin-right: 6px;
}
.list {
  margin: 15px;
}
.list__header {
  margin: 0 20px;
  color: var(--list-header-color);
  font-size: 13px;
}
.list__body {
  margin-top: 10px;
  background: var(--card-background);
  border-radius: var(--card-radius);
  border-radius: 12px;
  overflow: hidden;
}
.form-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  column-gap: 1em;
  font-size: 16px;
  min-height: 2em;
  padding: 0.5em 20px;
  position: relative;
}
.form-item[media*="prefers-color-scheme"] {
  display: none;
}
.form-item--link .icon-arrow_right {
  color: #86868b;
}
.form-item + .form-item::before {
  content: "";
  position: absolute;
  top: 0;
  left: 20px;
  right: 0;
  border-top: 0.5px solid var(--divider-color);
}
.form-item__input-wrapper {
  flex: 1;
  overflow: hidden;
  text-align: right;
}
.form-item__input {
  max-width: 100%;
}
.form-item .iconfont {
  margin-right: 4px;
}
.form-item input,
.form-item select {
  font-size: 14px;
  text-align: right;
}
.form-item input[type="checkbox"] {
  width: 1.25em;
  height: 1.25em;
}
input[type="number"] {
  width: 4em;
}
input[type="date"] {
  min-width: 6.4em;
}
input[type='checkbox'][role='switch'] {
  position: relative;
  display: inline-block;
  appearance: none;
  width: 40px;
  height: 24px;
  border-radius: 24px;
  background: #ccc;
  transition: 0.3s ease-in-out;
}
input[type='checkbox'][role='switch']::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  transition: 0.3s ease-in-out;
}
input[type='checkbox'][role='switch']:checked {
  background: var(--color-primary);
}
input[type='checkbox'][role='switch']:checked::before {
  transform: translateX(16px);
}
.actions {
  margin: 15px;
}
.copyright {
  margin: 15px;
  margin-inline: 18px;
  font-size: 12px;
  color: #86868b;
}
.copyright a {
  color: #515154;
  text-decoration: none;
}
.preview.loading {
  pointer-events: none;
}
.icon-loading {
  display: inline-block;
  animation: 1s linear infinite spin;
}
@keyframes spin {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(1turn);
  }
}
@media (prefers-color-scheme: light) {
  .form-item[media="(prefers-color-scheme: light)"] {
    display: flex;
  }
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
  input {
    background-color: rgb(58, 57, 57);
    color: var(--color-primary);
  }
  input[type='checkbox'][role='switch'] {
    background-color: rgb(56, 56, 60);
  }
  input[type='checkbox'][role='switch']::before {
    background-color: rgb(206, 206, 206);
  }
  select {
    background-color: rgb(82, 82, 82);
    border: none;
  }
  .form-item[media="(prefers-color-scheme: dark)"] {
    display: flex;
  }
}
`;

  const js =
`(() => {
  const settings = ${JSON.stringify({
    ...settings,
    useICloud: isUseICloud()
  })}
  const formItems = ${JSON.stringify(formItems)}

  window.invoke = (code, data, cb) => {
    ScriptableBridge.invoke(code, data, cb)
  }

  const formData = {}

  const createFormItem = (item) => {
    const value = settings[item.name] ?? item.default ?? null
    formData[item.name] = value;
    const label = document.createElement("label");
    label.className = "form-item";
    if (item.media) {
      label.setAttribute('media', item.media)
    }
    const div = document.createElement("div");
    div.innerText = item.label;
    label.appendChild(div);
    if (/^(select|multi-select)$/.test(item.type)) {
      const wrapper = document.createElement('div')
      wrapper.className = 'form-item__input-wrapper'
      const select = document.createElement('select')
      select.className = 'form-item__input'
      select.name = item.name
      select.multiple = item.type === 'multi-select'
      const map = (options, parent) => {
        for (const opt of (options || [])) {
          if (opt.children?.length) {
            const elGroup = document.createElement('optgroup')
            elGroup.label = opt.label
            map(opt.children, elGroup)
            parent.appendChild(elGroup)
          } else {
            const option = document.createElement('option')
            option.value = opt.value
            option.innerText = opt.label
            option.selected = Array.isArray(value) ? value.includes(opt.value) : (value === opt.value)
            parent.appendChild(option)
          }
        }
      }
      map(item.options || [], select)
      select.addEventListener('change', ({ target }) => {
        let { value } = target
        if (item.type === 'multi-select') {
          value = Array.from(target.selectedOptions).map(({ value }) => value)
        }
        formData[item.name] = value
        invoke('changeSettings', formData)
      })
      wrapper.appendChild(select)
      label.appendChild(wrapper)
    } else if (
      item.type === 'cell' ||
      item.type === 'page'
    ) {
      label.classList.add('form-item--link')
      const icon = document.createElement('i')
      icon.className = 'iconfont icon-arrow_right'
      label.appendChild(icon)
      label.addEventListener('click', () => {
        const { name } = item
        switch (name) {
          case 'backgroundImage':
            invoke('chooseBgImg')
            break
          case 'clearBackgroundImage':
            invoke('clearBgImg')
            break
          case 'reset':
            reset()
            break
          default:
            invoke('itemClick', item)
        }
      })
    } else {
      const input = document.createElement("input")
      input.className = 'form-item__input'
      input.name = item.name
      input.type = item.type || "text";
      input.enterKeyHint = 'done'
      input.value = value
      // Switch
      if (item.type === 'switch') {
        input.type = 'checkbox'
        input.role = 'switch'
        input.checked = value
        if (item.name === 'useICloud') {
          input.addEventListener('change', (e) => {
            invoke('moveSettings', e.target.checked)
          })
        }
      }
      if (item.type === 'number') {
        input.inputMode = 'decimal'
      }
      if (input.type === 'text') {
        input.size = 12
      }
      input.addEventListener("change", (e) => {
        formData[item.name] =
          item.type === 'switch'
          ? e.target.checked
          : item.type === 'number'
          ? Number(e.target.value)
          : e.target.value;
        invoke('changeSettings', formData)
      });
      label.appendChild(input);
    }
    return label
  }

  const createList = (list, title) => {
    const fragment = document.createDocumentFragment()

    let elBody;
    for (const item of list) {
      if (item.type === 'group') {
        const grouped = createList(item.items, item.label)
        fragment.appendChild(grouped)
      } else {
        if (!elBody) {
          const groupDiv = fragment.appendChild(document.createElement('div'))
          groupDiv.className = 'list'
          if (title) {
            const elTitle = groupDiv.appendChild(document.createElement('div'))
            elTitle.className = 'list__header'
            elTitle.textContent = title
          }
          elBody = groupDiv.appendChild(document.createElement('div'))
          elBody.className = 'list__body'
        }
        const label = createFormItem(item)
        elBody.appendChild(label)
      }
    }
    return fragment
  }

  const fragment = createList(formItems)
  document.getElementById('settings').appendChild(fragment)

  for (const btn of document.querySelectorAll('.preview')) {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget
      target.classList.add('loading')
      const icon = e.currentTarget.querySelector('.iconfont')
      const className = icon.className
      icon.className = 'iconfont icon-loading'
      invoke(
        'preview',
        e.currentTarget.dataset.size,
        () => {
          target.classList.remove('loading')
          icon.className = className
        }
      )
    })
  }

  const setFieldValue = (name, value) => {
    const input = document.querySelector(\`.form-item__input[name="\${name}"]\`)
    if (!input) return
    if (input.type === 'checkbox') {
      input.checked = value
    } else {
      input.value = value
    }
  }

  const reset = (items = formItems) => {
    for (const item of items) {
      if (item.type === 'group') {
        reset(item.items)
      } else if (item.type === 'page') {
        continue;
      } else {
        setFieldValue(item.name, item.default)
      }
    }
    invoke('removeSettings', formData)
  }
})()`;

  const html =
`<html>
  <head>
    <meta name='viewport' content='width=device-width, user-scalable=no'>
    <link rel="stylesheet" href="//at.alicdn.com/t/c/font_3772663_kmo790s3yfq.css" type="text/css">
    <style>${style}</style>
  </head>
  <body>
  ${head || ''}
  <section id="settings"></section>
  ${isFirstPage ? (previewsHTML + copyrightHTML) : ''}
  <script>${js}</script>
  </body>
</html>`;

  const webView = new WebView();
  const methods = {
    async preview (data) {
      const widget = await getWidget({ settings, family: data });
      widget[`present${data.replace(data[0], data[0].toUpperCase())}`]();
    },
    safari (data) {
      Safari.openInApp(data, true);
    },
    changeSettings (data) {
      Object.assign(settings, data);
      writeSettings(settings, { useICloud: settings.useICloud });
    },
    moveSettings (data) {
      settings.useICloud = data;
      moveSettings(data, settings);
    },
    removeSettings (data) {
      Object.assign(settings, data);
      clearBgImg();
      removeSettings(settings);
    },
    chooseBgImg (data) {
      chooseBgImg();
    },
    clearBgImg () {
      clearBgImg();
    },
    async itemClick (data) {
      if (data.type === 'page') {
        // `data` 经传到 HTML 后丢失了不可序列化的数据，因为需要从源数据查找
        const item = (() => {
          const find = (items) => {
            for (const el of items) {
              if (el.name === data.name) return el

              if (el.type === 'group') {
                const r = find(el.items);
                if (r) return r
              }
            }
            return null
          };
          return find(formItems)
        })();
        await present(item, false, { settings });
      } else {
        await onItemClick?.(data, { settings });
      }
    },
    native (data) {
      return onWebEvent?.(data)
    }
  };
  await loadHTML(
    webView,
    { html, baseURL: homePage },
    { methods }
  );

  const clearBgImg = () => {
    const { backgroundImage } = settings;
    delete settings.backgroundImage;
    if (backgroundImage && fm.fileExists(backgroundImage)) {
      fm.remove(backgroundImage);
    }
    writeSettings(settings, { useICloud: settings.useICloud });
    toast(i18n(['Cleared success!', '背景已清除']));
  };

  const chooseBgImg = async () => {
    try {
      const image = await Photos.fromLibrary();
      cache.writeImage('bg.png', image);
      const imgPath = fm.joinPath(cache.cacheDirectory, 'bg.png');
      settings.backgroundImage = imgPath;
      writeSettings(settings, { useICloud: settings.useICloud });
    } catch (e) {
      console.log('[info] 用户取消选择图片');
    }
  };

  webView.present();
  // ======= web end =========
};

/**
 * @param {Options} options
 */
const withSettings = async (options) => {
  const { formItems, onItemClick, ...restOptions } = options;
  return present({
    formItems: [
      {
        label: i18n(['Common', '通用']),
        type: 'group',
        items: [
          {
            label: i18n(['Sync with iCloud', 'iCloud 同步']),
            type: 'switch',
            name: 'useICloud',
            default: false
          },
          {
            label: i18n(['Background', '背景']),
            type: 'page',
            name: 'background',
            formItems: [
              {
                label: i18n(['Background', '背景']),
                type: 'group',
                items: [
                  {
                    name: 'backgroundColorLight',
                    type: 'color',
                    label: i18n(['Background color', '背景色']),
                    media: '(prefers-color-scheme: light)',
                    default: '#ffffff'
                  },
                  {
                    name: 'backgroundColorDark',
                    type: 'color',
                    label: i18n(['Background color', '背景色']),
                    media: '(prefers-color-scheme: dark)',
                    default: '#242426'
                  },
                  {
                    label: i18n(['Background image', '背景图']),
                    type: 'cell',
                    name: 'backgroundImage'
                  }
                ]
              },
              {
                type: 'group',
                items: [
                  {
                    label: i18n(['Clear background image', '清除背景图']),
                    type: 'cell',
                    name: 'clearBackgroundImage'
                  }
                ]
              }
            ]
          },
          {
            label: i18n(['Reset', '重置']),
            type: 'cell',
            name: 'reset'
          }
        ]
      },
      {
        label: i18n(['Settings', '设置']),
        type: 'group',
        items: formItems
      }
    ],
    onItemClick: (item, ...args) => {
      onItemClick?.(item, ...args);
    },
    ...restOptions
  }, true)
};

/**
 * 话费、流量和语音余额小组件小号 UI
 *
 * 原创 UI，修改套用请注明来源
 *
 * GitHub: https://github.com/honye
 *
 * @version 1.0.0
 * @author Honye
 */


const cache$1 = useCache();

const cacheImage = async (url, filename) => {
  const cached = cache$1.readImage(filename);
  if (cached) return cached
  const image = await getImage(url);
  cache$1.writeImage(filename, image);
  return image
};

const createBg = async () => {
  const filename = 'unicom_bg.png';
  const cached = cache$1.readImage(filename);
  if (cached) return cached
  const ctx = new DrawContext();
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  ctx.size = new Size(155, 155);
  ctx.drawImageInRect(
    await getImage('https://cdn.jsdelivr.net/gh/Honye/scriptable-scripts@master/static/unicom_bg.png'),
    new Rect(77, -22, 100, 100)
  );
  const image = ctx.getImage();
  cache$1.writeImage(filename, image);
  return image
};

/**
 * @param {Color} startColor
 * @param {Color} endColor
 * @param {number} factor 0.0 ~ 1.0
 */
const interpolateColor = (startColor, endColor, factor) => {
  const interpolate = (start, end) => {
    return start + (end - start) * factor
  };
  const r = interpolate(startColor.red, endColor.red);
  const g = interpolate(startColor.green, endColor.green);
  const b = interpolate(startColor.blue, endColor.blue);
  const a = interpolate(startColor.alpha, endColor.alpha);
  const hex = [r, g, b].map((n) => Math.round(n * 255).toString(16).padStart(2, '0')).join('');
  return new Color(hex, a)
};

/** @param {number} deg */
const deg2arc = (deg) => {
  return deg * Math.PI / 180
};

/**
 * @param {object} params
 * @param {Point} params.center
 * @param {number} params.radius
 * @param {number} params.deg
 */
const pointAtDeg = ({ center, radius, deg }) => {
  return new Point(
    center.x + radius * Math.cos(deg2arc(deg)),
    center.y + radius * Math.sin(deg2arc(deg))
  )
};

/**
 * @param {object} params
 * @param {Point} params.center
 * @param {number} params.radius
 * @param {number} params.startDeg
 * @param {number} params.drawDeg
 */
const arcPath = ({ center, radius, startDeg, drawDeg }) => {
  const startArc = deg2arc(startDeg);
  const path = new Path();
  path.move(pointAtDeg({ center, radius, deg: startDeg }));
  const l = Math.PI * radius * 2 * drawDeg / 360;
  for (let i = 0; i <= l; i++) {
    path.addLine(
      new Point(
        center.x + radius * Math.cos(startArc + i / radius),
        center.y + radius * Math.sin(startArc + i / radius)
      )
    );
  }
  return path
};

/**
 * @param {DrawContext} ctx
 * @param {object} options
 * @param {Color} options.startColor
 * @param {Color} options.endColor
 * @param {number} options.lineWidth
 */
const drawGradientArc = (ctx, {
  center,
  radius,
  startDeg,
  drawDeg,
  startColor,
  endColor,
  lineWidth
}) => {
  const startArc = deg2arc(startDeg);
  let lastPoint = pointAtDeg({ center, radius, deg: startDeg });
  const l = Math.PI * radius * 2 * drawDeg / 360;
  for (let i = 0; i <= l; i++) {
    const path = new Path();
    path.move(lastPoint);
    const nextPoint = new Point(
      center.x + radius * Math.cos(startArc + i / radius),
      center.y + radius * Math.sin(startArc + i / radius)
    );
    path.addLine(nextPoint);
    ctx.addPath(path);
    ctx.setLineWidth(lineWidth);
    ctx.setStrokeColor(interpolateColor(startColor, endColor, i / l));
    ctx.strokePath();
    lastPoint = nextPoint;
  }
};

/**
 * @param {DrawContext} ctx
 * @param {object} options
 * @param {Color} options.startColor
 * @param {Color} options.endColor
 */
const drawArc = (ctx, { startColor, endColor, percent }) => {
  const { width } = ctx.size;
  const lineWidth = 4;
  const radius = (width - lineWidth) / 2;
  const center = new Point(width / 2, width / 2);

  if (startColor === endColor) {
    ctx.addPath(arcPath({ center, radius, startDeg: 135, drawDeg: 270 * percent }));
    ctx.setStrokeColor(startColor);
    ctx.setLineWidth(lineWidth);
    ctx.strokePath();
  } else {
    drawGradientArc(ctx, {
      center,
      radius,
      startDeg: 135,
      drawDeg: 270 * percent,
      startColor,
      endColor,
      lineWidth
    });
  }

  //   ctx.addPath(
  //     arcPath({
  //       center: pointAtDeg({ center, radius, deg: 135 }),
  //       radius: lineWidth / 2,
  //       startDeg: -45,
  //       drawDeg: 180
  //     })
  //   )
  //   ctx.setFillColor(color)
  //   ctx.fillPath()

//   ctx.addPath(
//     arcPath({
//       center: pointAtDeg({ center, radius, deg: 45 }),
//       radius: lineWidth / 2,
//       startDeg: 45,
//       drawDeg: 180
//     })
//   )
//   ctx.setFillColor(color)
//   ctx.fillPath()
};

/**
 * @param {object} params
 * @param {Color} params.color
 */
const getArc = ({ color, percent }) => {
  const ctx = new DrawContext();
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  const width = 62;
  ctx.size = new Size(width, width);
  const aColor = new Color(color.hex, 0.1);
  drawArc(ctx, {
    startColor: aColor,
    endColor: aColor,
    percent: 1
  });
  drawArc(ctx, {
    startColor: color,
    endColor: new Color(color.hex, 0.4),
    percent
  });

  return ctx.getImage()
};

/**
 * @param {WidgetStack} container
 * @param {(s: WidgetStack) => void} fn
 */
const centerH = (container, fn) => {
  const stack = container.addStack();
  stack.size = new Size(vw(50 * 100 / 155), -1);
  stack.centerAlignContent();
  fn(stack);
};

/**
 * @param {WidgetStack} stack
 * @param {object} options
 * @param {Color} options.color
 */
const addItem = async (stack, { title, balance, total, icon, color }) => {
  const container = stack.addStack();
  container.centerAlignContent();
  const cs = vw(62 * 100 / 155);
  container.size = new Size(cs, cs);
  container.setPadding(0, 0, 0, 0);
  // container.borderWidth = vw(8 * 100 / 155)
  container.backgroundImage = getArc({
    color,
    percent: balance / total
  });

  const contentStack = container.addStack();
  const cts = vw(50 * 100 / 155);
  contentStack.size = new Size(cts, cts);
  contentStack.cornerRadius = cts / 2;
  contentStack.layoutVertically();
  contentStack.setPadding(vw(8 * 100 / 155), 0, 0, 0);
  const gradient = new LinearGradient();
  gradient.colors = [new Color(color.hex, 0.2), new Color(color.hex, 0)];
  gradient.locations = [0, 1];
  gradient.startPoint = new Point(0, 0);
  gradient.endPoint = new Point(0, 1);
  contentStack.backgroundGradient = gradient;

  centerH(contentStack, (s) => {
    const label = s.addText(title);
    label.font = Font.systemFont(vw(8 * 100 / 155));
    label.textColor = Color.dynamic(new Color('#221f1f', 0.7), new Color('#ffffff', 0.7));
  });

  centerH(contentStack, (s) => {
    const value = s.addText(`${balance}`);
    value.lineLimit = 1;
    value.minimumScaleFactor = 0.5;
    value.font = Font.boldRoundedSystemFont(vw(14 * 100 / 155));
  });

  centerH(contentStack, (s) => {
    const stack = s.addStack();
    const size = vw(16 * 100 / 155);
    stack.size = new Size(size, size);
    stack.cornerRadius = size / 2;
    stack.backgroundColor = color;
    stack.centerAlignContent();
    const ic = stack.addImage(SFSymbol.named(icon).image);
    const is = vw(12 * 100 / 155);
    ic.imageSize = new Size(is, is);
    ic.tintColor = Color.white();
  });
};

/**
 * @param {object} data
 * @param {number} data.hf
 * @param {number} data.ll
 * @param {number} data.totalLl
 * @param {number} data.yy
 * @param {number} data.totalYy
 */
const createWidget$1 = async ({ hf, ll, totalLl, yy, totalYy }) => {
  const widget = new ListWidget();
  widget.backgroundImage = await createBg();
  widget.setPadding(0, 0, 0, 0);

  const container = widget.addStack();
  container.layoutVertically();
  const p = vw(14 * 100 / 155);
  container.setPadding(p, p, p, p);

  const top = container.addStack();
  top.layoutHorizontally();
  const hfStack = top.addStack();
  hfStack.layoutVertically();
  const hflabel = hfStack.addText('剩余话费');
  hflabel.font = Font.systemFont(vw(12 * 100 / 155));
  hflabel.textColor = Color.dynamic(new Color('#221f1f', 0.7), new Color('#ffffff', 0.7));
  const hfBalance = hfStack.addText(`${hf}`);
  hfBalance.minimumScaleFactor = 0.5;
  hfBalance.font = Font.boldRoundedSystemFont(vw(24 * 100 / 155));
  hfBalance.textColor = Color.dynamic(new Color('#221f1f'), new Color('#ffffff'));
  top.addSpacer();
  // logo
  const logo = top.addImage(
    await cacheImage('https://cdn.jsdelivr.net/gh/Honye/scriptable-scripts@master/static/unicom.png', 'chinaunicom.png')
  );
  logo.imageSize = new Size(vw(24 * 100 / 155), vw(24 * 100 / 155));
  container.addSpacer(vw(18 * 100 / 155));
  const bottom = container.addStack();
  await addItem(bottom, {
    title: '剩余流量',
    balance: ll,
    total: totalLl,
    icon: 'antenna.radiowaves.left.and.right',
    color: new Color('#3bc9ec')
  });
  bottom.addSpacer();
  await addItem(bottom, {
    title: '剩余语音',
    balance: yy,
    total: totalYy,
    icon: 'phone',
    color: new Color('#a2cf39')
  });
  return widget
};

const preference = {
  packages: [],
  authorization: ''
};

const cache = useCache();

const hbHeaders = () => {
  let { authorization } = preference;
  if (!authorization) {
    try {
      const conf = importModule/* ignore */('Config')['10010']();
      authorization = conf.Authorization;
    } catch (e) {
      console.warn('Not set Authorization');
    }
  }
  return {
    zx: '12',
    Authorization: authorization,
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.31(0x18001f2e) NetType/4G Language/en'
  }
};

const createWidget = async () => {
  const data = await getData();
  const { balenceData, flowData, voiceData } = data;
  const widget = await createWidget$1({
    hf: balenceData.amount,
    ll: (flowData.left / 1024).toFixed(2),
    totalLl: (flowData.total / 1024).toFixed(2),
    yy: voiceData.left,
    totalYy: voiceData.total
  });
  return widget
};

/**
 * 湖北联通余额
 * @returns {{ amount: string }}
 */
const getBalence = async () => {
  const request = new Request('https://wap.10010hb.net/zinfo/front/user/findFeePackage');
  request.headers = hbHeaders();
  request.method = 'POST';
  const res = await request.loadJSON();
  if (res.success) {
    return res.data
  }
  return Promise.reject(res)
};

/** 套餐余额 */
const getPackageLeft = async () => {
  const request = new Request('https://wap.10010hb.net/zinfo/front/user/findLeftPackage');
  request.headers = hbHeaders();
  request.method = 'POST';
  const res = await request.loadJSON();
  if (res.success) {
    return res.data
  }
  return Promise.reject(res)
};

const getData = async () => {
  try {
    const [balence, packageLeft] = await Promise.all([getBalence(), getPackageLeft()]);
    const { addupInfoList } = packageLeft;
    const flowData = { left: 0, total: 0 };
    const voiceData = { left: 0, total: 0 };
    const { packages } = preference;
    const list = addupInfoList.filter((item) => packages.includes(item.FEE_POLICY_ID));
    for (const item of list) {
      // 语音
      if (item.ELEM_TYPE === '1') {
        voiceData.left += Number(item.X_CANUSE_VALUE);
        voiceData.total += Number(item.ADDUP_UPPER);
      }
      // 流量
      if (item.ELEM_TYPE === '3') {
        flowData.left += Number(item.X_CANUSE_VALUE);
        flowData.total += Number(item.ADDUP_UPPER);
      }
    }

    const data = {
      balenceData: balence,
      flowData,
      voiceData
    };
    cache.writeJSON('data.json', data);
    return data
  } catch (e) {
    /**
     * @type {{
     *  balenceData: { amount: string };
     *  flowData: { left: number, total: number };
     *  voiceData: { left: number, total: number };
     * }}
     */
    const data = cache.readJSON('data.json');
    console.warn('==== 数据请求失败，使用缓存数据 ====');
    console.warn(e);
    return data
  }
};

const { addupInfoList } = await getPackageLeft();
const cellularOptions = [];
const voiceOptions = [];
for (const item of addupInfoList) {
  const { ELEM_TYPE, FEE_POLICY_ID, FEE_POLICY_NAME } = item;
  const option = { label: FEE_POLICY_NAME, value: FEE_POLICY_ID };
  if (ELEM_TYPE === '1') {
    // 语音
    voiceOptions.push(option);
  }
  if (ELEM_TYPE === '3') {
    // 流量
    cellularOptions.push(option);
  }
}

await withSettings({
  formItems: [
    {
      name: 'packages',
      label: i18n(['Packages', '套餐']),
      type: 'multi-select',
      options: [
        {
          label: '流量',
          children: cellularOptions
        },
        {
          label: '语音',
          children: voiceOptions
        }
      ],
      default: preference.packages
    },
    {
      name: 'authorization',
      label: 'Authorization',
      type: 'text',
      default: preference.authorization
    }
  ],
  render: async ({ settings }) => {
    Object.assign(preference, settings);
    const widget = await createWidget();
    return widget
  }
});
