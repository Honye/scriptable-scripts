// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: globe; icon-color: teal;
/**
 * 网上国网小组件
 * 如何添加多户：长按桌面小组件，编辑添加参数，输入从 0 开始的整数，0 代表第一户，1 代表第二户，以此类推
 * 重写: https://raw.githubusercontent.com/dompling/Script/master/wsgw/index.js
 *
 * @version 1.3.4
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
const vmin = (num, widgetFamily) => {
  const family = widgetFamily || config.widgetFamily;
  if (!family) throw new Error('`vmin` only work in widget')
  const size = widgetSize();
  const width = size[family === 'large' ? 'medium' : family];
  const height = family === 'medium'
    ? size.small
    : family === 'extraLarge' ? size.large : size[family];
  return num * Math.min(width, height) / 100
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
 * @version 1.7.2
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
  let ifm;
  try {
    ifm = useFileManager({ useICloud: true });
  } catch (e) {
    return false
  }

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
 * @property {'text'|'number'|'color'|'select'|'date'|'cell'|'switch'} [type]
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
  <div class="copyright">© UI powered by <a href="javascript:invoke('safari','https://www.imarkr.com');">iMarkr</a></div>
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
  --text-color: #1e1f24;
  --text-secondary: #8b8d98;
  --divider-color: #eff0f3;
  --card-background: #fff;
  --card-radius: 10px;
  --bg-input: #f9f9fb;
}
* {
  -webkit-user-select: none;
  user-select: none;
}
:focus-visible {
  outline-width: 2px;
}
body {
  margin: 10px 0;
  -webkit-font-smoothing: antialiased;
  font-family: "SF Pro Display","SF Pro Icons","Helvetica Neue","Helvetica","Arial",sans-serif;
  accent-color: var(--color-primary);
  color: var(--text-color);
}
input {
  -webkit-user-select: auto;
  user-select: auto;
}
input:where([type="date"], [type="time"], [type="datetime-local"], [type="month"], [type="week"]) {
  accent-color: var(--text-color);
  white-space: nowrap;
}
select {
  accent-color: var(--text-color);
}
body {
  background: #f2f2f7;
}
button {
  font-size: 16px;
  background: var(--card-background);
  color: var(--text-color);
  border-radius: 8px;
  border: none;
  padding: 0.5em;
}
button .iconfont {
  margin-right: 6px;
}
.list {
  margin: 15px;
}
.list__header {
  margin: 0 20px;
  color: var(--text-secondary);
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
  text-align: right;
  box-sizing: border-box;
  padding: 2px;
  margin-right: -2px;
  overflow: hidden;
}
.form-item__input {
  max-width: calc(100% - 4px);
}
.form-item .iconfont {
  margin-right: 4px;
}
.form-item input,
.form-item select {
  font-size: 14px;
  text-align: right;
}
.form-item input:not([type=color]),
.form-item select {
  border-radius: 99px;
  background-color: var(--bg-input);
  border: none;
  color: var(--text-color);
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
  margin: 0;
  position: relative;
  display: inline-block;
  appearance: none;
  width: 40px;
  height: 25px;
  border-radius: 25px;
  background: var(--bg-input);
  transition: 0.3s ease-in-out;
}
input[type='checkbox'][role='switch']::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 2px;
  width: 21px;
  height: 21px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.04), 0 2px 6px 0 rgba(0, 0, 0, 0.15), 0 2px 1px 0 rgba(0, 0, 0, 0.06);
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
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  column-gap: 12px;
}
.copyright {
  margin: 15px;
  margin-inline: 18px;
  font-size: 12px;
  color: var(--text-secondary);
}
.copyright a {
  color: var(--text-color);
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
    --text-color: #eeeef0;
    --text-secondary: #6c6e79;
    --divider-color: #222325;
    --card-background: #19191b;
    --bg-input: #303136;
  }
  body {
    background: #111113;
  }
  input[type='checkbox'][role='switch']::before {
    background-color: rgb(206, 206, 206);
  }
  .form-item[media="(prefers-color-scheme: dark)"] {
    display: flex;
  }
}`;

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
 * @param {WidgetStack} stack
 * @param {object} options
 * @param {number} [options.column] column count
 * @param {number | [number, number]} [options.gap]
 * @param {'row' | 'column'} [options.direction]
 */
