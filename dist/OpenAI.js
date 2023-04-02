// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: atom;
/**
 * OpenAI account usage
 *
 * @version 0.1.1
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
  contentColor: '#333333'
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
    'iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAAAXNSR0IArs4c6QAAC9ZJREFUeF7tna/PND8VxfsVCBAgQCBAgAABAgQCBAiw/LUYDAIEAgQIECBAgECAAAECBDnJNrlpOj925uw+u2c+k7x53uxO78z93J5tb9vpfNI4IACBRQKfwAYCEFgmgECoHRBYIYBAqB4QQCDUAQgcI0ALcowbpS5CAIFcJNC4eYwAAjnGjVIXIYBALhJo3DxGAIEc40apixBAIBcJNG4eI4BAjnGj1EUIIJCLBBo3jxFAIMe4UeoiBBDIRQKNm8cIIJBj3Ch1EQII5CKBxs1jBBDIMW6UuggBBHKRQOPmMQII5Bg3Sl2EAAK5SKCf6OYXW2v69/nW2mfKdf/dWvtXa+1vt3//feI9Hb4UAjmMjoKFwKdaa9+4CUP/3zokjj+11v64deJHf49APjoC7399tRbfaq3tEcborVqUX7bWXrY1QSDvX0E/0oOv3lqOWcX/S2vtn7cvJJ7P3VqYzw4nSxwSicTycgcCebmQvM0NqeX4znC3/2it/ba1pnxj6VC5b7bWPl1O6C1IbYX0mewpZ5HYPuRAIB+C/e0vquT7+6VbpcosYagy7zlU/rtDEr9WToJTviL7T+2OIZA94eSckYByji+XD399hzjULfvau+QsCITKfy8B/fr/sBT6/W1EasuOhn0lrDr028uoC9VbB+UiylN6zqJy9XhqzoJAtsLK9yMBDeeqFdChyvrTDUQShIQxVnQVU7dJ4ljLWVTu60N5XfcXG+UskUMgFozxRvrkn/7WRFoV/A8L3us8daW6mOppai3U8qwJY6tbpwReo18PPRDIQ/G+vfG1X385pwqqijoeS3nGf1prv1kosweW8h61Rv3Y273bY3t6DgI5jC6+4FgZZw7/fJi/UO7w7VsOUc9Xl0itjWbPzx7fK90ttUA/O2twrTwCeSTd97U9E0efl1A3qx8/GVwcR7f0dV9SsjQ8W7tiykckpLWu1zjEvNSKWegjEAvGKCNqBfQrXXONXnE1uafvlgRSf933TBoudcWU1/x5Zc6jXkf3pjmYhxwI5CFY39qohnDrUGxNxDWitEcgajWUHywda0O+vUyfHJzNomtUSwMAOh6arCOQt67L9psfBTD+Ou8VyNLoloTXV/32m5eY1FqoW/eVyQSiBPC7Idep97FnqPkwKARyGF1kwdp10YiTkvCaOxwViLprqvz65e/HrAsmAallqLP0/XyJVa2S7mfrPmzBQSA2lG9vaM8M+VbF7AKrLYgqu1qNmtNsdYt0HS1onK387Ul8XSg5DhbYgoFAbCjf3tC4OlfDp+No0j0C+ftQyccVu7Kt5Ho2j9JhzsQ1gt4S26nAIJBT+KIK18RX66HUvRqPvQJR5a+Jfu8eyZ5ak9qF2hrtUsvTR7tmwLcGBE4FCYGcwhdVeByinS3j2CuQmmeMCba+U9dJXai6PmtrvmSW4MsWAomqhq/rjFMgSvA1l7H1oJNaErVc/eEpdcOUiK+VG59ifOjCRVqQ162wz76z2sVaWsKxtwVZW8Q4+lWv279TF08tz1J+Mk5mPiwPQSDProave72xomoZ+7g85JECkSiU2NfVv2tLT8ZBBSX8Wy3W3fQRyN3IYgvoV/kHxbtZhRuHgsdzZsO8W8C6MHsrMOYna92uuvZraWBh6/qr3yOQU/jiCv+o5ANL3axxIWPtDjkE0qGOLcS4crgn+1XUs1bvVJAQyCl8cYXHbtbS8xazESU9BKXP1QIcyUFmecSPC+GlVbtV1Pc8G78reAhkF6ZLnaRf5DqDvda3X5rxfqZA6ujbPdfdFVQEsgvTpU4acxE5ryHbtW1CxxnvtZW4FabKae2VWp6jLQgCuVT1fA1n68YM/Y72zHiPz6DPVuL23GGcKEQgrxF77mIHgdmTgb3Y1sNMs+fY15aaaJRKy0mOCqR2Celi7Qgup5wnMD40NVrcM+Ot/ETPp9dZctnpq3r7Bg5fuHWzjgqkJvL2TRzIQc5XpkQLtdJprdP/yhN81d+tGW+dq2Xp9Tl2iUsPSPXtgsZ5kGp/axRrHApmmDexNr6gT7Vi9m7L0mJB3f5sn6u1rladoT8jkIc/m04L8oK18wVuaSaQfltj16l/3l+K89fb04N1ychSsq6yRwUyLlq0z4Ho5hDIC9TGF7yFOvm2tJx8zybUyjO06HBt1/c+YnZPDjKbzZ89v3IaLQI5jTDSQB3FWtucbWl70Z5nSFxL+2GNa672CkRDyfXZdpa7R1bB13Zq/IXe2pyt5htbm78tiUqtjLpJS0m6xKakfNwd/iGrePtN0IK8dkX9yLur3SzXuwTX9uz91WQb07oQcTbULEGtPdN+mh8COY0w1sCYBJ/ZwXBpo7hxyLfCXNsbeC3ptwYEgVhxxhmrw6hy7t7nv9d2h6/7XM3Ajctd+t7AuoeHthr1ZhBIXJ22OqR8QSKpq3tVOVVJ10amJIwvDcl0v7E9v/66rmbz+6z7vcK0QUAgNpSxhmabWctZjW5pRry/6lmf6bVpOn+2M+LejRxkp86+q+XQHl1PfXknSXpsfX6IY1sv0lm76J4h31p+zH3sCxDvIUQLcg8tztUwq+ZI6jaiW+LQELFGwfYcszmOD2s9dMMIZE/YOGck0N9ZqJW4fbWuzhm3F+2fbe11NXsz1VPfZrsUYgRC5XcTWHoNm1oR5SvKXZSo93yl/6338RLioAVxVw3sdQLqginRnr36eYuSkvlx0nCrzMO+pwV5GFoM30azxlcfLIG5Z5TraXARyNNQX/pCPWfp2wKphZEgendLf+27IjqIIxAHRWzEEkAgsaHFMQcBBOKgiI1YAggkNrQ45iCAQBwUsRFLAIHEhhbHHAQQiIMiNmIJIJDY0OKYgwACcVDERiwBBBIbWhxzEEAgDorYiCWAQGJDi2MOAgjEQREbsQQQSGxoccxBAIE4KGIjlgACiQ0tjjkIIBAHRWzEEkAgsaHFMQcBBOKgiI1YAggkNrQ45iCAQBwUsRFLAIHEhhbHHAQQiIMiNmIJIJDY0OKYgwACcVDERiwBBBIbWhxzEEAgDorYiCWAQGJDi2MOAgjEQREbsQQQSGxoccxBAIE4KGIjlgACiQ0tjjkIIBAHRWzEEkAgsaHFMQcBBOKgiI1YAggkNrQ45iCAQBwUsRFLAIHEhhbHHAQQiIMiNmIJIJDY0OKYgwACcVDERiwBBBIbWhxzEEAgDorYiCWAQGJDi2MOAgjEQREbsQQQSGxoccxBAIE4KGIjlgACiQ0tjjkIIBAHRWzEEkAgsaHFMQcBBOKgiI1YAggkNrQ45iCAQBwUsRFLAIHEhhbHHAQQiIMiNmIJIJDY0OKYgwACcVDERiwBBBIbWhxzEEAgDorYiCWAQGJDi2MOAgjEQREbsQQQSGxoccxBAIE4KGIjlgACiQ0tjjkIIBAHRWzEEkAgsaHFMQcBBOKgiI1YAggkNrQ45iCAQBwUsRFLAIHEhhbHHAQQiIMiNmIJIJDY0OKYgwACcVDERiwBBBIbWhxzEEAgDorYiCWAQGJDi2MOAgjEQREbsQQQSGxoccxBAIE4KGIjlgACiQ0tjjkIIBAHRWzEEkAgsaHFMQcBBOKgiI1YAggkNrQ45iCAQBwUsRFLAIHEhhbHHAQQiIMiNmIJIJDY0OKYgwACcVDERiwBBBIbWhxzEEAgDorYiCWAQGJDi2MOAgjEQREbsQQQSGxoccxBAIE4KGIjlgACiQ0tjjkIIBAHRWzEEkAgsaHFMQcBBOKgiI1YAggkNrQ45iCAQBwUsRFLAIHEhhbHHAQQiIMiNmIJIJDY0OKYgwACcVDERiwBBBIbWhxzEEAgDorYiCWAQGJDi2MOAgjEQREbsQQQSGxoccxBAIE4KGIjlgACiQ0tjjkIIBAHRWzEEkAgsaHFMQcBBOKgiI1YAggkNrQ45iCAQBwUsRFLAIHEhhbHHAQQiIMiNmIJIJDY0OKYgwACcVDERiwBBBIbWhxzEEAgDorYiCWAQGJDi2MOAgjEQREbsQQQSGxoccxBAIE4KGIjlgACiQ0tjjkIIBAHRWzEEkAgsaHFMQeB/wNetczYFDP88AAAAABJRU5ErkJggg=='
  ));
  return image
};

const addItem = (container, data) => {
  const { titleColor, contentColor } = preference;
  const { title, content } = data;
  const titleText = container.addText(title);
  titleText.textColor = new Color(titleColor);
  titleText.font = Font.systemFont(14);
  container.addSpacer(2);
  const contentText = container.addText(content);
  contentText.textColor = new Color(contentColor);
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
    title: '已使用',
    content: `$${used_amount}`
  });
  widget.addSpacer(5);
  addItem(widget, {
    title: '总额',
    content: `$${grant_amount}`
  });
  widget.addSpacer(5);
  addItem(widget, {
    title: '有效时间',
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
      label: i18n(['Content color', '文字颜色']),
      name: 'contentColor',
      type: 'color',
      default: preference.contentColor
    }
  ],
  async render ({ settings }) {
    Object.assign(preference, settings);
    const widget = await createWidget();
    return widget
  }
});
