// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: book;
/**
 * @version 1.0.0
 * @author Honye
 */

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
 * Thanks @mzeryck
 *
 * @param {number} [height] The screen height measured in pixels
 */
const phoneSize = (height) => {
  const phones = {
    /** 14 Pro Max */
    2796: {
      small: 510,
      medium: 1092,
      large: 1146,
      left: 99,
      right: 681,
      top: 282,
      middle: 918,
      bottom: 1554
    },
    /** 14 Pro */
    2556: {
      small: 474,
      medium: 1014,
      large: 1062,
      left: 82,
      right: 622,
      top: 270,
      middle: 858,
      bottom: 1446
    },
    /** 13 Pro Max, 12 Pro Max */
    2778: {
      small: 510,
      medium: 1092,
      large: 1146,
      left: 96,
      right: 678,
      top: 246,
      middle: 882,
      bottom: 1518
    },
    /** 13, 13 Pro, 12, 12 Pro */
    2532: {
      small: 474,
      medium: 1014,
      large: 1062,
      left: 78,
      right: 618,
      top: 231,
      middle: 819,
      bottom: 1407
    },
    /** 11 Pro Max, XS Max */
    2688: {
      small: 507,
      medium: 1080,
      large: 1137,
      left: 81,
      right: 654,
      top: 228,
      middle: 858,
      bottom: 1488
    },
    /** 11, XR */
    1792: {
      small: 338,
      medium: 720,
      large: 758,
      left: 55,
      right: 437,
      top: 159,
      middle: 579,
      bottom: 999
    },
    /** 13 mini, 12 mini / 11 Pro, XS, X */
    2436: {
      small: 465,
      medium: 987,
      large: 1035,
      x: {
        left: 69,
        right: 591,
        top: 213,
        middle: 783,
        bottom: 1353
      },
      mini: {
        left: 69,
        right: 591,
        top: 231,
        middle: 801,
        bottom: 1371
      }
    },
    /** Plus phones */
    2208: {
      small: 471,
      medium: 1044,
      large: 1071,
      left: 99,
      right: 672,
      top: 114,
      middle: 696,
      bottom: 1278
    },
    /** SE2 and 6/6S/7/8 */
    1334: {
      small: 296,
      medium: 642,
      large: 648,
      left: 54,
      right: 400,
      top: 60,
      middle: 412,
      bottom: 764
    },
    /** SE1 */
    1136: {
      small: 282,
      medium: 584,
      large: 622,
      left: 30,
      right: 332,
      top: 59,
      middle: 399,
      bottom: 399
    },
    /** 11 and XR in Display Zoom mode */
    1624: {
      small: 310,
      medium: 658,
      large: 690,
      left: 46,
      right: 394,
      top: 142,
      middle: 522,
      bottom: 902
    },
    /** Plus in Display Zoom mode */
    2001: {
      small: 444,
      medium: 963,
      large: 972,
      left: 81,
      right: 600,
      top: 90,
      middle: 618,
      bottom: 1146
    }
  };
  height = height || Device.screenResolution().height;
  const scale = Device.screenScale();

  const phone = phones[height];
  if (phone) {
    return phone
  }

  if (config.runsInWidget) {
    const pc = {
      small: 164 * scale,
      medium: 344 * scale,
      large: 354 * scale
    };
    return pc
  }

  // in app screen fixed 375x812 pt
  return {
    small: 155 * scale,
    medium: 329 * scale,
    large: 345 * scale
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
 * @param {string} data
 */
const hashCode = (data) => {
  return Array.from(data).reduce((accumulator, currentChar) => Math.imul(31, accumulator) + currentChar.charCodeAt(0), 0)
};

/**
 * 轻松实现桌面组件可视化配置
 *
 * - 颜色选择器及更多表单控件
 * - 快速预览
 *
 * GitHub: https://github.com/honye
 *
 * @version 1.2.3
 * @author Honye
 */

const fm = FileManager.local();
const fileName = 'settings.json';

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
      fm.remove(l);
    } else {
      fm.remove(i);
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
    if (item.media) {
      label.setAttribute('media', item.media)
    }
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
      select.addEventListener('change', ({ target }) => {
        formData[item.name] = target.value
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

const paddingVertical = 10;
const preference = {
  /** @type {'light'|'dark'|'system'} */
  colorScheme: 'system',
  fontSize: 14,
  useShadow: false,
  lightColor: '#333333',
  darkColor: '#ffffff',
  indexLightColor: '',
  indexDarkColor: '',
  timeColor: '#666666',
  logoSize: 30,
  padding: [NaN, 12, NaN, 14],
  gap: 8,
  columns: '1'
};

const conf = {};
const screen = Device.screenResolution();
const scale = Device.screenScale();
const phone = phoneSize(screen.height);
const cache = useCache();

if (config.runsInWidget) {
  const [colorScheme] = (args.widgetParameter || '').split(';').map(text => text.trim());
  preference.colorScheme = colorScheme || preference.colorScheme;
}

const fetchData = async () => {
  const url = 'https://edith.xiaohongshu.com/api/sns/v1/search/hot_list';
  const request = new Request(url);
  request.headers = {
    'User-Agent': 'discover/8.27 (iPhone; iOS 17.4; Scale/2.00) Resolution/828*1792 Version/8.27 Build/8270555 Device/(Apple Inc.;iPhone12,1) NetType/CellNetwork',
    'xy-direction': '11',
    'Accept-Language': 'en-CN;q=1, zh-Hans-CN;q=0.9',
    shield: 'XYAAAAAQAAAAEAAABTAAAAUzUWEe4xG1IYD9/c+qCLOlKGmTtFa+lG434Me+FTQahCwIG0n8AVP53/i+Ytz8QursR+2dM1ZAw9FWKBZM6A31hp8uUtsx94LpkrZ5aD2koPQyq1',
    'xy-platform-info': 'platform=iOS&version=8.27&build=8270555&deviceId=05541FBC-7D6B-44B9-8A7D-C4790ED3C9D1&bundle=com.xingin.discover',
    'xy-common-params': 'app_id=ECFAAF02&build=8270555&channel=AppStore&deviceId=05541FBC-7D6B-44B9-8A7D-C4790ED3C9D1&device_fingerprint=2020111813402415850d0efad8f9e4c36e80fb5930417d0175b0e50fd1adc8&device_fingerprint1=2020111813402415850d0efad8f9e4c36e80fb5930417d0175b0e50fd1adc8&device_model=phone&fid=1608005629-0-0-eed79a78f1907a1d38d9d05dcddae6bc&gid=7d8c150e9cbc5575c2b0c5f2037957ece60f69c847359bfc77fd7966&identifier_flag=1&is_mac=0&lang=en&launch_id=732152837&platform=iOS&project_id=ECFAAF&sid=session.1698164477515785136366&t=1710460041&teenager=0&tz=Asia/Shanghai&uis=light&version=8.27',
    Referer: 'https://app.xhs.cn/'
  };
  try {
    const res = await request.loadJSON();
    const df = new DateFormatter();
    df.dateFormat = 'HH:mm';
    const timeString = df.string(new Date());
    const data = {
      data: res,
      updatedAt: timeString
    };
    cache.writeJSON('trending.json', data);
    return data
  } catch (e) {
    const data = cache.readJSON('trending.json');
    return data
  }
};

/**
 * 优先使用缓存的 Logo，如果不存在缓存则使用线上 Logo 并缓存
 */
const getLogoImage = async () => {
  try {
    const image = cache.readImage('logo.png');
    if (!image) {
      throw new Error('no cache')
    }
    return image
  } catch (e) {
    const image = await getImage('https://i2.100024.xyz/2024/03/16/ndzt4i.webp');
    cache.writeImage('logo.png', image);
    return image
  }
};

const createWidget = async ({ data, updatedAt }) => {
  const {
    fontSize,
    logoSize,
    padding,
    gap,
    columns
  } = preference;
  const { widgetFamily } = config;
  const heightPX = widgetFamily === 'medium' ? phone.small : phone[widgetFamily];
  let height = heightPX / scale;
  if (columns > 1) {
    // 当列数大于 1 时 Logo 和时间占满一行
    height -= logoSize;
  }
  conf.count = Math.floor((height - paddingVertical * 2 + gap) / (fontSize + gap));
  if (widgetFamily === 'small') {
    padding[1] = padding[3] = 6;
  }

  let stackBottom;
  let widgetBottom;
  const widget = new ListWidget();
  widget.url = 'xhsdiscover://home';
  const paddingY = paddingVertical - (gap / 2);
  widget.setPadding(paddingY, padding[1], paddingY, padding[3]);

  const max = Math.min(conf.count, data.data.items.length);
  const logoLines = logoSize ? Math.ceil((logoSize + gap) / (fontSize + gap)) : 0;
  if (columns > 1) {
    await addLogoTime(widget, { time: updatedAt });
    const stackItems = widget.addStack();
    const { add } = await useGrid(stackItems, { column: columns });
    for (let i = 0; i < max * columns; ++i) {
      await add((stack) => addItem(stack, data.data.items[i]), i);
    }
  } else {
    for (let i = 0; i < max; ++i) {
      const item = data.data.items[i];
      if (i === 0) {
        const stack = widget.addStack();
        await addItem(stack, item, i);
        stack.addSpacer();
        await addTime(stack, updatedAt);
      } else if (i < max - logoLines) {
        await addItem(widget, item, i);
      } else {
        if (!widgetBottom) {
          stackBottom = widget.addStack();
          stackBottom.bottomAlignContent();
          widgetBottom = stackBottom.addStack();
          widgetBottom.layoutVertically();
          addItem(widgetBottom, item, i);
        } else {
          await addItem(widgetBottom, item, i);
        }
        widgetBottom.length = (widgetBottom.length || 0) + 1;
        if (widgetBottom.length === logoLines) {
          stackBottom.addSpacer();
          await addLogo(stackBottom);
        }
      }
    }
  }
  return widget
};

/**
 * 优先使用线上最新 Icon 并缓存，请求失败时使用缓存
 */
const getIcon = async (src) => {
  const hash = `${hashCode(src)}`;
  try {
    const image = await getImage(src);
    cache.writeImage(hash, image);
    return image
  } catch (e) {
    return cache.readImage(hash)
  }
};

/**
 * @param {WidgetStack} widget
 * @param {*} item
 * @param {number} i
 */
const addItem = async (widget, item, i) => {
  const {
    fontSize,
    useShadow,
    lightColor,
    darkColor,
    indexLightColor,
    indexDarkColor,
    gap
  } = preference;
  i += 1;
  const { title, icon } = item;
  const stack = widget.addStack();
  stack.url = `xhsdiscover://search/result?keyword=${encodeURIComponent(title)}`;
  stack.centerAlignContent();
  stack.size = new Size(-1, fontSize + gap);
  const stackIndex = stack.addStack();
  stackIndex.size = new Size(fontSize * 1.4, -1);
  const textIndex = stackIndex.addText(`${i}`);
  textIndex.rightAlignText();
  let colors;
  if (indexLightColor) {
    colors = [new Color(indexLightColor), new Color(indexLightColor)];
  }
  if (indexDarkColor) {
    colors = colors || [new Color(indexDarkColor)];
    colors[1] = new Color(indexDarkColor);
  }
  textIndex.textColor = colors
    ? Color.dynamic(...colors)
    : i > 3 ? new Color('#f5c94c') : new Color('#fe4f67');
  textIndex.font = Font.boldSystemFont(fontSize);
  stack.addSpacer(4);
  const textTitle = stack.addText(title);
  textTitle.font = Font.systemFont(fontSize);
  textTitle.textColor = Color.dynamic(new Color(lightColor), new Color(darkColor));
  textTitle.lineLimit = 1;
  if (useShadow) {
    textTitle.shadowColor = Color.dynamic(
      new Color(lightColor, 0.2),
      new Color(darkColor, 0.2)
    );
    textTitle.shadowOffset = new Point(1, 1);
    textTitle.shadowRadius = 0.5;
  }
  if (icon) {
    stack.addSpacer(4);
    const imageIcon = stack.addImage(await getIcon(icon));
    imageIcon.imageSize = new Size(12, 12);
  }
  stack.addSpacer();
};

/**
 * @param {WidgetStack} container
 */
const addLogo = async (container) => {
  const { logoSize } = preference;
  const image = container.addImage(await getLogoImage());
  image.imageSize = new Size(logoSize, logoSize);
  return image
};

/**
 * @param {WidgetStack} container
 * @param {string} time
 */
const addTime = async (container, time) => {
  const { fontSize, timeColor } = preference;
  const textTime = container.addText(`更新于 ${time}`);
  textTime.font = Font.systemFont(fontSize * 0.7);
  textTime.textColor = new Color(timeColor);
  return textTime
};

/**
 * @param {WidgetStack} container
 * @param {object} data
 * @param {string} data.time
 */
const addLogoTime = async (container, { time }) => {
  const stack = container.addStack();
  stack.centerAlignContent();
  await addLogo(stack);
  stack.addSpacer();
  await addTime(stack, time);
  return stack
};

const main = async () => {
  const data = await fetchData();

  await withSettings({
    homePage: 'https://github.com/Honye/scriptable-scripts',
    formItems: [
      {
        name: 'lightColor',
        label: i18n(['Text color', '文字颜色']),
        type: 'color',
        media: '(prefers-color-scheme: light)',
        default: preference.lightColor
      },
      {
        name: 'darkColor',
        label: i18n(['Text color', '文字颜色']),
        type: 'color',
        media: '(prefers-color-scheme: dark)',
        default: preference.darkColor
      },
      {
        name: 'indexLightColor',
        label: i18n(['Index color', '序号颜色']),
        type: 'color',
        media: '(prefers-color-scheme: light)',
        default: preference.indexLightColor
      },
      {
        name: 'indexDarkColor',
        label: i18n(['Index color', '序号颜色']),
        type: 'color',
        media: '(prefers-color-scheme: dark)',
        default: preference.indexDarkColor
      },
      {
        name: 'useShadow',
        label: i18n(['Text shadow', '文字阴影']),
        type: 'switch',
        default: preference.useShadow
      },
      {
        name: 'fontSize',
        label: i18n(['Font size', '字体大小']),
        type: 'number',
        default: preference.fontSize
      },
      {
        name: 'timeColor',
        label: i18n(['Time color', '时间颜色']),
        type: 'color',
        default: preference.timeColor
      },
      {
        name: 'logoSize',
        label: i18n(['Logo size (0: hidden)', 'Logo 大小（0：隐藏）']),
        type: 'number',
        default: preference.logoSize
      },
      {
        name: 'columns',
        label: i18n(['Column count', '列数']),
        type: 'select',
        options: [
          { label: '1', value: '1' },
          { label: '2', value: '2' },
          { label: '3', value: '3' }
        ],
        default: preference.columns
      }
    ],
    render: async ({ family, settings }) => {
      family && (config.widgetFamily = family);
      Object.assign(preference, settings);
      try {
        return await createWidget(data)
      } catch (e) {
        console.error(e);
      }
    }
  });

  Script.complete();
};

await main();