const useGrid = async (stack, options) => {
  const {
    column,
    gap = 0,
    direction = 'row'
  } = options;
  const [columnGap, rowGap] = typeof gap === 'number' ? [gap, gap] : gap;

  if (direction === 'row') {
    stack.layoutVertically();
  } else {
    stack.layoutHorizontally();
  }

  let i = -1;
  const rows = [];

  const add = async (fn) => {
    i++;
    const r = Math.floor(i / column);
    if (i % column === 0) {
      if (r > 0) {
        stack.addSpacer(rowGap);
      }
      const rowStack = stack.addStack();
      if (direction === 'row') {
        rowStack.layoutHorizontally();
      } else {
        rowStack.layoutVertically();
      }
      rows.push(rowStack);
    }

    if (i % column > 0) {
      rows[r].addSpacer(columnGap);
    }
    await fn(rows[r]);
  };

  return { add }
};

const rpt = (n) => vmin(n * 100 / 155, config.widgetFamily);

const preference = {
  /** @type {'daily'|'monthly'} */
  dimension: 'daily',
  barCount: 7,
  showStepProgress: true,
  oneLevelPq: 2160,
  twoLevelPq: 4800
};

const cache = useCache();
const sizes = widgetSize();
/** @type {Date} */
let respDate;

const getData = async () => {
  const url = 'http://api.wsgw-rewrite.com/electricity/bill/all?monthElecQuantity=1&dayElecQuantity31=1&stepElecQuantity=1&eleBill=1';
  const filename = 'data.json';
  const fm = FileManager.local();
  const filePath = fm.joinPath(cache.cacheDirectory, filename);
  const mDate = fm.modificationDate(filePath);
  if (mDate && Date.now() - mDate.getTime() < 14400000) {
    console.log('[INFO] Request too frequent, using local cached data...');
    const data = cache.readJSON(filename);
    respDate = mDate;
    return data
  }

  const request = new Request(url);
  let data;
  try {
    data = await request.loadJSON();
    cache.writeJSON(filename, data);
    respDate = new Date();
  } catch (e) {
    console.error(e);
    console.log('[INFO] An exception occurred during the request; using cached data...');
    data = cache.readJSON(filename);
    if (!data) {
      console.error('Data request failed and no cached data is available. Please check the proxy configuration.');
    }
    respDate = mDate;
  }
  return data
};

const getWidgetData = async () => {
  const [i] = (args.widgetParameter || '')
    .split(';')
    .map((item) => item.trim() || undefined);
  const index = Number(i || 0);
  const data = await getData();
  return data[index]
};

const getLogo = async () => {
  const filename = 'logo.png';
  const cached = cache.readImage(filename);
  if (cached) return cached
  const image = await getImage('https://raw.githubusercontent.com/Honye/scriptable-scripts/refs/heads/master/static/sgcc.png');
  cache.writeImage(filename, image);
  return image
};

/**
 * @param {WidgetStack} widget
 */
