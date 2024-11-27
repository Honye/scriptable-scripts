if (typeof require === 'undefined') require = importModule
const { getImage, i18n, useCache, vmin } = require('./utils.module')
const { withSettings } = require('./withSettings.module')
const vw = (n) => vmin(n, config.widgetFamily)

const preference = {
  barCount: 7,
  showStepProgress: true,
  oneLevelPq: 2160,
  twoLevelPq: 4800
}

const cache = useCache()

const getData = async () => {
  const url = 'http://api.wsgw-rewrite.com/electricity/bill/all'
  const filename = 'data.json'
  const request = new Request(url)
  let data
  try {
    data = await request.loadJSON()
    cache.writeJSON(filename, data)
  } catch (e) {
    console.error(e)
    console.log('[INFO] An exception occurred during the request; using cached data...')
    data = cache.readJSON(filename)
  }
  return data
}

const getWidgetData = async () => {
  const [i] = (args.widgetParameter || '')
    .split(';')
    .map((item) => item.trim() || undefined)
  const index = Number(i || 0)
  const data = await getData()
  return data[index]
}

const getLogo = async () => {
  const filename = 'logo.png'
  const cached = cache.readImage(filename)
  if (cached) return cached
  const image = await getImage('https://raw.githubusercontent.com/Honye/scriptable-scripts/refs/heads/master/static/sgcc.png')
  cache.writeImage(filename, image)
  return image
}

/**
 * @param {ListWidget} widget
 */
const addBarChart = (widget, data) => {
  const { barCount } = preference
  const { sevenEleList } = data.dayElecQuantity31
  /** @type {number[]} */
  const seven = []
  let i = 0
  while (seven.length < barCount && i < sevenEleList.length) {
    const { dayElePq } = sevenEleList[i]
    if (dayElePq && !Number.isNaN(Number(dayElePq))) {
      seven.unshift(Number(dayElePq))
    }
    i++
  }

  const container = widget.addStack()
  container.size = new Size(-1, vw(68 * 100 / 155))
  const vp = vw(10 * 100 / 155)
  container.setPadding(vp, 0, vp, 0)
  container.layoutHorizontally()
  container.bottomAlignContent()

  container.addSpacer()
  const max = Math.max(...seven)
  const maxHeight = vw(48 * 100 / 155)
  const w = vw(8 * 100 / 155)
  for (let i = 0; i < seven.length; i++) {
    const day = container.addStack()
    day.size = new Size(w, seven[i] / max * maxHeight)
    day.cornerRadius = w / 2
    day.backgroundColor = Color.red()
    const gradient = new LinearGradient()
    gradient.locations = [0, 1]
    gradient.colors = [
      new Color('#81CDC7'),
      new Color('#00706B')
    ]
    gradient.startPoint = new Point(0, 0)
    gradient.endPoint = new Point(0, 1)
    day.backgroundGradient = gradient
    container.addSpacer()
  }
}

/**
 * @param {WidgetStack} container
 */
const addStepProgress = (container, data) => {
  const { oneLevelPq, twoLevelPq } = preference
  const oneLevelColor = new Color('#00706B')
  const oneLevelBg = new Color(oneLevelColor.hex, 0.1)
  const twoLevelColor = new Color('#E8C70B')
  const twoLevelBg = new Color(twoLevelColor.hex, 0.1)
  const threeLevelColor = new Color('#D0580D')
  const threeLevelBg = new Color(threeLevelColor.hex, 0.1)
  const transparent = new Color('#000000', 0)
  const [{ electricParticulars }] = data.stepElecQuantity
  const { totalYearPq } = electricParticulars

  const stack = container.addStack()
  stack.size = new Size(-1, vw(4 * 100 / 155))
  stack.addSpacer()
  const gradient = new LinearGradient()
  const colors = [
    oneLevelBg, oneLevelBg, // 0~0.32
    transparent, transparent, // 0.32~0.34
    twoLevelBg, twoLevelBg, // 0.34~0.66
    transparent, transparent, // 0.66~0.68
    threeLevelBg, threeLevelBg // 0.68~1
  ]
  const locations = [
    0, 0.32,
    0.32, 0.34,
    0.34, 0.66,
    0.66, 0.68,
    0.68, 1
  ]
  gradient.startPoint = new Point(0, 0)
  gradient.endPoint = new Point(1, 0)
  const level = totalYearPq > twoLevelPq ? 3 : totalYearPq > oneLevelPq ? 2 : 1
  if (level > 0) {
    colors.splice(
      0, 0,
      oneLevelColor, oneLevelColor
    )
    const per = Math.min(totalYearPq / oneLevelPq, 1) * 0.32
    locations.splice(
      1, 0,
      per, per
    )
  }
  if (level > 1) {
    colors.splice(4, 0, twoLevelColor, twoLevelColor)
    const per = Math.min(totalYearPq / twoLevelPq, 1) * 0.32
    locations.splice(
      5, 0,
      0.34 + per, 0.34 + per
    )
  }
  if (level > 2) {
    colors.splice(8, 0, threeLevelColor, threeLevelColor)
    const per = Math.min(totalYearPq / (twoLevelPq + twoLevelPq - oneLevelPq), 1) * 0.32
    locations.splice(
      9, 0,
      0.68 + per, 0.68 + per
    )
  }
  gradient.colors = colors
  gradient.locations = locations
  stack.backgroundGradient = gradient
}

