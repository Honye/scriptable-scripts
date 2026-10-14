// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: globe; icon-color: teal;
/**
 * 网上国网小组件
 * 使用前在设置中填写网上国网手机号和密码，首次登录需在设置中发送并填入短信验证码
 * 如何添加多户：长按桌面小组件，编辑添加参数，输入从 0 开始的整数，0 代表第一户，1 代表第二户，以此类推
 * 数据：直连网上国网 App 接口，协议移植自 https://github.com/stevenjoezhang/hass-state-grid (MIT)
 *
 * @version 1.4.0
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

/**
 * 网上国网 App 3.2.3 协议（SM2/SM3/SM4 加密 + Turing 设备令牌）
 *
 * 协议与设备令牌算法移植自 stevenjoezhang/hass-state-grid
 * MIT License, Copyright (c) 2026 stevenjoezhang
 * Scriptable 移植参考 githubdulong/Script Scriptable/SGCC.js
 */
function uk(base, user) { return `${base}_${md5hex(String(user)).slice(0, 8)}`; }
const K = { data: 'sgcc_hark_data2', err: 'sgcc_hark_err2', lock: 'sgcc_hark_lock', dev: 'sgcc_app_dev', sess: 'sgcc_app_sess', sms: 'sgcc_app_sms' };

function clean(v) { return String(v == null ? '' : v).trim(); }
function num(v) { if (typeof v === 'number') return Number.isFinite(v) ? v : NaN; const n = Number(String(v == null ? '' : v).replace(/[^\d.-]/g, '')); return Number.isFinite(n) && String(v == null ? '' : v).trim() !== '' ? n : NaN; }

/* ==================== 加密 ==================== */
// 纯 JS 国网 App 协议加密核心（移植自 MIT 项目 stevenjoezhang/hass-state-grid）
// 原 Copyright (c) 2026 stevenjoezhang, MIT License.
function utf8enc(s){const o=[];for(let i=0;i<s.length;i++){let c=s.charCodeAt(i);if(c>=0xd800&&c<0xdc00&&i+1<s.length){const d=s.charCodeAt(i+1);if(d>=0xdc00&&d<0xe000){c=0x10000+((c-0xd800)<<10)+(d-0xdc00);i++;}}if(c<0x80)o.push(c);else if(c<0x800)o.push(0xc0|(c>>6),0x80|(c&63));else if(c<0x10000)o.push(0xe0|(c>>12),0x80|((c>>6)&63),0x80|(c&63));else o.push(0xf0|(c>>18),0x80|((c>>12)&63),0x80|((c>>6)&63),0x80|(c&63));}return new Uint8Array(o);}
function utf8dec(b){let s='';for(let i=0;i<b.length;){const c=b[i++];let cp;if(c<0x80)cp=c;else if(c<0xe0)cp=((c&31)<<6)|(b[i++]&63);else if(c<0xf0){cp=((c&15)<<12)|((b[i++]&63)<<6)|(b[i++]&63);}else {cp=((c&7)<<18)|((b[i++]&63)<<12)|((b[i++]&63)<<6)|(b[i++]&63);}if(cp>0xffff){cp-=0x10000;s+=String.fromCharCode(0xd800+(cp>>10),0xdc00+(cp&1023));}else s+=String.fromCharCode(cp);}return s;}
function u8(x){ if(x instanceof Uint8Array) return x; if(typeof x==='string') return utf8enc(x); return new Uint8Array(x);}
function toHex(b){let s='';for(let i=0;i<b.length;i++)s+=b[i].toString(16).padStart(2,'0');return s;}
function fromHex(h){const b=new Uint8Array(h.length/2);for(let i=0;i<b.length;i++)b[i]=parseInt(h.substr(i*2,2),16);return b;}
function rotl(x,n){n&=31;return ((x<<n)|(x>>>(32-n)))>>>0;}