const addBarChart = (widget, data) => {
  const { barCount, dimension, oneLevelPq, twoLevelPq } = preference;
  /** @type {{yearTotal:number;monthElec:number;level:number}[]} */
  const monthlyData = [];
  /** @type {{ value: number; level: number }[]} */
  let seven = [];
  const { mothEleList = [] } = data.monthElecQuantity || {};
  let yearTotal = 0;
  for (const { monthEleNum } of mothEleList) {
    const n = Number(monthEleNum);
    yearTotal += n;
    const level = yearTotal > Number(twoLevelPq) ? 3 : yearTotal > Number(oneLevelPq) ? 2 : 1;
    monthlyData.push({ yearTotal, monthElec: n, level });
    if (dimension === 'monthly') {
      seven.push({ value: n, level });
    }
  }
  if (dimension === 'daily') {
    const { sevenEleList } = data.dayElecQuantity31;
    for (const { day, dayElePq } of sevenEleList) {
      if (dayElePq && !Number.isNaN(Number(dayElePq))) {
        let [, year, month] = day.match(/^(\d{4})(\d{2})/);
        year = Number(year);
        month = Number(month);
        // 非今年数据默认阶梯为 1
        let level = 1;
        if (new Date().getFullYear() === year) {
          const safeIndex = Math.max(
            0,
            Math.min(monthlyData.length - 1, month > monthlyData.length ? monthlyData.length - 1 : month - 1)
          );
          level = monthlyData[safeIndex]?.level || level;
        }
        seven.unshift({ value: Number(dayElePq), level });
      }
    }
  }

  seven = seven.slice(-barCount);
  const container = widget.addStack();
  const height = config.widgetFamily === 'medium' ? rpt(40) : rpt(68);
  container.size = new Size(-1, height);
  const vp = config.widgetFamily === 'medium' ? rpt(4) : rpt(10);
  const px = config.widgetFamily === 'medium' ? 0 : rpt(8);
  container.setPadding(vp, px, vp, px);
  container.layoutHorizontally();
  container.bottomAlignContent();

  const gap = config.widgetFamily === 'medium' ? rpt(6) : undefined;
  const max = Math.max(...seven.map(({ value }) => value));
  const maxHeight = height - vp * 2;
  const w = config.widgetFamily === 'medium' ? rpt(6) : rpt(8);
  for (const [i, { value, level }] of seven.entries()) {
    const day = container.addStack();
    day.size = new Size(w, value / max * maxHeight);
    day.cornerRadius = w / 2;
    const gradient = new LinearGradient();
    gradient.locations = [0, 1];
    const colors = [
      [new Color('#81CDC7'), new Color('#00706B')], // level 1
      [new Color('#FFEE8C'), new Color('#E8C70B')], // level 2
      [new Color('#FCBF94'), new Color('#D0580D')] // level 3
    ];
    gradient.colors = colors[level - 1];
    gradient.startPoint = new Point(0, 0);
    gradient.endPoint = new Point(0, 1);
    day.backgroundGradient = gradient;
    if (i < seven.length - 1) {
      container.addSpacer(gap);
    }
  }
};

/**
 * @param {WidgetStack} container
 */
const addStepProgress = (container, data) => {
  const { oneLevelPq, twoLevelPq } = preference;
  const oneLevelColor = new Color('#00706B');
  const oneLevelBg = new Color(oneLevelColor.hex, 0.1);
  const twoLevelColor = new Color('#E8C70B');
  const twoLevelBg = new Color(twoLevelColor.hex, 0.1);
  const threeLevelColor = new Color('#D0580D');
  const threeLevelBg = new Color(threeLevelColor.hex, 0.1);
  const transparent = new Color('#000000', 0);
  let totalYearPq = 0;
  if (data.stepElecQuantity?.[0]) {
    const [{ electricParticulars }] = data.stepElecQuantity;
    totalYearPq = electricParticulars.totalYearPq;
  }

  const stack = container.addStack();
  stack.size = new Size(-1, rpt(4));
  stack.addSpacer();
  const gradient = new LinearGradient();
  const colors = [
    oneLevelBg, oneLevelBg, // 0~0.32
    transparent, transparent, // 0.32~0.34
    twoLevelBg, twoLevelBg, // 0.34~0.66
    transparent, transparent, // 0.66~0.68
    threeLevelBg, threeLevelBg // 0.68~1
  ];
  const locations = [
    0, 0.32,
    0.32, 0.34,
    0.34, 0.66,
    0.66, 0.68,
    0.68, 1
  ];
  gradient.startPoint = new Point(0, 0);
  gradient.endPoint = new Point(1, 0);
  const level = totalYearPq > twoLevelPq ? 3 : totalYearPq > oneLevelPq ? 2 : 1;
  if (level > 0) {
    colors.splice(
      0, 0,
      oneLevelColor, oneLevelColor
    );
    const per = Math.min(totalYearPq / oneLevelPq, 1) * 0.32;
    locations.splice(
      1, 0,
      per, per
    );
  }
  if (level > 1) {
    colors.splice(4 + 2, 0, twoLevelColor, twoLevelColor);
    const per = Math.min(totalYearPq / twoLevelPq, 1) * 0.32;
    locations.splice(
      5 + 2, 0,
      0.34 + per, 0.34 + per
    );
  }
  if (level > 2) {
    colors.splice(8 + 2 * 2, 0, threeLevelColor, threeLevelColor);
    const per = Math.min(totalYearPq / (twoLevelPq + twoLevelPq - oneLevelPq), 1) * 0.32;
    locations.splice(
      9 + 2 * 2, 0,
      0.68 + per, 0.68 + per
    );
  }
  gradient.colors = colors;
  gradient.locations = locations;
  stack.backgroundGradient = gradient;
};

