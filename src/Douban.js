if (typeof require === 'undefined') require = importModule
const { sloarToLunar } = require('./lunar.module')
const { i18n, vw } = require('./utils.module')
const { withSettings } = require('./withSettings.module')

const preference = {
  showDate: true,
  useTextShadow: true
}

const rpt = (n) => {
  const designWith = { small: 155, medium: 329 }
  const { widgetFamily } = config
  return vw(n * 100 / (designWith[widgetFamily] || designWith.medium), widgetFamily)
}

const $12Animals = {
  子: '鼠',
  丑: '牛',
  寅: '虎',
  卯: '兔',
  辰: '龙',
  巳: '蛇',
  午: '马',
  未: '羊',
  申: '猴',
  酉: '鸡',
  戌: '狗',
  亥: '猪'
}

const render = async () => {
  const url = 'https://www.imarkr.com/api/douban/daily'
  const request = new Request(url)
  const data = await request.loadJSON()

  const widgetFamily = config.widgetFamily
  switch (widgetFamily) {
    case 'small':
      return renderSmall(data)
    case 'medium':
      return renderMedium(data)
    case 'large':
      return renderLarge(data)
    default:
      return renderMedium(data)
  }
}

const renderSmall = async (data) => {
  const { showDate, useTextShadow } = preference
  const widget = new ListWidget()
  widget.url = data.url
  widget.setPadding(rpt(12), rpt(12), rpt(12), rpt(12))
  const image = await getImage(data.poster)
  shadowBgImage(widget, image)

  if (showDate) {
    const now = new Date()
    const { lunarYear, lunarMonth, lunarDay } = sloarToLunar(now.getFullYear(), now.getMonth() + 1, now.getDate())
    const top = widget.addStack()
    top.centerAlignContent()
    const day = top.addText(`${now.getDate()}`.padStart(2, '0'))
    day.font = new Font('DIN Alternate', rpt(28))
    day.textColor = Color.white()
    top.addSpacer(rpt(4))
    const dateWrap = top.addStack()
    dateWrap.layoutVertically()
    const df = new DateFormatter()
    df.locale = 'zh-CN'
    df.dateFormat = 'MMMM｜E'
    const week = dateWrap.addText(df.string(now))
    week.font = Font.mediumSystemFont(rpt(8))
    week.textColor = Color.white()
    dateWrap.addSpacer(rpt(2))
    const lunar = dateWrap.addText(`${$12Animals[lunarYear[1]]}年${lunarMonth}月${lunarDay}`)
    lunar.font = Font.mediumSystemFont(rpt(8))
    lunar.textColor = Color.white()
    if (useTextShadow) {
      const color = new Color('#192319', 0.4)
      const offset = new Point(0, 0)
      const radius = 3
      day.shadowColor = color
      day.shadowOffset = offset
      day.shadowRadius = radius
      week.shadowColor = color
      week.shadowOffset = offset
      week.shadowRadius = radius
      lunar.shadowColor = color
      lunar.shadowOffset = offset
      lunar.shadowRadius = radius
    }
  }

  widget.addSpacer()
  const textTitle = widget.addText(`《${data.title}》`)
  textTitle.font = Font.boldSystemFont(rpt(12))
  textTitle.textColor = Color.white()
  textTitle.lineLimit = 1
  textTitle.minimumScaleFactor = 0.5
  widget.addSpacer(rpt(4))
  const stackRating = widget.addStack()
  await widgetRating(stackRating, data)
  return widget
}

const renderMedium = async (data) => {
  const { showDate, useTextShadow } = preference
  const widget = new ListWidget()
  widget.url = data.url
  widget.setPadding(rpt(12), rpt(12), rpt(12), rpt(12))
  const image = await getImage(data.poster)
  shadowBgImage(widget, image)

  if (showDate) {
    const now = new Date()
    const { lunarYear, lunarMonth, lunarDay } = sloarToLunar(now.getFullYear(), now.getMonth() + 1, now.getDate())
    const top = widget.addStack()
    top.addSpacer()
    const dateWrap = top.addStack()
    dateWrap.layoutVertically()
    const dayWrap = dateWrap.addStack()
    dayWrap.size = new Size(rpt(48), -1)
    const day = dayWrap.addText(`${now.getDate()}`.padStart(2, '0'))
    day.font = new Font('DIN Alternate', rpt(28))
    day.textColor = Color.white()
    const df = new DateFormatter()
    df.locale = 'zh-CN'
    df.dateFormat = 'MMMM｜E'
    const week = dateWrap.addText(df.string(now))
    week.font = Font.mediumSystemFont(rpt(8))
    week.textColor = Color.white()
    dateWrap.addSpacer(rpt(2))
    const lunar = dateWrap.addText(`${$12Animals[lunarYear[1]]}年${lunarMonth}月${lunarDay}`)
    lunar.font = Font.mediumSystemFont(rpt(8))
    lunar.textColor = Color.white()
    if (useTextShadow) {
      const color = new Color('#192319', 0.4)
      const offset = new Point(0, 0)
      const radius = 3
      day.shadowColor = color
      day.shadowOffset = offset
      day.shadowRadius = radius
      week.shadowColor = color
      week.shadowOffset = offset
      week.shadowRadius = radius
      lunar.shadowColor = color
      lunar.shadowOffset = offset
      lunar.shadowRadius = radius
    }
  }

  widget.addSpacer()
  const stackRating = widget.addStack()
  stackRating.centerAlignContent()
  const textTitle = stackRating.addText(`《${data.title}》`)
  textTitle.font = Font.mediumSystemFont(rpt(12))
  textTitle.textColor = Color.white()
  textTitle.lineLimit = 1
  textTitle.minimumScaleFactor = 0.5
  stackRating.addSpacer(rpt(4))
  await widgetRating(stackRating, data)
  stackRating.addSpacer()
  widget.addSpacer(rpt(4))
  const stackContent = widget.addStack()
  const textContent = stackContent.addText(data.content)
  textContent.font = Font.systemFont(rpt(10))
  textContent.textColor = Color.white()
  textContent.lineLimit = 2
  textContent.minimumScaleFactor = 0.5
  return widget
}

