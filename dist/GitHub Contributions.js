// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: braille; icon-color: deep-gray;
/**
 * @version 1.3.0
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

const getImage = async (url) => {
  const request = new Request(url);
  const image = await request.loadImage();
  return image
};

const useCache$1 = () => {
  const fm = FileManager.local();
  const cacheDirectory = fm.joinPath(fm.cacheDirectory(), `${Script.name()}.Scriptable`);
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

/**
 * @param {ListWidget | WidgetStack} stack container widget
 * @param {object} options
 * @param {string} [options.src] image url
 * @param {Image} [options.image]
 * @param {number} options.size
 */
const addAvatar = async (stack, options) => {
  const { image, src, size } = options;
  const _image = stack.addImage(image || await getImage(src));
  _image.imageSize = new Size(size, size);
  _image.cornerRadius = size;
  return _image
};

/**
 * @param {ListWidget | WidgetStack} stack
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
 * @param {string} hex
 */
const hexToRGBA = (hex) => {
  const red = Number.parseInt(hex.substr(-6, 2), 16);
  const green = Number.parseInt(hex.substr(-4, 2), 16);
  const blue = Number.parseInt(hex.substr(-2, 2), 16);
  let alpha = 1;

  if (hex.length >= 8) {
    Number.parseInt(hex.substr(-8, 2), 16);
    Number.parseInt(hex.substr(-6, 2), 16);
    Number.parseInt(hex.substr(-4), 2);
    const number = Number.parseInt(hex.substr(-2, 2), 16);
    alpha = Number.parseFloat((number / 255).toFixed(3));
  }
  return { red, green, blue, alpha }
};

const _RGBToHex = (r, g, b) => {
  r = r.toString(16);
  g = g.toString(16);
  b = b.toString(16);

  if (r.length === 1) { r = '0' + r; }
  if (g.length === 1) { g = '0' + g; }
  if (b.length === 1) { b = '0' + b; }

  return '#' + r + g + b
};

const RGBToHSL = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;

  const cmin = Math.min(r, g, b);
  const cmax = Math.max(r, g, b);
  const delta = cmax - cmin;
  let h = 0;
  let s = 0;
  let l = 0;

  if (delta === 0) {
    h = 0;
  } else if (cmax === r) {
    h = ((g - b) / delta) % 6;
  } else if (cmax === g) {
    h = (b - r) / delta + 2;
  } else {
    h = (r - g) / delta + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) {
    h += 360;
  }

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);
  return { h, s, l }
};

const _HSLToRGB = (h, s, l) => {
  // Must be fractions of 1
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  return { r, g, b }
};