const addBarAndStep = (widget, data) => {
  const container = widget.addStack();
  container.layoutVertically();
  const gradient = new LinearGradient();
  gradient.locations = [0, 1];
  gradient.colors = [
    new Color('#00706B', 0),
    Color.dynamic(
      new Color('#00706B', 0.05),
      new Color('#04605B', 0.15)
    )
  ];
  gradient.startPoint = new Point(0, 0);
  gradient.endPoint = new Point(0, 1);
  container.cornerRadius = 6;
  container.backgroundGradient = gradient;
  addBarChart(container, data);
  addStepProgress(container, data);
};

/**
 * @param {WidgetStack} stack
 * @param {object} data
 * @param {string} data.label
 * @param {number} data.value
 */
const addLabelValue = (stack, { label, value }) => {
  const c = stack.addStack();
  c.layoutVertically();
  c.addStack().addSpacer();
  c.backgroundColor = Color.dynamic(new Color('#00706B', 0.05), new Color('#04605B', 0.15));
  c.cornerRadius = rpt(6);
  c.setPadding(rpt(6), rpt(12), rpt(6), rpt(12));
  const title = c.addText(label);
  title.font = Font.systemFont(rpt(8));
  title.textColor = Color.dynamic(new Color('#18231C', 0.7), new Color('#FFFFFF', 0.7));
  const number = c.addText(`${value}`);
  number.font = Font.boldRoundedSystemFont(14);
  number.textColor = Color.dynamic(new Color('#18231C'), new Color('#FFFFFF'));
};

/**
 * @param {WidgetStack} stack
 */
const addMediumSteps = (stack, data, { width }) => {
  const { oneLevelPq, twoLevelPq } = preference;
  let totalYearPq = 0;
  if (data.stepElecQuantity?.[0]) {
    const [{ electricParticulars }] = data.stepElecQuantity;
    totalYearPq = electricParticulars.totalYearPq;
  }

  const c = stack.addStack();
  c.layoutVertically();
  c.backgroundColor = Color.dynamic(new Color('#00706B', 0.05), new Color('#04605B', 0.15));
  c.cornerRadius = rpt(6);
  const paddingX = rpt(12);
  c.setPadding(rpt(6), paddingX, rpt(6), paddingX);
  c.addStack().addSpacer();

  const level = totalYearPq > twoLevelPq ? 3 : totalYearPq > oneLevelPq ? 2 : 1;
  let percent = totalYearPq / [oneLevelPq, twoLevelPq, twoLevelPq + twoLevelPq - oneLevelPq][level - 1];
  percent = Math.min(percent, 1);
  const head = c.addStack();
  const title = head.addText(`第${['一', '二', '三'][level - 1]}梯度：${Number((percent * 100).toFixed(2))}%`);
  title.font = Font.systemFont(rpt(8));
  title.textColor = Color.dynamic(new Color('#18231C', 0.7), new Color('#FFFFFF', 0.7));
  head.addSpacer();
  const time = head.addStack();
  time.centerAlignContent();
  const clock = time.addImage(SFSymbol.named('clock.arrow.circlepath').image);
  clock.tintColor = Color.dynamic(new Color('#18231C', 0.7), new Color('#FFFFFF', 0.7));
  clock.imageSize = new Size(rpt(8), rpt(8));
  const df = new DateFormatter();
  df.locale = 'zh-CN';
  df.dateFormat = 'HH:mm';
  const timeText = time.addText(` ${df.string(respDate)}`);
  timeText.font = Font.systemFont(rpt(8));
  timeText.textColor = Color.dynamic(new Color('#18231C', 0.7), new Color('#FFFFFF', 0.7));

  c.addSpacer(rpt(4));
  const p = c.addStack();
  const barGap = rpt(2);
  const t = Math.floor((width - paddingX * 2 + barGap) / (2 + barGap));
  /** one step bar counts */
  const n = Math.floor(t / 3);
  const colors = [
    Color.dynamic(new Color('#00706B'), new Color('#04605B')), // level 1
    Color.dynamic(new Color('#E8C70B'), new Color('#CBAD02')), // level 2
    Color.dynamic(new Color('#D0580D'), new Color('#D0580D')) // level 3
  ];
  const bgColors = [
    Color.dynamic(new Color('#00706B', 0.1), new Color('#04605B', 0.1)), // level 1
    Color.dynamic(new Color('#E8C70B', 0.1), new Color('#CBAD02', 0.1)), // level 2
    Color.dynamic(new Color('#D0580D', 0.1), new Color('#D0580D', 0.1)) // level 3
  ];
  for (let i = 0; i < n * 3; i++) {
    const bar = p.addStack();
    bar.layoutVertically();
    bar.addSpacer();
    bar.size = new Size(2, -1);
    const end = Math.floor(n * level * percent);
    bar.backgroundColor = (i > end ? bgColors : colors)[Math.floor(i / n)];
    bar.cornerRadius = 1;
    if (i < n * 3 - 1) {
      p.addSpacer(barGap);
    }
  }
};