const addBarAndStep = (widget, data) => {
  const container = widget.addStack()
  container.layoutVertically()
  const gradient = new LinearGradient()
  gradient.locations = [0, 1]
  gradient.colors = [
    new Color('#00706B', 0),
    Color.dynamic(
      new Color('#00706B', 0.05),
      new Color('#04605B', 0.15)
    )
  ]
  gradient.startPoint = new Point(0, 0)
  gradient.endPoint = new Point(0, 1)
  container.cornerRadius = 6
  container.backgroundGradient = gradient
  addBarChart(container, data)
  addStepProgress(container, data)
}

const createWidget = async (data) => {
  const widget = new ListWidget()
  widget.setPadding(12, 12, 12, 12)
  widget.backgroundColor = Color.dynamic(
    new Color('#ffffff'),
    new Color('#171A18')
  )
  const gradient = new LinearGradient()
  gradient.colors = [
    new Color('#00706B', 0),
    Color.dynamic(new Color('#00706B', 0.18), new Color('#00706B', 0))
  ]
  gradient.locations = [0.65, 1]
  gradient.startPoint = new Point(0, 0)
  gradient.endPoint = new Point(1, 1)
  widget.backgroundGradient = gradient

  addBarAndStep(widget, data)

  widget.addSpacer()
  const bottom = widget.addStack()
  bottom.layoutVertically()
  const l = bottom.addText('剩余电费')
  l.font = Font.systemFont(vw(12 * 100 / 155))
  l.textColor = Color.dynamic(new Color('#18231C', 0.7), new Color('#ffffff', 0.7))
  const w = bottom.addStack()
  w.centerAlignContent()
  const p = w.addText(`${data.eleBill.sumMoney}`)
  p.font = Font.boldRoundedSystemFont(vw(24 * 100 / 155))
  p.textColor = Color.dynamic(new Color('#18231C'), new Color('#ffffff'))
  w.addSpacer()
  const logo = w.addImage(await getLogo())
  const lw = vw(24 * 100 / 155)
  logo.imageSize = new Size(lw, lw)
  return widget
}

await withSettings({
  formItems: [
    {
      label: i18n(['Bar count', '柱状图数量']),
      name: 'barCount',
      type: 'number',
      default: preference.barCount
    },
    {
      label: i18n(['Show tiered progress', '显示阶梯进度']),
      name: 'showStepProgress',
      type: 'switch',
      default: preference.showStepProgress
    },
    {
      label: i18n(['First level cap', '第一阶梯上限']),
      name: 'oneLevelPq',
      type: 'number',
      default: preference.oneLevelPq
    },
    {
      label: i18n(['Second level cap', '第二阶梯上限']),
      name: 'twoLevelPq',
      type: 'number',
      default: preference.twoLevelPq
    }
  ],
  render: async ({ family, settings }) => {
    family && (config.widgetFamily = family)
    Object.assign(preference, settings)
    const data = await getWidgetData()
    const widget = await createWidget(data)
    return widget
  }
})
