// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: snowflake; icon-color: teal;
/**
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
  prompt: '讲个笑话',
  fontSize: 14,
  showPrompt: true,
  useImageAPI: false,
  apiKey: '',
  model: 'text-davinci-003'
};

/**
 * @param {object} options
 * @param {string} options.url
 * @param {any} options.data
 */
const request = async ({ url, data }) => {
  const { apiKey } = preference;
  const req = new Request(`https://api.openai.com/v1${url}`);
  req.method = 'POST';
  req.headers = {
    'Content-Type': 'application/json',
    Authorization: apiKey ? `Bearer ${apiKey}` : undefined
  };
  req.body = JSON.stringify(data);
  const json = await req.loadJSON();
  if (json.error) {
    return Promise.reject(json.error)
  }
  return json
};

const fetchAnswer = async () => {
  const { prompt, model } = preference;
  const json = await request({
    url: '/completions',
    data: {
      model,
      prompt,
      temperature: 1,
      top_p: 1,
      max_tokens: 500
    }
  });
  return json
};

const createImage = async () => {
  const { prompt } = preference;
  const json = await request({
    url: '/images/generations',
    data: {
      prompt,
      n: 1,
      size: '512x512'
    }
  });
  return json
};

/**
 * @param {string} message
 */
const createErrorWidget = (message) => {
  const widget = new ListWidget();
  widget.addText(message).textColor = Color.red();
  return widget
};

const createImageWidget = async () => {
  const { prompt, showPrompt, fontSize } = preference;
  const { data } = await createImage();
  const [{ url }] = data;
  const widget = new ListWidget();
  widget.url = url;
  widget.backgroundImage = await getImage(url);
  if (showPrompt) {
    const promptText = widget.addText(prompt);
    promptText.font = Font.systemFont(fontSize);
    promptText.textColor = Color.gray();
    promptText.shadowColor = new Color(Color.gray().hex, 0.25);
    promptText.shadowRadius = 0.5;
    promptText.shadowOffset = new Point(1, 1);
    widget.addSpacer();
  }
  return widget
};

const createWidget = async () => {
  const { apiKey, fontSize, showPrompt, useImageAPI } = preference;
  if (!apiKey) {
    return createErrorWidget(i18n(['Have to enter API Key', '必须填写 API Key']))
  }

  if (useImageAPI) {
    return await createImageWidget()
  }

  const { choices } = await fetchAnswer();
  const widget = new ListWidget();
  if (showPrompt) {
    const promptText = widget.addText(preference.prompt);
    promptText.font = Font.systemFont(fontSize);
    promptText.textColor = Color.gray();
    widget.addSpacer(fontSize);
  }
  const contentText = widget.addText(choices[0].text.trim());
  contentText.font = Font.systemFont(fontSize);
  contentText.minimumScaleFactor = 0.8;
  return widget
};

await withSettings({
  formItems: [
    {
      label: i18n(['Prompt', '提示']),
      name: 'prompt',
      default: preference.prompt
    },
    {
      label: i18n(['Font size', '字体大小']),
      name: 'fontSize',
      type: 'number',
      default: preference.fontSize
    },
    {
      label: i18n(['Show prompt', '显示提示']),
      name: 'showPrompt',
      type: 'switch',
      default: preference.showPrompt
    },
    {
      label: 'API',
      type: 'group',
      items: [
        {
          label: i18n(['Use Image API', 'AI 图片']),
          name: 'useImageAPI',
          type: 'switch',
          default: preference.useImageAPI
        },
        {
          label: 'API Key',
          name: 'apiKey',
          default: preference.apiKey
        },
        {
          label: i18n(['Model', '训练模型']),
          name: 'model',
          default: preference.model
        }
      ]
    }
  ],
  render: async ({ settings }) => {
    Object.assign(preference, settings);
    const widget = await createWidget();
    return widget
  }
});