/* ===== MD5 ===== */
function md5(input){
  const msg=u8(input);
  const S=[7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  const Kt=[];for(let i=0;i<64;i++)Kt[i]=(Math.floor(Math.abs(Math.sin(i+1))*4294967296))>>>0;
  const ml=msg.length;const bl=ml*8;
  const withpad=((ml+8)>>6)+1;const buf=new Uint8Array(withpad*64);
  buf.set(msg);buf[ml]=0x80;const dv=new DataView(buf.buffer);
  dv.setUint32(buf.length-8,bl>>>0,true);dv.setUint32(buf.length-4,Math.floor(bl/4294967296)>>>0,true);
  let a0=0x67452301,b0=0xefcdab89,c0=0x98badcfe,d0=0x10325476;
  for(let off=0;off<buf.length;off+=64){
    const M=[];for(let i=0;i<16;i++)M[i]=dv.getUint32(off+i*4,true);
    let A=a0,B=b0,C=c0,D=d0;
    for(let i=0;i<64;i++){let F,g;
      if(i<16){F=(B&C)|((~B>>>0)&D);g=i;}
      else if(i<32){F=(D&B)|((~D>>>0)&C);g=(5*i+1)&15;}
      else if(i<48){F=B^C^D;g=(3*i+5)&15;}
      else {F=C^(B|(~D>>>0));g=(7*i)&15;}
      F=(F+A+Kt[i]+M[g])>>>0;A=D;D=C;C=B;B=(B+rotl(F,S[i]))>>>0;
    }
    a0=(a0+A)>>>0;b0=(b0+B)>>>0;c0=(c0+C)>>>0;d0=(d0+D)>>>0;
  }
  const out=new Uint8Array(16);const o=new DataView(out.buffer);
  o.setUint32(0,a0,true);o.setUint32(4,b0,true);o.setUint32(8,c0,true);o.setUint32(12,d0,true);
  return out;
}
const md5hex=x=>toHex(md5(x));

/* ===== SHA-256 / HMAC ===== */
function sha256(input){
  const msg=u8(input);
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  let H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const ml=msg.length;const bl=ml*8;
  const withpad=((ml+8)>>6)+1;const buf=new Uint8Array(withpad*64);
  buf.set(msg);buf[ml]=0x80;const dv=new DataView(buf.buffer);
  dv.setUint32(buf.length-4,bl>>>0);dv.setUint32(buf.length-8,Math.floor(bl/4294967296)>>>0);
  const w=new Array(64);
  for(let off=0;off<buf.length;off+=64){
    for(let i=0;i<16;i++)w[i]=dv.getUint32(off+i*4);
    for(let i=16;i<64;i++){const s0=rotl(w[i-15],25)^rotl(w[i-15],14)^(w[i-15]>>>3);const s1=rotl(w[i-2],15)^rotl(w[i-2],13)^(w[i-2]>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0;}
    let [a,b,c,d,e,f,g,h]=H;
    for(let i=0;i<64;i++){const S1=rotl(e,26)^rotl(e,21)^rotl(e,7);const ch=(e&f)^((~e>>>0)&g);const t1=(h+S1+ch+K[i]+w[i])>>>0;const S0=rotl(a,30)^rotl(a,19)^rotl(a,10);const maj=(a&b)^(a&c)^(b&c);const t2=(S0+maj)>>>0;h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}
    H=[(H[0]+a)>>>0,(H[1]+b)>>>0,(H[2]+c)>>>0,(H[3]+d)>>>0,(H[4]+e)>>>0,(H[5]+f)>>>0,(H[6]+g)>>>0,(H[7]+h)>>>0];
  }
  const out=new Uint8Array(32);const o=new DataView(out.buffer);
  for(let i=0;i<8;i++)o.setUint32(i*4,H[i]);
  return out;
}
function hmacSha256(key,msg){
  key=u8(key);msg=u8(msg);
  if(key.length>64)key=sha256(key);
  const k=new Uint8Array(64);k.set(key);
  const ip=new Uint8Array(64),op=new Uint8Array(64);
  for(let i=0;i<64;i++){ip[i]=k[i]^0x36;op[i]=k[i]^0x5c;}
  const inner=sha256(concat(ip,msg));
  return sha256(concat(op,inner));
}
function concat(...arrs){let n=0;for(const a of arrs)n+=a.length;const o=new Uint8Array(n);let p=0;for(const a of arrs){o.set(a,p);p+=a.length;}return o;}

/* ===== SM3 ===== */
function sm3(input){
  const m=u8(input);const len=m.length;const bitLen=len*8;
  const padLen=((len%64)<56?56:120)-(len%64);
  const buf=new Uint8Array(len+padLen+8);buf.set(m);buf[len]=0x80;
  const dv=new DataView(buf.buffer);
  dv.setUint32(buf.length-4,bitLen>>>0);dv.setUint32(buf.length-8,Math.floor(bitLen/4294967296)>>>0);
  let V=[0x7380166f,0x4914b2b9,0x172442d7,0xda8a0600,0xa96f30bc,0x163138aa,0xe38dee4d,0xb0fb0e4e];
  for(let b=0;b<buf.length;b+=64){
    const W=new Array(68),W1=new Array(64);
    for(let i=0;i<16;i++)W[i]=dv.getUint32(b+i*4);
    for(let i=16;i<68;i++){const x=W[i-16]^W[i-9]^rotl(W[i-3],15);W[i]=(x^rotl(x,15)^rotl(x,23)^rotl(W[i-13],7)^W[i-6])>>>0;}
    for(let i=0;i<64;i++)W1[i]=(W[i]^W[i+4])>>>0;
    let [A,B,C,D,E,F,G,H]=V;
    for(let j=0;j<64;j++){const Tj=j<16?0x79cc4519:0x7a879d8a;const SS1=rotl((rotl(A,12)+E+rotl(Tj,j))>>>0,7);const SS2=(SS1^rotl(A,12))>>>0;const FF=j<16?(A^B^C):((A&B)|(A&C)|(B&C));const GG=j<16?(E^F^G):((E&F)|((~E>>>0)&G));const TT1=(FF+D+SS2+W1[j])>>>0;const TT2=(GG+H+SS1+W[j])>>>0;D=C;C=rotl(B,9);B=A;A=TT1;H=G;G=rotl(F,19);F=E;E=(TT2^rotl(TT2,9)^rotl(TT2,17))>>>0;}
    V=[(V[0]^A)>>>0,(V[1]^B)>>>0,(V[2]^C)>>>0,(V[3]^D)>>>0,(V[4]^E)>>>0,(V[5]^F)>>>0,(V[6]^G)>>>0,(V[7]^H)>>>0];
  }
  const out=new Uint8Array(32);const o=new DataView(out.buffer);for(let i=0;i<8;i++)o.setUint32(i*4,V[i]);return out;
}
const sm3hex=x=>toHex(sm3(x));
// sm3 kdf: z is bytes
function sm3kdf(z,klen){let ct=1;let out=new Uint8Array(0);const n=Math.ceil(klen/32);for(let i=0;i<n;i++){const cnt=new Uint8Array(4);new DataView(cnt.buffer).setUint32(0,ct);out=concat(out,sm3(concat(z,cnt)));ct++;}return out.slice(0,klen);}

/* ===== SM4 ECB PKCS7 ===== */
const SM4_SBOX=fromHex('d690e9fecce13db716b614c228fb2c05 2b679a762abe04c3aa441326498606999c4250f491ef987a33540b43edcfac62 e4b31ca9c908e89580df94fa758f3fa6 4707a7fcf37317ba83593c19e6854fa8 686b81b27164da8bf8eb0f4b70569d35 1e240e5e6358d1a225227c3b01217887 d40046579fd327524c3602e7a0c4c89e eabf8ad240c738b5a3f7f2cef96115a1 e0ae5da49b341a55ad933230f58cb1e3 1df6e22e8266ca60c02923ab0d534e6f d5db3745defd8e2f03ff6a726d6c5b51 8d1baf92bbddbc7f11d95c411f105ad8 0ac13188a5cd7bbd2d74d012b8e5b4b0 8969974a0c96777e65b9f109c56ec684 18f07dec3adc4d2079ee5f3ed7cb3948'.replace(/\s/g,''));
const SM4_CK=[0x00070e15,0x1c232a31,0x383f464d,0x545b6269,0x70777e85,0x8c939aa1,0xa8afb6bd,0xc4cbd2d9,0xe0e7eef5,0xfc030a11,0x181f262d,0x343b4249,0x50575e65,0x6c737a81,0x888f969d,0xa4abb2b9,0xc0c7ced5,0xdce3eaf1,0xf8ff060d,0x141b2229,0x30373e45,0x4c535a61,0x686f767d,0x848b9299,0xa0a7aeb5,0xbcc3cad1,0xd8dfe6ed,0xf4fb0209,0x10171e25,0x2c333a41,0x484f565d,0x646b7279];
const SM4_FK=[0xa3b1bac6,0x56aa3350,0x677d9197,0xb27022dc];
function sm4tau(a){return ((SM4_SBOX[(a>>>24)&0xff]<<24)|(SM4_SBOX[(a>>>16)&0xff]<<16)|(SM4_SBOX[(a>>>8)&0xff]<<8)|SM4_SBOX[a&0xff])>>>0;}
function sm4L(b){return (b^rotl(b,2)^rotl(b,10)^rotl(b,18)^rotl(b,24))>>>0;}
function sm4Lp(b){return (b^rotl(b,13)^rotl(b,23))>>>0;}
function sm4Key(key){const MK=[];for(let i=0;i<4;i++)MK[i]=((key[i*4]<<24)|(key[i*4+1]<<16)|(key[i*4+2]<<8)|key[i*4+3])>>>0;const K=[MK[0]^SM4_FK[0],MK[1]^SM4_FK[1],MK[2]^SM4_FK[2],MK[3]^SM4_FK[3]];const rk=[];for(let i=0;i<32;i++){const t=(K[i+1]^K[i+2]^K[i+3]^SM4_CK[i])>>>0;const r=(K[i]^sm4Lp(sm4tau(t)))>>>0;K[i+4]=r;rk[i]=r;}return rk;}
function sm4Block(rk,inp,enc){let X=[((inp[0]<<24)|(inp[1]<<16)|(inp[2]<<8)|inp[3])>>>0,((inp[4]<<24)|(inp[5]<<16)|(inp[6]<<8)|inp[7])>>>0,((inp[8]<<24)|(inp[9]<<16)|(inp[10]<<8)|inp[11])>>>0,((inp[12]<<24)|(inp[13]<<16)|(inp[14]<<8)|inp[15])>>>0];for(let i=0;i<32;i++){const k=enc?rk[i]:rk[31-i];const t=(X[i+1]^X[i+2]^X[i+3]^k)>>>0;X[i+4]=(X[i]^sm4L(sm4tau(t)))>>>0;}const o=[X[35],X[34],X[33],X[32]];const out=new Uint8Array(16);for(let i=0;i<4;i++){out[i*4]=(o[i]>>>24)&0xff;out[i*4+1]=(o[i]>>>16)&0xff;out[i*4+2]=(o[i]>>>8)&0xff;out[i*4+3]=o[i]&0xff;}return out;}
function sm4EncryptEcb(data,key){const rk=sm4Key(key);const pad=16-(data.length%16);const buf=new Uint8Array(data.length+pad);buf.set(data);for(let i=data.length;i<buf.length;i++)buf[i]=pad;const out=new Uint8Array(buf.length);for(let i=0;i<buf.length;i+=16)out.set(sm4Block(rk,buf.subarray(i,i+16),true),i);return out;}
function sm4DecryptEcb(data,key){const rk=sm4Key(key);const out=new Uint8Array(data.length);for(let i=0;i<data.length;i+=16)out.set(sm4Block(rk,data.subarray(i,i+16),false),i);const pad=out[out.length-1];return out.slice(0,out.length-pad);}
// App: key text 32 hex chars, uses first 16 ASCII bytes as key
function sm4KeyBytes(keyText){return u8(keyText.slice(0,16));}
function sm4EncryptHex(plain,keyText){return toHex(sm4EncryptEcb(u8(plain),sm4KeyBytes(keyText))).toUpperCase();}
function sm4DecryptHex(hex,keyText){return sm4DecryptEcb(fromHex(hex),sm4KeyBytes(keyText));}

/* ===== AES-256 ECB (check code) ===== */
// robust AES sbox
function aesSboxCompute(){const sbox=new Uint8Array(256);let p=1,q=1;do{p=p^(p<<1)^((p&0x80)?0x11b:0);p&=0xff;q^=q<<1;q^=q<<2;q^=q<<4;q&=0xff;if(q&0x80)q^=0x09;const xf=q^((q<<1)|(q>>>7))^((q<<2)|(q>>>6))^((q<<3)|(q>>>5))^((q<<4)|(q>>>4));sbox[p]=(xf^0x63)&0xff;}while(p!==1);sbox[0]=0x63;return sbox;}
const ASB=aesSboxCompute();
function aesExpand(key){const Nk=8,Nr=14,w=new Uint8Array(4*4*(Nr+1));w.set(key);const rcon=[0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36,0x6c,0xd8,0xab,0x4d];let i=Nk;const tmp=new Uint8Array(4);while(i<4*(Nr+1)){for(let k=0;k<4;k++)tmp[k]=w[(i-1)*4+k];if(i%Nk===0){const t=tmp[0];tmp[0]=ASB[tmp[1]]^rcon[i/Nk-1];tmp[1]=ASB[tmp[2]];tmp[2]=ASB[tmp[3]];tmp[3]=ASB[t];}else if(i%Nk===4){for(let k=0;k<4;k++)tmp[k]=ASB[tmp[k]];}for(let k=0;k<4;k++)w[i*4+k]=w[(i-Nk)*4+k]^tmp[k];i++;}return {w,Nr};}
function xtime(a){return ((a<<1)^((a&0x80)?0x11b:0))&0xff;}
function aesEncryptBlock(st,w,Nr){const s=st.slice();for(let k=0;k<16;k++)s[k]^=w[k];for(let r=1;r<Nr;r++){for(let k=0;k<16;k++)s[k]=ASB[s[k]];// shiftrows (column-major state: s[r+4c])
    aesShift(s);aesMix(s);for(let k=0;k<16;k++)s[k]^=w[r*16+k];}
  for(let k=0;k<16;k++)s[k]=ASB[s[k]];aesShift(s);for(let k=0;k<16;k++)s[k]^=w[Nr*16+k];return s;}
function aesShift(s){const t=[s[0],s[5],s[10],s[15],s[4],s[9],s[14],s[3],s[8],s[13],s[2],s[7],s[12],s[1],s[6],s[11]];for(let i=0;i<16;i++)s[i]=t[i];}
function aesMix(s){for(let c=0;c<4;c++){const o=c*4;const a0=s[o],a1=s[o+1],a2=s[o+2],a3=s[o+3];s[o]=xtime(a0)^(xtime(a1)^a1)^a2^a3;s[o+1]=a0^xtime(a1)^(xtime(a2)^a2)^a3;s[o+2]=a0^a1^xtime(a2)^(xtime(a3)^a3);s[o+3]=(xtime(a0)^a0)^a1^a2^xtime(a3);}}
function aes256EcbEncrypt(data,key){const {w,Nr}=aesExpand(key);const pad=16-(data.length%16);const buf=new Uint8Array(data.length+pad);buf.set(data);for(let i=data.length;i<buf.length;i++)buf[i]=pad;const out=new Uint8Array(buf.length);for(let i=0;i<buf.length;i+=16)out.set(aesEncryptBlock(buf.subarray(i,i+16),w,Nr),i);return out;}

/* ===== SM2 ===== */
const SM2_P=BigInt('0xFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFF');
const SM2_A=BigInt('0xFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFC');
BigInt('0x28E9FA9E9D9F5E344D5A9E4BCF6509A7F39789F515AB8F92DDBCBD414D940E93');
const SM2_GX=BigInt('0x32C4AE2C1F1981195F9904466A39C9948FE30BBFF2660BE1715A4589334C74C7');
const SM2_GY=BigInt('0xBC3736A2F4F6779C59BDCEE36B692153D0A9877CC62A474002DF32E52139F0A0');
function mod(a,m){return ((a%m)+m)%m;}
function inv(a,m){let [old_r,r]=[mod(a,m),m];let [old_s,s]=[1n,0n];while(r!==0n){const q=old_r/r;[old_r,r]=[r,old_r-q*r];[old_s,s]=[s,old_s-q*s];}return mod(old_s,m);}
function ptAdd(P,Q){if(!P)return Q;if(!Q)return P;const [x1,y1]=P,[x2,y2]=Q;if(x1===x2&&mod(y1+y2,SM2_P)===0n)return null;let l;if(x1===x2&&y1===y2){l=mod((3n*x1*x1+SM2_A)*inv(2n*y1,SM2_P),SM2_P);}else {l=mod((y2-y1)*inv(mod(x2-x1,SM2_P),SM2_P),SM2_P);}const x3=mod(l*l-x1-x2,SM2_P);const y3=mod(l*(x1-x3)-y1,SM2_P);return [x3,y3];}
function ptMul(k,P){let R=null,N=P;while(k>0n){if(k&1n)R=ptAdd(R,N);N=ptAdd(N,N);k>>=1n;}return R;}
const G=[SM2_GX,SM2_GY];
function b32(n){let h=n.toString(16).padStart(64,'0');return fromHex(h);}
// encrypt 32-char key text ascii -> "04"+C1C3C2 hex (mode 1)
function sm2EncryptKey(keyText,serverPubHex){const msg=u8(keyText);let pub=serverPubHex;if(pub.length===130)pub=pub.slice(2);const px=BigInt('0x'+pub.slice(0,64)),py=BigInt('0x'+pub.slice(64));
  let k,C1,xy;do{k=BigInt('0x'+toHex(randomBytes(32)))%SM2_P;if(k===0n)continue;C1=ptMul(k,G);xy=ptMul(k,[px,py]);}while(!C1||!xy);
  const x2=b32(xy[0]),y2=b32(xy[1]);const t=sm3kdf(concat(x2,y2),msg.length);let ok=false;for(const b of t)if(b!==0){ok=true;break;}if(!ok)return sm2EncryptKey(keyText,serverPubHex);
  const C2=new Uint8Array(msg.length);for(let i=0;i<msg.length;i++)C2[i]=msg[i]^t[i];
  const C3=sm3(concat(x2,msg,y2));
  b32(C1[0]).length?toHex(b32(C1[0]))+toHex(b32(C1[1])):'';
  return '04'+toHex(concat(b32(C1[0]),b32(C1[1]),C3,C2));
}
function sm2DecryptKey(wrapHex,privHex){let w=wrapHex.toLowerCase().startsWith('04')?wrapHex.slice(2):wrapHex;const C1=[BigInt('0x'+w.slice(0,64)),BigInt('0x'+w.slice(64,128))];w.slice(128,192);const C2=fromHex(w.slice(192));const d=BigInt('0x'+privHex);const xy=ptMul(d,C1);const x2=b32(xy[0]),y2=b32(xy[1]);const t=sm3kdf(concat(x2,y2),C2.length);const M=new Uint8Array(C2.length);for(let i=0;i<C2.length;i++)M[i]=C2[i]^t[i];return M;}

/* ===== random ===== */
function randomBytes(n){if(typeof globalThis!=='undefined'&&globalThis.crypto&&globalThis.crypto.getRandomValues){const b=new Uint8Array(n);globalThis.crypto.getRandomValues(b);return b;}const b=new Uint8Array(n);for(let i=0;i<n;i++)b[i]=Math.floor(Math.random()*256);return b;}

/* ===== turing hash64 (BigInt) ===== */
const M64=(1n<<64n)-1n;const TMUL=0xC6A4A7935BD1E995n;
function u64(v){return v&M64;}
function mix47(v){v=u64(v);return u64(v^(v>>47n));}
function turingHash64(data,seed){data=u8(data);const length=BigInt(data.length);let state=u64(u64(length*TMUL)^BigInt(seed>>>0));const blocks=data.length>>3;for(let i=0;i<blocks;i++){let word=0n;for(let j=7;j>=0;j--)word=(word<<8n)|BigInt(data[i*8+j]);word=u64(mix47(u64(word*TMUL))*TMUL);state=u64((word^state)*TMUL);}const tail=data.subarray(blocks*8);if(tail.length>=7)state^=BigInt(tail[6])<<48n;if(tail.length>=6)state^=BigInt(tail[5])<<40n;if(tail.length>=5)state^=BigInt(tail[4])<<32n;if(tail.length>=4)state^=BigInt(tail[3])<<24n;if(tail.length>=3)state^=BigInt(tail[2])<<16n;if(tail.length>=2)state^=0x118727C03FB9FFC6n&(BigInt(tail[1])<<8n);if(tail.length>=1){state^=BigInt(tail[0]);state=u64(state*TMUL);}state=mix47(state);state=u64(state*TMUL);return mix47(state);}

/* ===== XXTEA (Quarenden.a with embedded length) ===== */
const DELTA=0x9E3779B9;
function _xxteaKey(keyBytes){let material=keyBytes&&keyBytes.length?keyBytes:u8('DFG#$%^#%$RGHR(&*M<><');if(material.length>16)material=md5(material);const m=new Uint8Array(16);m.set(material.subarray(0,16));const dv=new DataView(m.buffer);return [dv.getUint32(0,true),dv.getUint32(4,true),dv.getUint32(8,true),dv.getUint32(12,true)];}
function _mx(sum,y,z,p,e,key){return (((((z>>>5)^((y<<2)>>>0))>>>0)+(((y>>>3)^((z<<4)>>>0))>>>0))>>>0 ^ ((((y^sum)>>>0)+((z^key[(p&3)^e])>>>0))>>>0))>>>0;}
function xxteaEncrypt(plain,keyBytes){if(!plain.length)return plain;const count=((plain.length/4)|0)+(plain.length%4===0?1:2);const values=new Array(count).fill(0);for(let i=0;i<plain.length;i++)values[i>>2]=(values[i>>2]|(plain[i]<<((i%4)*8)))>>>0;values[count-1]=plain.length;const n=count-1;const key=_xxteaKey(keyBytes);let rounds=6+((52/(n+1))|0);let total=0;let z=values[n];while(rounds){total=(total+DELTA)>>>0;const e=(total>>>2)&3;for(let p=0;p<n;p++){const y=values[p+1];values[p]=(values[p]+_mx(total,y,z,p,e,key))>>>0;z=values[p];}const y=values[0];values[n]=(values[n]+_mx(total,y,z,n,e,key))>>>0;z=values[n];rounds--;}const out=new Uint8Array(count*4);const dv=new DataView(out.buffer);for(let i=0;i<count;i++)dv.setUint32(i*4,values[i],true);return out;}

/* ===== RSA PKCS1 v1.5 (Turing public key) ===== */
const RSA_N=BigInt('0xb595f83a8a0ee3c16261addfc3353e7e13c73b762c3013f53225752a9fa8b0d0c33ed7f810f0a3bb323be5e6bef036eaf2e41e0975accd2a565161f573617492197904e0b30cbc9dd7aea2e079e1de3596dcf36ef444e1f3569987d737e7753e7367e893f9cf71ea661a6de3977199adcc6937dff6c1870297eb744d6473f8fb93367d17f3f51fe229e6c5424359c95985aa3ca18299334f6b1fa2d16198accc057d1e93b76fd385774fbf040453a9dfaa51b7ce6cc8778c6bc84148ec6e9213fadb4f96a4b84728953d4546d60c98b92fbf5cd5db079f4c90c968ac8ce3edeb2f0bde85e4e6399ca97b86faee15f1ef1296e8e0e2f88e6bde00c520bb871225');
const RSA_E=65537n;
function modpow(b,e,m){let r=1n;b%=m;while(e>0n){if(e&1n)r=(r*b)%m;e>>=1n;b=(b*b)%m;}return r;}
function rsaEncrypt(message){const size=256;const ps=size-message.length-3;const pad=new Uint8Array(ps);let f=0;while(f<ps){const r=randomBytes(ps);for(let i=0;i<r.length&&f<ps;i++)if(r[i]!==0)pad[f++]=r[i];}const enc=concat(new Uint8Array([0,2]),pad,new Uint8Array([0]),message);const c=modpow(BigInt('0x'+toHex(enc)),RSA_E,RSA_N);return b256(c,size);}
function b256(n,size){let h=n.toString(16).padStart(size*2,'0');return fromHex(h);}

/* ===== deflate (stored blocks) + zlib wrapper ===== */
function adler32(data){let a=1,b=0;for(let i=0;i<data.length;i++){a=(a+data[i])%65521;b=(b+a)%65521;}return ((b<<16)|a)>>>0;}
function zlibCompressStored(data){const parts=[new Uint8Array([0x78,0x01])];let i=0;while(i<data.length){const len=Math.min(65535,data.length-i);const last=(i+len>=data.length)?1:0;const hdr=new Uint8Array(5);hdr[0]=last;hdr[1]=len&0xff;hdr[2]=(len>>8)&0xff;hdr[3]=(~len)&0xff;hdr[4]=((~len)>>8)&0xff;parts.push(hdr,data.subarray(i,i+len));i+=len;}const ad=adler32(data);parts.push(new Uint8Array([(ad>>>24)&0xff,(ad>>>16)&0xff,(ad>>>8)&0xff,ad&0xff]));return concat(...parts);}


/* ==================== Turing 设备令牌 ==================== */
const REF_NATIVE = {"21":"0","108":"5","7":"","10":"5939.59,5939.59","105":"100","14":"1080*2154","101":"0","152":"0","103":"0","104":"2","33":"33","11":"type=1:name=Goldfish 3-axis Accelerometer:vendor=The Android Open Source Project:resolution=2.480159E-4:,type=4:name=Goldfish 3-axis Gyroscope:vendor=The Android Open Source Project:resolution=0.001:,type=2:name=Goldfish 3-axis Magnetic field sensor:vendor=The Android Open Source Project:resolution=0.5:,type=5:name=Goldfish Light sensor:vendor=The Android Open Source Project:resolution=1.0:,type=6:name=Goldfish Pressure sensor:vendor=The Android Open Source Project:resolution=1.0:,","24":"sdk_gphone64_arm64","12":"","23":"google","8":"google/sdk_gphone64_arm64/emu64a:13/TE1A.240213.009/12342917:userdebug/dev-keys","13":"1000.0","25":"13","20":"0","100":"","22":"","102":"0","106":"","115":"","113":"0","114":"0","44":"","35":"","42":"Google","107":"com.sgcc.wsgw.cn_DAB5608ECD1ABEF80E5FA277CF3B8D50","200":"32,2,3,4,36,5,6,40,136,43,45,143,144,10002,19,10003","116":"","117":"1","45":"","118":"v4;-1_v6;-1","120":"rwxp;/apex/com.android.art/lib64/libart.so,rwxp;/apex/com.android.runtime/lib64/bionic/libdl.so,rwxp;/system/lib64/libz.so","121":"","122":"","135":"tmpfs:/dev:tmpfs:rw&seclabel&nosuid&relatime&mode=755,tmpfs:/mnt:tmpfs:rw&seclabel&nosuid&nodev&noexec&relatime&mode=755&gid=1000,/dev/fuse:/mnt/installer/0/emulated:fuse:rw&lazytime&nosuid&nodev&noexec&noatime&user_id=0&group_id=0&allow_other,/dev/block/platform/a003c00.virtio_mmio/by-name/metadata:/metadata:ext4:rw&seclabel&nosuid&nodev&noatime,tmpfs:/apex:tmpfs:rw&seclabel&nosuid&nodev&noexec&relatime&mode=755,tmpfs:/apex/apex-info-list.xml:tmpfs:rw&seclabel&nosuid&nodev&noexec&relatime&mode=755,/dev/fuse:/storage/emulated:fuse:rw&lazytime&nosuid&nodev&noexec&noatime&user_id=0&group_id=0&allow_other,tmpfs:/data/data:tmpfs:rw&seclabel&nosuid&nodev&noexec&relatime&mode=751,tmpfs:/data/user:tmpfs:rw&seclabel&nosuid&nodev&noexec&relatime&mode=751,tmpfs:/data/user_de:tmpfs:rw&seclabel&nosuid&nodev&noexec&relatime&mode=751,tmpfs:/data/misc/profiles/cur:tmpfs:rw&seclabel&nosuid&nodev&noexec&relatime&mode=751,tmpfs:/data/misc/profiles/ref:tmpfs:rw&seclabel&nosuid&nodev&noexec&relatime&mode=751,/dev/block/loop::13,/dev/block/dm::71","124":"","131":"0,0,Built-in Screen,1080x2220,131,1,0,","137":"-8233870966039513836:enforcing,7247450386580705748:0,3920320800439300925:T-Mobile","133":"android.content.pm.IPackageManager$Stub$Proxy,,","140":"0,0,,0,,","138":"5,1","149":"en-US","150":"Asia/Shanghai","151":"310260","9":"/dev/block/dm-0:802660,tmpfs:1006268,tmpfs:1006268,/dev/block/dm-4:98620,/dev/block/dm-3:2122372,/dev/block/dm-2:175392,tmpfs:1006268,/dev/block/loop4:784,","15":"Ring_Synth_04.ogg","46":"0","51":""};
const JAVA_CONST = {"2013":"/dev/qemu_pipe,/dev/vboxguest,/dev/vboxuser,/system/framework/org.lineageos.platform-res.apk,/system/lib/ccc,/dev/socket/baseband_genyd,/sys/class/misc/vboxguest,/system/priv-app/CMSettingsProvider,/system/lib64/ccc,/ueventd.ttVM_x86.rc,/init.ttVM_x86.rc,/system/lib/hw/sensors.vbox86.so,/hmdocker,/system/lib/libnemuVMprop.so,/system/bin/magiskpolicy,/system/bin/qemud,/ueventd.vbox86.rc,/system/bin/androVM_setprop,/dev/socket/genyd,/sys/module/vboxguest,/system/priv-app/LineageSettingsProvider,/system/lib/hw/gps.vbox86.so,/system/etc/init.buildroid.sh,/system/lib/hw/audio.primary.vbox86.so,/sys/qemu_trace,/sys/class/misc/vboxuser,/system/bin/mount.nemusf,/ueventd.andy.rc,/system/priv-app/vmos-pro-intent,/sys/module/vboxvideo,/system/lib/hw/gralloc.vbox86.so,/proc/device-tree/goldfish_pipe@a060000,/system/addon.d/50-lineage.sh,/system/priv-app/romex,/system/lib64/arm64/nb/libc.so,/dev/socket/qemud,/data/.bluestacks.prop,/ueventd.android_x86.rc,/.dockerenv,/system/bin/magisk,/system/lib64/libc.so,/system/lib64/.aa,/fstab.andy,/dev/apksafe_pipe,/fstab.vbox86,/ueventd.nox.rc,/init.nox.rc,/system/app/DotPapers,/system/lib/.aa,/init.goldfish.rc,/x86.prop,/dev/mumuvmmguest,/dev/mumuvmmuser,/proc/device-tree/virtio_mmio@a000000,/system/bin/nemuVM-nemu-service,/sys/module/vboxsf,/dev/goldfish_pipe,/system/lib/hw/camera.vbox86.so,/system/priv-app/MuMuAudio,/sys/devices/virtual/misc/vboxguest,/system/bin/androVM-prop,/sys/devices/virtual/misc/vboxuser,/system/addon.d/99-magisk.sh,/fstab.nox,/system/lib64/libriruloader.so,/fstab.ttVM_x86,/system/etc/mumu-configs,/init.vbox86.rc","2016":"com/wind/xpatch/proxy/XpatchProxyApplication,de/robv/android/xposed/XposedHelpers,com/wind/xposed/entry/XposedModuleEntry,com/bug/fuck/fuck","2017":"ro.boot.flash.locked,ro.boot.vbmeta.device_state,ro.boot.verifiedbootstate,ro.boot.veritymode,ro.boot.warranty_bit,ro.debuggable,ro.secure,ro.secureboot.lockstate,ro.vendor.boot.warranty_bit,ro.vendor.warranty_bit,ro.warranty_bit,vendor.boot.vbmeta.device_state,ro.lineage.device,ro.dotOS.device,ro.dalvik.vm.native.bridge,nemud.player_package,init.svc.nemuinit"};
const PKG='com.sgcc.wsgw.cn',CHANNEL='10000191',BUILD_MARKER='77F2B17A00A92C71';
/* ===== JCE writer ===== */
class Jce{constructor(){this.b=[];}
  head(tag,t){if(tag<15)this.b.push((tag<<4)|t);else {this.b.push(0xF0|t,tag);}}
  zero(tag){this.head(tag,12);}
  byte(tag,v){v=Number(v);if(v===0)this.zero(tag);else {this.head(tag,0);this.b.push(v&0xff);}}
  short(tag,v){v=Number(v);if(v>=-128&&v<=127)this.byte(tag,v);else {this.head(tag,1);this.b.push((v>>8)&0xff,v&0xff);}}
  int32(tag,v){v=Number(v);if(v>=-32768&&v<=32767)this.short(tag,v);else {this.head(tag,2);this.b.push((v>>>24)&0xff,(v>>>16)&0xff,(v>>>8)&0xff,v&0xff);}}
  int64(tag,v){const n=BigInt(v);if(n>=-2147483648n&&n<=2147483647n)this.int32(tag,Number(n));else {this.head(tag,3);let x=BigInt.asUintN(64,n);const o=[];for(let i=0;i<8;i++){o.unshift(Number(x&0xffn));x>>=8n;}this.b.push(...o);}}
  string(tag,v){const raw=typeof v==='string'?u8(v):v;if(raw.length<=255){this.head(tag,6);this.b.push(raw.length);}else {this.head(tag,7);const l=raw.length;this.b.push((l>>>24)&0xff,(l>>>16)&0xff,(l>>>8)&0xff,l&0xff);}for(let i=0;i<raw.length;i++)this.b.push(raw[i]);}
  mapIntStr(tag,entries){this.head(tag,8);this.int32(0,entries.length);for(const [k,v] of entries){this.int32(0,k);this.string(1,v);}}
  struct(tag,fields){this.head(tag,10);for(let i=0;i<fields.length;i++)this.b.push(fields[i]);this.head(0,11);}
  finish(){return new Uint8Array(this.b);}
}
/* ===== profile ===== */
const JAVA_PERF_ORDER=[133,138,140,-17,17,145,146,149,22,150,151,24,100,101,102,103,104,105,106,107,44,113,114,115,116,117,118,120,122,'s9'];
const JAVA_PERF_REF={133:0,138:1,140:0,'-17':0,17:1,145:0,146:0,149:0,22:1,150:0,151:0,24:0,100:6,101:114,102:0,103:0,104:0,105:0,106:3,107:0,44:0,113:2,114:1,115:1,116:0,117:0,118:0,120:8,122:0,s9:1};
const NATIVE_PERF_ORDER=[21,7,10,14,33,11,24,12,23,8,13,25,20,35,42,121,135,124,125,129,131,134,132,137,142,141,9,15,16];
const NATIVE_PERF_REF={21:1,7:0,10:3,14:0,33:0,11:0,24:0,12:0,23:0,8:0,13:0,25:0,20:0,35:0,42:0,121:1,135:2,124:0,125:0,129:0,131:0,134:0,132:0,137:1,142:0,141:0,9:16,15:0,16:0};
const PROC_TPL=[[-1,3,1000,17,0,438,3],[-1,1,0,20,0,493,3],[1,1,1000,1864,1036632,420,2],[-1,1,0,20,0,493,2],[1,3,1000,17,0,438,3],[1,1,null,19,0,292,6],[-1,1,null,19,0,292,6]];
function b64(bytes){const A='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';let s='';let i=0;for(;i+2<bytes.length;i+=3){const n=(bytes[i]<<16)|(bytes[i+1]<<8)|bytes[i+2];s+=A[(n>>18)&63]+A[(n>>12)&63]+A[(n>>6)&63]+A[n&63];}if(i<bytes.length){const n=(bytes[i]<<16)|((i+1<bytes.length?bytes[i+1]:0)<<8);s+=A[(n>>18)&63]+A[(n>>12)&63]+(i+1<bytes.length?A[(n>>6)&63]:'=')+'=';}return s;}
function b64url(bytes){return b64(bytes).replace(/\+/g,'-').replace(/\//g,'_');}
function b64dec(s){const A='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';s=s.replace(/=+$/,'');const out=[];let buf=0,bits=0;for(const ch of s){buf=(buf<<6)|A.indexOf(ch);bits+=6;if(bits>=8){bits-=8;out.push((buf>>bits)&0xff);}}return new Uint8Array(out);}
class Profile{
  constructor(seed,boot,install){this.seed=seed;this.boot=boot;this.install=install;this._c={};}
  bytes(label,size=32){const key=label+'|'+size;if(this._c[key])return this._c[key];const out=[];let ctr=0;while(out.length<size){const c=new Uint8Array(4);new DataView(c.buffer).setUint32(0,ctr);const d=hmacSha256(this.seed,concat(u8('wsgw-turing-profile-v1\0'+label),c));for(const x of d)out.push(x);ctr++;}const r=new Uint8Array(out.slice(0,size));this._c[key]=r;return r;}
  hex(label,size=16){return toHex(this.bytes(label,size));}
  integerBig(label,lo,hi){lo=BigInt(lo);hi=BigInt(hi);const v=BigInt('0x'+toHex(this.bytes(label,8)));return lo+v%(hi-lo+1n);}
  integer(label,lo,hi){return Number(this.integerBig(label,lo,hi));}
  reqInt(label,ts,lo,hi){return this.integer(`request:${ts}:${label}`,lo,hi);}
  uuid(label){const v=Array.from(this.bytes(label,16));v[6]=(v[6]&0x0f)|0x40;v[8]=(v[8]&0x3f)|0x80;const h=toHex(v);return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}
  identity(){if(this._id)return this._id;const mac=Array.from(this.bytes('wifi-mac',6));mac[0]=(mac[0]&0xfe)|0x02;this._id={profile_id:this.uuid('profile-id'),android_id:this.hex('android-id',8),oaid:this.uuid('oaid'),brand:'google',model:'sdk_gphone64_arm64',release:'13',package_name:PKG,channel:CHANNEL};return this._id;}
  timing(label,ts,ref){if(ref<=0)return 0;const radius=Math.max(1,Math.floor(ref/4));const digits=String(ref).length;const lo=digits>1?10**(digits-1):0;const hi=10**digits-1;return this.reqInt(`timing:${label}`,ts,Math.max(lo,ref-radius),Math.min(hi,ref+radius));}
  javaPerf(ts){return JAVA_PERF_ORDER.map(f=>`${f}_${this.timing(String(f),ts,JAVA_PERF_REF[String(f)])}`).join(',');}
  directPerf(ts){const s=NATIVE_PERF_ORDER.map(f=>`${f}_${this.timing('native-'+f,ts,NATIVE_PERF_REF[f])}`).join(',');return `${this.javaPerf(ts)},${s}`;}
  nativeMap(cur){const id=this.identity();const boot=this.boot;const uid=this.integer('uid',10000,19999);const install=this.install;
    const ia=b64url(this.bytes('install-a',16));const ib=b64url(this.bytes('install-b',16)).replace(/=+$/,'')+'=';
    const ictx=`1:1:${uid}:${install}:${id.package_name}::${this.integer('install-slot',100000000,999999999)}:app/~~${ia}/-${ib},`;
    const pe=PROC_TPL.map((t,i)=>{const [sign,kind,ownerV,a,b,c,md]=t;const mag=this.integerBig(`process-hash-${i}`,'1000000000000000000','9000000000000000000');const ph=mag*BigInt(sign);const owner=ownerV==null?uid:ownerV;const metric=this.reqInt(`process-metric-${i}`,cur,10**(md-1),10**md-1);return `${ph}:${kind}:${owner}_${a}_${b}_${c}_${metric}`;});
    const iid=this.hex('interface-id',3);
    const net=`8,eth0;69699;3;fe80::5054:ff:fe${iid.slice(0,2)}:${iid.slice(2)};fec0::5054:ff:fe${iid.slice(0,2)}:${iid.slice(2)};10.0.2.15,dummy0;65731;1;fe80::8c95:a4ff:fe59:322`;
    const lat=this.reqInt('collection-latency',cur,8000,16000);
    const v={};for(const k of Object.keys(REF_NATIVE))v[k]=String(REF_NATIVE[k]);
    Object.assign(v,{16:id.android_id,17:ictx,26:this.hex('native-device-id',16),34:`C:1,T:${cur},LT:${lat}`,125:pe.join(','),126:String(boot),129:net,141:String(this.integer('native-property-141',1000000,9999999)),146:'1,272494655,eth0,10.0.2.15,10.0.2.3',148:id.oaid});
    return v;}
  featureMap(cur,code,nonce){const id=this.identity();const n=this.nativeMap(cur);const st=[0,1,2].map(i=>this.reqInt(`stage-${i}`,cur,1000,2200));
    return {1:id.channel,4:this.javaPerf(cur),205:n[22],210:n[34],240:n[44],250:n[100],251:n[101],252:n[102],253:n[103],254:n[104],255:n[105],256:n[106],257:n[107],258:n[113],259:n[114],264:n[24],266:n[45],267:n[17],268:n[115],269:n[116],270:n[117],271:n[46],272:n[118],273:'',279:n[120],280:n[122],281:n[126],282:n[138],284:n[146],285:n[149],286:n[150],287:n[151],288:n[152],303:`5_1_${code}_${st.join('_')}`,308:'1',309:'',402:'',406:'',2001:n[200],2005:'0',2013:JAVA_CONST['2013'],2016:JAVA_CONST['2016'],2017:JAVA_CONST['2017'],2018:String(this.integer('uid',10000,19999)),2019:n[133],2021:n[140],2029:'0',3001:String(code),3002:'1',3004:nonce,3005:'1'};}
}
function hashTags(entries,ts){const parts=entries.map(([,v])=>String(v));let st=BigInt(ts);for(let i=0;i<Math.floor((entries.length+3)/4);i++){st=((st*214013n+2531011n)>>16n)&0x7FFFn;parts.push(st.toString(16));}const d=turingHash64(u8(parts.join('')),0).toString(16);return ['01'+d,d];}
function buildM90(p,ts,nonce){const code=-22056;const id=p.identity();const f=p.featureMap(ts,code,nonce);const nm=p.nativeMap(ts);
  const nested=Object.keys(nm).map(k=>[Number(k),nm[k]]).sort((a,b)=>a[0]-b[0]);
  const [t10,t12]=hashTags(nested,ts);const uid=f[2018];const proc=`${id.package_name}:tools,${uid},untrusted_app,${uid},,init`;
  const o=new Jce();o.int64(0,ts);
  const meta=new Jce();meta.int32(0,90);meta.string(1,'90');meta.string(2,BUILD_MARKER);meta.string(3,CHANNEL);meta.int32(4,2);o.struct(1,meta.finish());
  o.mapIntStr(2,nested);
  const net=new Jce();net.string(0,'3.2.3,113');net.string(1,id.package_name);o.struct(3,net.finish());
  o.mapIntStr(5,[[3,f[303]],[8,f[308]],[9,f[309]],[7,proc],[10,t10],[12,t12],[4,p.directPerf(ts)]]);
  o.mapIntStr(6,[[2,'']]);
  const tail=new Jce();tail.string(0,'');tail.string(2,'');tail.int32(3,0);tail.string(4,'');tail.string(5,'');o.struct(8,tail.finish());
  const nb=o.finish();
  const w=new Jce();w.mapIntStr(0,[[2,id.model],[1,id.brand],[3,id.channel],[4,id.package_name]]);w.int64(1,ts);w.int32(2,1);w.struct(4,nb);w.int32(5,code);w.string(6,String(code));w.string(7,nonce);
  return {m90:w.finish(),nested:nb,tags:[t10,t12]};}
const ALNUM='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
function randStr(n,alpha=ALNUM){const r=randomBytes(n*2);let s='';for(let i=0;i<n;i++)s+=alpha[((r[i*2]<<8)|r[i*2+1])%alpha.length];return s;}
function deviceToken(p,ts){const nonce=randStr(32);const {m90}=buildM90(p,ts,nonce);const key=u8(randStr(16));const comp=zlibCompressStored(concat(new Uint8Array([2]),m90));const cipher=xxteaEncrypt(comp,key);return {token:'v3:'+b64(concat(new Uint8Array([1]),rsaEncrypt(key),cipher)),time:String(ts).slice(0,10),ts};}
function appGuid(p){const a='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';return Array.from(p.bytes('app-guid',60)).map(v=>a[v%62]).join('');}

/* ===== 国网 App 接口 ===== */
const SG_BASE = 'https://csc-service.sgcc.com.cn:28630/';
const SERVER_PUB = '0409C10D38CF7B4E28097EAAA519E3157C9B4E72194CD13BD11932CE40ED5624AFEFF27F78893E4C4FC2029DA147AB6CEAE0CDC8E3A547EFCDC5AB91757FE1CA60';
const CLIENT_PRIV = '50C4AF48DF75808050729977AA6BC127DC21A404755C660B94222F9D50FA4A75';
const P_LOGIN = 'emss-uia-center-front/member/c2/f01';
const P_SMS = 'emss-uia-center-front/member/c1/f01';
const P_DAILY = 'emss-bia-bill-front/member/c11/f01';
const P_MONTH = 'emss-bia-bill-front/member/c51/f04';
const P_BAL = 'emss-bia-balance-front/member/c16/f01';
const CHECK_KEY = 'LNPO+ISJ+QeqNemFK+3OMUdexSn2i6pB';

class SgError extends Error { constructor(code, msg) { super(msg ? `${msg}` : code); this.code = String(code || ''); } }

function cnNow() { const d = new Date(Date.now() + 8 * 3600000); const p = (n, l = 2) => String(n).padStart(l, '0'); return { s14: `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`, ms: p(d.getUTCMilliseconds(), 3), y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() }; }
function reqTimestamp() { const n = cnNow(); return n.s14 + n.ms + randStr(6, '0123456789'); }
function appGuidNew() { const n = cnNow(); return randStr(40, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') + n.s14 + n.ms + String(100 + (randomBytes(2)[0] * 256 + randomBytes(1)[0]) % 900); }

function javaHash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) >>> 0; return h; }
function hashMapOrder(v) {
  if (Array.isArray(v)) return v.map(hashMapOrder);
  if (v && typeof v === 'object') {
    const buckets = {};
    Object.keys(v).forEach((k) => { let h = javaHash(k); h = (h ^ (h >>> 16)) >>> 0; const b = h & 15; (buckets[b] = buckets[b] || []).push(k); });
    const o = {};
    Object.keys(buckets).map(Number).sort((a, b) => a - b).forEach((b) => buckets[b].forEach((k) => { o[k] = hashMapOrder(v[k]); }));
    return o;
  }
  return v;
}
function loginMd5(params) { return md5hex(Object.keys(params).sort().map((k) => k + JSON.stringify(hashMapOrder(params[k]))).join('')); }

function checkCode(account) {
  let r = 0n; const rb = randomBytes(8); for (const b of rb) r = (r << 8n) | BigInt(b); r &= (1n << 63n) - 1n;
  return String(r).padStart(24, '0') + toHex(aes256EcbEncrypt(u8(`${account}${Date.now()}`), u8(CHECK_KEY)));
}
function uscInfo(dev) { return { isEncrypt: 'false', devciceIp: '127.0.0.1', devciceId: '000000', tenant: 'state_grid', member: '2202', optSys: 'Android 13', operatorType: '', devciceName: 'sdk_gphone64_arm64', pushId: '000000,000000' }; }
function loginParams(account, password, code, codeKey) {
  return {
    quInfo: { code: code || '', codeKey: codeKey || '', account, password: md5hex(password), optSys: 'Android', pushId: '000000,000000', addressCity: '', addressProvince: '', addressRegion: '' },
    uscInfo: uscInfo(),
    checkCode: checkCode(account),
    avalonValidCode: '',
  };
}

class SgApp {
  constructor(ctx, user, pass) { this.ctx = ctx; this.user = clean(user).replace(/^(\+?86)?\s*/, '').replace(/\D/g, ''); this.pass = clean(pass); this.dev = null; this.sess = null; }
  sk(base) { return uk(base, this.user); }
  st(k, v) { try { if (v === undefined) return this.ctx.storage.getJSON(k); this.ctx.storage.setJSON(k, v); } catch (_) { return null; } return null; }
  device() {
    if (this.dev) return this.dev;
    let s = this.st(K.dev);
    if (!s || !s.seed) {
      const now = Date.now();
      const boot = now - 3600000 - Math.floor(Math.random() * (86400000 * 14 - 3600000));
      s = { seed: b64(randomBytes(32)), boot, install: boot - 86400000 - Math.floor(Math.random() * 86400000 * 179) };
    }
    const prof = new Profile(b64dec(s.seed), s.boot, s.install);
    if (!s.tok || Date.now() - s.tok.ts > 4 * 3600000) s.tok = deviceToken(prof, Date.now());
    this.st(K.dev, s);
    this.dev = { s, guid: appGuid(prof) };
    return this.dev;
  }
  headers(loginP, authed) {
    const d = this.device();
    const h = {
      'Content-Type': 'application/json; charset=UTF-8',
      timeStamp: loginP ? cnNow().s14 : reqTimestamp(),
      t: authed ? this.sess.token : '',
      userid: authed ? this.sess.userId : '0',
      AppGuid: d.guid, AppGuidNew: appGuidNew(), security: 'android', appcode: 'WSGW-SG1001-APP', datacenter: '99', AccessMethod: 'App',
      deviceTokenTX: d.s.tok.token, deviceTokenTXTime: d.s.tok.time,
      province: authed ? (this.sess.province || '') : '',
      version: '3.2.3', wsgwType: 'android', ip: '127.0.0.1', os: 'android', 'User-Agent': 'okhttp/3.14.9',
    };
    if (loginP) h.md5 = loginMd5(loginP);
    return h;
  }
  async post(path, payload, { authed = false, loginP = null } = {}) {
    const key = toHex(randomBytes(16));
    const ts = String(Date.now());
    const data = sm4EncryptHex(JSON.stringify(payload), key);
    const skey = sm2EncryptKey(key, SERVER_PUB);
    const body = JSON.stringify({ data, sign: sm3hex(skey + data + ts), skey, timestamp: ts });
    const req = { headers: this.headers(loginP, authed), body, timeout: 20000 };
    let text;
    try { const r = await this.ctx.http.post(SG_BASE + path, req); text = await r.text(); if (r.status >= 500) throw new Error('HTTP ' + r.status); }
    catch (e) { throw new SgError('net', '连不上国网服务器：' + ((e && e.message) || e)); }
    let outer; try { outer = JSON.parse(text); } catch (_) { throw new SgError('net', '国网返回了无法识别的内容'); }
    if (!outer.respKey || !outer.encryptData) throw new SgError(outer.code || 'net', outer.message || '国网返回异常');
    const k2 = utf8dec(sm2DecryptKey(String(outer.respKey), CLIENT_PRIV));
    return JSON.parse(utf8dec(sm4DecryptHex(String(outer.encryptData), k2)));
  }
  static check(resp) {
    const top = String(resp.code == null ? '' : resp.code);
    const d = resp.data && typeof resp.data === 'object' ? resp.data : {};
    const srv = d.srvrt && typeof d.srvrt === 'object' ? d.srvrt : null;
    const code = srv ? String(srv.resultCode || '') : top;
    const msg = (srv && srv.resultMessage) || resp.message || '';
    if (srv && code && code !== '0000') throw new SgError(code, msg);
    if (!srv && top && top !== '1') throw new SgError(top, msg);
    return d;
  }
  async login(code, codeKey) {
    const p = loginParams(this.user, this.pass, code, codeKey);
    const resp = await this.post(P_LOGIN, p, { loginP: p });
    const d = SgApp.check(resp);
    const biz = d.bizrt || {};
    if (!biz.token) throw new SgError('auth', '登录没有返回凭证');
    let ui = biz.userInfo; if (Array.isArray(ui)) ui = ui.find((x) => x && typeof x === 'object') || {}; ui = ui || {};
    const life = Number(biz.tokenExpireTime) || 1296000;
    this.sess = { user: this.user, token: String(biz.token), userId: String(ui.userId || biz.userId || '0'), province: clean(ui.addressProvince), exp: Date.now() + Math.max(300, life) * 1000, accounts: (Array.isArray(ui.powerUserList) ? ui.powerUserList : []).map(acctOf).filter(Boolean) };
    this.st(this.sk(K.sess), this.sess);
    return this.sess;
  }
  async sendDeviceSms() {
    const resp = await this.post(P_SMS, { uscInfo: { tenant: 'state_grid', member: '2202', devciceId: '000000', devciceName: 'sdk_gphone64_arm64', devciceIp: '127.0.0.1' }, quInfo: { voiceCodeFlag: false, account: this.user, sendType: 0, businessType: 'logindevice' } });
    const d = SgApp.check(resp);
    const ck = d.bizrt && d.bizrt.codeKey;
    if (!ck) throw new SgError('sms', '验证码发送失败');
    return String(ck);
  }
  async ensure() {
    let s = this.st(this.sk(K.sess));
    if (!s || !s.token) { const o = this.st(K.sess); if (o && o.user === this.user) s = o; }
    if (s && s.user === this.user && s.token && s.exp > Date.now() + 300000) { this.sess = s; return s; }
    const env = this.ctx.env || {};
    const sms = clean(env.SGCC_SMS).replace(/\D/g, '');
    const pend = this.st(this.sk(K.sms));
    const pendOk = pend && pend.user === this.user && Date.now() - pend.ts < 15 * 60000;
    if (pendOk && sms.length === 6 && sms !== pend.used) {
      this.st(this.sk(K.sms), { ...pend, used: sms });
      return this.login(sms, pend.codeKey);
    }
    try { return await this.login(); }
    catch (e) {
      const codeStr = String((e && e.code) || '');
      const msgStr = String((e && e.message) || '');
      const isSmsRequired = codeStr === '4006' || codeStr.includes('4006') ||
                            codeStr === 'RK007' || codeStr === 'RK008' || codeStr === 'RK1003' ||
                            /验证码|新设备|短信|超时\(RK007\)|安全验证|RK00/i.test(msgStr);
      if (!isSmsRequired) throw e;
      // 超过60秒允许重新触发下发短信验证码
      if (!pendOk || Date.now() - pend.ts > 60 * 1000) {
        try {
          const codeKey = await this.sendDeviceSms();
          this.st(this.sk(K.sms), { user: this.user, codeKey, ts: Date.now(), used: sms });
          console.log(`[SGCC] 安全验证码已成功触发下发到手机号: ${this.user}`);
        } catch (smsErr) {
          console.error(`[SGCC] 下发验证码接口异常: ${smsErr.message || smsErr}`);
          throw new SgError('sms_fail', `触发短信验证码失败：${smsErr.message || '国网短信网关繁忙，请稍后重试'}`);
        }
      }
      throw new SgError('4006', `国网新设备安全验证：短信验证码已发至 ${this.user.slice(0, 3)}****${this.user.slice(-4)}，请在设置中填入「短信验证码」后刷新`);
    }
  }
  async authed(path, payload) {
    await this.ensure();
    for (let i = 0; i < 2; i++) {
      const resp = await this.post(path, payload, { authed: true });
      try { return SgApp.check(resp); }
      catch (e) {
        if (!['-200', '-201'].includes(e.code) || i) throw e;
        this.st(this.sk(K.sess), {}); this.sess = null; await this.ensure();
      }
    }
    return {};
  }
}

function acctOf(v) {
  if (!v || typeof v !== 'object') return null;
  const f = (...ks) => { for (const k of ks) if (v[k] != null && v[k] !== '') return String(v[k]); return ''; };
  const consNo = f('powerUserNo', 'consNo');
  if (!consNo) return null;
  const src = f('powerUserNo_dst', 'consNo_dst') || consNo;
  return { consNo, src, pro: f('proNo', 'provinceId'), org: f('orgNo'), elec: f('elecType', 'constType'), name: f('consName', 'userName', 'nickname'), orgName: f('orgName') };
}
function consType(a) { return a.elec === '04' || (a.elec === '02' && a.pro === '11102') ? '02' : '01'; }
function ymd(y, m, d) { return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
function monthRange(y, m) { return [ymd(y, m, 1), ymd(y, m, new Date(Date.UTC(y, m, 0)).getUTCDate())]; }


async function queryAccount(app, a) {
  const n = cnNow();
  const daily = [];
  let monthTotal = NaN;
  for (let off = 0; off < 2; off++) {
    let y = n.y, m = n.m - off; if (m < 1) { m += 12; y -= 1; }
    const [s, e] = monthRange(y, m);
    try {
      const d = await app.authed(P_DAILY, { serviceCode: 'BCP_000026', source: 'app', target: a.pro, data: { acctId: 'acctid01', channelCode: 'SGAPP', consNo: a.src, consNosrc: a.src, endTime: e, consType: consType(a), funcCode: 'ALIPAY_01', orgNo: a.org, proCode: a.pro, promotCode: '1', promotType: '1', serialNo: '', srvCode: '', startTime: s, userName: 'acctid01' } });
      (Array.isArray(d.sevenEleList) ? d.sevenEleList : []).forEach((x) => {
        const dStr = String(x.day || '').replace(/\D/g, '');
        daily.push({ day: dStr, dayElePq: x.dayElePq });
      });
      if (off === 0) monthTotal = num(d.totalPq);
    } catch (e) { if (off === 0 && !daily.length) throw e; }
  }
  let bills = [], yearPq = NaN, yearAmt = NaN;
  for (const y of [n.y, n.y - 1]) {
    try {
      const d = await app.authed(P_MONTH, { serviceCode: 'BCP_000026', source: 'app', target: a.pro, data: { year: y, consNo: a.src, provinceCode: a.pro, startYm: `${y}01`, endYm: `${y}12`, funcCode: 'ALIPAY_01' } });
      const raw = Array.isArray(d.list) ? d.list : Array.isArray(d.mothEleList) ? d.mothEleList : Array.isArray(d.monthEleList) ? d.monthEleList : [];
      const list = raw.map((x) => {
        const ele = Array.isArray(x.eleList) ? x.eleList : [];
        let use = num(x.monthPq != null ? x.monthPq : x.monthEleNum != null ? x.monthEleNum : x.pq != null ? x.pq : x.totalPq);
        if (!Number.isFinite(use) && ele.length) use = ele.reduce((s, i) => s + (num(i.pq) || 0), 0);
        let cost = num(x.monthAmt != null ? x.monthAmt : x.monthEleCost != null ? x.monthEleCost : x.amt);
        if (!Number.isFinite(cost) && ele.length) cost = ele.reduce((s, i) => s + (num(i.amt) || 0), 0);
        return { month: clean(x.ym || x.month).replace(/\D/g, '').slice(0, 6), monthEleNum: use, monthEleCost: cost };
      }).filter((x) => x.month.length === 6);
      if (y === n.y) { yearPq = num(d.yearPq); yearAmt = num(d.yearAmt); if (!Number.isFinite(yearPq) && list.length) yearPq = list.reduce((s, x) => s + (x.monthEleNum || 0), 0); if (!Number.isFinite(yearAmt) && list.length) yearAmt = list.reduce((s, x) => s + (x.monthEleCost || 0), 0); }
      bills = list.concat(bills);
      if (list.length && y === n.y && n.m > 1) break;
    } catch (e) { if (['-200', '-201', '4006', 'RK008'].includes(e.code)) throw e; break; }
  }
  let bal = null;
  try {
    const d = await app.authed(P_BAL, { serviceCode: '0101143', source: 'app', target: a.pro, data: { srvCode: '', serialNo: '', channelCode: '0902', funcCode: 'A1007200', acctId: app.sess.userId, userName: 'acctid01', promotType: '1', promotCode: '1', userAccountId: app.sess.userId, list: [{ consNoSrc: a.src, proCode: a.pro, sceneType: a.elec, consNo: a.consNo, orgNo: a.org }] } });
    bal = (Array.isArray(d.list) ? d.list : []).find((x) => x && typeof x === 'object') || null;
  } catch (e) { if (['-200', '-201', '4006', 'RK008'].includes(e.code)) throw e; }
  
  let sumMoney = NaN, owe = 0;
  if (bal) {
    const sm = num(bal.sumMoney);        // 账单金额 / 应缴金额
    const ab = num(bal.accountBalance);  // 账户预存款可用余额
    const pb = num(bal.prepayBal);       // 预付费余额
    const ho = num(bal.historyOwe);      // 历史真实逾期欠费

    if (String(bal.consType) === '1') {
      // 预付费用户（智能电表）：优先取 sm，无则取 pb
      sumMoney = Number.isFinite(sm) ? sm : (Number.isFinite(pb) ? pb : 0);
      if (sumMoney < 0) owe = Math.abs(sumMoney);
    } else {
      // 后付费用户（抄表结算户）：
      const validAb = Number.isFinite(ab) && ab > 0 ? ab : 0;
      const validSm = Number.isFinite(sm) && sm > 0 ? sm : 0;

      // 若有预存款，展示抵扣后的净结余；若无预存，展示本期账单金额
      sumMoney = validAb > 0 ? (validAb - validSm) : validSm;

      // 严格判定欠费：仅当国网明确标记逾期欠费(historyOwe > 0)时才认定为欠费
      // 正常账期内的待缴账单绝不误判为欠费
      if (Number.isFinite(ho) && ho > 0) {
        owe = ho;
        sumMoney = -ho;
      }
    }
    if (Number.isFinite(ho) && ho > 0) owe = Math.max(owe, ho);
  }

  const isPostPaid = bal && String(bal.consType) !== '1';
  const eleBill = {
    sumMoney: Number.isFinite(sumMoney) ? sumMoney : 0,
    historyOwe: owe,
    prepayBal: bal ? num(bal.prepayBal) : NaN,
    date: bal ? clean(bal.date || bal.amtTime) : ''
  };
  if (isPostPaid) {
    eleBill.accountBalance = bal && Number.isFinite(num(bal.accountBalance)) ? num(bal.accountBalance) : 0;
  }

  return {
    userInfo: { consNo: a.consNo, consNo_dst: a.src, consName_dst: a.name, orgName: a.orgName, proNo: a.pro },
    arrearsOfFees: owe > 0,
    eleBill,
    dayElecQuantity31: { sevenEleList: daily },
    monthElecQuantity: { mothEleList: bills, dataInfo: { totalEleNum: yearPq, totalEleCost: yearAmt } },
    monthTotal,
  };
}

const rpt = (n) => vmin(n * 100 / 155, config.widgetFamily);

const preference = {
  phone: '',
  password: '',
  smsCode: '',
  /** @type {'daily'|'monthly'} */
  dimension: 'daily',
  barCount: 7,
  showStepProgress: true,
  oneLevelPq: 2160,
  twoLevelPq: 4800
};

const cache = useCache();
const sizes = widgetSize();
const dataFilename = 'data.v2.json';
/** @type {Date} */
let respDate;

const KEYCHAIN_PREFIX = 'honye.sgcc.';

/**
 * SgApp 运行所需的存储与网络适配
 * @param {string} [smsCode] 新设备短信验证码
 */
const createCtx = (smsCode = '') => ({
  env: { SGCC_SMS: smsCode },
  storage: {
    getJSON: (k) => {
      const key = KEYCHAIN_PREFIX + k;
      return Keychain.contains(key) ? JSON.parse(Keychain.get(key)) : null
    },
    setJSON: (k, v) => Keychain.set(KEYCHAIN_PREFIX + k, JSON.stringify(v))
  },
  http: {
    post: async (url, { headers = {}, body = '', timeout = 20000 }) => {
      const request = new Request(url);
      request.method = 'POST';
      request.headers = Object.fromEntries(
        Object.entries(headers).map(([k, v]) => [k, v == null ? '' : String(v)])
      );
      request.body = body;
      request.timeoutInterval = timeout / 1000;
      const text = await request.loadString();
      return {
        status: request.response?.statusCode ?? 200,
        text: async () => text
      }
    }
  }
});

const createApp = () => {
  const { phone, password, smsCode } = preference;
  if (!phone || !password) {
    throw new Error('请先在设置中填写网上国网手机号和密码')
  }
  return new SgApp(createCtx(String(smsCode || '').trim()), phone, password)
};

const fetchData = async () => {
  const app = createApp();
  const { accounts = [] } = await app.ensure();
  if (!accounts.length) throw new Error('该网上国网账号未绑定户号')

  const list = [];
  let error;
  for (const account of accounts.slice(0, 6)) {
    try {
      list.push(await queryAccount(app, account));
    } catch (e) {
      console.error(e);
      error = e;
      // 占位保证 Parameter 下标与户号顺序一致
      list.push(null);
    }
  }
  if (list.every((item) => !item)) throw error
  return list
};

const getData = async () => {
  const fm = FileManager.local();
  const filePath = fm.joinPath(cache.cacheDirectory, dataFilename);
  const mDate = fm.modificationDate(filePath);
  if (mDate && Date.now() - mDate.getTime() < 14400000) {
    console.log('[INFO] Request too frequent, using local cached data...');
    respDate = mDate;
    return cache.readJSON(dataFilename)
  }

  try {
    const data = await fetchData();
    cache.writeJSON(dataFilename, data);
    respDate = new Date();
    return data
  } catch (e) {
    console.error(e);
    const data = cache.readJSON(dataFilename);
    if (!data) throw e
    console.log('[INFO] An exception occurred during the request; using cached data...');
    respDate = mDate;
    return data
  }
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0
};

const currentYm = () => {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
};

/**
 * 将接口数据整理为组件所需字段
 */
const normalize = (data) => {
  const { eleBill = {}, dayElecQuantity31 = {}, monthElecQuantity = {} } = data;
  const daily = (dayElecQuantity31.sevenEleList || [])
    .filter(({ dayElePq }) => dayElePq !== '' && dayElePq != null && !Number.isNaN(Number(dayElePq)))
    .map(({ day, dayElePq }) => ({ day: String(day), value: Number(dayElePq) }))
    .sort((a, b) => a.day.localeCompare(b.day));
  const monthly = (monthElecQuantity.mothEleList || [])
    .map(({ month, monthEleNum, monthEleCost }) => ({
      month: String(month),
      pq: toNumber(monthEleNum),
      cost: toNumber(monthEleCost)
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const ym = currentYm();
  // 最近一个已结算月份作为“上期”
  const settled = monthly.filter(({ month, pq, cost }) => month < ym && (pq > 0 || cost > 0));
  const last = settled[settled.length - 1];
  const yearPq = toNumber(monthElecQuantity.dataInfo?.totalEleNum);
  // 阶梯电量 = 年度已结算电量 + 本月未结算的日用电
  const pendingPq = monthly.some(({ month }) => month === ym)
    ? 0
    : daily.filter(({ day }) => day.startsWith(ym)).reduce((sum, { value }) => sum + value, 0);

  return {
    arrearsOfFees: !!data.arrearsOfFees,
    balance: toNumber(eleBill.sumMoney).toFixed(2),
    lastAmount: last ? last.cost.toFixed(2) : '0.00',
    lastPq: last ? last.pq : 0,
    yearPq,
    yearAmount: toNumber(monthElecQuantity.dataInfo?.totalEleCost).toFixed(2),
    stepPq: Math.round(yearPq + pendingPq),
    daily,
    monthly
  }
};

const getWidgetData = async () => {
  const [i] = (args.widgetParameter || '')
    .split(';')
    .map((item) => item.trim() || undefined);
  const index = Number(i || 0);
  const data = await getData();
  const item = data[index];
  if (!item) throw new Error(`户号 ${index} 不存在或查询失败`)
  return normalize(item)
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
  const getLevel = (total) => total > Number(twoLevelPq) ? 3 : total > Number(oneLevelPq) ? 2 : 1;
  /** 每月对应的阶梯，按年累计 */
  const monthLevels = {};
  /** @type {{ value: number; level: number }[]} */
  let seven = [];
  let year = '';
  let yearTotal = 0;
  for (const { month, pq } of data.monthly) {
    if (month.slice(0, 4) !== year) {
      year = month.slice(0, 4);
      yearTotal = 0;
    }
    yearTotal += pq;
    const level = getLevel(yearTotal);
    monthLevels[month] = level;
    if (dimension === 'monthly') {
      seven.push({ value: pq, level });
    }
  }
  if (dimension === 'daily') {
    const thisYear = String(new Date().getFullYear());
    const thisYearMonths = Object.keys(monthLevels).filter((m) => m.startsWith(thisYear));
    // 本月未结算时沿用今年最近一个月的阶梯
    const latestLevel = monthLevels[thisYearMonths[thisYearMonths.length - 1]] || 1;
    for (const { day, value } of data.daily) {
      const month = day.slice(0, 6);
      // 非今年数据默认阶梯为 1
      const level = month.startsWith(thisYear) ? monthLevels[month] || latestLevel : 1;
      seven.push({ value, level });
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
  const max = Math.max(0, ...seven.map(({ value }) => value)) || 1;
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
  const totalYearPq = data.stepPq;

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
  const totalYearPq = data.stepPq;

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
  const number = left.addText(data.balance);
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
    value: data.lastAmount
  }));
  await add((stack) => addLabelValue(stack, {
    label: '上期电量',
    value: data.lastPq
  }));
  await add((stack) => addLabelValue(stack, {
    label: '年度电费',
    value: data.yearAmount
  }));
  await add((stack) => addLabelValue(stack, {
    label: '年度电量',
    value: data.yearPq
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
  const { lastAmount } = data;
  const l = bottom.addText(`余额${Number(lastAmount) ? `(上期:${lastAmount})` : ''}`);
  l.font = Font.systemFont(rpt(12));
  l.textColor = Color.dynamic(new Color('#18231C', 0.7), new Color('#ffffff', 0.7));
  const w = bottom.addStack();
  w.centerAlignContent();
  const p = w.addText(data.balance);
  p.font = Font.boldRoundedSystemFont(rpt(24));
  p.textColor = Color.dynamic(new Color('#18231C'), new Color('#ffffff'));
  w.addSpacer();
  const logo = w.addImage(await getLogo());
  const lw = rpt(24);
  logo.imageSize = new Size(lw, lw);
  return widget
};

const createErrorWidget = (message) => {
  const widget = new ListWidget();
  widget.setPadding(12, 12, 12, 12);
  const title = widget.addText('网上国网');
  title.font = Font.boldSystemFont(14);
  title.textColor = Color.dynamic(new Color('#18231C'), new Color('#ffffff'));
  widget.addSpacer(6);
  const text = widget.addText(message);
  text.font = Font.systemFont(12);
  text.minimumScaleFactor = 0.6;
  text.textColor = Color.dynamic(new Color('#18231C', 0.7), new Color('#ffffff', 0.7));
  widget.addSpacer();
  return widget
};

const presentAlert = async (title, message) => {
  const alert = new Alert();
  alert.title = title;
  alert.message = message;
  alert.addAction(i18n(['OK', '确定']));
  await alert.presentAlert();
};

const sendSms = async () => {
  let app;
  try {
    app = createApp();
  } catch (e) {
    await presentAlert('提示', e.message);
    return
  }
  try {
    const codeKey = await app.sendDeviceSms();
    app.st(app.sk(K.sms), { user: app.user, codeKey, ts: Date.now(), used: '' });
    await presentAlert(
      '短信验证码已发送',
      `验证码已发至 ${app.user.slice(0, 3)}****${app.user.slice(-4)}，请在 15 分钟内填入「短信验证码」后预览组件`
    );
  } catch (e) {
    console.error(e);
    await presentAlert('发送失败', e.message || String(e));
  }
};

const clearCache = async () => {
  const fm = FileManager.local();
  const filePath = fm.joinPath(cache.cacheDirectory, dataFilename);
  if (fm.fileExists(filePath)) fm.remove(filePath);
  await presentAlert('已清除', '下次刷新将重新请求国网数据');
};

await withSettings({
  formItems: [
    {
      label: i18n(['Account', '网上国网账号']),
      type: 'group',
      items: [
        {
          label: i18n(['Phone', '手机号']),
          name: 'phone',
          type: 'tel',
          default: preference.phone
        },
        {
          label: i18n(['Password', '密码']),
          name: 'password',
          type: 'password',
          default: preference.password
        },
        {
          label: i18n(['Send SMS code', '发送短信验证码']),
          name: 'sendSms',
          type: 'cell'
        },
        {
          label: i18n(['SMS code', '短信验证码']),
          name: 'smsCode',
          type: 'text',
          default: preference.smsCode
        },
        {
          label: i18n(['Clear data cache', '清除数据缓存']),
          name: 'clearCache',
          type: 'cell'
        }
      ]
    },
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
  onItemClick: async ({ name }, { settings }) => {
    Object.assign(preference, settings);
    switch (name) {
      case 'sendSms':
        await sendSms();
        break
      case 'clearCache':
        await clearCache();
        break
    }
  },
  render: async ({ family, settings }) => {
    family && (config.widgetFamily = family);
    Object.assign(preference, settings);
    try {
      return await createWidget()
    } catch (e) {
      console.error(e);
      return createErrorWidget(e.message || String(e))
    }
  }
});
