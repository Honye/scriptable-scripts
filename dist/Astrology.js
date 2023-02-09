// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: star-of-david; icon-color: deep-blue;
/**
 * 星座运势
 *
 * @version 1.2.0
 * @author Honye
 */

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
 * @version 1.4.0
 * @author Honye
 */
const fm$1 = FileManager.local();
const fileName = 'settings.json';

const toast = (message) => {
  const notification = new Notification();
  notification.title = Script.name();
  notification.body = message;
  notification.schedule();
};

const isUseICloud = () => {
  const ifm = useFileManager({ useICloud: true });
  const filePath = fm$1.joinPath(ifm.cacheDirectory, fileName);
  return fm$1.fileExists(filePath)
};

/** 查看配置文件可导出分享 */
const exportSettings = () => {
  const scopedFM = useFileManager({ useICloud: isUseICloud() });
  const filePath = fm$1.joinPath(scopedFM.cacheDirectory, fileName);
  if (fm$1.isFileStoredIniCloud(filePath)) {
    fm$1.downloadFileFromiCloud(filePath);
  }
  if (fm$1.fileExists(filePath)) {
    QuickLook.present(filePath);
  } else {
    const alert = new Alert();
    alert.message = i18n(['Using default configuration', '使用的默认配置，未做任何修改']);
    alert.addCancelAction(i18n(['OK', '好的']));
    alert.present();
  }
};

const importSettings = async () => {
  const alert1 = new Alert();
  alert1.message = i18n([
    'Will replace existing configuration',
    '会替换已有配置，确认导入吗？可将现有配置导出备份后再导入其他配置'
  ]);
  alert1.addAction(i18n(['Import', '导入']));
  alert1.addCancelAction(i18n(['Cancel', '取消']));
  const i = await alert1.present();
  if (i === -1) return

  const pathList = await DocumentPicker.open(['public.json']);
  for (const path of pathList) {
    const fileName = fm$1.fileName(path, true);
    const scopedFM = useFileManager({ useICloud: isUseICloud() });
    const destPath = fm$1.joinPath(scopedFM.cacheDirectory, fileName);
    if (fm$1.fileExists(destPath)) {
      fm$1.remove(destPath);
    }
    const i = destPath.lastIndexOf('/');
    const directory = destPath.substring(0, i);
    if (!fm$1.fileExists(directory)) {
      fm$1.createDirectory(directory, true);
    }
    fm$1.copy(path, destPath);
  }
  const alert = new Alert();
  alert.message = i18n(['Imported success', '导入成功']);
  alert.addAction(i18n(['Restart', '重新运行']));
  await alert.present();
  const callback = new CallbackURL('scriptable:///run');
  callback.addParameter('scriptName', Script.name());
  callback.open();
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
  fm$1.remove(
    fm$1.joinPath(cache.cacheDirectory, fileName)
  );
};

