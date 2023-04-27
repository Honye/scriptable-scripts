// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: atom;
/**
 * OpenAI account usage
 *
 * @version 1.0.0
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
 * @version 1.4.0
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

/** 查看配置文件可导出分享 */
const exportSettings = () => {
  const scopedFM = useFileManager({ useICloud: isUseICloud() });
  const filePath = fm.joinPath(scopedFM.cacheDirectory, fileName);
  if (fm.isFileStoredIniCloud(filePath)) {
    fm.downloadFileFromiCloud(filePath);
  }
  if (fm.fileExists(filePath)) {
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
    const fileName = fm.fileName(path, true);
    const scopedFM = useFileManager({ useICloud: isUseICloud() });
    const destPath = fm.joinPath(scopedFM.cacheDirectory, fileName);
    if (fm.fileExists(destPath)) {
      fm.remove(destPath);
    }
    const i = destPath.lastIndexOf('/');
    const directory = destPath.substring(0, i);
    if (!fm.fileExists(directory)) {
      fm.createDirectory(directory, true);
    }
    fm.copy(path, destPath);
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
  apiKey: '',
  titleColor: '#8e8e93',
  titleColorDark: '#8e8e93',
  contentColor: '#333333',
  contentColorDark: '#ffffff'
};
const cache = useCache();

const getBalance = async () => {
  const { apiKey } = preference;
  const request = new Request('https://api.openai.com/dashboard/billing/credit_grants');
  request.headers = {
    Authorization: `Bearer ${apiKey}`
  };
  try {
    const json = await request.loadJSON();
    if (json.error) {
      const notification = new Notification();
      notification.title = Script.name();
      notification.body = i18n(['Session has expired!', 'Session Key 已过期！']);
      notification.openURL = 'https://platform.openai.com/account/usage';
      notification.schedule();
      throw new Error(json.error.message)
    }
    cache.writeJSON('credit_grants.json', json);
    return json
  } catch (e) {
    const json = cache.readJSON('credit_grants.json');
    return json
  }
};

const genSmallBg = () => {
  const image = Image.fromData(Data.fromBase64String(
    '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'
  ));
  return image
};

const addItem = (container, data) => {
  const {
    titleColor, titleColorDark,
    contentColor, contentColorDark
  } = preference;
  const { title, content } = data;
  const titleText = container.addText(title);
  titleText.textColor = Color.dynamic(
    new Color(titleColor),
    new Color(titleColorDark)
  );
  titleText.font = Font.systemFont(14);
  container.addSpacer(2);
  const contentText = container.addText(content);
  contentText.textColor = Color.dynamic(
    new Color(contentColor),
    new Color(contentColorDark)
  );
  contentText.font = Font.mediumSystemFont(18);
};

const createWidget = async () => {
  const widget = new ListWidget();
  const bg = genSmallBg();
  widget.backgroundImage = bg;
  const { grants } = await getBalance();
  const [data] = grants.data;
  const { grant_amount, used_amount, expires_at } = data;
  addItem(widget, {
    title: i18n(['Used', '已使用']),
    content: `$${used_amount}`
  });
  widget.addSpacer(5);
  addItem(widget, {
    title: i18n(['Granted', '总额']),
    content: `$${grant_amount}`
  });
  widget.addSpacer(5);
  addItem(widget, {
    title: i18n(['Expires', '有效时间']),
    content: new Date(expires_at * 1000).toLocaleDateString('zh-CN')
  });
  return widget
};

await withSettings({
  formItems: [
    {
      label: 'Session Key',
      name: 'apiKey',
      type: 'string',
      default: preference.apiKey
    },
    {
      label: i18n(['Title color', '标题颜色']),
      name: 'titleColor',
      type: 'color',
      default: preference.titleColor
    },
    {
      label: i18n(['Title color (dark)', '标题颜色（夜间）']),
      name: 'titleColorDark',
      type: 'color',
      default: preference.titleColorDark
    },
    {
      label: i18n(['Content color', '文字颜色']),
      name: 'contentColor',
      type: 'color',
      default: preference.contentColor
    },
    {
      label: i18n(['Content color (dark)', '文字颜色（夜间）']),
      name: 'contentColorDark',
      type: 'color',
      default: preference.contentColorDark
    }
  ],
  async render ({ settings }) {
    Object.assign(preference, settings);
    const widget = await createWidget();
    return widget
  }
});
