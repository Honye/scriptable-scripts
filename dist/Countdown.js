// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: user-clock; icon-color: teal;
/**
 * @version 1.2.0
 * @author Honye
 */

// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: magic;
/**
 * @file API 链式调用无变量命名烦恼
 * @version 1.0.0
 * @author Honye
 */

/**
 * @example
 * ```
 * proxy.call(this)
 * ```
 */
function proxy () {
  this.ListWidget = new Proxy(ListWidget, {
    construct (Target, args) {
      const widget = new Target(...args);

      /**
       * @template {extends Record<string, any>} T
       * @param {T} target
       * @param {string[]} props
       */
      const makeSetter = (target, props) => {
        const properties = props.reduce((res, item) => {
          res[`set${item[0].toUpperCase()}${item.substring(1)}`] = {
            value (value) {
              this[item] = value;
              return this
            }
          };
          return res
        }, {});
        Object.defineProperties(target, properties);
        Object.defineProperties(target, {
          next: {
            value (callback) {
              const context = this;
              callback(context);
              return this
            }
          }
        });
      };

      /**
       * 使无返回的函数返回 this 以支持链式调用
       * @param {string[]} props 函数名列表
       */
      const proxyFn = (target, props) => {
        for (const name of props) {
          target[name] = new Proxy(target[name], {
            apply (target, self, args) {
              target.apply(self, args);
              return self
            }
          });
        }
      };

      makeSetter(widget, [
        'backgroundColor',
        'backgroundImage',
        'backgroundGradient',
        'spacing',
        'url',
        'refreshAfterDate'
      ]);
      proxyFn(widget, [
        'setPadding',
        'useDefaultPadding'
      ]);

      const addDateHandler = {
        apply (target, self, args) {
          const result = target.apply(self, args);
          makeSetter(result, [
            'date',
            'textColor',
            'font',
            'textOpacity',
            'lineLimit',
            'minimumScaleFactor',
            'shadowColor',
            'shadowRadius',
            'shadowOffset',
            'url'
          ]);
          proxyFn(result, [
            'leftAlignText',
            'centerAlignText',
            'rightAlignText',
            'applyTimeStyle',
            'applyDateStyle',
            'applyRelativeStyle',
            'applyOffsetStyle',
            'applyTimerStyle'
          ]);
          return result
        }
      };
      /** @type {ProxyHandler<Function>} */
      const addImageHandler = {
        apply (target, self, args) {
          const result = target.apply(self, args);
          makeSetter(result, [
            'image',
            'resizable',
            'imageSize',
            'imageOpacity',
            'cornerRadius',
            'borderWidth',
            'borderColor',
            'containerRelativeShape',
            'tintColor',
            'url'
          ]);
          proxyFn(result, [
            'leftAlignImage',
            'centerAlignImage',
            'rightAlignImage',
            'applyFittingContentMode',
            'applyFillingContentMode'
          ]);
          return result
        }
      };
      const addTextHandler = {
        apply (target, self, args) {
          const result = target.apply(self, args);
          makeSetter(result, [
            'text',
            'textColor',
            'font',
            'textOpacity',
            'lineLimit',
            'minimumScaleFactor',
            'shadowColor',
            'shadowRadius',
            'shadowOffset',
            'url'
          ]);
          proxyFn(result, [
            'leftAlignText',
            'centerAlignText',
            'rightAlignText'
          ]);
          return result
        }
      };
      const addStackHandler = {
        apply (target, self, args) {
          const stack = target.apply(self, args);
          makeSetter(stack, [
            'backgroundColor',
            'backgroundImage',
            'backgroundGradient',
            'spacing',
            'size',
            'cornerRadius',
            'borderWidth',
            'borderColor',
            'url'
          ]);
          proxyFn(stack, [
            'setPadding',
            'useDefaultPadding',
            'topAlignContent',
            'centerAlignContent',
            'bottomAlignContent',
            'layoutHorizontally',
            'layoutVertically'
          ]);
          stack.addDate = new Proxy(stack.addDate, addDateHandler);
          stack.addImage = new Proxy(stack.addImage, addImageHandler);
          stack.addStack = new Proxy(stack.addStack, addStackHandler);
          stack.addText = new Proxy(stack.addText, addTextHandler);
          return stack
        }
      };

      widget.addDate = new Proxy(widget.addDate, addDateHandler);
      widget.addImage = new Proxy(widget.addImage, addImageHandler);
      widget.addStack = new Proxy(widget.addStack, addStackHandler);
      widget.addText = new Proxy(widget.addText, addTextHandler);
      return widget
    }
  });
  return this
}

