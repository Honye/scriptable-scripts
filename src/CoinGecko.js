const { getImage, useCache, hashCode } = importModule('utils.module')
const { withSettings } = importModule('withSettings.module')

/**
 * 是否缓存请求响应数据
 *
 * - `true`：网络异常时显示历史缓存数据
 * - `false`：当网络异常时组件会显示红色异常信息
 */
let cacheData = true
const API_BASE = 'https://api.coingecko.com/api/v3'
const cache = useCache()

const fetchCoinList = async () => {
  if (!config.runsInApp) {
    try {
      const list = cache.readJSON('coins-list.json')
      if (list && list.length) {
        return list
      }
    } catch (e) {}
  }
  const url = `${API_BASE}/coins/list`
  const request = new Request(url)
  const json = await request.loadJSON()
  cache.writeJSON('coins-list.json', json)
  return json
}

const findCoins = async (symbols) => {
  const list = await fetchCoinList()
  const result = []
  for (const symbol of symbols) {
    const coin = list.find((item) => item.symbol.toLowerCase() === symbol.toLowerCase())
    result.push(coin)
  }
  return result
}

const fetchMarkets = async (params = {}) => {
  const query =
   Object.entries({
     vs_currency: 'USD',
     ...params
   })
     .map(([k, v]) => `${k}=${v || ''}`)
     .join('&')
  const url = `${API_BASE}/coins/markets?${query}`
  const request = new Request(url)
  try {
    const json = await request.loadJSON()
    if (cacheData) {
      cache.writeJSON('data.json', json)
    }
    return json
  } catch (e) {
    if (cacheData) {
      return cache.readJSON('data.json')
    }
    throw e
  }
}

/**
 * @param {string} url
 * @returns {Image}
 */
const getIcon = async (url) => {
  const hash = `${hashCode(url)}`
  try {
    const icon = cache.readImage(hash)
    if (!icon) {
      throw new Error('no cached icon')
    }
    return icon
  } catch (e) {
    const icon = await getImage(url)
    cache.writeImage(hash, icon)
    return icon
  }
}

const getSmallBg = async (url) => {
  const webview = new WebView()
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
    img.src = '${url}'`
  const uri = await webview.evaluateJavaScript(js, true)
  const base64str = uri.replace(/^data:image\/\w+;base64,/, '')
  const image = Image.fromData(Data.fromBase64String(base64str))
  return image
}

const addListItem = async (widget, market) => {
  const item = widget.addStack()
  item.url = `https://www.coingecko.com/${Device.language()}/coins/${market.id}`
  const left = item.addStack()
  left.centerAlignContent()
  const image = left.addImage(await getIcon(market.image))
  image.imageSize = new Size(28, 28)
  left.addSpacer(8)
  const coin = left.addStack()
  coin.layoutVertically()
  const symbol = coin.addText(market.symbol.toUpperCase())
  symbol.font = Font.semiboldSystemFont(16)
  const name = coin.addText(market.name)
  name.font = Font.systemFont(10)
  name.textColor = Color.gray()

  const right = item.addStack()
  const price = right.addStack()
  price.layoutVertically()
  price.centerAlignContent()
  const cuWrap = price.addStack()
  cuWrap.addSpacer()
  const currency = cuWrap.addText(`$ ${market.current_price}`)
  currency.font = Font.semiboldSystemFont(15)
  const timeWrap = price.addStack()
  timeWrap.addSpacer()
  const dfm = new DateFormatter()
  dfm.dateFormat = 'hh:mm'
  const time = timeWrap.addText(dfm.string(new Date(market.last_updated)))
  time.font = Font.systemFont(10)
  time.textColor = Color.gray()
  right.addSpacer(8)
  const perWrap = right.addStack()
  perWrap.size = new Size(72, 28)
  perWrap.cornerRadius = 4
  const per = market.price_change_percentage_24h
  perWrap.backgroundColor = per > 0 ? Color.green() : Color.red()
  perWrap.centerAlignContent()
  const percent = perWrap.addText(`${per > 0 ? '+' : ''}${per.toFixed(2)}%`)
  percent.font = Font.semiboldSystemFont(14)
  percent.textColor = Color.white()
  percent.lineLimit = 1
  percent.minimumScaleFactor = 0.1
}

const addList = async (widget, data) => {
  widget.url = `https://www.coingecko.com/${Device.language()}`
  widget.setPadding(5, 15, 5, 15)
  await Promise.all(
    data.map((item) => {
      const add = async () => {
        widget.addSpacer()
        await addListItem(widget, item)
      }
      return add()
    })
  )
  widget.addSpacer()
}

const render = async (data) => {
  const market = data[0]
  const widget = new ListWidget()
  widget.backgroundColor = Color.dynamic(new Color('#fff'), new Color('#242426'))
  if (config.widgetFamily === 'small') {
    widget.url = `https://www.coingecko.com/${Device.language()}/coins/${market.id}`
    const image = await getIcon(market.image)
    const obase64str = Data.fromPNG(image).toBase64String()
    widget.backgroundColor = Color.dynamic(new Color('#fff'), new Color('#242426'))
    const bg = await getSmallBg(`data:image/png;base64,${obase64str}`)
    widget.backgroundImage = bg
    widget.setPadding(12, 12, 12, 12)
    const coin = widget.addText(market.symbol.toUpperCase())
    coin.font = Font.heavySystemFont(24)
    coin.rightAlignText()
    const name = widget.addText(market.name)
    name.font = Font.systemFont(10)
    name.textColor = Color.gray()
    name.rightAlignText()
    widget.addSpacer()

    const changePercent = market.price_change_percentage_24h || NaN
    const trend = widget.addText(`${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%`)
    trend.font = Font.semiboldSystemFont(16)
    trend.textColor = changePercent >= 0 ? Color.green() : Color.red()
    trend.rightAlignText()

    const price = widget.addText(`$ ${market.current_price}`)
    price.font = Font.boldSystemFont(28)
    price.rightAlignText()
    price.lineLimit = 1
    price.minimumScaleFactor = 0.1
    const history = widget.addText(`H: ${market.high_24h}, L: ${market.low_24h}`)
    history.font = Font.systemFont(10)
    history.textColor = Color.gray()
    history.rightAlignText()
    history.lineLimit = 1
    history.minimumScaleFactor = 0.1
  } else if (config.widgetFamily === 'medium') {
    await addList(widget, data.slice(0, 3))
  } else if (config.widgetFamily === 'large') {
    await addList(widget, data.slice(0, 6))
  }

  return widget
}

const main = async () => {
  const [symbols] = (args.widgetParameter || '').split(';').map((item) => item.trim())

  // symbols = 'btc,eth'
  let ids = ''
  if (symbols) {
    const list = await findCoins(
      symbols.split(',').map((item) => item.trim())
    )
    ids = list.filter((item) => item)
      .map((item) => item.id)
      .join(',')
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
      config.widgetFamily = family ?? config.widgetFamily
      cacheData = settings.cacheData ?? cacheData

      const markets = await fetchMarkets({ ids })
      const widget = await render(markets)
      return widget
    }
  })
  if (config.runsInWidget) {
    Script.setWidget(widget)
  }
}

await main()