const lightenDarkenColor = (hsl, amount) => {
  const rgb = _HSLToRGB(hsl.h, hsl.s, hsl.l + amount);
  const hex = _RGBToHex(rgb.r, rgb.g, rgb.b);
  return hex
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
    <form class="list__body" action="javascript:void(0);">
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
    <form id="form" class="list__body" action="javascript:void(0);"></form>
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

let user = 'Honye';
let theme = 'system';
let useOfficial = true;
const officialColors = [
  ['#9be9a8', '#0e4429'],
  ['#40c463', '#006d32'],
  ['#30a14e', '#26a641'],
  ['#216e39', '#39d353']
];
const halloweenColors = [
  ['#ffee4a', '#631c03'],
  ['#ffc501', '#bd561d'],
  ['#fe9600', '#fa7a18'],
  ['#03001c', '#fddf68']
];
let themeColor = '#9be9a8';
const themes = {
  dark: {
    background: new Color('#242426')
  },
  light: {
    background: new Color('#ffffff')
  }
};

const gap = { x: 3, y: 2 };

const screen = Device.screenResolution();
const scale = Device.screenScale();
const size = phoneSize(screen.height);
const cache = useCache$1();

/**
 * @param {string} user
 */
const fetchData = async (user) => {
  const url = `https://www.imarkr.com/api/github/${user}`;
  const req = new Request(url);
  let data;
  try {
    data = await req.loadJSON();
    cache.writeJSON(`${user}.json`, data);
  } catch (e) {
    data = cache.readJSON(`${user}.json`);
  }
  return data
};

const isHalloween = () => {
  const date = new Date();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  return (month === 10 && day === 31) || (month === 11 && day === 1)
};

const render = async () => {
  if (config.runsInWidget) {
    [
      user = user,
      theme = theme
    ] = (args.widgetParameter || '')
      .split(',')
      .map(item => item.trim() || undefined);
  }

  const resp = await fetchData(user);

  const { widgetFamily } = config;
  const columns = widgetFamily === 'small' ? 9 : 20;
  const widgetWidth = size[widgetFamily === 'large' ? 'medium' : widgetFamily] / scale;
  const rectWidth = (widgetWidth - 24 - gap.x * (columns - 1)) / columns;
  const widget = new ListWidget();
  widget.url = `https://github.com/${user}`;
  widget.backgroundColor = theme === 'system'
    ? Color.dynamic(
      themes.light.background,
      themes.dark.background
    )
    : themes[theme].background;

  const { avatar, contributions } = resp;
  const name = resp.name || user;
  const countText = `${resp.contributions_count} contributions`;
  const latestDate = new Date(contributions.slice(-1)[0].date.replace(/-/g, '/'));
  const sliceCount = columns * 7 - 7 + latestDate.getDay() + 1;
  const colorsData = contributions
    .slice(-sliceCount).map((item) => item.level);

  const head = widget.addStack();
  head.layoutHorizontally();
  head.centerAlignContent();

  // avatar
  let image;
  try {
    image = await getImage(avatar);
    cache.writeImage(`${user}.jpeg`, image);
  } catch (e) {
    image = cache.readImage(`${user}.jpeg`);
  }
  await addAvatar(head, { image, size: 20 });
  head.addSpacer(3);

  // user name
  const textName = head.addText(name.toUpperCase());
  textName.lineLimit = 1;
  textName.minimumScaleFactor = 0.5;
  textName.font = Font.boldSystemFont(13);
  textName.textColor = new Color('#aeaeb7', 1);
  head.addSpacer(3);

  // contributions count, would not show on small
  if (widgetFamily !== 'small') {
    const textCount = head.addText(`(${countText})`.toUpperCase());
    textCount.font = Font.systemFont(12);
    textCount.textColor = new Color('#aeaeb7', 1);
  }

  widget.addSpacer(10);

  const gridStack = widget.addStack();
  const { add } = await useGrid(gridStack, {
    direction: 'vertical',
    column: 7,
    gap: [gap.y, gap.x]
  });

  const rgba = hexToRGBA(themeColor);
  const hsl = RGBToHSL(rgba.red, rgba.green, rgba.blue);
  const itemColors = useOfficial
    ? isHalloween() ? halloweenColors : officialColors
    : Array(4).fill({}).map((_, index) => lightenDarkenColor(hsl, -index * 18));
  const colors = [['#ebedf0', '#45454a'], ...itemColors];

  const addItem = (stack, level) => {
    const rect = stack.addStack();
    rect.size = new Size(rectWidth, rectWidth);
    rect.cornerRadius = 2;
    const color = colors[level];
    rect.backgroundColor = theme === 'system'
      ? (Array.isArray(color)
          ? Color.dynamic(new Color(color[0]), new Color(color[1]))
          : new Color(color
          )
        )
      : new Color(colors[theme][level], 1);
  };

  for (const [, level] of colorsData.entries()) {
    await add((stack) => addItem(stack, level));
  }

  return widget
};

const main = async () => {
  const widget = await withSettings({
    formItems: [
      {
        name: 'user',
        label: 'User name',
        type: 'text',
        default: user
      },
      {
        name: 'useOfficial',
        label: 'Official theme',
        type: 'switch',
        default: useOfficial
      },
      {
        name: 'themeColor',
        label: 'Theme color',
        type: 'color',
        default: themeColor
      }
    ],
    render: async ({ family, settings }) => {
      if (family) {
        config.widgetFamily = family;
      }
      user = settings.user || user;
      themeColor = settings.themeColor || themeColor;
      useOfficial = settings.useOfficial ?? useOfficial;
      const widget = await render()
        .catch((e) => {
          console.error(e);
          throw e
        });
      return widget
    }
  }).catch((e) => {
    console.error(e);
    throw e
  });
  if (config.runsInWidget) {
    Script.setWidget(widget);
  }
};

main();
