// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: frog; icon-color: green;
/**
 * @version 1.0.0
 * @author Honye
 */

const getImage = async (url) => {
  const request = new Request(url);
  const image = await request.loadImage();
  return image
};

const API_BASE = 'https://api.coingecko.com/api/v3';

const queryCoin = async (symbol) => {
  const url = `https://jun.fly.dev/api/coingecko/coins?symbol=${symbol}`;
  const request = new Request(url);
  const json = await request.loadJSON();
  return json
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

const render = async (data) => {
  const market = data[0];
  const widget = new ListWidget();
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
  }

  return widget
};

const main = async () => {
  const [symbols] = (args.widgetParameter || '').split(';').map((item) => item.trim());

  let ids = '';
  if (symbols) {
    const list = await queryCoin(symbols);
    ids = list.filter((item) => item)
      .map((item) => item.id)
      .join(',');
  }

  const markets = await fetchMarkets({ ids });

  config.widgetFamily = 'small';
  const widget = await render(markets);
  widget.presentSmall();
};

await main();