const renderLarge = async (data) => {
  const widget = new ListWidget()
  widget.url = data.url
  widget.setPadding(rpt(12), rpt(12), rpt(12), rpt(12))
  const img = widget.addStack()
  img.size = new Size(-1, rpt(180))
  img.addStack().addSpacer()
  img.cornerRadius = rpt(8)
  const image = await getImage(data.poster)
  img.backgroundImage = image

  const now = new Date()
  const { lunarYear, lunarMonth, lunarDay } = sloarToLunar(now.getFullYear(), now.getMonth() + 1, now.getDate())
  const dateWrap = widget.addStack()
  dateWrap.setPadding(rpt(12), 0, rpt(12), 0)
  dateWrap.centerAlignContent()
  const df = new DateFormatter()
  df.locale = 'zh-CN'
  df.dateFormat = 'MM月dd日｜E'
  const date = dateWrap.addText(df.string(now))
  date.font = Font.boldSystemFont(rpt(16))
  date.textColor = Color.dynamic(new Color('#192319'), new Color('#fff'))
  dateWrap.addSpacer()
  const lunar = dateWrap.addText(`${$12Animals[lunarYear[1]]}年${lunarMonth}月${lunarDay}`)
  lunar.font = Font.systemFont(rpt(12))
  lunar.textColor = Color.dynamic(new Color('#7A8679'), new Color('#ADB7B1'))

  const line = widget.addStack()
  line.size = new Size(-1, 1)
  line.addSpacer()
  const gradient = new LinearGradient()
  const colors = []
  const locations = []
  const steps = 45
  const stepSize = 1 / steps
  for (let i = 0; i < steps; i++) {
    const color = Color.dynamic(new Color('#E5EAE5', (i + 1) % 2), new Color('#363C38', (i + 1) % 2))
    colors.push(color, color)
    locations.push(stepSize * i, stepSize * (i + 1))
  }
  gradient.colors = colors
  gradient.locations = locations
  gradient.startPoint = new Point(0, 0)
  gradient.endPoint = new Point(1, 0)
  line.backgroundGradient = gradient
  widget.addSpacer()
  const name = widget.addText(`《${data.title}》`)
  name.font = Font.mediumSystemFont(rpt(14))
  name.textColor = Color.dynamic(new Color('#192319'), new Color('#fff'))
  widget.addSpacer(rpt(6))
  const extra = widget.addStack()
  extra.centerAlignContent()
  extra.spacing = rpt(4)
  widgetRating(extra, data)
  const man = extra.addText(`${data.subtitle.replace(/\n/g, ' / ')}`)
  man.font = Font.systemFont(rpt(10))
  man.textColor = Color.dynamic(new Color('#7A8679'), new Color('#ADB7B1'))
  widget.addSpacer(rpt(6))
  const content = widget.addText(data.content)
  content.font = Font.systemFont(rpt(12))
  content.lineLimit = 2
  content.textColor = Color.dynamic(new Color('#192319'), new Color('#fff'))
  return widget
}

const widgetRating = (widget, data) => {
  const stack = widget.addStack()
  stack.setPadding(rpt(2), rpt(4), rpt(2), rpt(4))
  stack.backgroundColor = Color.dynamic(new Color('#20D770'), new Color('#1FA85A'))
  stack.cornerRadius = rpt(4)
  const ratingText = data.rating === null ? '无' : data.rating.toFixed(1)
  const textTitle = stack.addText(`豆瓣评分 ${ratingText}`)
  textTitle.font = Font.mediumSystemFont(rpt(8))
  textTitle.textColor = new Color('#fff')
}

const getImage = async (url) => {
  const request = new Request(url)
  request.headers = {
    'User-Agent': 'FRDMoonWidgetExtension/8.0.0 (iPhone; iOS 16.5.1; Scale/2.00)'
  }
  const image = await request.loadImage()
  return image
}

/**
 * @param {ListWidget} widget
 * @param {Image} image
 */
const shadowBgImage = (widget, image) => {
  widget.backgroundImage = image
  const gradient = new LinearGradient()
  gradient.startPoint = new Point(0, 0)
  gradient.endPoint = new Point(0, 1)
  gradient.colors = [
    new Color('#192319', 0.1),
    new Color('#192319', 0),
    new Color('#192319', 1)
  ]
  gradient.locations = [0, 0.5, 1]
  widget.backgroundGradient = gradient
}

await withSettings({
  formItems: [
    {
      label: i18n(['Show Date', '显示日期']),
      name: 'showDate',
      type: 'switch',
      default: preference.showDate
    },
    {
      label: i18n(['Text Shadow', '文字阴影']),
      name: 'useTextShadow',
      type: 'switch',
      default: preference.useTextShadow
    }
  ],
  render: ({ family, settings }) => {
    family && (config.widgetFamily = family)
    Object.assign(preference, settings)
    return render()
  }
})