const moveSettings = (useICloud, data) => {
  const localFM = useFileManager();
  const iCloudFM = useFileManager({ useICloud: true });
  const [i, l] = [
    fm$1.joinPath(iCloudFM.cacheDirectory, fileName),
    fm$1.joinPath(localFM.cacheDirectory, fileName)
  ];
  try {
    // 移动文件需要创建父文件夹，写入操作会自动创建文件夹
    writeSettings(data, { useICloud });
    if (useICloud) {
      if (fm$1.fileExists(l)) fm$1.remove(l);
    } else {
      if (fm$1.fileExists(i)) fm$1.remove(i);
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
    if (backgroundImage && fm$1.fileExists(backgroundImage)) {
      widget.backgroundImage = fm$1.readImage(backgroundImage);
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
}
`;

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

  const formData = {};

  const createFormItem = (item) => {
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
  await webView.loadHTML(html, homePage);

  const clearBgImg = () => {
    const { backgroundImage } = settings;
    delete settings.backgroundImage;
    if (backgroundImage && fm$1.fileExists(backgroundImage)) {
      fm$1.remove(backgroundImage);
    }
    writeSettings(settings, { useICloud: settings.useICloud });
    toast(i18n(['Cleared success!', '背景已清除']));
  };

  const chooseBgImg = async () => {
    try {
      const image = await Photos.fromLibrary();
      cache.writeImage('bg.png', image);
      const imgPath = fm$1.joinPath(cache.cacheDirectory, 'bg.png');
      settings.backgroundImage = imgPath;
      writeSettings(settings, { useICloud: settings.useICloud });
    } catch (e) {
      console.log('[info] 用户取消选择图片');
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
        const widget = await getWidget({ settings, family: data });
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
        Object.assign(settings, data);
        writeSettings(settings, { useICloud: settings.useICloud });
        break
      case 'moveSettings':
        settings.useICloud = data;
        moveSettings(data, settings);
        break
      case 'removeSettings':
        Object.assign(settings, data);
        clearBgImg();
        removeSettings(settings);
        break
      case 'chooseBgImg':
        chooseBgImg();
        break
      case 'clearBgImg':
        clearBgImg();
        break
      case 'itemClick':
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
        break
      case 'native':
        onWebEvent?.(data);
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
                    label: i18n(['Background color (light)', '背景色（白天）']),
                    default: '#ffffff'
                  },
                  {
                    name: 'backgroundColorDark',
                    type: 'color',
                    label: i18n(['Background color (dark)', '背景色（夜间）']),
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
        type: 'group',
        items: [
          {
            label: i18n(['Export settings', '导出配置']),
            type: 'cell',
            name: 'export'
          },
          {
            label: i18n(['Import settings', '导入配置']),
            type: 'cell',
            name: 'import'
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
      const { name } = item;
      if (name === 'export') {
        exportSettings();
      }
      if (name === 'import') {
        importSettings().catch((err) => {
          console.error(err);
          throw err
        });
      }
      onItemClick?.(item, ...args);
    },
    ...restOptions
  }, true)
};

const preference = {
  /** 星座 */
  constellation: 'Aries',
  borderWidth: 6,
  borderColor: '',
  cornerRadius: 16,
  backgroundColorLight: '#f9f9f9',
  backgroundColorDark: '#242426',
  backgroundImage: '',
  textColorLight: '#222222',
  textColorDark: '#ffffff',
  iconColor: '#facb19',
  iconName: 'star.fill',
  avatarSize: 32
};
const contentPadding = 8;
const fm = FileManager.local();
const cache = useCache();
const constellations = new Map([
  ['Aries', {
    name: '️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️白羊座',
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/1.png',
    range: '03/21 - 04/19'
  }],
  ['Taurus', {
    name: '金牛座',
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/2.png',
    range: '04/20 - 05/20'
  }],
  ['Gemini', {
    name: '双子座',
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/3.png',
    range: '05/21 - 06/21'
  }],
  ['Cancer', {
    name: '巨蟹座',
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/4.png',
    range: '06/22 - 07/22'
  }],
  ['Leo', {
    name: '狮子座',
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/5.png',
    range: '07/23 - 08/22'
  }],
  ['Virgo', {
    name: '处女座',
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/6.png',
    range: '08/23 - 09/22'
  }],
  ['Libra', {
    name: '天秤座',
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/7.png',
    range: '09/23 - 10/23'
  }],
  ['Scorpio', {
    name: '天蝎座',
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/8.png',
    range: '10/24 - 11/22'
  }],
  ['Sagittarius', {
    name: '射手座',
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/9.png',
    range: '11/23 - 12/21'
  }],
  ['Capricorn', {
    name: '魔羯座',
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/10.png',
    range: '12/22 - 01/19'
  }],
  ['Aquarius', {
    name: '水瓶座',
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/11.png',
    range: '01/20 - 02/18'
  }],
  ['Pisces', {
    name: '双鱼座',
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/12.png',
    range: '02/19 - 03/20'
  }]
]);
const constellationOptions = (() => {
  const options = [];
  for (const [key, { name, range }] of constellations.entries()) {
    options.push({
      label: `${i18n([key, name])}（${range}）`,
      value: key
    });
  }
  return options
})();

/**
 * @param {string} constellation 星座
 */
const getData = async (constellation) => {
  const request = new Request(`https://interface.sina.cn/ast/get_app_fate.d.json?type=astro&class=${constellation}`);
  const date = new Date();
  const today = date.toLocaleDateString('zh-CN').replace(/\//g, '-');
  date.setDate(-1);
  const yesterday = date.toLocaleDateString('zh-CN').replace(/\//g, '-');
  const fm = FileManager.local();
  const ypath = fm.joinPath(cache.cacheDirectory, `${yesterday}.json`);
  if (fm.fileExists(ypath)) {
    fm.remove(ypath);
  }
  const tpath = fm.joinPath(cache.cacheDirectory, `${today}.json`);
  if (fm.fileExists(tpath)) {
    const data = cache.readJSON(tpath);
    return data
  }

  const { result } = await request.loadJSON();
  const { status, data } = result;
  if (status.code === 0) {
    cache.writeJSON(`${today}.json`, data);
    return data
  }
  return Promise.reject(status)
};

const getWidgetSize = () => {
  const widgetRect = phoneSize();
  const scale = Device.screenScale();
  const family = config.widgetFamily;
  const width = widgetRect[family === 'large' ? 'medium' : family] / scale;
  const height = widgetRect[family === 'medium' ? 'small' : family] / scale;
  return { width, height }
};

const getAvatarBg = (color) => {
  const context = new DrawContext();
  context.size = new Size(50, 50);
  context.opaque = false;
  context.setFillColor(new Color(color, 0.6));
  context.fillEllipse(new Rect(3, 3, 44, 44));
  return context.getImage()
};

const getImg = async (url) => {
  const hash = `${hashCode(url)}`;
  try {
    const image = cache.readImage(hash);
    if (image) {
      return image
    }
    throw new Error('No cache')
  } catch (err) {
    const image = await getImage(url);
    cache.writeImage(hash, image);
    return image
  }
};

/**
 * @param {WidgetStack} container
 * @param {object} options
 * @param {number} options.width
 * @param {Color} options.color
 */
const addAvatar = async (container, { width, color }) => {
  const constellation = constellations.get(preference.constellation);
  const avatar = container.addStack();
  const size = new Size(...Array(2).fill(width));
  avatar.size = size;
  avatar.backgroundImage = getAvatarBg(color);
  const img = avatar.addImage(await getImg(constellation.image));
  img.imageSize = size;
};

/**
 * @param {WidgetStack} container
 * @param {object} options
 * @param {Color} options.color
 */
const addHead = async (container, { color }) => {
  const { textColorLight, textColorDark, avatarSize } = preference;
  const constellation = constellations.get(preference.constellation);
  const stack = container.addStack();
  stack.size = new Size(-1, 32);
  stack.centerAlignContent();
  await addAvatar(stack, { width: avatarSize, color });
  stack.addSpacer(8);
  const info = stack.addStack();
  info.layoutVertically();
  const title = info.addText(constellation.name);
  title.font = Font.systemFont(13);
  title.textColor = Color.dynamic(new Color(textColorLight), new Color(textColorDark));
  const df = new DateFormatter();
  df.dateFormat = 'yyyy-MM-dd';
  const date = info.addText(df.string(new Date()));
  date.font = Font.systemFont(10);
  date.textColor = Color.dynamic(
    new Color(textColorLight, 0.8),
    new Color(textColorDark, 0.8)
  );
};

/**
 * @param {WidgetStack} container
 * @param {object} options
 * @param {Size} options.size
 * @param {string} options.value
 */
const addStars = (container, { value, size }) => {
  const { iconName, iconColor } = preference;
  const stack = container.addStack();
  stack.centerAlignContent();
  for (let i = 0; i < 5; i++) {
    const sfs = SFSymbol.named(iconName);
    const star = stack.addImage(sfs.image);
    star.tintColor = i < value ? new Color(iconColor) : Color.lightGray();
    star.imageSize = size;
  }
};

/**
 * 百分比转为5星比
 * @param {string} percent 带%的百分比
 */
const percent2Stars = (percent) => {
  const v = Number(percent.replace(/%$/, ''));
  // 至少1星
  const n = Math.max(Math.round(v / 100 * 5), 1);
  return n
};

/**
 * @param {WidgetStack} container
 * @param {{ name: string; value: string }} data
 */
const addItem = (container, data) => {
  const { textColorLight, textColorDark } = preference;
  const fontSize = 10;
  const iconSize = fontSize + 3;
  const height = iconSize;
  const stack = container.addStack();
  stack.size = new Size(-1, height);
  stack.centerAlignContent();
  stack.spacing = 6;
  const label = stack.addText(data.name);
  label.font = Font.systemFont(fontSize);
  label.textColor = Color.dynamic(
    new Color(textColorLight, 0.8),
    new Color(textColorDark, 0.8)
  );
  const matches = data.value.match(/(\d+)%$/);
  if (matches) {
    // if: 百分比使用五星
    const n = percent2Stars(data.value);
    addStars(stack, {
      value: n,
      size: new Size(iconSize, iconSize)
    });
  } else {
    const text = stack.addText(data.value);
    text.font = Font.systemFont(fontSize);
    text.textColor = Color.dynamic(new Color(textColorLight), new Color(textColorDark));
  }
};

/**
 * @param {WidgetStack} container
 * @param {{new_list:{name:string;value:string}[]}} data
 */
const addSmallContent = async (container, { new_list: data }) => {
  const { borderColor } = preference;
  const lucky = data.find((item) => item.name === '幸运颜色');

  container.layoutVertically();
  const { height } = container.size;
  let gap = (height - contentPadding * 2 - 32 - 13 * 5 - 2) / 5;
  console.log(`[info] max gap size: ${gap}`);
  gap = Math.min(gap, contentPadding);
  console.log(`[info] actual gap size: ${gap}`);
  await addHead(container, { color: borderColor || lucky.bg_color_value });
  container.addSpacer(2);
  container.addSpacer(gap);
  addItem(container, data.find((item) => item.name === '工作指数'));
  container.addSpacer(gap);
  addItem(container, data.find((item) => item.name === '财运指数'));
  container.addSpacer(gap);
  addItem(container, data.find((item) => item.name === '爱情指数'));
  container.addSpacer(gap);
  // 幸运颜色
  addItem(container, lucky);
  container.addSpacer(gap);
  addItem(container, data.find((item) => item.name === '幸运数字'));
};

/**
 * @param {WidgetStack} container
 */
const addMediumContent = async (container, data, { padding } = { padding: contentPadding }) => {
  const { new_list: newList } = data;
  const { borderColor, textColorLight, textColorDark } = preference;
  const { height } = container.size;
  const constellation = constellations.get(preference.constellation);
  const lucky = newList.find((item) => item.name === '幸运颜色');
  const textColor = Color.dynamic(new Color(textColorLight), new Color(textColorDark));
  const leftStack = container.addStack();
  leftStack.layoutVertically();

  const headStack = leftStack.addStack();
  headStack.centerAlignContent();
  headStack.spacing = 6;
  await addAvatar(headStack, { width: 36, color: borderColor || lucky.bg_color_value });

  const hrStack = headStack.addStack();
  hrStack.layoutVertically();
  hrStack.centerAlignContent();
  const htStack = hrStack.addStack();
  htStack.topAlignContent();
  htStack.spacing = 4;
  const hbStack = hrStack.addStack();
  hbStack.bottomAlignContent();
  hbStack.spacing = 4;

  const nameStack = htStack.addStack();
  nameStack.layoutVertically();
  nameStack.topAlignContent();
  nameStack.size = new Size(10 * 6, -1);
  const nameText = nameStack.addText(constellation.name);
  nameText.leftAlignText();
  nameText.font = Font.systemFont(14);
  nameText.textColor = textColor;

  const rangeStack = hbStack.addStack();
  rangeStack.bottomAlignContent();
  rangeStack.size = new Size(10 * 6, -1);
  const rangeText = rangeStack.addText(
    constellation.range.replace(/\//g, '.').replace(/\s/g, '')
  );
  rangeText.leftAlignText();
  rangeText.font = Font.systemFont(10);
  rangeText.textColor = textColor;
  rangeText.lineLimit = 1;
  rangeText.minimumScaleFactor = 0.6;

  const df = new DateFormatter();
  df.dateFormat = 'MM月dd日';
  const dateText = htStack.addText(df.string(new Date()));
  dateText.font = Font.systemFont(14);
  dateText.textColor = textColor;
  hrStack.addSpacer(2);

  const summary = newList.find((item) => item.name === '今日幸运值');
  const n = percent2Stars(summary.value);
  addStars(hbStack, { size: new Size(13, 13), value: n });

  leftStack.addSpacer(10);
  const contentText = leftStack.addText(data.new_content);
  contentText.font = Font.systemFont(12);
  contentText.minimumScaleFactor = 0.8;
  contentText.textColor = textColor;

  container.addSpacer(6);
  const lineStack = container.addStack();
  lineStack.layoutVertically();
  lineStack.size = new Size(0.5, -1);
  lineStack.addSpacer();
  lineStack.backgroundColor = new Color(Color.lightGray().hex, 0.2);
  container.addSpacer(6);

  const rightStack = container.addStack();
  rightStack.layoutVertically();
  let gap = (height - padding * 2 - 13 * 7) / 6;
  console.log(`[info] max gap size: ${gap}`);
  gap = Math.min(gap, contentPadding);
  console.log(`[info] actual gap size: ${gap}`);
  addItem(rightStack, newList.find((item) => item.name === '爱情指数'));
  rightStack.addSpacer(gap);
  addItem(rightStack, newList.find((item) => item.name === '工作指数'));
  rightStack.addSpacer(gap);
  addItem(rightStack, newList.find((item) => item.name === '财运指数'));
  rightStack.addSpacer(gap);
  addItem(rightStack, newList.find((item) => item.name === '健康指数'));
  rightStack.addSpacer(gap);
  addItem(rightStack, newList.find((item) => item.name === '幸运数字'));
  rightStack.addSpacer(gap);
  addItem(rightStack, newList.find((item) => item.name === '幸运颜色'));
  rightStack.addSpacer(gap);
  addItem(rightStack, newList.find((item) => item.name === '贵人星座'));
};

const addLargeContent = async (container, data) => {
  const { width, height } = container.size;
  container.layoutVertically();
  const topStack = container.addStack();
  const topHeight = 13 * 7 + 8 * 6;
  topStack.size = new Size(-1, topHeight);
  await addMediumContent(topStack, data, { padding: 0 });

  const gap = 14;
  container.addSpacer(gap);
  await addChart(
    container,
    data.chart,
    {
      size: new Size(width - contentPadding * 2, height - contentPadding * 2 - topHeight - gap)
    }
  );
};

/**
 * @param {WidgetStack} container
 */
const addChart = async (container, chartData, { size }) => {
  const { xAxis, series } = chartData;
  const labels = JSON.stringify(xAxis.data);
  const colors = [
    'rgb(91, 0, 255)',
    'rgb(255, 135, 189)',
    'rgb(49, 146, 241)',
    'rgb(255, 206, 114)',
    'rgb(80, 227, 194)'
  ];
  const datasets = series.map((item, i) => ({
    label: item.name,
    fill: false,
    borderColor: colors[i],
    backgroundColor: colors[i].replace(/^rgb/, 'rgba').replace(/\)$/, ', 0.5)'),
    data: item.data
  }));

  const stack = container.addStack();
  const options = `{
    type: 'line',
    data: {
      labels: ${labels},
      datasets: ${JSON.stringify(datasets)}
    },
    options: {
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: {
            callback: (val, i) => {
              const text = ['', '很差', '一般', '平平', '好运', '很棒']
              const t = text[i / 2]
              if (t) {
                return t
              }
              return val + '%'
            }
          }
        }
      }
    }
  }`;
  const date = new Date();
  const today = date.toLocaleDateString('zh-CN').replace(/\//g, '-');
  date.setDate(-1);
  const yesterday = date.toLocaleDateString('zh-CN').replace(/\//g, '-');
  const fm = FileManager.local();
  const ypath = fm.joinPath(cache.cacheDirectory, yesterday);
  if (fm.fileExists(ypath)) {
    fm.remove(ypath);
  }
  const tpath = fm.joinPath(cache.cacheDirectory, today);
  let img;
  if (fm.fileExists(tpath)) {
    img = cache.readImage(tpath);
  } else {
    img = await getImage(`https://quickchart.io/chart?v=4&c=${encodeURIComponent(options)}`);
    cache.writeImage(today, img);
  }
  const image = stack.addImage(img);
  image.imageSize = size;
};

const createWidget = async () => {
  const {
    constellation,
    borderColor,
    borderWidth,
    cornerRadius,
    backgroundColorLight,
    backgroundColorDark,
    backgroundImage
  } = preference;

  const data = await getData(constellation);
  const { new_list: newList } = data.today;
  const family = config.widgetFamily;
  const widget = new ListWidget();
  widget.setPadding(...Array(4).fill(0));
  const lucky = newList.find((item) => item.name === '幸运颜色');
  widget.backgroundColor = new Color(borderColor || lucky.bg_color_value);

  const widgetSize = getWidgetSize();
  const container = widget.addStack();
  container.size = new Size(
    widgetSize.width - borderWidth * 2,
    widgetSize.height - borderWidth * 2
  );
  container.setPadding(...Array(4).fill(contentPadding));
  container.cornerRadius = cornerRadius;
  container.backgroundColor = Color.dynamic(
    new Color(backgroundColorLight),
    new Color(backgroundColorDark)
  );
  if (backgroundImage && fm.fileExists(backgroundImage)) {
    container.backgroundColor = undefined;
  }
  if (family === 'small') {
    await addSmallContent(container, data.today);
  } else if (family === 'medium') {
    await addMediumContent(container, data.today);
  } else {
    await addLargeContent(container, data.today);
  }
  return widget
};

await withSettings({
  formItems: [
    {
      label: i18n(['Constellation', '星座']),
      name: 'constellation',
      type: 'select',
      options: constellationOptions,
      default: preference.constellation
    },
    {
      label: i18n(['Border color', '边框颜色']),
      name: 'borderColor',
      type: 'color',
      default: preference.borderColor
    },
    {
      label: i18n(['Border width', '边框宽度']),
      name: 'borderWidth',
      type: 'number',
      default: preference.borderWidth
    },
    {
      label: i18n(['Corner radius', '圆角']),
      name: 'cornerRadius',
      type: 'number',
      default: preference.cornerRadius
    },
    {
      label: i18n(['Text color (light)', '文字颜色（白天）']),
      name: 'textColorLight',
      type: 'color',
      default: preference.textColorLight
    },
    {
      label: i18n(['Text color (dark)', '文字颜色（夜间）']),
      name: 'textColorDark',
      type: 'color',
      default: preference.textColorDark
    },
    {
      label: i18n(['Icon color', '星星颜色']),
      name: 'iconColor',
      type: 'color',
      default: preference.iconColor
    },
    {
      label: i18n(['Icon name (SFSymbol)', '星星图标（SFSymbol）']),
      name: 'iconName',
      type: 'text',
      default: preference.iconName
    }
  ],
  render: async ({ family, settings }) => {
    family && (config.widgetFamily = family);
    Object.assign(preference, settings);
    const widget = await createWidget();
    return widget
  }
});
