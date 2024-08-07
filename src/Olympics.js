if (typeof require === 'undefined') require = importModule
const { withSettings } = require('./withSettings.module')
const { getImage, useCache } = require('./utils.module')

const cache = useCache()

const preference = {
  rows: 5,
  fontSize: 11,
  showRowBg: true,
  spacing: 15,
  showTime: false
}
let flagWidth = 0
let flagHeight = 0

/**
 * @param {WidgetStack} stack
 * @param {string} text
 */
const addText = (stack, text) => {
  const w = stack.addStack()
  w.size = new Size(preference.fontSize * 2.8, preference.fontSize * 2.4)
  w.centerAlignContent()
  w.addSpacer()
  const n = w.addText(text)
  n.font = Font.systemFont(preference.fontSize)
  return n
}

/**
 * @param {ListWidget} widget
 */
const addRow = (widget) => {
  const tr = widget.addStack()
  tr.setPadding(0, 4, 0, 4)
  tr.cornerRadius = 4
  return tr
}

/**
 * @param {ListWidget} widget
 */
const addTableHead = (widget) => {
  const headStack = addRow(widget)
  const headColor = Color.dynamic(
    new Color('#4b5367'),
    new Color('#fff', 0.7)
  )
  const rc = headStack.addStack()
  rc.layoutVertically()
  const hidden = rc.addStack()
  hidden.addStack().size = new Size(preference.fontSize * 1.3 + 3 + flagWidth, 0)
  hidden.addSpacer()
  const h1 = rc.addStack()
  h1.size = new Size(-1, preference.fontSize * 2.4)
  h1.centerAlignContent()
  if (preference.showTime) {
    const s = h1.addImage(SFSymbol.named('clock.arrow.circlepath').image)
    s.tintColor = headColor
    s.imageSize = new Size(preference.fontSize, preference.fontSize)
    h1.addSpacer(3)
    const df = new DateFormatter()
    df.dateFormat = 'HH:mm'
    const t = h1.addText(df.string(new Date()))
    t.font = Font.systemFont(preference.fontSize)
    t.textColor = headColor
    t.lineLimit = 1
    t.minimumScaleFactor = 0.6
  } else {
    const t1 = h1.addText('排名')
    t1.textColor = headColor
    t1.font = Font.systemFont(preference.fontSize)
    t1.lineLimit = 1
  }
  const t2 = addText(headStack, '金')
  t2.textColor = headColor
  headStack.addSpacer(preference.spacing)
  const t3 = addText(headStack, '银')
  t3.textColor = headColor
  headStack.addSpacer(preference.spacing)
  const t4 = addText(headStack, '铜')
  t4.textColor = headColor
  headStack.addSpacer(preference.spacing)
  const t5 = addText(headStack, '总')
  t5.textColor = headColor
}

const getFlagImage = async (nocCode, url) => {
  try {
    const image = cache.readImage(`${nocCode}.png`)
    if (!image) {
      throw new Error('No cache')
    }
    return image
  } catch (e) {
    const image = await getImage(url)
    cache.writeImage(`${nocCode}.png`, image)
    return image
  }
}

/**
 * @param {ListWidget} widget
 * @param {*} item
 * @param {number} i
 */
const addTableRow = async (widget, item) => {
  const tr = addRow(widget)
  const boldFont = Font.boldSystemFont(preference.fontSize)

  const d1 = tr.addStack()
  d1.size = new Size(-1, preference.fontSize * 2.4)
  d1.centerAlignContent()
  const stackIndex = d1.addStack()
  stackIndex.size = new Size(preference.fontSize * 1.3, -1)
  const index = stackIndex.addText(item.nocGoldRank)
  index.textColor = new Color('#8d93a6')
  index.font = boldFont
  d1.addSpacer(3)
  const image = await getFlagImage(item.nocCode, item.nocLogo)
  const flag = d1.addImage(image)
  flag.imageSize = new Size(flagWidth, flagHeight)
  let country
  if (config.widgetFamily !== 'small') {
    d1.addSpacer(4)
    country = d1.addText(item.nocName)
    country.lineLimit = 1
    country.font = Font.systemFont(preference.fontSize)
  }
  d1.addSpacer()
  const g = addText(tr, item.gold)
  g.textColor = new Color('#d9a400')
  g.font = boldFont
  tr.addSpacer(preference.spacing)
  const s = addText(tr, item.silver)
  s.textColor = new Color('#9297b8')
  s.font = boldFont
  tr.addSpacer(preference.spacing)
  const b = addText(tr, item.bronze)
  b.textColor = new Color('#bd7e69')
  b.font = boldFont
  tr.addSpacer(preference.spacing)
  const t = addText(tr, item.total)
  t.font = boldFont
  if (item.nocCode === 'CHN') {
    if (preference.showRowBg) {
      const l = new LinearGradient()
      l.startPoint = new Point(0, 0)
      l.endPoint = new Point(1, 0)
      l.colors = [
        Color.dynamic(new Color('#ff0000', 0.05), new Color('#fff', 0.05)),
        new Color('#fff', 0)
      ]
      l.locations = [0, 1]
      tr.backgroundGradient = l
    }
    const chinaRed = new Color('#ed4646')
    if (config.widgetFamily !== 'small') {
      country.textColor = chinaRed
      country.font = Font.boldSystemFont(preference.fontSize)
    }
    g.textColor = chinaRed
    s.textColor = chinaRed
    b.textColor = chinaRed
    t.textColor = chinaRed
  }
}

const render = async () => {
  flagHeight = preference.fontSize * 1.2
  flagWidth = 100 * (flagHeight / 68)

  const api = 'https://app.sports.qq.com/m/oly/medalsRank?competitionID=180000&disciplineCode=ALL&from=h5'
  const request = new Request(api)
  const res = await request.loadJSON()
  /** @type {any[]} */
  const list = res.data.list

  const widget = new ListWidget()
  widget.setPadding(8, 12, 8, 12)

  if (config.widgetFamily === 'small') {
    preference.spacing = 0
  }

  addTableHead(widget)

  const i = list.findIndex(({ nocCode }) => nocCode === 'CHN')
  const rList = i < preference.rows
    ? list.slice(0, preference.rows)
    : [...list.slice(0, preference.rows - 1), list[i]]
  await Promise.all(rList.map((item, i) => addTableRow(widget, item, i)))

  return widget
}

await withSettings({
  homePage: 'https://github.com/Honye/scriptable-scripts',
  formItems: [
    {
      name: 'rows',
      label: '显示行数',
      type: 'number',
      default: preference.rows
    },
    {
      name: 'fontSize',
      label: '字体大小',
      type: 'number',
      default: preference.fontSize
    },
    {
      name: 'showRowBg',
      label: '中国背景',
      type: 'switch',
      default: preference.showRowBg
    },
    {
      name: 'spacing',
      label: '奖牌列间距',
      type: 'number',
      default: preference.spacing
    },
    {
      name: 'showTime',
      label: '显示时间',
      type: 'switch',
      default: preference.showTime
    }
  ],
  render: async ({ family, settings }) => {
    family && (config.widgetFamily = family)
    Object.assign(preference, settings)
    const widget = await render()
    return widget
  }
})
