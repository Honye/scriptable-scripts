if (typeof require === 'undefined') require = importModule
const { getImage, i18n, useCache, widgetSize } = require('./utils.module')
const { withSettings } = require('./withSettings.module')

const preference = {
  fontSize: 12,
  textColorLight: '#232323',
  textColorDark: '#ffffff',
  itemTimeColorLight: '#707070',
  itemTimeColorDark: '#c2c2c2',
  lineLimit: 2,
  space: 2,
  exclude: ''
}

const cache = useCache()
const lineHeight = 1.24
const space = 4

const requestData = async () => {
  const url = 'https://www.cls.cn/nodeapi/telegraphList'
  const request = new Request(url)
  const data = await request.loadJSON()
  return data
}

const getLogoImage = async () => {
  try {
    const image = cache.readImage('logo.png')
    if (!image) {
      throw new Error('no cache')
    }
    return image
  } catch (e) {
    const image = await getImage(
      'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/d8/03/5d/d8035d9a-bd09-dc3a-6aa4-fe29a805568e/AppIcon-0-0-1x_U007epad-0-0-0-sRGB-85-220.png/434x0w.webp'
    )
    cache.writeImage('logo.png', image)
    return image
  }
}

const measureText = async (
  text,
  fontSize,
  fontWeight = 'normal',
  fontStyle = 'normal',
  fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif'
) => {
  const js = `const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    // 格式: "font-style font-variant font-weight font-size/line-height font-family"
    // 对于宽度计算，line-height 和 font-variant 通常不影响单行宽度
    context.font = \`${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}\`
    const { width } = context.measureText('${text}')
    completion({ width })`
  const wv = new WebView()
  const res = await wv.evaluateJavaScript(js, true)
  return res
}

const formatTime = (date) => {
  const df = new DateFormatter()
  df.dateFormat = 'HH:mm'
  return df.string(date)
}

const createWidgt = async () => {
  const {
    fontSize,
    textColorLight,
    textColorDark,
    itemTimeColorLight,
    itemTimeColorDark,
    lineLimit,
    exclude
  } = preference
  const {
    data: { roll_data: rollData }
  } = await requestData()
  const sizes = widgetSize()
  const widgetWidth = config.widgetFamily === 'small' ? sizes.small : sizes.medium
  const widgetHeight =
    config.widgetFamily === 'large' ? sizes.large : sizes.small
  let leftHeight = widgetHeight
  const widget = new ListWidget()
  widget.setPadding(0, 12, 0, 12)
  // 上下预留间距
  leftHeight -= 20

  const head = widget.addStack()
  head.size = new Size(-1, fontSize * 1.2 + 2)
  head.centerAlignContent()
  const logo = head.addImage(await getLogoImage())
  logo.imageSize = new Size(fontSize * 1.2 + 2, fontSize * 1.2 + 2)
  logo.cornerRadius = 4
  logo.url = 'https://m.cls.cn'
  head.addSpacer(4)
  if (config.widgetFamily !== 'small') {
    const title = head.addText('财联社电报')
    title.font = Font.mediumSystemFont(fontSize * 1.2)
    title.textColor = Color.dynamic(
      new Color(textColorLight),
      new Color(textColorDark)
    )
  }
  head.addSpacer()
  const time = head.addText(`${config.widgetFamily !== 'small' ? '更新于 ' : ''}${formatTime(new Date())}`)
  time.font = Font.systemFont(10)
  time.textColor = Color.dynamic(
    new Color(textColorLight, 0.8),
    new Color(textColorDark, 0.8)
  )
  // 减去头部高度
  leftHeight -= fontSize * 1.2 + 2

  const { width: timeWidth } = await measureText('04:44', fontSize)
  const titleCWidth = widgetWidth - 24 - timeWidth - space

  for (const item of rollData) {
    const titleText = item.title || item.content
    if (exclude && new RegExp(exclude, 'i').test(titleText)) {
      continue
    }
    if (preference.space > 0) {
      widget.addSpacer(preference.space)
      leftHeight -= preference.space
    }
    const { width: titleWidth } = await measureText(titleText, fontSize)

    // 此条文本需要多少行
    let lines = Math.ceil(titleWidth / titleCWidth)
    lines = Math.min(lines, lineLimit)
    const limit = Math.min(Math.floor(leftHeight / (fontSize * lineHeight)), lineLimit)
    // 文本实际渲染行数
    lines = Math.min(lines, limit)

    const row = widget.addStack()
    row.url = item.shareurl
    const textColor = Color.dynamic(
      new Color(textColorLight),
      new Color(textColorDark)
    )
    const timeStack = row.addStack()
    timeStack.size = new Size(timeWidth, -1)
    const time = timeStack.addText(`${formatTime(new Date(item.ctime * 1000))}`)
    time.font = Font.systemFont(fontSize)
    time.textColor = Color.dynamic(
      new Color(itemTimeColorLight),
      new Color(itemTimeColorDark)
    )
    row.addSpacer(4)
    const title = row.addText(item.title || item.content)
    title.font = Font.systemFont(fontSize)
    title.textColor = textColor
    title.lineLimit = limit

    leftHeight -= lines * (fontSize * lineHeight)
    if (leftHeight < (fontSize * lineHeight + (preference.space || 0))) break
  }

  return widget
}

await withSettings({
  formItems: [
    {
      label: i18n(['Text size', '字体大小']),
      name: 'fontSize',
      type: 'number',
      default: preference.fontSize
    },
    {
      label: i18n(['Text color', '文字颜色']),
      name: 'textColorLight',
      type: 'color',
      media: '(prefers-color-scheme: light)',
      default: preference.textColorLight
    },
    {
      label: i18n(['Text color', '文字颜色']),
      name: 'textColorDark',
      type: 'color',
      media: '(prefers-color-scheme: dark)',
      default: preference.textColorDark
    },
    {
      label: i18n(['Time color', '时间颜色']),
      name: 'itemTimeColorLight',
      type: 'color',
      media: '(prefers-color-scheme: light)',
      default: preference.itemTimeColorLight
    },
    {
      label: i18n(['Time color', '时间颜色']),
      name: 'itemTimeColorDark',
      type: 'color',
      media: '(prefers-color-scheme: dark)',
      default: preference.itemTimeColorDark
    },
    {
      label: i18n(['Line limit', '行数限制']),
      name: 'lineLimit',
      type: 'number',
      default: preference.lineLimit
    },
    {
      label: i18n(['Space', '间距']),
      name: 'space',
      type: 'number',
      default: preference.space
    },
    {
      label: i18n(['Exclude', '过滤排除']),
      name: 'exclude',
      type: 'text',
      default: preference.exclude
    }
  ],
  render: ({ settings, family }) => {
    if (family) config.widgetFamily = family
    Object.assign(preference, settings)
    return createWidgt()
  }
})