/**
 * @param {object} options
 * @param {string} [options.title]
 * @param {string} [options.message]
 * @param {Array<{ title: string; [key: string]: any }>} options.options
 * @param {boolean} [options.showCancel = true]
 * @param {string} [options.cancelText = 'Cancel']
 */
const presentSheet = async (options) => {
  options = {
    showCancel: true,
    cancelText: 'Cancel',
    ...options
  };
  const alert = new Alert();
  if (options.title) {
    alert.title = options.title;
  }
  if (options.message) {
    alert.message = options.message;
  }
  if (!options.options) {
    throw new Error('The "options" property of the parameter cannot be empty')
  }
  for (const option of options.options) {
    alert.addAction(option.title);
  }
  if (options.showCancel) {
    alert.addCancelAction(options.cancelText);
  }
  const value = await alert.presentSheet();
  return {
    value,
    option: options.options[value]
  }
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
    return fm.readImage(fm.joinPath(cacheDirectory, filePath))
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
 * 轻松实现桌面组件可视化配置
 *
 * - 颜色选择器及更多表单控件
 * - 快速预览
 *
 * GitHub: https://github.com/honye
 *
 * @version 1.2.2
 * @author Honye
 */

/**
 * @returns {Promise<Settings>}
 */
const readSettings = async () => {
  const localFM = useFileManager();
  let settings = localFM.readJSON('settings.json');
  if (settings) {
    console.log('[info] use local settings');
    return settings
  }

  const iCloudFM = useFileManager({ useICloud: true });
  settings = iCloudFM.readJSON('settings.json');
  if (settings) {
    console.log('[info] use iCloud settings');
  }
  return settings
};

/**
 * @param {Record<string, unknown>} data
 * @param {{ useICloud: boolean; }} options
 */
const writeSettings = async (data, { useICloud }) => {
  const fm = useFileManager({ useICloud });
  fm.writeJSON('settings.json', data);
};

const removeSettings = async (settings) => {
  const cache = useFileManager({ useICloud: settings.useICloud });
  FileManager.local().remove(
    FileManager.local().joinPath(
      cache.cacheDirectory,
      'settings.json'
    )
  );
};

const moveSettings = (useICloud, data) => {
  const localFM = useFileManager();
  const iCloudFM = useFileManager({ useICloud: true });
  const [i, l] = [
    FileManager.local().joinPath(
      iCloudFM.cacheDirectory,
      'settings.json'
    ),
    FileManager.local().joinPath(
      localFM.cacheDirectory,
      'settings.json'
    )
  ];
  try {
    writeSettings(data, { useICloud });
    if (useICloud) {
      FileManager.local().remove(l);
    } else {
      FileManager.iCloud().remove(i);
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * @typedef {object} FormItem
 * @property {string} name
 * @property {string} label
 * @property {string} [type]
 * @property {{ label: string; value: unknown }[]} [options]
 * @property {unknown} [default]
 */
/**
 * @typedef {Record<string, unknown>} Settings
 * @property {boolean} useICloud
 * @property {string} [backgroundImage]
 */
/**
 * @param {object} options
 * @param {FormItem[]} [options.formItems]
 * @param {(data: {
 *  settings: Settings;
 *  family?: 'small'|'medium'|'large';
 * }) => Promise<ListWidget>} options.render
 * @param {string} [options.homePage]
 * @param {(item: FormItem) => void} [options.onItemClick]
 * @returns {Promise<ListWidget|undefined>} 在 Widget 中运行时返回 ListWidget，其它无返回
 */
const withSettings = async (options) => {
  const {
    formItems = [],
    onItemClick,
    render,
    homePage = 'https://www.imarkr.com'
  } = options;
  const cache = useCache();

  let settings = await readSettings() || {};
  const imgPath = FileManager.local().joinPath(
    cache.cacheDirectory,
    'bg.png'
  );

  if (config.runsInWidget) {
    const widget = await render({ settings });
    if (settings.backgroundImage) {
      widget.backgroundImage = FileManager.local().readImage(imgPath);
    }
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
  font-size: 16px;
  min-height: 2em;
  padding: 0.5em 20px;
  position: relative;
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
  min-width: 8em;
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
}`;

  const js =
`(() => {
  const settings = ${JSON.stringify(settings)}
  const formItems = ${JSON.stringify(formItems)}
  
  window.invoke = (code, data) => {
    window.dispatchEvent(
      new CustomEvent(
        'JBridge',
        { detail: { code, data } }
      )
    )
  }
  
  const iCloudInput = document.querySelector('input[name="useICloud"]')
  iCloudInput.checked = settings.useICloud
  iCloudInput
    .addEventListener('change', (e) => {
      invoke('moveSettings', e.target.checked)
    })
  
  const formData = {};

  const fragment = document.createDocumentFragment()
  for (const item of formItems) {
    const value = settings[item.name] ?? item.default ?? null
    formData[item.name] = value;
    const label = document.createElement("label");
    label.className = "form-item";
    const div = document.createElement("div");
    div.innerText = item.label;
    label.appendChild(div);
    if (item.type === 'select') {
      const select = document.createElement('select')
      select.className = 'form-item__input'
      select.name = item.name
      select.value = value
      for (const opt of (item.options || [])) {
        const option = document.createElement('option')
        option.value = opt.value
        option.innerText = opt.label
        option.selected = value === opt.value
        select.appendChild(option)
      }
      select.addEventListener('change', (e) => {
        formData[item.name] = e.target.value
        invoke('changeSettings', formData)
      })
      label.appendChild(select)
    } else if (item.type === 'cell') {
      label.classList.add('form-item--link')
      const icon = document.createElement('i')
      icon.className = 'iconfont icon-arrow_right'
      label.appendChild(icon)
      label.addEventListener('click', () => {
        invoke('itemClick', item)
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
    fragment.appendChild(label);
  }
  document.getElementById('form').appendChild(fragment)

  for (const btn of document.querySelectorAll('.preview')) {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget
      target.classList.add('loading')
      const icon = e.currentTarget.querySelector('.iconfont')
      const className = icon.className
      icon.className = 'iconfont icon-loading'
      const listener = (event) => {
        const { code } = event.detail
        if (code === 'previewStart') {
          target.classList.remove('loading')
          icon.className = className
          window.removeEventListener('JWeb', listener);
        }
      }
      window.addEventListener('JWeb', listener)
      invoke('preview', e.currentTarget.dataset.size)
    })
  }

  const reset = () => {
    for (const item of formItems) {
      const el = document.querySelector(\`.form-item__input[name="\${item.name}"]\`)
      formData[item.name] = item.default
      if (item.type === 'switch') {
        el.checked = item.default
      } else {
        el && (el.value = item.default)
      }
    }
    invoke('removeSettings', formData)
  }
  document.getElementById('reset').addEventListener('click', () => reset())

  document.getElementById('chooseBgImg')
    .addEventListener('click', () => invoke('chooseBgImg'))
})()`;

  const html =
`<html>
  <head>
    <meta name='viewport' content='width=device-width, user-scalable=no'>
    <link rel="stylesheet" href="//at.alicdn.com/t/c/font_3772663_kmo790s3yfq.css" type="text/css">
    <style>${style}</style>
  </head>
  <body>
  <div class="list">
    <div class="list__header">${i18n(['Common', '通用'])}</div>
    <form class="list__body" action="javascript:void(0);">
      <label class="form-item">
        <div>${i18n(['Sync with iCloud', 'iCloud 同步'])}</div>
        <input name="useICloud" type="checkbox" role="switch">
      </label>
      <label id="chooseBgImg" class="form-item form-item--link">
        <div>${i18n(['Background image', '背景图'])}</div>
        <i class="iconfont icon-arrow_right"></i>
      </label>
      <label id='reset' class="form-item form-item--link">
        <div>${i18n(['Reset', '重置'])}</div>
        <i class="iconfont icon-arrow_right"></i>
      </label>
    </form>
  </div>
  <div class="list">
    <div class="list__header">${i18n(['Settings', '设置'])}</div>
    <form id="form" class="list__body" action="javascript:void(0);"></form>
  </div>
  <div class="actions">
    <button class="preview" data-size="small"><i class="iconfont icon-yingyongzhongxin"></i>${i18n(['Small', '预览小号'])}</button>
    <button class="preview" data-size="medium"><i class="iconfont icon-daliebiao"></i>${i18n(['Medium', '预览中号'])}</button>
    <button class="preview" data-size="large"><i class="iconfont icon-dantupailie"></i>${i18n(['Large', '预览大号'])}</button>
  </div>
  <footer>
    <div class="copyright">Copyright © 2022 <a href="javascript:invoke('safari','https://www.imarkr.com');">iMarkr</a> All rights reserved.</div>
  </footer>
    <script>${js}</script>
  </body>
</html>`;

  const webView = new WebView();
  await webView.loadHTML(html, homePage);

  const clearBgImg = () => {
    delete settings.backgroundImage;
    const fm = FileManager.local();
    if (fm.fileExists(imgPath)) {
      fm.remove(imgPath);
    }
  };

  const chooseBgImg = async () => {
    const { option } = await presentSheet({
      options: [
        { key: 'choose', title: i18n(['Choose photo', '选择图片']) },
        { key: 'clear', title: i18n(['Clear background image', '清除背景图']) }
      ],
      cancelText: i18n(['Cancel', '取消'])
    });
    switch (option?.key) {
      case 'choose': {
        try {
          const image = await Photos.fromLibrary();
          cache.writeImage('bg.png', image);
          settings.backgroundImage = imgPath;
          writeSettings(settings, { useICloud: settings.useICloud });
        } catch (e) {}
        break
      }
      case 'clear':
        clearBgImg();
        writeSettings(settings, { useICloud: settings.useICloud });
        break
    }
  };

  const injectListener = async () => {
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
    ).catch((err) => {
      console.error(err);
      throw err
    });
    const { code, data } = event;
    switch (code) {
      case 'preview': {
        const widget = await render({ settings, family: data });
        const { backgroundImage } = settings;
        if (backgroundImage) {
          widget.backgroundImage = FileManager.local().readImage(backgroundImage);
        }
        webView.evaluateJavaScript(
          'window.dispatchEvent(new CustomEvent(\'JWeb\', { detail: { code: \'previewStart\' } }))',
          false
        );
        widget[`present${data.replace(data[0], data[0].toUpperCase())}`]();
        break
      }
      case 'safari':
        Safari.openInApp(data, true);
        break
      case 'changeSettings':
        settings = { ...settings, ...data };
        writeSettings(settings, { useICloud: settings.useICloud });
        break
      case 'moveSettings':
        settings.useICloud = data;
        moveSettings(data, settings);
        break
      case 'removeSettings':
        settings = { ...settings, ...data };
        clearBgImg();
        removeSettings(settings);
        break
      case 'chooseBgImg':
        await chooseBgImg();
        break
      case 'itemClick':
        onItemClick?.(data);
        break
    }
    injectListener();
  };

  injectListener().catch((e) => {
    console.error(e);
    throw e
  });
  webView.present();
  // ======= web end =========
};

if (typeof require === 'undefined') require = importModule;

proxy.call(undefined);

const preference = {
  title: '🇨🇳 Programmer',
  titleBgOpacity: 1,
  titleColor: '#ffffff',
  date: '2024-10-24',
  numColor: '#373655',
  numFontSize: 48,
  unitColor: '#6e6e73',
  unitFontSize: 18,
  dateColor: '#86868b',
  dateFontSize: 14,
  useTextShadow: false
};

/**
 * @param {WidgetText} widget
 */
const setTextShadow = (widget) => {
  widget.setShadowColor(new Color(Color.gray().hex, 0.25))
    .setShadowRadius(0.5)
    .setShadowOffset(new Point(1, 1));
};

const renderTitle = (widget) => {
  const { title, titleBgOpacity, titleColor, useTextShadow } = preference;
  const bg = new LinearGradient();
  bg.colors = [
    new Color('#9ce4c1', titleBgOpacity),
    new Color('#92d8e1', titleBgOpacity)
  ];
  bg.locations = [0, 1];
  bg.startPoint = new Point(0, 0);
  bg.endPoint = new Point(1, 0);

  widget.addStack()
    .setBackgroundGradient(bg)
    .setPadding(10, 12, 10, 12)
    .layoutVertically()
    .next((stack) => {
      stack.addText(title)
        .setFont(Font.semiboldSystemFont(16))
        .setTextColor(new Color(titleColor))
        .next((widget) => {
          if (useTextShadow) {
            setTextShadow(widget);
          }
        });
    })
    .next((stack) => stack.addStack().addSpacer());
};

const addText = (widget, { text, lineHeight }) => {
  return widget.addStack()
    .setPadding(0, 0, 0, 0)
    .setSize(new Size(0, lineHeight))
    .addText(text)
};

/**
 * @param {WidgetStack} container
 */
const renderDays = (container) => {
  const {
    date,
    numColor, numFontSize,
    unitColor, unitFontSize,
    useTextShadow
  } = preference;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const days = Math.ceil(Math.abs(target - now) / (24 * 3600000));

  const row = container.addStack().bottomAlignContent();
  // render number
  addText(row, {
    text: `${days}`,
    lineHeight: numFontSize
  })
    .setFont(Font.boldSystemFont(numFontSize))
    .setTextColor(new Color(numColor))
    .next((widget) => {
      if (useTextShadow) {
        setTextShadow(widget);
      }
    });

  row.addSpacer(4);
  // render unit
  row.addText(i18n(['days', '天']))
    .setFont(Font.systemFont(unitFontSize))
    .setLineLimit(1)
    .setMinimumScaleFactor(0.2)
    .setTextColor(new Color(unitColor))
    .next((widget) => {
      if (useTextShadow) {
        setTextShadow(widget);
      }
    });
};

/**
 * @param {WidgetStack} container
 */
const renderDate = (container) => {
  const { date, dateColor, dateFontSize, useTextShadow } = preference;

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const df = new DateFormatter();
  df.dateFormat = 'yyyy/MM/dd';

  container.addText(df.string(target))
    .setFont(Font.regularRoundedSystemFont(dateFontSize))
    .setTextColor(new Color(dateColor))
    .next((widget) => {
      if (useTextShadow) {
        setTextShadow(widget);
      }
    });
};

const createWidget = () => {
  const { backgroundImage } = preference;

  const gradient = new LinearGradient();
  gradient.colors = [
    new Color('#fff', 0),
    new Color('#9ce4c1', 0.3)
  ];
  gradient.locations = [0, 1];
  gradient.startPoint = new Point(0, 0);
  gradient.endPoint = new Point(1, 0);

  const widget = new ListWidget()
    .setBackgroundColor(Color.white())
    .next((widget) => {
      if (!backgroundImage) {
        widget.setBackgroundGradient(gradient);
      }
    })
    .setPadding(0, 0, 0, 0)
    .next(renderTitle);

  widget.addStack()
    .layoutVertically()
    .setPadding(12, 12, 18, 12)
    .next((stack) => stack.addSpacer())
    .next(renderDays)
    .next((stack) => stack.addSpacer(8))
    .next(renderDate);

  return widget
};

await withSettings({
  formItems: [
    {
      name: 'title',
      label: i18n(['Title', '标题']),
      default: preference.title
    },
    {
      name: 'titleBgOpacity',
      label: i18n(['Title background opacity', '标题背景透明度']),
      type: 'number',
      default: preference.titleBgOpacity
    },
    {
      name: 'titleColor',
      label: i18n(['Title color', '标题颜色']),
      type: 'color',
      default: preference.titleColor
    },
    {
      name: 'date',
      label: i18n(['Date', '日期']),
      type: 'date',
      default: preference.date
    },
    {
      name: 'numColor',
      label: i18n(['Number color', '数字颜色']),
      type: 'color',
      default: preference.numColor
    },
    {
      name: 'numFontSize',
      label: i18n(['Number font size', '数字字体大小']),
      type: 'number',
      default: preference.numFontSize
    },
    {
      name: 'unitColor',
      label: i18n(['Unit color', '单位颜色']),
      type: 'color',
      default: preference.unitColor
    },
    {
      name: 'unitFontSize',
      label: i18n(['Unit font size', '单位字体大小']),
      type: 'number',
      default: preference.unitFontSize
    },
    {
      name: 'dateColor',
      label: i18n(['Date color', '日期颜色']),
      type: 'color',
      default: preference.dateColor
    },
    {
      name: 'dateFontSize',
      label: i18n(['Date font size', '日期字体大小']),
      type: 'number',
      default: preference.dateFontSize
    },
    {
      name: 'useTextShadow',
      label: i18n(['Text shadow', '文字阴影']),
      type: 'switch',
      default: preference.useTextShadow
    }
  ],
  render: ({ settings }) => {
    Object.assign(preference, settings);
    const widget = createWidget();
    return widget
  }
});
