// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: braille; icon-color: deep-gray;
/**
 * 用圆点可视化本年/本月的剩余天数
 * 支持小、中、大三种尺寸，支持深浅色主题自动切换
 * 本月进度按日历月视图 7 列排列，可设置每周从周日或周一开始
 * 在 App 中运行可进行可视化配置和预览
 * 小组件参数：year（本年）或 month（本月），优先于应用内配置
 *
 * @version 1.0.0
 * @author Honye
 */

/**
 * @version 1.2.3
 */


/**
 * 比较两个版本号的大小
 * @param {string} version1 第一个版本号
 * @param {string} version2 第二个版本号
 * @returns {number} 如果 version1 > version2 返回 1, 如果 version1 < version2 返回 -1, 否则返回 0。
 */
const compareVersion = (version1, version2) => {
  const arr1 = version1.split('.');
  const arr2 = version2.split('.');

  const maxLength = Math.max(arr1.length, arr2.length);

  for (let i = 0; i < maxLength; i++) {
    const num1 = parseInt(arr1[i] || 0, 10);
    const num2 = parseInt(arr2[i] || 0, 10);

    if (num1 > num2) {
      return 1
    }
    if (num1 < num2) {
      return -1
    }
  }

  return 0
};

/**
 * @returns {Record<'small'|'medium'|'large'|'extraLarge', number>}
 */
