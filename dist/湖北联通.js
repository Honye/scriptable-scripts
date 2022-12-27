// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: mobile-alt; icon-color: red;
/**
 * 湖北联通信息展示和自动签到
 *
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
 * 是否同一天
 * @param {string|number|Date} a
 * @param {string|number|Date} b
 */
const isSameDay = (a, b) => {
  const leftDate = new Date(a);
  leftDate.setHours(0);
  const rightDate = new Date(b);
  rightDate.setHours(0);
  return Math.abs(leftDate - rightDate) < 3600000
};

/**
 * 是否是今天
 * @param {string|number|Date} date
 */
const isToday = (date) => isSameDay(new Date(), date);

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
 * @version 1.2.1
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

if (typeof require === 'undefined') require = importModule;

let conf = {
  /** wap.10010hb.net */
  Authorization: '',
  /** act.10010.com API cookie  */
  actionCookie: ''
};
const preference = {
  textColorLight: '#222222',
  textColorDark: '#ffffff',
  /** 签到时间 */
  checkInAfter: '12:12',
  disabledCheckIn: false
};
if (!conf.actionCookie) {
  try {
    conf = importModule/* ignore */('Config')['10010']();
  } catch (e) {
    console.error(e);
  }
}
const cache = useCache();
const Cookie = conf.actionCookie;
const ringStackSize = 61; // 圆环大小
const ringTextSize = 14; // 圆环中心文字大小
const creditTextSize = 21; // 话费文本大小
const databgColor = new Color('12A6E4', 0.3); // 流量环背景颜色
const datafgColor = new Color('12A6E4'); // 流量环前景颜色
let dataTextColor = Color.dynamic(
  new Color(preference.textColorLight),
  new Color(preference.textColorDark)
);
const voicebgColor = new Color('F86527', 0.3); // 语音环背景颜色
const voicefgColor = new Color('F86527'); // 语音环前景颜色

const dataSfs = SFSymbol.named('antenna.radiowaves.left.and.right');
dataSfs.applyHeavyWeight();
const dataIcon = dataSfs.image;
const canvSize = 178;
const canvas = new DrawContext();
const canvWidth = 18;
const canvRadius = 80;

const hbHeaders = {
  zx: '12',
  Authorization: conf.Authorization,
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.31(0x18001f2e) NetType/4G Language/en'
};

const createWidget = async () => {
  const { disabledCheckIn } = preference;
  const data = await getData();
  const { balenceData, flowData, voiceData, _state } = data;
  let signState = 1;
  if (!disabledCheckIn && Cookie) {
    const { state } = await daySign().catch((e) => {
      return { state: -1 }
    });
    signState = state;
  }
  const widget = new ListWidget();
  widget.setPadding(16, 16, 16, 16);
  widget.backgroundColor = Color.dynamic(new Color('ffffff'), new Color('242426'));

  const status = _state === 'expired'
    ? 'failed' // 余额信息请求失败，检查授权信息是否有效
    : signState === -1
      ? 'warning' // 签到失败，检查 act.10010.com Cookie 是否有效
      : signState === 0
        ? 'waiting' // 等待签到
        : 'success'; // 一切正常并已签到
  addStatusDot(widget, status);
  await addLogo(widget);
  await renderBalance(widget, balenceData.amount);
  await renderArcs(widget, flowData, voiceData);
  return widget
};

/**
 * 状态显示
 * @param {'waiting'|'success'|'warning'|'failed'} status
 */
const addStatusDot = (widget, status) => {
  const stackStatus = widget.addStack();
  stackStatus.addSpacer();
  const iconStatus = stackStatus.addImage(SFSymbol.named('circle.fill').image);
  iconStatus.imageSize = new Size(6, 6);
  const colors = {
    waiting: Color.gray(),
    success: Color.green(),
    warning: Color.orange(),
    failed: Color.red()
  };
  iconStatus.tintColor = colors[status];
};

/** 联通 Logo 显示 */
const addLogo = async (widget) => {
  const cuIconUrl = 'https://jun.fly.dev/imgs/chinaunicom.png';
  const headerStack = widget.addStack();
  headerStack.addSpacer();
  const logo = headerStack.addImage(await getImage(cuIconUrl));
  logo.imageSize = new Size(393 * 0.25, 118 * 0.25);
  headerStack.addSpacer();
  widget.addSpacer();
};

