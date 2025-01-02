if (typeof require === 'undefined') require = importModule
const { getImage, i18n, useCache, vmin, widgetSize } = require('./utils.module')
const { withSettings } = require('./withSettings.module')
const { useGrid } = require('./widgets.module')
const rpt = (n) => vmin(n * 100 / 155, config.widgetFamily)

const preference = {
  /** @type {'daily'|'monthly'} */
  dimension: 'daily',
  barCount: 7,
  showStepProgress: true,
  oneLevelPq: 2160,
  twoLevelPq: 4800
}

const cache = useCache()
const sizes = widgetSize()
/** @type {Date} */
let respDate

const getData = async () => {
  const url = 'http://api.wsgw-rewrite.com/electricity/bill/all?monthElecQuantity=1&dayElecQuantity31=1&stepElecQuantity=1&eleBill=1'
  const filename = 'data.json'
  const fm = FileManager.local()
  const filePath = fm.joinPath(cache.cacheDirectory, filename)
  const mDate = fm.modificationDate(filePath)
  if (mDate && Date.now() - mDate.getTime() < 14400000) {
    console.log('[INFO] Request too frequent, using local cached data...')
    const data = cache.readJSON(filename)
    respDate = mDate
    return data
  }

  const request = new Request(url)
  let data
  try {
    data = await request.loadJSON()
    cache.writeJSON(filename, data)
    respDate = new Date()
  } catch (e) {
    console.error(e)
    console.log('[INFO] An exception occurred during the request; using cached data...')
    data = cache.readJSON(filename)
    respDate = mDate
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
 * @param {WidgetStack} widget
 */
const addBarChart = (widget, data) => {
  const { barCount, dimension, oneLevelPq, twoLevelPq } = preference
  /** @type {{yearTotal:number;monthElec:number;level:number}[]} */
  const monthlyData = []
  /** @type {{ value: number; level: number }[]} */
  let seven = []
  const { mothEleList = [] } = data.monthElecQuantity
  let yearTotal = 0
  for (const { monthEleNum } of mothEleList) {
    const n = Number(monthEleNum)
    yearTotal += n
    const level = yearTotal > Number(twoLevelPq) ? 3 : yearTotal > Number(oneLevelPq) ? 2 : 1
    monthlyData.push({ yearTotal, monthElec: n, level })
    if (dimension === 'monthly') {
      seven.push({ value: n, level })
    }
  }
  if (dimension === 'daily') {
    const { sevenEleList } = data.dayElecQuantity31
    for (const { day, dayElePq } of sevenEleList) {
      if (dayElePq && !Number.isNaN(Number(dayElePq))) {
        let [, year, month] = day.match(/^(\d{4})(\d{2})/)
        year = Number(year)
        month = Number(month)
        // 非今年数据默认阶梯为 1
        let level = 1
        if (new Date().getFullYear() === year) {
          const safeIndex = Math.max(
            0,
            Math.min(monthlyData.length - 1, month > monthlyData.length ? monthlyData.length - 1 : month - 1)
          )
          level = monthlyData[safeIndex].level
        }
        seven.unshift({ value: Number(dayElePq), level })
      }
    }
  }

  seven = seven.slice(-barCount)
  const container = widget.addStack()
  const height = config.widgetFamily === 'medium' ? rpt(40) : rpt(68)
  container.size = new Size(-1, height)
  const vp = config.widgetFamily === 'medium' ? rpt(4) : rpt(10)
  const px = config.widgetFamily === 'medium' ? 0 : rpt(8)
  container.setPadding(vp, px, vp, px)
  container.layoutHorizontally()
  container.bottomAlignContent()

  const gap = config.widgetFamily === 'medium' ? rpt(6) : undefined
  const max = Math.max(...seven.map(({ value }) => value))
  const maxHeight = height - vp * 2
  const w = config.widgetFamily === 'medium' ? rpt(6) : rpt(8)
  for (const [i, { value, level }] of seven.entries()) {
    const day = container.addStack()
    day.size = new Size(w, value / max * maxHeight)
    day.cornerRadius = w / 2
    const gradient = new LinearGradient()
    gradient.locations = [0, 1]
    const colors = [
      [new Color('#81CDC7'), new Color('#00706B')], // level 1
      [new Color('#FFEE8C'), new Color('#E8C70B')], // level 2
      [new Color('#FCBF94'), new Color('#D0580D')] // level 3
    ]
    gradient.colors = colors[level - 1]
    gradient.startPoint = new Point(0, 0)
    gradient.endPoint = new Point(0, 1)
    day.backgroundGradient = gradient
    if (i < seven.length - 1) {
      container.addSpacer(gap)
    }
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
  let totalYearPq = 0
  if (data.stepElecQuantity?.[0]) {
    const [{ electricParticulars }] = data.stepElecQuantity
    totalYearPq = electricParticulars.totalYearPq
  }

  const stack = container.addStack()
  stack.size = new Size(-1, rpt(4))
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
    colors.splice(4 + 2, 0, twoLevelColor, twoLevelColor)
    const per = Math.min(totalYearPq / twoLevelPq, 1) * 0.32
    locations.splice(
      5 + 2, 0,
      0.34 + per, 0.34 + per
    )
  }
  if (level > 2) {
    colors.splice(8 + 2 * 2, 0, threeLevelColor, threeLevelColor)
    const per = Math.min(totalYearPq / (twoLevelPq + twoLevelPq - oneLevelPq), 1) * 0.32
    locations.splice(
      9 + 2 * 2, 0,
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

/**
 * @param {WidgetStack} stack
 * @param {object} data
 * @param {string} data.label
 * @param {number} data.value
 */
const addLabelValue = (stack, { label, value }) => {
  const c = stack.addStack()
  c.layoutVertically()
  c.addStack().addSpacer()
  c.backgroundColor = Color.dynamic(new Color('#00706B', 0.05), new Color('#04605B', 0.15))
  c.cornerRadius = rpt(6)
  c.setPadding(rpt(6), rpt(12), rpt(6), rpt(12))
  const title = c.addText(label)
  title.font = Font.systemFont(rpt(8))
  title.textColor = Color.dynamic(new Color('#18231C', 0.7), new Color('#FFFFFF', 0.7))
  const number = c.addText(`${value}`)
  number.font = Font.boldRoundedSystemFont(14)
  number.textColor = Color.dynamic(new Color('#18231C'), new Color('#FFFFFF'))
}

/**
 * @param {WidgetStack} stack
 */
const addMediumSteps = (stack, data, { width }) => {
  const { oneLevelPq, twoLevelPq } = preference
  let totalYearPq = 0
  if (data.stepElecQuantity?.[0]) {
    const [{ electricParticulars }] = data.stepElecQuantity
    totalYearPq = electricParticulars.totalYearPq
  }

  const c = stack.addStack()
  c.layoutVertically()
  c.backgroundColor = Color.dynamic(new Color('#00706B', 0.05), new Color('#04605B', 0.15))
  c.cornerRadius = rpt(6)
  const paddingX = rpt(12)
  c.setPadding(rpt(6), paddingX, rpt(6), paddingX)
  c.addStack().addSpacer()

  const level = totalYearPq > twoLevelPq ? 3 : totalYearPq > oneLevelPq ? 2 : 1
  let percent = totalYearPq / [oneLevelPq, twoLevelPq, twoLevelPq + twoLevelPq - oneLevelPq][level - 1]
  percent = Math.min(percent, 1)
  const head = c.addStack()
  const title = head.addText(`第${['一', '二', '三'][level - 1]}梯度：${Number((percent * 100).toFixed(2))}%`)
  title.font = Font.systemFont(rpt(8))
  title.textColor = Color.dynamic(new Color('#18231C', 0.7), new Color('#FFFFFF', 0.7))
  head.addSpacer()
  const time = head.addStack()
  time.centerAlignContent()
  const clock = time.addImage(SFSymbol.named('clock.arrow.circlepath').image)
  clock.tintColor = Color.dynamic(new Color('#18231C', 0.7), new Color('#FFFFFF', 0.7))
  clock.imageSize = new Size(rpt(8), rpt(8))
  const df = new DateFormatter()
  df.locale = 'zh-CN'
  df.dateFormat = 'HH:mm'
  const timeText = time.addText(` ${df.string(respDate)}`)
  timeText.font = Font.systemFont(rpt(8))
  timeText.textColor = Color.dynamic(new Color('#18231C', 0.7), new Color('#FFFFFF', 0.7))

  c.addSpacer(rpt(4))
  const p = c.addStack()
  const barGap = rpt(2)
  const t = Math.floor((width - paddingX * 2 + barGap) / (2 + barGap))
  /** one step bar counts */
  const n = Math.floor(t / 3)
  const colors = [
    Color.dynamic(new Color('#00706B'), new Color('#04605B')), // level 1
    Color.dynamic(new Color('#E8C70B'), new Color('#CBAD02')), // level 2
    Color.dynamic(new Color('#D0580D'), new Color('#D0580D')) // level 3
  ]
  const bgColors = [
    Color.dynamic(new Color('#00706B', 0.1), new Color('#04605B', 0.1)), // level 1
    Color.dynamic(new Color('#E8C70B', 0.1), new Color('#CBAD02', 0.1)), // level 2
    Color.dynamic(new Color('#D0580D', 0.1), new Color('#D0580D', 0.1)) // level 3
  ]
  for (let i = 0; i < n * 3; i++) {
    const bar = p.addStack()
    bar.layoutVertically()
    bar.addSpacer()
    bar.size = new Size(2, -1)
    const end = Math.floor(n * level * percent)
    bar.backgroundColor = (i > end ? bgColors : colors)[Math.floor(i / n)]
    bar.cornerRadius = 1
    if (i < n * 3 - 1) {
      p.addSpacer(barGap)
    }
  }
}

const createMediumWidget = async () => {
  const { barCount } = preference
  const data = await getWidgetData()
  const widget = new ListWidget()
  const widgetPadding = rpt(12)
  widget.setPadding(widgetPadding, widgetPadding, widgetPadding, widgetPadding)
  const widgetGradient = new LinearGradient()
  widgetGradient.colors = [
    Color.dynamic(new Color('#00706B', 0.18), new Color('#00706B', 0)),
    new Color('#00706B', 0)
  ]
  widgetGradient.locations = [0, 0.35]
  widgetGradient.startPoint = new Point(0, 0)
  widgetGradient.endPoint = new Point(sizes.small / sizes.medium, 1)
  widget.backgroundGradient = widgetGradient

  const container = widget.addStack()
  container.layoutHorizontally()

  const lpx = rpt(4)
  const barItemWith = rpt(6)
  const barGap = rpt(6)
  const leftWidth = Math.max(barCount, 7) * (barItemWith + barGap) - barGap + lpx * 2
  const left = container.addStack()
  left.size = new Size(leftWidth, -1)
  left.layoutVertically()
  const gradient = new LinearGradient()
  gradient.locations = [0, 1]
  gradient.colors = [
    new Color('#00706B', 0),
    Color.dynamic(new Color('#00706B', 0.05), new Color('#04605B', 0.15))
  ]
  gradient.startPoint = new Point(0, 0.4)
  gradient.endPoint = new Point(0, 1)
  left.backgroundGradient = gradient
  left.cornerRadius = rpt(6)
  left.setPadding(0, lpx, 0, lpx)

  const logo = left.addImage(await getLogo())
  const lw = rpt(24)
  logo.imageSize = new Size(lw, lw)

  left.addSpacer(rpt(12))
  const label = left.addText(!data.arrearsOfFees ? '剩余电费' : '待缴电费')
  label.font = Font.systemFont(rpt(10))
  label.textColor = Color.dynamic(new Color('#18231C', 0.7), new Color('#FFFFFF', 0.7))
  const number = left.addText(`${data.eleBill.sumMoney}`)
  number.minimumScaleFactor = 0.5
  number.font = Font.boldRoundedSystemFont(rpt(18))
  number.textColor = Color.dynamic(new Color('#18231C'), new Color('#FFFFFF'))

  left.addSpacer()
  addBarChart(left, data)

  const lrGap = rpt(12)
  container.addSpacer(lrGap)
  const right = container.addStack()
  right.layoutVertically()
  const { add } = await useGrid(right, {
    column: 2,
    gap: [rpt(8), rpt(6)]
  })
  await add((stack) => addLabelValue(stack, {
    label: '上期电费',
    value: data.stepElecQuantity?.[0].electricParticulars.totalAmount || '0.00'
  }))
  await add((stack) => addLabelValue(stack, {
    label: '上期电量',
    value: data.stepElecQuantity?.[0].electricParticulars.totalPq || '0.00'
  }))
  await add((stack) => addLabelValue(stack, {
    label: '年度电费',
    value: data.monthElecQuantity.dataInfo?.totalEleCost || 0
  }))
  await add((stack) => addLabelValue(stack, {
    label: '年度电量',
    value: data.monthElecQuantity.dataInfo?.totalEleNum || 0
  }))
  right.addSpacer(rpt(6))
  addMediumSteps(right, data, { width: sizes.medium - widgetPadding * 2 - leftWidth - lrGap })
  return widget
}

const createWidget = async () => {
  if (config.widgetFamily === 'medium') {
    const widget = await createMediumWidget()
    return widget
  }

  const data = await getWidgetData()
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
  let totalAmount = 0
  if (data.stepElecQuantity?.[0]) {
    const { electricParticulars } = data.stepElecQuantity[0]
    totalAmount = electricParticulars.totalAmount
  }
  const l = bottom.addText(`余额${totalAmount ? `(上期:${totalAmount})` : ''}`)
  l.font = Font.systemFont(rpt(12))
  l.textColor = Color.dynamic(new Color('#18231C', 0.7), new Color('#ffffff', 0.7))
  const w = bottom.addStack()
  w.centerAlignContent()
  const p = w.addText(`${data.eleBill.sumMoney}`)
  p.font = Font.boldRoundedSystemFont(rpt(24))
  p.textColor = Color.dynamic(new Color('#18231C'), new Color('#ffffff'))
  w.addSpacer()
  const logo = w.addImage(await getLogo())
  const lw = rpt(24)
  logo.imageSize = new Size(lw, lw)
  return widget
}

await withSettings({
  formItems: [
    {
      label: i18n(['Daily or monthly', '每日或每月']),
      name: 'dimension',
      type: 'select',
      options: [
        { label: i18n(['Daily', '每日']), value: 'daily' },
        { label: i18n(['Monthly', '每月']), value: 'monthly' }
      ],
      default: preference.dimension
    },
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
    const widget = await createWidget()
    return widget
  }
})