const widgetSize = () => {
  const phones = {
    /** 16 Pro Max */
    956: { small: 170, medium: 364, large: 382 },
    /** 16 Pro, 17 Pro */
    874: {
      ios26: { small: 164, medium: 349, large: 365 },
      ios: { small: 162, medium: 344, large: 366 }
    },
    /** 16 Plus, 15 Pro Max, 15 Plus, 14 Pro Max */
    932: { small: 170, medium: 364, large: 382 },
    /** 13 Pro Max, 12 Pro Max */
    926: { small: 170, medium: 364, large: 382 },
    /** 11 Pro Max, 11, XS Max, XR */
    896: { small: 169, medium: 360, large: 379 },
    /** Plus phones */
    736: { small: 157, medium: 348, large: 357 },
    /** 16, 15 Pro, 15, 14 Pro */
    852: { small: 158, medium: 339, large: 354 },
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

  const sizes = phones[height];
  if (sizes) {
    if (compareVersion(Device.systemVersion(), '26') > -1 && sizes.ios26) {
      return sizes.ios26
    }
    return sizes.ios || sizes
  }

  if (config.runsInWidget) {
    const pc = { small: 164, medium: 344, large: 344 };
    return pc
  }

  // in app screen fixed 375x812 pt
  return { small: 155, medium: 329, large: 329 }
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
 * @version 1.7.3
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
 * @param {{ useICloud: boolean; }} [options]
 */
const writeSettings = async (data, { useICloud } = { useICloud: isUseICloud() }) => {
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
input, textarea {
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
.form-item textarea,
.form-item select {
  font-size: 14px;
  text-align: right;
}
.form-item input[type=text],
.form-item textarea {
  width: 11em;
}
.form-item textarea {
  text-align: start;
}
.form-item input:not([type=color]),
.form-item textarea,
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
      const input = document.createElement(item.type ==='textarea' ? 'textarea' : "input")
      input.className = 'form-item__input'
      input.name = item.name
      input.type = item.type || "text";
      input.enterKeyHint = item.type ==='textarea' ? 'enter' : 'done'
      if (item.type === 'textarea') input.rows = '1'
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
      if (input.type === 'text' || input.type === 'textarea') {
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
 * 小组件参数（优先于应用内设置）：
 * - `year` / `年`：本年剩余天数
 * - `month` / `月`：本月剩余天数
 */

const DAY = 24 * 3600000;

const preference = {
  /** @type {'year'|'month'} */
  mode: 'year',
  /** @type {'sunday'|'monday'} 月视图一周的开始 */
  weekStart: 'monday',
  showPercent: true,
  backgroundColorLight: '#ffffff',
  backgroundColorDark: '#1c1c1e',
  titleColorLight: '#000000',
  titleColorDark: '#ffffff',
  percentColorLight: '#8e8e93',
  percentColorDark: '#8e8e93',
  passedColorLight: '#1c1c1e',
  passedColorDark: '#ffffff',
  leftColorLight: '#d1d1d6',
  leftColorDark: '#3a3a3c'
};

/**
 * @param {'title'|'percent'|'passed'|'left'|'background'} name
 */
const dynamicColor = (name) => Color.dynamic(
  new Color(preference[`${name}ColorLight`]),
  new Color(preference[`${name}ColorDark`])
);

/**
 * @param {string} [param]
 * @returns {'year'|'month'|undefined}
 */
const parseMode = (param) => {
  const [mode] = (param || '').split(',').map((s) => s.trim().toLowerCase());
  if (['month', 'm', '月'].includes(mode)) return 'month'
  if (['year', 'y', '年'].includes(mode)) return 'year'
};

/**
 * @param {'year'|'month'} mode
 */
const getProgress = (mode) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (mode === 'month') {
    const total = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    // 1 号之前的空位数，与日历月视图对齐
    const offset = preference.weekStart === 'monday' ? (firstDay + 6) % 7 : firstDay;
    return { total, passed: now.getDate() - 1, offset }
  }
  const today = new Date(year, month, now.getDate());
  const total = Math.round((new Date(year + 1, 0, 1) - new Date(year, 0, 1)) / DAY);
  const passed = Math.round((today - new Date(year, 0, 1)) / DAY);
  return { total, passed, offset: 0 }
};

/**
 * 拉伸横纵间距，使网格铺满整个区域
 * @param {{ columns: number; rows: number; dot: number }} grid
 * @param {number} width
 * @param {number} height
 */
const stretch = ({ columns, rows, dot }, width, height) => ({
  columns,
  rows,
  dot,
  gapX: columns > 1 ? (width - columns * dot) / (columns - 1) : 0,
  gapY: rows > 1 ? (height - rows * dot) / (rows - 1) : 0
});

/**
 * 在给定区域内找到让圆点最大的列数
 * @param {number} count
 * @param {number} width
 * @param {number} height
 * @param {number} gapRatio 间距与圆点直径之比
 */
const layoutGrid = (count, width, height, gapRatio) => {
  let best = { columns: count, rows: 1, dot: 0 };
  for (let columns = 1; columns <= count; columns++) {
    const rows = Math.ceil(count / columns);
    const dot = Math.min(
      width / (columns + (columns - 1) * gapRatio),
      height / (rows + (rows - 1) * gapRatio)
    );
    if (dot > best.dot) best = { columns, rows, dot };
  }
  return stretch(best, width, height)
};

/**
 * 固定列数排列，行数由圆点数决定
 * @param {number} count
 * @param {number} columns
 * @param {number} width
 * @param {number} height
 * @param {number} gapRatio 间距与圆点直径之比
 */
const layoutFixedColumns = (count, columns, width, height, gapRatio) => {
  const rows = Math.ceil(count / columns);
  const dot = Math.min(
    width / (columns + (columns - 1) * gapRatio),
    height / (rows + (rows - 1) * gapRatio)
  );
  return stretch({ columns, rows, dot }, width, height)
};

/**
 * 标题行与圆点网格同宽，高度之和等于内容区高度
 * @param {WidgetStack} container
 * @param {object} options
 * @param {number} options.total
 * @param {number} options.passed
 * @param {number} options.offset 第一个圆点前的空位数
 * @param {ReturnType<typeof layoutGrid>} options.layout
 * @param {number} options.width
 * @param {number} options.fontSize
 * @param {number} options.lineHeight 标题行高度
 * @param {number} options.spacing 标题与圆点的间距
 */
const addContent = (container, {
  total, passed, offset, layout, width, fontSize, lineHeight, spacing
}) => {
  const { columns, rows, dot, gapX, gapY } = layout;

  const head = container.addStack();
  head.size = new Size(width, lineHeight);
  head.centerAlignContent();
  const left = total - passed;
  const title = head.addText(i18n([`${left} days left`, `剩余 ${left} 天`]));
  title.font = Font.semiboldSystemFont(fontSize);
  title.textColor = dynamicColor('title');
  title.lineLimit = 1;
  title.minimumScaleFactor = 0.6;
  head.addSpacer();
  if (preference.showPercent) {
    const percent = head.addText(`${Math.round(passed / total * 100)}%`);
    percent.font = Font.mediumSystemFont(fontSize);
    percent.textColor = dynamicColor('percent');
    percent.lineLimit = 1;
  }

  container.addSpacer(spacing);

  const passedColor = dynamicColor('passed');
  const leftColor = dynamicColor('left');
  const grid = container.addStack();
  grid.layoutVertically();
  grid.spacing = gapY;
  for (let row = 0; row < rows; row++) {
    const rowStack = grid.addStack();
    rowStack.spacing = gapX;
    const start = row * columns - offset;
    const end = Math.min(start + columns, total);
    for (let i = start; i < end; i++) {
      const cell = rowStack.addStack();
      cell.size = new Size(dot, dot);
      // 1 号之前的空位保持透明
      if (i >= 0) {
        cell.cornerRadius = dot / 2;
        cell.backgroundColor = i < passed ? passedColor : leftColor;
      }
    }
    // 最后一行不满时靠左
    if (end - start < columns) rowStack.addSpacer();
  }
};

/**
 * @param {'small'|'medium'|'large'} family
 */
const createWidget = (family) => {
  const { mode } = preference;
  const size = widgetSize();
  const width = size[family === 'small' ? 'small' : 'medium'];
  const height = size[family === 'large' ? 'large' : 'small'];
  const padding = family === 'small' ? 14 : 16;
  const fontSize = family === 'large' ? 17 : family === 'medium' ? 15 : 14;
  const spacing = family === 'small' ? 8 : 10;
  // 中文回退到苹方字体，行高比 SF 大，按 1.4 倍字号预留
  const lineHeight = Math.ceil(fontSize * 1.4);

  const { total, passed, offset } = getProgress(mode);

  const widget = new ListWidget();
  widget.backgroundColor = dynamicColor('background');
  widget.setPadding(padding, padding, padding, padding);
  const tomorrow = new Date();
  tomorrow.setHours(24, 0, 0, 0);
  widget.refreshAfterDate = tomorrow;

  const contentWidth = width - padding * 2;
  const dotsHeight = height - padding * 2 - lineHeight - spacing;
  const gapRatio = 0.5;
  const count = offset + total;
  const layout = mode === 'month'
    ? layoutFixedColumns(count, 7, contentWidth, dotsHeight, gapRatio)
    : layoutGrid(count, contentWidth, dotsHeight, gapRatio);

  const container = widget.addStack();
  container.layoutVertically();
  addContent(container, {
    total, passed, offset, layout, width: contentWidth, fontSize, lineHeight, spacing
  });
  // 内容固定在顶部
  widget.addSpacer();

  return widget
};

/**
 * @param {string} name
 * @param {[en: string, zh: string]} label
 */
const colorItems = (name, label) => [
  {
    name: `${name}ColorLight`,
    label: i18n(label),
    type: 'color',
    media: '(prefers-color-scheme: light)',
    default: preference[`${name}ColorLight`]
  },
  {
    name: `${name}ColorDark`,
    label: i18n(label),
    type: 'color',
    media: '(prefers-color-scheme: dark)',
    default: preference[`${name}ColorDark`]
  }
];

await withSettings({
  formItems: [
    {
      name: 'mode',
      label: i18n(['Progress type', '进度类型']),
      type: 'select',
      options: [
        { label: i18n(['Year', '本年']), value: 'year' },
        { label: i18n(['Month', '本月']), value: 'month' }
      ],
      default: preference.mode
    },
    {
      name: 'weekStart',
      label: i18n(['Week starts on (month)', '每周开始于（月）']),
      type: 'select',
      options: [
        { label: i18n(['Sunday', '周日']), value: 'sunday' },
        { label: i18n(['Monday', '周一']), value: 'monday' }
      ],
      default: preference.weekStart
    },
    {
      name: 'showPercent',
      label: i18n(['Show percentage', '显示百分比']),
      type: 'switch',
      default: preference.showPercent
    },
    ...colorItems('title', ['Title color', '标题颜色']),
    ...colorItems('percent', ['Percentage color', '百分比颜色']),
    ...colorItems('passed', ['Passed dot color', '已过圆点颜色']),
    ...colorItems('left', ['Remaining dot color', '剩余圆点颜色'])
  ],
  render: ({ family, settings }) => {
    for (const key of Object.keys(preference)) {
      if (settings[key] !== undefined && settings[key] !== null) {
        preference[key] = settings[key];
      }
    }
    if (config.runsInWidget) {
      preference.mode = parseMode(args.widgetParameter) || preference.mode;
    }
    family = family || config.widgetFamily;
    return createWidget(
      ['small', 'medium', 'large'].includes(family) ? family : 'large'
    )
  }
});