/** 余额显示 */
const renderBalance = async (widget, balance) => {
  const stack = widget.addStack();
  stack.centerAlignContent();
  stack.addSpacer();
  const elText = stack.addText(balance);
  elText.textColor = dataTextColor;
  elText.font = Font.mediumRoundedSystemFont(creditTextSize);
  stack.addSpacer();
  widget.addSpacer();
};

/**
 * @param {Data} flowData
 * @param {Data} voiceData
 */
const renderArcs = async (widget, flowData, voiceData) => {
  const bodyStack = widget.addStack();
  bodyStack.layoutVertically();

  canvas.size = new Size(canvSize, canvSize);
  canvas.opaque = false;
  canvas.respectScreenScale = true;

  const dataGap = (flowData.left / flowData.total * 100) * 3.6;
  const voiceGap = (voiceData.left / voiceData.total * 100) * 3.6;

  drawArc(dataGap, datafgColor, databgColor);
  const ringStack = bodyStack.addStack();
  const ringLeft = ringStack.addStack();
  ringLeft.layoutVertically();
  ringLeft.size = new Size(ringStackSize, ringStackSize);
  ringLeft.backgroundImage = canvas.getImage();
  await ringContent(
    ringLeft,
    dataIcon,
    datafgColor,
    `${Number((flowData.left / 1024).toFixed(2))}`,
    'GB'
  );
  ringStack.addSpacer();

  drawArc(voiceGap, voicefgColor, voicebgColor);
  const ringRight = ringStack.addStack();
  ringRight.layoutVertically();
  ringRight.size = new Size(ringStackSize, ringStackSize);
  ringRight.backgroundImage = canvas.getImage();
  await ringContent(
    ringRight,
    SFSymbol.named('phone.fill').image,
    voicefgColor,
    `${voiceData.left}`,
    '分钟'
  );
};

function sinDeg (deg) {
  return Math.sin((deg * Math.PI) / 180)
}

function cosDeg (deg) {
  return Math.cos((deg * Math.PI) / 180)
}

function ringContent (widget, icon, iconColor, text, unit) {
  const rowIcon = widget.addStack();
  rowIcon.addSpacer();
  const iconElement = rowIcon.addImage(icon);
  iconElement.tintColor = iconColor;
  iconElement.imageSize = new Size(12, 12);
  iconElement.imageOpacity = 0.7;
  rowIcon.addSpacer();

  widget.addSpacer(1);

  const rowText = widget.addStack();
  rowText.addSpacer();
  const textElement = rowText.addText(text);
  textElement.textColor = dataTextColor;
  textElement.font = Font.mediumSystemFont(ringTextSize);
  rowText.addSpacer();

  const rowUnit = widget.addStack();
  rowUnit.addSpacer();
  const unitElement = rowUnit.addText(unit);
  unitElement.textColor = dataTextColor;
  unitElement.font = Font.boldSystemFont(8);
  unitElement.textOpacity = 0.5;
  rowUnit.addSpacer();
}

function drawArc (deg, fillColor, strokeColor) {
  const ctr = new Point(canvSize / 2, canvSize / 2);
  const bgx = ctr.x - canvRadius;
  const bgy = ctr.y - canvRadius;
  const bgd = 2 * canvRadius;
  const bgr = new Rect(bgx, bgy, bgd, bgd);

  canvas.setFillColor(fillColor);
  canvas.setStrokeColor(strokeColor);
  canvas.setLineWidth(canvWidth);
  canvas.strokeEllipse(bgr);

  for (let t = 0; t < deg; t++) {
    const rectX = ctr.x + canvRadius * sinDeg(t) - canvWidth / 2;
    const rectY = ctr.y - canvRadius * cosDeg(t) - canvWidth / 2;
    const rectR = new Rect(rectX, rectY, canvWidth, canvWidth);
    canvas.fillEllipse(rectR);
  }
}

/**
 * 每日签到
 * @returns {Promise<{ state: 0 | 1 }>}
 */
