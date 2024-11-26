if (typeof require === 'undefined') require = importModule
const { getImage, useCache, vw } = require('./utils.module')

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
  const image = await getImage('http://192.168.0.107:3000/sgcc.png')
  cache.writeImage(filename, image)
  return image
}

/**
 * @param {ListWidget} widget
 */
const addBarChart = (widget, data) => {
  const { sevenEleList } = data.dayElecQuantity31
  /** @type {number[]} */
  const seven = []
  let i = 0
  while (seven.length < 7) {
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
  container.backgroundGradient = gradient
  container.cornerRadius = 6

  container.addSpacer()
  const max = Math.max(...seven)
  const maxHeight = vw(48 * 100 / 155)
  const w = vw(8 * 100 / 155)
  for (let i = 0; i < 7; i++) {
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

  addBarChart(widget, data)

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

const data = await getWidgetData()
const widget = await createWidget(data)
Script.setWidget(widget)
if (config.runsInApp) {
  widget.presentSmall()
}
