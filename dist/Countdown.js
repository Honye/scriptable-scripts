// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: user-clock; icon-color: teal;
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
 * @param {...string} paths
 */
const joinPath = (...paths) => {
  const fm = FileManager.local();
  return paths.reduce((prev, curr) => {
    return fm.joinPath(prev, curr)
  }, '')
};

/**
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

  const readString = (filePath) => {
    return fm.readString(
      fm.joinPath(cacheDirectory, filePath)
    )
  };

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

const useCache = () => useFileManager({ basePath: 'cache' });

/**
 * 轻松实现桌面组件可视化配置
 *
 * - 颜色选择器及更多表单控件
 * - 快速预览
 *
 * GitHub: https://github.com/honye
 *
 * @version 1.1.0
 * @author Honye
 */

const cache = useCache();

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
 * @param {object} options
 * @param {{
 *  name: string;
 *  label: string;
 *  type: string;
 *  default: unknow;
 * }[]} options.formItems
 * @param {(data: {
 *  settings: Record<string, string>;
 *  family: string;
 * }) => Promise<ListWidget>} options.render
 * @param {string} [options.homePage]
 * @returns {Promise<ListWidget|undefined>} 在 Widget 中运行时返回 ListWidget，其它无返回
 */
const withSettings = async (options = {}) => {
  const {
    formItems = [],
    onItemClick,
    render,
    homePage = 'https://www.imarkr.com'
  } = options;

  /** @type {{ backgroundImage?: string; [key: string]: unknown }} */
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
  const settings = JSON.parse('${JSON.stringify(settings)}')
  const formItems = JSON.parse('${JSON.stringify(formItems)}')
  
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
        el.value = item.default
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
    <div class="list__header">Common</div>
    <form class="list__body" action="javascript:void(0);">
      <label class="form-item">
        <div>Sync with iCloud</div>
        <input name="useICloud" type="checkbox" role="switch">
      </label>
      <label id="chooseBgImg" class="form-item form-item--link">
        <div>Background image</div>
        <i class="iconfont icon-arrow_right"></i>
      </label>
      <label id='reset' class="form-item form-item--link">
        <div>Reset</div>
        <i class="iconfont icon-arrow_right"></i>
      </label>
    </form>
  </div>
  <div class="list">
    <div class="list__header">Settings</div>
    <form id="form" class="list__body" action="javascript:void(0);"></form>
  </div>
  <div class="actions">
    <button class="preview" data-size="small"><i class="iconfont icon-yingyongzhongxin"></i>Small</button>
    <button class="preview" data-size="medium"><i class="iconfont icon-daliebiao"></i>Medium</button>
    <button class="preview" data-size="large"><i class="iconfont icon-dantupailie"></i>Large</button>
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
        { key: 'choose', title: 'Choose photo' },
        { key: 'clear', title: 'Clear background image' }
      ]
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
        writeSettings(data, { useICloud: settings.useICloud });
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

const preference = {
  title: '🇨🇳 Programmer',
  date: '2024-10-24'
};

const addTitle = (widget, { title }) => {
  const headStack = widget.addStack();
  headStack.setPadding(12, 12, 12, 12);
  const bg = new LinearGradient();
  bg.colors = [
    new Color('#9ce4c1'),
    new Color('#92d8e1')
  ];
  bg.locations = [0, 1];
  bg.startPoint = new Point(0, 0);
  bg.endPoint = new Point(1, 0);
  headStack.backgroundGradient = bg;
  const titleText = headStack.addText(title);
  titleText.font = Font.semiboldSystemFont(16);
  titleText.textColor = Color.white();
  headStack.addSpacer();
};

const addText = (widget, { text, lineHeight }) => {
  const stack = widget.addStack();
  stack.setPadding(0, 0, 0, 0);
  stack.size = new Size(0, lineHeight);
  return stack.addText(text)
};

const createWidget = () => {
  const { title, date } = preference;

  const widget = new ListWidget();
  widget.setPadding(0, 0, 0, 0);
  widget.backgroundColor = Color.white();

  addTitle(widget, { title });
  const bodyStack = widget.addStack();
  bodyStack.layoutVertically();
  bodyStack.setPadding(20, 12, 20, 12);
  bodyStack.addStack().addSpacer();
  bodyStack.addSpacer();
  const bg = new LinearGradient();
  bg.colors = [
    new Color('#fff', 0),
    new Color('#9ce4c1', 0.3)
  ];
  bg.locations = [0, 1];
  bg.startPoint = new Point(0, 0);
  bg.endPoint = new Point(1, 0);
  bodyStack.backgroundGradient = bg;

  const days = bodyStack.addStack();
  days.bottomAlignContent();
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  const d = Math.ceil((target - now) / (24 * 3600000));
  const num = addText(days, {
    text: `${d}`,
    lineHeight: 50
  });
  num.font = Font.boldSystemFont(50);
  num.textColor = new Color('#373655');
  //   const unit = addText(days,{
  //     text: 'days',
  //     lineHeight: 14
  //   })
  days.addSpacer(4);
  const unit = days.addText('days');
  unit.font = Font.systemFont(18);
  unit.textColor = new Color('#6e6e73');

  bodyStack.addSpacer(8);

  const df = new DateFormatter();
  df.dateFormat = 'yyyy/MM/dd';
  const dateText = bodyStack.addText(df.string(target));
  dateText.font = Font.regularRoundedSystemFont(14);
  dateText.textColor = new Color('#86868b');

  return widget
};

await withSettings({
  formItems: [
    {
      name: 'title',
      label: 'Text',
      default: preference.title
    },
    {
      name: 'date',
      label: 'Date',
      type: 'date',
      default: preference.date
    }
  ],
  render: ({ settings }) => {
    Object.assign(preference, settings);
    const widget = createWidget();
    return widget
  }
});