const createMediumWidget = async () => {
  const { barCount } = preference;
  const data = await getWidgetData();
  const widget = new ListWidget();
  const widgetPadding = rpt(12);
  widget.setPadding(widgetPadding, widgetPadding, widgetPadding, widgetPadding);
  const widgetGradient = new LinearGradient();
  widgetGradient.colors = [
    Color.dynamic(new Color('#00706B', 0.18), new Color('#00706B', 0)),
    new Color('#00706B', 0)
  ];
  widgetGradient.locations = [0, 0.35];
  widgetGradient.startPoint = new Point(0, 0);
  widgetGradient.endPoint = new Point(sizes.small / sizes.medium, 1);
  widget.backgroundGradient = widgetGradient;

  const container = widget.addStack();
  container.layoutHorizontally();

  const lpx = rpt(4);
  const barItemWith = rpt(6);
  const barGap = rpt(6);
  const leftWidth = Math.max(barCount, 7) * (barItemWith + barGap) - barGap + lpx * 2;
  const left = container.addStack();
  left.size = new Size(leftWidth, -1);
  left.layoutVertically();
  const gradient = new LinearGradient();
  gradient.locations = [0, 1];
  gradient.colors = [
    new Color('#00706B', 0),
    Color.dynamic(new Color('#00706B', 0.05), new Color('#04605B', 0.15))
  ];
  gradient.startPoint = new Point(0, 0.4);
  gradient.endPoint = new Point(0, 1);
  left.backgroundGradient = gradient;
  left.cornerRadius = rpt(6);
  left.setPadding(0, lpx, 0, lpx);

  const logo = left.addImage(await getLogo());
  const lw = rpt(24);
  logo.imageSize = new Size(lw, lw);

  left.addSpacer(rpt(12));
  const label = left.addText(!data.arrearsOfFees ? '剩余电费' : '待缴电费');
  label.font = Font.systemFont(rpt(10));
  label.textColor = Color.dynamic(new Color('#18231C', 0.7), new Color('#FFFFFF', 0.7));
  const number = left.addText(`${data.eleBill.sumMoney}`);
  number.minimumScaleFactor = 0.5;
  number.font = Font.boldRoundedSystemFont(rpt(18));
  number.textColor = Color.dynamic(new Color('#18231C'), new Color('#FFFFFF'));

  left.addSpacer();
  addBarChart(left, data);

  const lrGap = rpt(12);
  container.addSpacer(lrGap);
  const right = container.addStack();
  right.layoutVertically();
  const { add } = await useGrid(right, {
    column: 2,
    gap: [rpt(8), rpt(6)]
  });
  await add((stack) => addLabelValue(stack, {
    label: '上期电费',
    value: data.stepElecQuantity?.[0].electricParticulars.totalAmount || '0.00'
  }));
  await add((stack) => addLabelValue(stack, {
    label: '上期电量',
    value: data.stepElecQuantity?.[0].electricParticulars.totalPq || '0.00'
  }));
  await add((stack) => addLabelValue(stack, {
    label: '年度电费',
    value: data.monthElecQuantity.dataInfo?.totalEleCost || 0
  }));
  await add((stack) => addLabelValue(stack, {
    label: '年度电量',
    value: data.monthElecQuantity.dataInfo?.totalEleNum || 0
  }));
  right.addSpacer(rpt(6));
  addMediumSteps(right, data, { width: sizes.medium - widgetPadding * 2 - leftWidth - lrGap });
  return widget
};

