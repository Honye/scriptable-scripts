if (typeof require === 'undefined') require = importModule
const { getImage, i18n, timeOffset, useCache } = require('./utils.module')
const { withSettings } = require('./withSettings.module')

const preference = {
  type: 'all',
  mediumCount: 3,
  largeCount: 7
}
const cache = useCache()

const requestData = async () => {
  const url = 'https://api.gofans.cn/v1/m/app_records?page=1&limit=50'
  const request = new Request(url)
  request.headers = {
    Origin: 'https://m.gofans.cn'
  }
  try {
    const json = await request.loadJSON()
    cache.writeJSON('records.json', json)
    return json
  } catch (e) {
    const json = cache.readJSON('records.json')
    return json
  }
}

const createWidget = async (data) => {
  const family = config.widgetFamily
  const { type, mediumCount, largeCount } = preference
  const widget = new ListWidget()
  widget.setPadding(8, 12, 8, 12)
  widget.spacing = 8

  if (family === 'small') {
    widget.addText(i18n(['Not support small size', '不支持小号组件']))
      .textColor = Color.red()
    return widget
  }

  const num = family === 'large' ? largeCount : mediumCount
  const filter = type === 'ios'
    ? (item) => item.kind === 2
    : type === 'mac'
      ? (item) => item.kind === 1
      : () => true
  for (const [index, item] of data.filter(filter).slice(0, num).entries()) {
    if (index > 0) {
      const stack = widget.addStack()
      stack.addSpacer(44)
      const line = stack.addStack()
      line.addSpacer()
      line.size = new Size(-1, 0.5)
      line.backgroundColor = new Color(Color.gray().hex, 0.4)
    }
    await addItem(widget, item)
  }
  return widget
}

/**
 * @param {WidgetStack} container
 */
const addItem = async (container, data) => {
  const stack = container.addStack()
  const callback = new CallbackURL(URLScheme.forRunningScript())
  callback.addParameter('id', data.uuid)
  stack.url = callback.getURL()
  stack.spacing = 8
  stack.centerAlignContent()
  const icon = stack.addImage(await getImage(data.icon))
  icon.imageSize = new Size(36, 36)
  icon.cornerRadius = 8

  const content = stack.addStack()
  content.layoutVertically()
  content.spacing = 4
  const top = content.addStack()
  top.bottomAlignContent()
  top.spacing = 4
  const name = top.addText(data.name)
  name.font = Font.systemFont(14)
  name.lineLimit = 1
  top.addSpacer()
  const time = top.addText(timeOffset(new Date(1e3 * data.updated_at)))
  time.font = Font.systemFont(10)
  time.textColor = Color.gray()

  const bottom = content.addStack()
  bottom.topAlignContent()
  bottom.spacing = 4
  const intro = bottom.addText(data.description)
  intro.lineLimit = 1
  intro.font = Font.systemFont(12)
  intro.textColor = Color.gray()
  bottom.addSpacer()
  const currentPrice = Number(data.price)
  const price = bottom.addText(`¥${Number(data.original_price)} → ${currentPrice > 0 ? currentPrice : i18n(['Free', '免费'])}`)
  price.font = Font.systemFont(12)
}

const requestDetail = async (id) => {
  const url = `https://api.gofans.cn/v1/m/apps/${id}`
  const request = new Request(url)
  request.headers = {
    Origin: 'https://m.gofans.cn'
  }
  return request.loadJSON()
}

const query = args.queryParameters
if (query.id) {
  const app = await requestDetail(query.id)
  Safari.open(app.track_url)
} else {
  const { data } = await requestData()
  const widget = await withSettings({
    formItems: [
      {
        name: 'type',
        label: i18n(['Application type', '应用类型']),
        type: 'select',
        options: [
          { label: i18n(['All', '全部']), value: 'all' },
          { label: 'iPhone', value: 'ios' },
          { label: 'Mac', value: 'mac' }
        ]
      },
      {
        name: 'mediumCount',
        label: i18n(['Number when medium size', '中号时显示个数']),
        type: 'number',
        default: preference.mediumCount
      },
      {
        name: 'largeCount',
        label: i18n(['Number when large size', '大号时显示个数']),
        type: 'number',
        default: preference.largeCount
      }
    ],
    render: async ({ family, settings }) => {
      config.widgetFamily = family ?? config.widgetFamily
      Object.assign(preference, settings)
      const widget = await createWidget(data)
      return widget
    }
  })
  if (config.runsInWidget) {
    Script.setWidget(widget)
  }
}
