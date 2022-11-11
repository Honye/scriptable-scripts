// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: frog; icon-color: green;
/**
 * 在 App 内运行时会请求最新的货币列表并缓存
 * 
 * 其他情况优先使用缓存中货币 ID 去请求数据
 *
 * @version 1.1.0
 * @author Honye
 */

const getImage = async (url) => {
  const request = new Request(url);
  const image = await request.loadImage();
  return image
};

const useCache = () => {
  const fm = FileManager.local();
  const cacheDirectory = fm.joinPath(fm.cacheDirectory(), `${Script.name()}.Scriptable`);

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

const API_BASE = 'https://api.coingecko.com/api/v3';
const cache = useCache();

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
  const json = await request.loadJSON();
  return json
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
  return uri
};

const addListItem = async (widget, market) => {
  const item = widget.addStack();
  item.url = `https://www.coingecko.com/${Device.language()}/coins/${market.id}`;
  const left = item.addStack();
  left.centerAlignContent();
  const image = left.addImage(await getImage(market.image));
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
    const image = await getImage(market.image);
    const obase64str = Data.fromPNG(image).toBase64String();
    const uri = await getSmallBg(`data:image/png;base64,${obase64str}`);
    const base64str = uri.replace(/^data:image\/\w+;base64,/, '');
    widget.backgroundColor = Color.dynamic(new Color('#fff'), new Color('#242426'));
    widget.backgroundImage = Image.fromData(Data.fromBase64String(base64str));
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

  const markets = await fetchMarkets({ ids });

  //   config.widgetFamily = 'medium'
  if (config.runsInApp) {
    config.widgetFamily = config.widgetFamily || 'small';
  }
  const widget = await render(markets);
  Script.setWidget(widget);
  if (config.runsInApp) {
    switch (config.widgetFamily) {
      case 'small':
        widget.presentSmall();
        break
      case 'medium':
        widget.presentMedium();
        break
      case 'large':
        widget.presentLarge();
        break
    }
  }
};

await main();
