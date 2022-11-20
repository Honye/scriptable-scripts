// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: frog; icon-color: green;
/**
 * 在 App 内运行时会请求最新的货币列表并缓存
 * 
 * 其他情况优先使用缓存中货币 ID 去请求数据
 *
 * @version 1.2.0
 * @author Honye
 */

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
 * @param {string} data
 */
const hashCode = (data) => {
  return Array.from(data).reduce((accumulator, currentChar) => Math.imul(31, accumulator) + currentChar.charCodeAt(0), 0)
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
    <div class="copyright">Copyright © 2022 <a href="javascript:invoke('safari','https://www.imarkr.com');">iMarkr</a> All rights reserved.</div>
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

/**
 * 是否缓存请求响应数据
 *
 * - `true`：网络异常时显示历史缓存数据
 * - `false`：当网络异常时组件会显示红色异常信息
 */
let cacheData = true;
const API_BASE = 'https://api.coingecko.com/api/v3';
const cache = useCache$1();

const fetchCoinList = async () => {
  if (!config.runsInApp) {
    try {
      const list = cache.readJSON('coins-list.json');
      if (list && list.length) {
        return list
      }
    } catch (e) {}
  }
  const url = `${API_BASE}/coins/list`;
  const request = new Request(url);
  const json = await request.loadJSON();
  cache.writeJSON('coins-list.json', json);
  return json
};

const findCoins = async (symbols) => {
  const list = await fetchCoinList();
  const result = [];
  for (const symbol of symbols) {
    const coin = list.find((item) => item.symbol.toLowerCase() === symbol.toLowerCase());
    result.push(coin);
  }
  return result
};

const fetchMarkets = async (params = {}) => {
  const query =
   Object.entries({
     vs_currency: 'USD',
     ...params
   })
     .map(([k, v]) => `${k}=${v || ''}`)
     .join('&');
  const url = `${API_BASE}/coins/markets?${query}`;
  const request = new Request(url);
  try {
    const json = await request.loadJSON();
    if (cacheData) {
      cache.writeJSON('data.json', json);
    }
    return json
  } catch (e) {
    if (cacheData) {
      return cache.readJSON('data.json')
    }
    throw e
  }
};

/**
 * @param {string} url
 * @returns {Image}
 */
const getIcon = async (url) => {
  const hash = `${hashCode(url)}`;
  try {
    const icon = cache.readImage(hash);
    if (!icon) {
      throw new Error('no cached icon')
    }
    return icon
  } catch (e) {
    const icon = await getImage(url);
    cache.writeImage(hash, icon);
    return icon
  }
};

const getSmallBg = async (url) => {
  const webview = new WebView();
  const js =
    `const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const { width, height } = img
      canvas.width = width
      canvas.height = height
      ctx.globalAlpha = 0.3
      ctx.drawImage(
        img,
        -width / 2 + 50,
        -height / 2 + 50,
        width,
        height
      )
      const uri = canvas.toDataURL()
      completion(uri);
    };
    img.src = '${url}'`;
  const uri = await webview.evaluateJavaScript(js, true);
  const base64str = uri.replace(/^data:image\/\w+;base64,/, '');
  const image = Image.fromData(Data.fromBase64String(base64str));
  return image
};

const addListItem = async (widget, market) => {
  const item = widget.addStack();
  item.url = `https://www.coingecko.com/${Device.language()}/coins/${market.id}`;
  const left = item.addStack();
  left.centerAlignContent();
  const image = left.addImage(await getIcon(market.image));
  image.imageSize = new Size(28, 28);
  left.addSpacer(8);
  const coin = left.addStack();
  coin.layoutVertically();
  const symbol = coin.addText(market.symbol.toUpperCase());
  symbol.font = Font.semiboldSystemFont(16);
  const name = coin.addText(market.name);
  name.font = Font.systemFont(10);
  name.textColor = Color.gray();

  const right = item.addStack();
  const price = right.addStack();
  price.layoutVertically();
  price.centerAlignContent();
  const cuWrap = price.addStack();
  cuWrap.addSpacer();
  const currency = cuWrap.addText(`$ ${market.current_price}`);
  currency.font = Font.semiboldSystemFont(15);
  const timeWrap = price.addStack();
  timeWrap.addSpacer();
  const dfm = new DateFormatter();
  dfm.dateFormat = 'hh:mm';
  const time = timeWrap.addText(dfm.string(new Date(market.last_updated)));
  time.font = Font.systemFont(10);
  time.textColor = Color.gray();
  right.addSpacer(8);
  const perWrap = right.addStack();
  perWrap.size = new Size(72, 28);
  perWrap.cornerRadius = 4;
  const per = market.price_change_percentage_24h;
  perWrap.backgroundColor = per > 0 ? Color.green() : Color.red();
  perWrap.centerAlignContent();
  const percent = perWrap.addText(`${per > 0 ? '+' : ''}${per.toFixed(2)}%`);
  percent.font = Font.semiboldSystemFont(14);
  percent.textColor = Color.white();
  percent.lineLimit = 1;
  percent.minimumScaleFactor = 0.1;
};

const addList = async (widget, data) => {
  widget.url = `https://www.coingecko.com/${Device.language()}`;
  widget.setPadding(5, 15, 5, 15);
  await Promise.all(
    data.map((item) => {
      const add = async () => {
        widget.addSpacer();
        await addListItem(widget, item);
      };
      return add()
    })
  );
  widget.addSpacer();
};

const render = async (data) => {
  const market = data[0];
  const widget = new ListWidget();
  widget.backgroundColor = Color.dynamic(new Color('#fff'), new Color('#242426'));
  if (config.widgetFamily === 'small') {
    widget.url = `https://www.coingecko.com/${Device.language()}/coins/${market.id}`;
    const image = await getIcon(market.image);
    const obase64str = Data.fromPNG(image).toBase64String();
    widget.backgroundColor = Color.dynamic(new Color('#fff'), new Color('#242426'));
    const bg = await getSmallBg(`data:image/png;base64,${obase64str}`);
    widget.backgroundImage = bg;
    widget.setPadding(12, 12, 12, 12);
    const coin = widget.addText(market.symbol.toUpperCase());
    coin.font = Font.heavySystemFont(24);
    coin.rightAlignText();
    const name = widget.addText(market.name);
    name.font = Font.systemFont(10);
    name.textColor = Color.gray();
    name.rightAlignText();
    widget.addSpacer();

    const changePercent = market.price_change_percentage_24h || NaN;
    const trend = widget.addText(`${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%`);
    trend.font = Font.semiboldSystemFont(16);
    trend.textColor = changePercent >= 0 ? Color.green() : Color.red();
    trend.rightAlignText();

    const price = widget.addText(`$ ${market.current_price}`);
    price.font = Font.boldSystemFont(28);
    price.rightAlignText();
    price.lineLimit = 1;
    price.minimumScaleFactor = 0.1;
    const history = widget.addText(`H: ${market.high_24h}, L: ${market.low_24h}`);
    history.font = Font.systemFont(10);
    history.textColor = Color.gray();
    history.rightAlignText();
    history.lineLimit = 1;
    history.minimumScaleFactor = 0.1;
  } else if (config.widgetFamily === 'medium') {
    await addList(widget, data.slice(0, 3));
  } else if (config.widgetFamily === 'large') {
    await addList(widget, data.slice(0, 6));
  }

  return widget
};

const main = async () => {
  const [symbols] = (args.widgetParameter || '').split(';').map((item) => item.trim());

  // symbols = 'btc,eth'
  let ids = '';
  if (symbols) {
    const list = await findCoins(
      symbols.split(',').map((item) => item.trim())
    );
    ids = list.filter((item) => item)
      .map((item) => item.id)
      .join(',');
  }

  const widget = await withSettings({
    formItems: [
      {
        name: 'cacheData',
        type: 'switch',
        label: 'Cache data',
        default: true
      }
    ],
    render: async ({ settings, family }) => {
      config.widgetFamily = family ?? config.widgetFamily;
      cacheData = settings.cacheData ?? cacheData;

      const markets = await fetchMarkets({ ids });
      const widget = await render(markets);
      return widget
    }
  });
  if (config.runsInWidget) {
    Script.setWidget(widget);
  }
};

await main();
