if (typeof require === 'undefined') require = importModule
const { addAvatar, useGrid } = require('./widgets.module')
const { phoneSize, useCache, getImage, i18n } = require('./utils.module')
const { hexToRGBA, RGBToHSL, lightenDarkenColor } = require('./color.module')
const { withSettings } = require('./withSettings.module')

let user = 'Honye'
let useOfficial = true
const officialColors = [
  ['#9be9a8', '#0e4429'],
  ['#40c463', '#006d32'],
  ['#30a14e', '#26a641'],
  ['#216e39', '#39d353']
]
const halloweenColors = [
  ['#ffee4a', '#631c03'],
  ['#ffc501', '#bd561d'],
  ['#fe9600', '#fa7a18'],
  ['#03001c', '#fddf68']
]
let themeColor = '#9be9a8'

const gap = { x: 3, y: 2 }

const screen = Device.screenResolution()
const scale = Device.screenScale()
const size = phoneSize(screen.height)
const cache = useCache()

/**
 * @param {string} user
 */
const fetchData = async (user) => {
  const url = `https://www.imarkr.com/api/github/${user}`
  const req = new Request(url)
  let data
  try {
    data = await req.loadJSON()
    cache.writeJSON(`${user}.json`, data)
  } catch (e) {
    data = cache.readJSON(`${user}.json`)
  }
  return data
}

const isHalloween = () => {
  const date = new Date()
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()
  return (month === 10 && day === 31) || (month === 11 && day === 1)
}

const render = async () => {
  if (config.runsInWidget) {
    [user = user] = (args.widgetParameter || '')
      .split(';')
      .map(item => item.trim() || undefined)
  }

  const resp = await fetchData(user)

  const { widgetFamily } = config
  const columns = widgetFamily === 'small' ? 9 : 20
  const widgetWidth = size[widgetFamily === 'large' ? 'medium' : widgetFamily] / scale
  const widgetHeight = size[widgetFamily === 'medium' ? 'small' : widgetFamily] / scale
  let rectWidth = (widgetWidth - 24 - gap.x * (columns - 1)) / columns
  const rectHeight = (widgetHeight - 54 - gap.y * 6) / 7
  rectWidth = Math.min(rectWidth, rectHeight)
  const widget = new ListWidget()
  widget.url = `https://github.com/${user}`

  const {
    avatar,
    contributions,
    contribution_colors: respContributionColors
  } = resp
  /** GitHub 接口返回的主题色 */
  const contributionColors = respContributionColors
    ? respContributionColors.map((hex, index) => [hex, respContributionColors[respContributionColors.length - 1 - index]])
    : null
  const name = resp.name || user
  const countText = `${resp.contributions_count} contributions`
  const latestDate = new Date(contributions.slice(-1)[0].date.replace(/-/g, '/'))
  const sliceCount = columns * 7 - 7 + latestDate.getDay() + 1

  const head = widget.addStack()
  head.layoutHorizontally()
  head.centerAlignContent()

  // avatar
  let image
  try {
    image = await getImage(avatar)
    cache.writeImage(`${user}.jpeg`, image)
  } catch (e) {
    image = cache.readImage(`${user}.jpeg`)
  }
  await addAvatar(head, { image, size: 20 })
  head.addSpacer(3)

  // user name
  const textName = head.addText(name.toUpperCase())
  textName.lineLimit = 1
  textName.minimumScaleFactor = 0.5
  textName.font = Font.boldSystemFont(13)
  textName.textColor = new Color('#aeaeb7', 1)
  head.addSpacer(3)

  // contributions count, would not show on small
  if (widgetFamily !== 'small') {
    const textCount = head.addText(`(${countText})`.toUpperCase())
    textCount.font = Font.systemFont(12)
    textCount.textColor = new Color('#aeaeb7', 1)
  }

  widget.addSpacer(10)

  const gridStack = widget.addStack()
  const { add } = await useGrid(gridStack, {
    direction: 'vertical',
    column: 7,
    gap: [gap.y, gap.x]
  })

  const rgba = hexToRGBA(themeColor)
  const hsl = RGBToHSL(rgba.red, rgba.green, rgba.blue)
  const itemColors = useOfficial
    ? contributionColors || (isHalloween() ? halloweenColors : officialColors)
    : Array(4).fill({}).map((_, index) => lightenDarkenColor(hsl, -index * 18))
  const colors = [['#ebedf0', '#45454a'], ...itemColors]

  const addItem = (stack, level) => {
    const rect = stack.addStack()
    rect.size = new Size(rectWidth, rectWidth)
    rect.cornerRadius = 2
    const color = colors[level]
    rect.backgroundColor =
      Array.isArray(color)
        ? Color.dynamic(new Color(color[0]), new Color(color[1]))
        : new Color(color)
  }

  const length = contributions.length
  for (let i = length - sliceCount; i < length; i++) {
    await add((stack) => addItem(stack, contributions[i].level))
  }
  return widget
}

await withSettings({
  formItems: [
    {
      name: 'user',
      label: i18n(['User name', '用户名']),
      type: 'text',
      default: user
    },
    {
      name: 'useOfficial',
      label: i18n(['Official theme', '使用官方主题']),
      type: 'switch',
      default: useOfficial
    },
    {
      name: 'themeColor',
      label: i18n(['Theme color', '自定义主题色']),
      type: 'color',
      default: themeColor
    }
  ],
  render: async ({ family, settings }) => {
    if (family) {
      config.widgetFamily = family
    }
    user = settings.user || user
    themeColor = settings.themeColor || themeColor
    useOfficial = settings.useOfficial ?? useOfficial
    const widget = await render()
    return widget
  }
})
