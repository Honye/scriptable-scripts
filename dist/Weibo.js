// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: fire;
/**
 * Top trending searches on Weibo
 *
 * @version 2.1.0
 * @author Honye
 */

/**
 * @param {number} [height] The screen height measured in pixels
 */
const phoneSize = (height) => {
  const phones = {
    /** 12 Pro Max */
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
    /** 12 and 12 Pro */
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
    /** 11 Pro, XS, X, 12 mini */
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

const useCache = (useICloud) => {
  const fm = FileManager[useICloud ? 'iCloud' : 'local']();
  const cacheDirectory = fm.joinPath(fm.documentsDirectory(), Script.name());

  const writeString = (filePath, content) => {
    const safePath = fm.joinPath(cacheDirectory, filePath).replace(/\/+$/, '');
    const i = safePath.lastIndexOf('/');
    const directory = safePath.substring(0, i);
    if (!fm.fileExists(directory)) {
      fm.createDirectory(directory, true);
    }
    fm.writeString(safePath, content);
  };

  const writeJSON = (filePath, jsonData) => writeString(filePath, JSON.stringify(jsonData));

  const readString = (filePath) => {
    return fm.readString(
      fm.joinPath(cacheDirectory, filePath)
    )
  };

  const readJSON = (filePath) => JSON.parse(readString(filePath));

  return {
    cacheDirectory,
    writeString,
    writeJSON,
    readString,
    readJSON
  }
};

const readSettings = async () => {
  const localFM = useCache();
  let settings = localFM.readJSON('settings.json');
  if (settings) {
    console.log('[info] use local settings');
    return settings
  }

  const iCloudFM = useCache(true);
  settings = iCloudFM.readJSON('settings.json');
  if (settings) {
    console.log('[info] use iCloud settings');
  }
  return settings
};

const writeSettings = async (data, { useICloud }) => {
  const fm = useCache(useICloud);
  fm.writeJSON('settings.json', data);
};

const removeSettings = async (settings) => {
  const cache = useCache(settings.useICloud);
  FileManager.local().remove(
    FileManager.local().joinPath(
      cache.cacheDirectory,
      'settings.json'
    )
  );
};

const moveSettings = (useICloud, data) => {
  const localFM = useCache();
  const iCloudFM = useCache(true);
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
 */
const withSettings = async (options = {}) => {
  const {
    formItems = [],
    render,
    homePage = 'https://www.imarkr.com'
  } = options;

  let settings = await readSettings() || {};

  if (config.runsInWidget) {
    const widget = await render({ settings });
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
    } else {
      const input = document.createElement("input");
      input.name = item.name
      input.type = item.type || "text";
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
      input.addEventListener("change", (e) => {
        formData[item.name] =
          item.type === 'switch'
          ? e.target.checked
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

  document.querySelector('a').addEventListener('click', (e) => {
    //invoke('safari', e.currentTarget.dataset.href)
  })

  const reset = () => {
    for (const item of formItems) {
      const el = document.querySelector(\`input[name="\${item.name}"]\`)
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
    <form class="list__body">
      <label class="form-item">
        <div>Sync with iCloud</div>
        <input name="useICloud" type="checkbox" role="switch">
      </label>
      <label id='reset' class="form-item form-item--link">
        <div>Reset</div>
        <i class="iconfont icon-arrow_right"></i>
      </label>
    </form>
  </div>
  <div class="list">
    <div class="list__header">Settings</div>
    <form id="form" class="list__body"></form>
  </div>
  <div class="actions">
    <button class="preview" data-size="small"><i class="iconfont icon-yingyongzhongxin"></i>Small</button>
    <button class="preview" data-size="medium"><i class="iconfont icon-daliebiao"></i>Medium</button>
    <button class="preview" data-size="large"><i class="iconfont icon-dantupailie"></i>Large</button>
  </div>
  <footer>
    <div class="copyright">Copyright © 2022 <a href="javascript:invoke('safari','https://www.imarkr.com');" data-href='https://www.imarkr.com'>iMarkr</a> All rights reserved.</div>
  </footer>
    <script>${js}</script>
  </body>
</html>`;

  const webView = new WebView();
  await webView.loadHTML(html, homePage);

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
        removeSettings(settings);
        break
    }
    injectListener();
  };

  injectListener();
  webView.present();
  // ======= web end =========
};

// ====== 清除旧版本无用缓存 =====
// FIXME 下个版本删除
try {
  Keychain.remove(`$${Script.name()}.client`);
} catch (e) {}
// ===========================

let fontSize = 14;
const gap = 8;
const logoSize = 30;
const paddingVertical = 10;
const themes = {
  light: {
    background: new Color('#ffffff')
  },
  dark: {
    background: new Color('#242426', 1)
  }
};
const preference = {
  /** @type {'h5'|'international'} */
  client: 'h5',
  useShadow: false,
  lightColor: new Color('#333'),
  darkColor: Color.white(),
  timeColor: new Color('#666')
};

/** Scoped Keychain */
const KeyStorage = {
  set: (key, value) => {
    return Keychain.set(`$${Script.name()}.${key}`, JSON.stringify(value))
  },
  get: (key) => {
    const _key = `$${Script.name()}.${key}`;
    if (Keychain.contains(_key)) {
      return JSON.parse(Keychain.get(_key))
    }
  }
};

/** 微博国际版页面 */
const InternationalScheme = {
  hotSearch: () => 'weibointernational://hotsearch',
  search: (keyword) => `weibointernational://search?keyword=${encodeURIComponent(keyword)}`
};

/** 微博 H5 应用页面 */
const H5Page = {
  hotSearch: () => `https://m.weibo.cn/p/index?containerid=${encodeURIComponent('106003&filter_type=realtimehot')}`,
  search: (keyword) => `https://m.weibo.cn/search?containerid=${encodeURIComponent('100103type=1&t=10&q=' + keyword)}`
};

const conf = {
  theme: 'system'
};
const screen = Device.screenResolution();
const scale = Device.screenScale();
const phone = phoneSize(screen.height);

if (config.runsInWidget) {
  const [client, theme] = (args.widgetParameter || '').split(',').map(text => text.trim());
  preference.client = client === '2' ? 'international' : preference.client;
  conf.theme = theme || conf.theme;
}

const Pages = () => {
  switch (preference.client) {
    case 'international':
      return InternationalScheme
    case 'h5':
      return H5Page
  }
};

const fetchData = async () => {
  const url = 'https://weibointl.api.weibo.cn/portal.php?ct=feed&a=search_topic';
  const request = new Request(url);
  try {
    const res = await request.loadJSON();
    const df = new DateFormatter();
    df.dateFormat = 'HH:mm';
    const timeString = df.string(new Date());
    const data = {
      data: res,
      updatedAt: timeString
    };
    KeyStorage.set('cache', data);
    return data
  } catch (e) {
    const data = KeyStorage.get('cache');
    return data
  }
};

const createWidget = async ({ data, updatedAt }) => {
  const { timeColor } = preference;
  let stackBottom;
  let widgetBottom;
  const widget = new ListWidget();
  const { widgetFamily } = config;
  const height = (widgetFamily === 'medium' ? phone.small : phone[widgetFamily]) / scale;
  conf.count = Math.floor((height - paddingVertical * 2 + gap) / (fontSize + gap));
  widget.backgroundColor = conf.theme === 'system'
    ? Color.dynamic(themes.light.background, themes.dark.background)
    : themes[conf.theme].background;
  widget.url = Pages().hotSearch();
  const paddingY = paddingVertical - (gap / 2);
  widget.setPadding(paddingY, 12, paddingY, 14);
  const max = conf.count;
  const logoLines = Math.ceil((logoSize + gap) / (fontSize + gap));
  for (let i = 0; i < max; ++i) {
    const item = data.data[i];
    if (i === 0) {
      const stack = widget.addStack();
      await addItem(stack, item);
      stack.addSpacer();
      const textTime = stack.addText(`更新于 ${updatedAt}`);
      textTime.font = Font.systemFont(fontSize * 0.7);
      textTime.textColor = timeColor;
    } else if (i < max - logoLines) {
      await addItem(widget, item);
    } else {
      if (!widgetBottom) {
        stackBottom = widget.addStack();
        stackBottom.bottomAlignContent();
        widgetBottom = stackBottom.addStack();
        widgetBottom.layoutVertically();
        addItem(widgetBottom, item);
      } else {
        await addItem(widgetBottom, item);
      }
      widgetBottom.length = (widgetBottom.length || 0) + 1;
      if (widgetBottom.length === logoLines) {
        stackBottom.addSpacer();
        const imageLogo = stackBottom.addImage(await getImage('https://www.sinaimg.cn/blog/developer/wiki/LOGO_64x64.png'));
        imageLogo.imageSize = new Size(logoSize, logoSize);
      }
    }
  }
  return widget
};

const addItem = async (widget, item) => {
  const { useShadow, lightColor, darkColor } = preference;
  const stack = widget.addStack();
  const [, queryString] = item.scheme.split('?');
  const query = {};
  queryString.split('&').forEach((item) => {
    const [key, value] = item.split('=');
    query[key] = value;
  });
  stack.url = Pages().search(query.keyword);
  stack.centerAlignContent();
  stack.size = new Size(-1, fontSize + gap);
  const stackIndex = stack.addStack();
  stackIndex.size = new Size(fontSize * 1.4, -1);
  const textIndex = stackIndex.addText(String(item.pic_id));
  textIndex.rightAlignText();
  textIndex.textColor = item.pic_id > 3 ? new Color('#f5c94c', 1) : new Color('#fe4f67', 1);
  textIndex.font = Font.boldSystemFont(fontSize);
  stack.addSpacer(4);
  const textTitle = stack.addText(item.title);
  textTitle.font = Font.systemFont(fontSize);
  textTitle.textColor = conf.theme === 'system'
    ? Color.dynamic(lightColor, darkColor)
    : conf.theme === 'light'
      ? lightColor
      : darkColor;
  textTitle.lineLimit = 1;
  if (useShadow) {
    textTitle.shadowColor = new Color('#000000', 0.2);
    textTitle.shadowOffset = new Point(1, 1);
    textTitle.shadowRadius = 0.5;
  }
  if (item.icon) {
    stack.addSpacer(4);
    const imageIcon = stack.addImage(await getImage(item.icon));
    imageIcon.imageSize = new Size(12, 12);
  }
  stack.addSpacer();
};

const getImage = async (url) => {
  const request = new Request(url);
  const image = await request.loadImage();
  return image
};

const main = async () => {
  const data = await fetchData();

  const widget = await withSettings({
    homePage: 'https://github.com/Honye/scriptable-scripts',
    formItems: [
      {
        name: 'client',
        label: 'Client',
        type: 'select',
        options: [
          { label: 'H5 (微博)', value: 'h5' },
          { label: 'Weibo intl.', value: 'international' }
        ],
        default: 'h5'
      },
      {
        name: 'lightColor',
        label: 'Text color (light)',
        type: 'color',
        default: '#333333'
      },
      {
        name: 'darkColor',
        label: 'Text color (dark)',
        type: 'color',
        default: '#ffffff'
      },
      {
        name: 'useShadow',
        label: 'Text shadow',
        type: 'switch',
        default: preference.useShadow
      },
      {
        name: 'fontSize',
        label: 'Font size',
        type: 'number',
        default: fontSize
      },
      {
        name: 'timeColor',
        label: 'Time color',
        type: 'color',
        default: preference.timeColor.hex
      }
    ],
    render: async ({ family, settings }) => {
      family && (config.widgetFamily = family);
      console.log(`[Weibo.js] ${JSON.stringify(settings)}`);
      Object.assign(preference, {
        ...settings,
        fontSize: Number(settings.fontSize) || preference.fontSize,
        lightColor: settings.lightColor ? new Color(settings.lightColor) : preference.lightColor,
        darkColor: settings.lightColor ? new Color(settings.darkColor) : preference.darkColor,
        timeColor: settings.timeColor ? new Color(settings.timeColor) : preference.timeColor
      });
      fontSize = Number(settings.fontSize) || fontSize;
      try {
        return await createWidget(data)
      } catch (e) {
        console.error(e);
      }
    }
  });
  if (config.runsInWidget) {
    Script.setWidget(widget);
  }
  // if (config.runsInApp) {
  //   const res = await presentSheet({
  //     message: 'Preview the widget or update the script. Update will override the whole script.',
  //     options: [
  //       { title: 'Update', value: 'Update' }
  //     ]
  //   })
  //   const value = res.option?.value
  //   switch (value) {
  //     case 'Update':
  //       update()
  //       break
  //   }
  // }

  Script.complete();
};

main();