const daySign = async () => {
  const cachePath = 'daySign.json';
  const cacheSignData = cache.readJSON(cachePath);
  const { at } = cacheSignData || {};
  const signed = at && isToday(new Date(at));
  // 已签到
  if (signed) return cacheSignData

  const { checkInAfter } = preference;
  const checkInDate = new Date();
  checkInDate.setHours(...(checkInAfter.split(':')));
  // 未到用户设置的最早签到时间
  if (Date.now() < checkInDate.getTime()) {
    return { state: 0 }
  }

  const url = 'https://act.10010.com/SigninApp/signin/daySign';
  const req = new Request(url);
  req.headers = {
    'User-Agent': 'ChinaUnicom4.x/1.0 CFNetwork/1220.1 Darwin/20.3.0',
    cookie: Cookie,
    Host: 'act.10010.com'
  };
  const data = await req.loadJSON();
  if (data.status === '0000' || (data.msg || '').includes('已经签到')) {
    cache.writeJSON(cachePath, {
      ...data,
      at: new Date().toISOString(),
      state: 1
    });
    return data
  }
  console.warn(`[${Script.name()}]: 签到失败`);
  console.warn(data);
  return Promise.reject(data.msg)
};

/**
 * 湖北联通余额
 * @returns {{ amount: string }}
 */
const getBalence = async () => {
  const request = new Request('https://wap.10010hb.net/zinfo/front/user/findFeePackage');
  request.headers = hbHeaders;
  request.method = 'POST';
  const res = await request.loadJSON();
  if (res.success) {
    return res.data
  }
  return Promise.reject(res)
};

/** 套餐余额 */
const getPackageLeft = async () => {
  const request = new Request('https://wap.10010hb.net/zinfo/front/user/findLeftPackage');
  request.headers = hbHeaders;
  request.method = 'POST';
  const res = await request.loadJSON();
  if (res.success) {
    return res.data
  }
  return Promise.reject(res)
};

const getData = async () => {
  try {
    const [balence, packageLeft] = await Promise.all([getBalence(), getPackageLeft()]);
    const { addupInfoList } = packageLeft;
    const flowData = { left: 0, total: 0 };
    const voiceData = { left: 0, total: 0 };
    for (const item of addupInfoList) {
      // 语音
      if (item.elemtype === '1') {
        voiceData.left += Number(item.xcanusevalue);
        voiceData.total += Number(item.addupupper);
      }
      // 流量
      if (item.elemtype === '3') {
        flowData.left += Number(item.xcanusevalue);
        flowData.total += Number(item.addupupper);
      }
    }

    const data = {
      balenceData: balence,
      flowData,
      voiceData
    };
    cache.writeJSON('data.json', data);
    data._state = 'approved';
    return data
  } catch (e) {
    /**
     * @type {{
     *  balenceData: { amount: string };
     *  flowData: { left: number, total: number };
     *  voiceData: { left: number, total: number };
     * }}
     */
    const data = cache.readJSON('data.json');
    data._state = 'expired';
    console.warn('==== 数据请求失败，使用缓存数据 ====');
    console.warn(e);
    return data
  }
};

await withSettings({
  formItems: [
    {
      name: 'textColorLight',
      label: i18n(['Text color (light)', '文字颜色（白天）']),
      type: 'color',
      default: preference.textColorLight
    },
    {
      name: 'textColorDark',
      label: i18n(['Text color (dark)', '文字颜色（黑夜）']),
      type: 'color',
      default: preference.textColorDark
    },
    {
      name: 'checkInAfter',
      label: i18n(['Check in after time', '最早签到时间']),
      type: 'time',
      default: preference.checkInAfter
    },
    {
      name: 'disabledCheckIn',
      label: i18n(['Disabled check in', '禁用签到']),
      type: 'switch',
      default: preference.disabledCheckIn
    }
  ],
  render: async ({ settings }) => {
    Object.assign(preference, settings);
    const { textColorLight, textColorDark } = preference;
    dataTextColor = Color.dynamic(
      new Color(textColorLight),
      new Color(textColorDark)
    );
    const widget = await createWidget();
    return widget
  }
});