const createWidget = async () => {
  if (config.widgetFamily === 'medium') {
    const widget = await createMediumWidget();
    return widget
  }

  const data = await getWidgetData();
  const widget = new ListWidget();
  widget.setPadding(12, 12, 12, 12);
  widget.backgroundColor = Color.dynamic(
    new Color('#ffffff'),
    new Color('#171A18')
  );
  const gradient = new LinearGradient();
  gradient.colors = [
    new Color('#00706B', 0),
    Color.dynamic(new Color('#00706B', 0.18), new Color('#00706B', 0))
  ];
  gradient.locations = [0.65, 1];
  gradient.startPoint = new Point(0, 0);
  gradient.endPoint = new Point(1, 1);
  widget.backgroundGradient = gradient;

  addBarAndStep(widget, data);

  widget.addSpacer();
  const bottom = widget.addStack();
  bottom.layoutVertically();
  let totalAmount = 0;
  if (data.stepElecQuantity?.[0]) {
    const { electricParticulars } = data.stepElecQuantity[0];
    totalAmount = electricParticulars.totalAmount;
  }
  const l = bottom.addText(`余额${totalAmount ? `(上期:${totalAmount})` : ''}`);
  l.font = Font.systemFont(rpt(12));
  l.textColor = Color.dynamic(new Color('#18231C', 0.7), new Color('#ffffff', 0.7));
  const w = bottom.addStack();
  w.centerAlignContent();
  const p = w.addText(`${data.eleBill.sumMoney}`);
  p.font = Font.boldRoundedSystemFont(rpt(24));
  p.textColor = Color.dynamic(new Color('#18231C'), new Color('#ffffff'));
  w.addSpacer();
  const logo = w.addImage(await getLogo());
  const lw = rpt(24);
  logo.imageSize = new Size(lw, lw);
  return widget
};

await withSettings({
  formItems: [
    {
      label: i18n(['Daily or monthly', '每日或每月']),
      name: 'dimension',
      type: 'select',
      options: [
        { label: i18n(['Daily', '每日']), value: 'daily' },
        { label: i18n(['Monthly', '每月']), value: 'monthly' }
      ],
      default: preference.dimension
    },
    {
      label: i18n(['Bar count', '柱状图数量']),
      name: 'barCount',
      type: 'number',
      default: preference.barCount
    },
    {
      label: i18n(['Show tiered progress', '显示阶梯进度']),
      name: 'showStepProgress',
      type: 'switch',
      default: preference.showStepProgress
    },
    {
      label: i18n(['First level cap', '第一阶梯上限']),
      name: 'oneLevelPq',
      type: 'number',
      default: preference.oneLevelPq
    },
    {
      label: i18n(['Second level cap', '第二阶梯上限']),
      name: 'twoLevelPq',
      type: 'number',
      default: preference.twoLevelPq
    }
  ],
  render: async ({ family, settings }) => {
    family && (config.widgetFamily = family);
    Object.assign(preference, settings);
    const widget = await createWidget();
    return widget
  }
});
