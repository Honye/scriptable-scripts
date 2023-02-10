if (typeof require === 'undefined') require = importModule
const { withSettings } = require('./withSettings.module')
const { getImage, i18n, phoneSize, useCache, hashCode } = require('./utils.module')

const preference = {
  /** 星座 */
  constellation: 'Aries',
  borderWidth: 6,
  borderColor: '',
  cornerRadius: 16,
  backgroundColorLight: '#f9f9f9',
  backgroundColorDark: '#242426',
  backgroundImage: '',
  textColorLight: '#333333',
  textColorDark: '#ffffff',
  iconColor: '#facb19',
  iconName: 'star.fill',
  fontSize: 10
}
const contentPadding = 8
const fm = FileManager.local()
const cache = useCache()
const constellations = new Map([
  ['Aries', {
    name: '️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️白羊座',
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/1.png',
    range: '03/21 - 04/19'
  }],
  ['Taurus', {
    name: '金牛座',
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/2.png',
    range: '04/20 - 05/20'
  }],
  ['Gemini', {
    name: '双子座',
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/3.png',
    range: '05/21 - 06/21'
  }],
  ['Cancer', {
    name: '巨蟹座',
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/4.png',
    range: '06/22 - 07/22'
  }],
  ['Leo', {
    name: '狮子座',
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/5.png',
    range: '07/23 - 08/22'
  }],
  ['Virgo', {
    name: '处女座',
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/6.png',
    range: '08/23 - 09/22'
  }],
  ['Libra', {
    name: '天秤座',
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/7.png',
    range: '09/23 - 10/23'
  }],
  ['Scorpio', {
    name: '天蝎座',
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/8.png',
    range: '10/24 - 11/22'
  }],
  ['Sagittarius', {
    name: '射手座',
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/9.png',
    range: '11/23 - 12/21'
  }],
  ['Capricorn', {
    name: '魔羯座',
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/10.png',
    range: '12/22 - 01/19'
  }],
  ['Aquarius', {
    name: '水瓶座',
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/11.png',
    range: '01/20 - 02/18'
  }],
  ['Pisces', {
    name: '双鱼座',
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/12.png',
    range: '02/19 - 03/20'
  }]
])
const constellationOptions = (() => {
  const options = []
  for (const [key, { name, range }] of constellations.entries()) {
    options.push({
      label: `${i18n([key, name])}（${range}）`,
      value: key
    })
  }
  return options
})()

/**
 * @param {string} constellation 星座
 */
const getData = async (constellation) => {
  const request = new Request(`https://interface.sina.cn/ast/get_app_fate.d.json?type=astro&class=${constellation}`)
  const date = new Date()
  const today = date.toLocaleDateString('zh-CN').replace(/\//g, '-')
  date.setDate(-1)
  const yesterday = date.toLocaleDateString('zh-CN').replace(/\//g, '-')
  const fm = FileManager.local()
  const ypath = fm.joinPath(cache.cacheDirectory, `${constellation}-${yesterday}.json`)
  if (fm.fileExists(ypath)) {
    fm.remove(ypath)
  }
  const fileName = `${constellation}-${today}.json`
  const tpath = fm.joinPath(cache.cacheDirectory, fileName)
  if (fm.fileExists(tpath)) {
    const data = cache.readJSON(fileName)
    return data
  }

  const { result } = await request.loadJSON()
  const { status, data } = result
  if (status.code === 0) {
    cache.writeJSON(fileName, data)
    return data
  }
  return Promise.reject(status)
}

const getWidgetSize = () => {
  const widgetRect = phoneSize()
  const scale = Device.screenScale()
  const family = config.widgetFamily
  const width = widgetRect[family === 'large' ? 'medium' : family] / scale
  const height = widgetRect[family === 'medium' ? 'small' : family] / scale
  return { width, height }
}

const getAvatarBg = (color) => {
  const context = new DrawContext()
  context.size = new Size(50, 50)
  context.opaque = false
  context.setFillColor(new Color(color, 0.6))
  context.fillEllipse(new Rect(3, 3, 44, 44))
  return context.getImage()
}

const getImg = async (url) => {
  const hash = `${hashCode(url)}`
  try {
    const image = cache.readImage(hash)
    if (image) {
      return image
    }
    throw new Error('No cache')
  } catch (err) {
    const image = await getImage(url)
    cache.writeImage(hash, image)
    return image
  }
}

/**
 * @param {WidgetStack} container
 * @param {object} options
 * @param {number} options.width
 * @param {Color} options.color
 */
const addAvatar = async (container, { width, color }) => {
  const constellation = constellations.get(preference.constellation)
  const avatar = container.addStack()
  const size = new Size(...Array(2).fill(width))
  avatar.size = size
  avatar.backgroundImage = getAvatarBg(color)
  const img = avatar.addImage(await getImg(constellation.image))
  img.imageSize = size
}

/**
 * @param {WidgetStack} container
 * @param {object} options
 * @param {Color} options.color
 */
const addHead = async (container, { color }) => {
  const { textColorLight, textColorDark, fontSize } = preference
  const constellation = constellations.get(preference.constellation)
  const stack = container.addStack()
  stack.size = new Size(-1, fontSize * 3.2)
  stack.centerAlignContent()
  await addAvatar(stack, { width: fontSize * 3.2, color })
  stack.addSpacer(8)
  const info = stack.addStack()
  info.layoutVertically()
  const title = info.addText(constellation.name)
  title.font = Font.systemFont(fontSize * 1.2)
  title.textColor = Color.dynamic(new Color(textColorLight), new Color(textColorDark))
  const df = new DateFormatter()
  df.dateFormat = 'yyyy-MM-dd'
  const date = info.addText(df.string(new Date()))
  date.font = Font.systemFont(fontSize * 0.85)
  date.textColor = Color.dynamic(
    new Color(textColorLight, 0.8),
    new Color(textColorDark, 0.8)
  )
}

/**
 * @param {WidgetStack} container
 * @param {object} options
 * @param {Size} options.size
 * @param {string} options.value
 */
const addStars = (container, { value, size }) => {
  const { iconName, iconColor } = preference
  const stack = container.addStack()
  stack.centerAlignContent()
  for (let i = 0; i < 5; i++) {
    const sfs = SFSymbol.named(iconName)
    const star = stack.addImage(sfs.image)
    star.tintColor = i < value ? new Color(iconColor) : Color.lightGray()
    star.imageSize = size
  }
}

/**
 * 百分比转为5星比
 * @param {string} percent 带%的百分比
 */
const percent2Stars = (percent) => {
  const v = Number(percent.replace(/%$/, ''))
  // 至少1星
  const n = Math.max(Math.round(v / 100 * 5), 1)
  return n
}

/**
 * @param {WidgetStack} container
 * @param {{ name: string; value: string }} data
 */
const addItem = (container, data) => {
  const { textColorLight, textColorDark, fontSize } = preference
  const iconSize = fontSize + 3
  const height = iconSize
  const stack = container.addStack()
  stack.size = new Size(-1, height)
  stack.centerAlignContent()
  stack.spacing = 6
  const label = stack.addText(data.name)
  label.font = Font.systemFont(fontSize)
  label.textColor = Color.dynamic(
    new Color(textColorLight, 0.8),
    new Color(textColorDark, 0.8)
  )
  const matches = data.value.match(/(\d+)%$/)
  if (matches) {
    // if: 百分比使用五星
    const n = percent2Stars(data.value)
    addStars(stack, {
      value: n,
      size: new Size(iconSize, iconSize)
    })
  } else {
    const text = stack.addText(data.value)
    text.font = Font.systemFont(fontSize)
    text.textColor = Color.dynamic(new Color(textColorLight), new Color(textColorDark))
  }
}

/**
 * @param {WidgetStack} container
 * @param {{new_list:{name:string;value:string}[]}} data
 */
const addSmallContent = async (container, { new_list: data }) => {
  const { borderColor, fontSize } = preference
  const lucky = data.find((item) => item.name === '幸运颜色')

  container.layoutVertically()
  const { height } = container.size
  let gap = (height - contentPadding * 2 - fontSize * 3 - (fontSize + 3) * 5 - 2) / 5
  console.log(`[info] max gap size: ${gap}`)
  gap = Math.min(gap, contentPadding)
  console.log(`[info] actual gap size: ${gap}`)
  await addHead(container, { color: borderColor || lucky.bg_color_value })
  container.addSpacer(2)
  container.addSpacer(gap)
  addItem(container, data.find((item) => item.name === '工作指数'))
  container.addSpacer(gap)
  addItem(container, data.find((item) => item.name === '财运指数'))
  container.addSpacer(gap)
  addItem(container, data.find((item) => item.name === '爱情指数'))
  container.addSpacer(gap)
  // 幸运颜色
  addItem(container, lucky)
  container.addSpacer(gap)
  addItem(container, data.find((item) => item.name === '幸运数字'))
}

/**
 * @param {WidgetStack} container
 */
const addMediumContent = async (container, data, { padding } = { padding: contentPadding }) => {
  const { new_list: newList } = data
  const { borderColor, textColorLight, textColorDark, fontSize } = preference
  const { height } = container.size
  const iconSize = fontSize + 3
  const constellation = constellations.get(preference.constellation)
  const lucky = newList.find((item) => item.name === '幸运颜色')
  const textColor = Color.dynamic(new Color(textColorLight), new Color(textColorDark))
  const leftStack = container.addStack()
  leftStack.layoutVertically()

  const headStack = leftStack.addStack()
  headStack.centerAlignContent()
  headStack.spacing = 6
  await addAvatar(headStack, { width: fontSize * 3.2, color: borderColor || lucky.bg_color_value })

  const hrStack = headStack.addStack()
  hrStack.layoutVertically()
  hrStack.centerAlignContent()
  const htStack = hrStack.addStack()
  htStack.topAlignContent()
  htStack.spacing = 4
  const hbStack = hrStack.addStack()
  hbStack.bottomAlignContent()
  hbStack.spacing = 4

  const rangeTextSize = fontSize * 0.8
  const rangeWidth = rangeTextSize * 6
  const nameStack = htStack.addStack()
  nameStack.layoutVertically()
  nameStack.topAlignContent()
  nameStack.size = new Size(rangeWidth, -1)
  const nameText = nameStack.addText(constellation.name)
  nameText.leftAlignText()
  nameText.font = Font.systemFont(fontSize * 1.2)
  nameText.textColor = textColor

  const rangeStack = hbStack.addStack()
  rangeStack.bottomAlignContent()
  rangeStack.size = new Size(rangeWidth, -1)
  const rangeText = rangeStack.addText(
    constellation.range.replace(/\//g, '.').replace(/\s/g, '')
  )
  rangeText.leftAlignText()
  rangeText.font = Font.systemFont(rangeTextSize)
  rangeText.textColor = textColor
  rangeText.lineLimit = 1
  rangeText.minimumScaleFactor = 0.6

  const df = new DateFormatter()
  df.dateFormat = 'MM月dd日'
  const dateText = htStack.addText(df.string(new Date()))
  dateText.font = Font.systemFont(fontSize * 1.2)
  dateText.textColor = textColor
  hrStack.addSpacer(2)

  const summary = newList.find((item) => item.name === '今日幸运值')
  const n = percent2Stars(summary.value)
  addStars(hbStack, { size: new Size(iconSize, iconSize), value: n })

  leftStack.addSpacer(10)
  const contentText = leftStack.addText(data.new_content)
  contentText.font = Font.systemFont(fontSize * 1.1)
  contentText.minimumScaleFactor = 0.8
  contentText.textColor = Color.dynamic(
    new Color(textColorLight, 0.9),
    new Color(textColorDark, 0.9)
  )

  container.addSpacer(6)
  const lineStack = container.addStack()
  lineStack.layoutVertically()
  lineStack.size = new Size(0.5, -1)
  lineStack.addSpacer()
  lineStack.backgroundColor = new Color(Color.lightGray().hex, 0.2)
  container.addSpacer(6)

  const rightStack = container.addStack()
  rightStack.layoutVertically()
  let gap = (height - padding * 2 - iconSize * 7) / 6
  console.log(`[info] max gap size: ${gap}`)
  gap = Math.min(gap, contentPadding)
  console.log(`[info] actual gap size: ${gap}`)
  addItem(rightStack, newList.find((item) => item.name === '爱情指数'))
  rightStack.addSpacer(gap)
  addItem(rightStack, newList.find((item) => item.name === '工作指数'))
  rightStack.addSpacer(gap)
  addItem(rightStack, newList.find((item) => item.name === '财运指数'))
  rightStack.addSpacer(gap)
  addItem(rightStack, newList.find((item) => item.name === '健康指数'))
  rightStack.addSpacer(gap)
  addItem(rightStack, newList.find((item) => item.name === '幸运数字'))
  rightStack.addSpacer(gap)
  addItem(rightStack, newList.find((item) => item.name === '幸运颜色'))
  rightStack.addSpacer(gap)
  addItem(rightStack, newList.find((item) => item.name === '贵人星座'))
}

const addLargeContent = async (container, data) => {
  const { fontSize } = preference
  const { width, height } = container.size
  container.layoutVertically()
  const topStack = container.addStack()
  const topHeight = (fontSize + 3) * 7 + 6 * 6
  topStack.size = new Size(-1, topHeight)
  await addMediumContent(topStack, data, { padding: 0 })

  const gap = 14
  container.addSpacer(gap)
  await addChart(
    container,
    data.chart,
    {
      size: new Size(width - contentPadding * 2, height - contentPadding * 2 - topHeight - gap)
    }
  )
}

/**
 * @param {WidgetStack} container
 */
const addChart = async (container, chartData, { size }) => {
  const { constellation } = preference
  const { xAxis, series } = chartData
  const labels = JSON.stringify(xAxis.data)
  const colors = [
    'rgb(91, 0, 255)',
    'rgb(255, 135, 189)',
    'rgb(49, 146, 241)',
    'rgb(255, 206, 114)',
    'rgb(80, 227, 194)'
  ]
  const datasets = series.map((item, i) => ({
    label: item.name,
    fill: false,
    borderColor: colors[i],
    backgroundColor: colors[i].replace(/^rgb/, 'rgba').replace(/\)$/, ', 0.5)'),
    data: item.data
  }))

  const stack = container.addStack()
  const options = `{
    type: 'line',
    data: {
      labels: ${labels},
      datasets: ${JSON.stringify(datasets)}
    },
    options: {
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: {
            callback: (val, i) => {
              const text = ['', '很差', '一般', '平平', '好运', '很棒']
              const t = text[i / 2]
              if (t) {
                return t
              }
              return val + '%'
            }
          }
        }
      }
    }
  }`
  const date = new Date()
  const today = date.toLocaleDateString('zh-CN').replace(/\//g, '-')
  date.setDate(-1)
  const yesterday = date.toLocaleDateString('zh-CN').replace(/\//g, '-')
  const fm = FileManager.local()
  const ypath = fm.joinPath(cache.cacheDirectory, `${constellation}-${yesterday}`)
  if (fm.fileExists(ypath)) {
    fm.remove(ypath)
  }
  const fileName = `${constellation}-${today}`
  const tpath = fm.joinPath(cache.cacheDirectory, fileName)
  let img
  if (fm.fileExists(tpath)) {
    img = cache.readImage(fileName)
  } else {
    img = await getImage(`https://quickchart.io/chart?v=4&c=${encodeURIComponent(options)}`)
    cache.writeImage(fileName, img)
  }
  const image = stack.addImage(img)
  image.imageSize = size
}

const createWidget = async () => {
  const {
    constellation,
    borderColor,
    borderWidth,
    cornerRadius,
    backgroundColorLight,
    backgroundColorDark,
    backgroundImage
  } = preference

  const data = await getData(constellation)
  const { new_list: newList } = data.today
  const family = config.widgetFamily
  const widget = new ListWidget()
  widget.setPadding(...Array(4).fill(0))
  const lucky = newList.find((item) => item.name === '幸运颜色')
  widget.backgroundColor = new Color(borderColor || lucky.bg_color_value)

  const widgetSize = getWidgetSize()
  const container = widget.addStack()
  container.size = new Size(
    widgetSize.width - borderWidth * 2,
    widgetSize.height - borderWidth * 2
  )
  container.setPadding(...Array(4).fill(contentPadding))
  container.cornerRadius = cornerRadius
  container.backgroundColor = Color.dynamic(
    new Color(backgroundColorLight),
    new Color(backgroundColorDark)
  )
  if (backgroundImage && fm.fileExists(backgroundImage)) {
    container.backgroundColor = undefined
  }
  if (family === 'small') {
    await addSmallContent(container, data.today)
  } else if (family === 'medium') {
    await addMediumContent(container, data.today)
  } else {
    await addLargeContent(container, data.today)
  }
  return widget
}

await withSettings({
  formItems: [
    {
      label: i18n(['Constellation', '星座']),
      name: 'constellation',
      type: 'select',
      options: constellationOptions,
      default: preference.constellation
    },
    {
      label: i18n(['Border color', '边框颜色']),
      name: 'borderColor',
      type: 'color',
      default: preference.borderColor
    },
    {
      label: i18n(['Border width', '边框宽度']),
      name: 'borderWidth',
      type: 'number',
      default: preference.borderWidth
    },
    {
      label: i18n(['Corner radius', '圆角']),
      name: 'cornerRadius',
      type: 'number',
      default: preference.cornerRadius
    },
    {
      label: i18n(['Font size', '文字大小']),
      name: 'fontSize',
      type: 'number',
      default: preference.fontSize
    },
    {
      label: i18n(['Text color (light)', '文字颜色（白天）']),
      name: 'textColorLight',
      type: 'color',
      default: preference.textColorLight
    },
    {
      label: i18n(['Text color (dark)', '文字颜色（夜间）']),
      name: 'textColorDark',
      type: 'color',
      default: preference.textColorDark
    },
    {
      label: i18n(['Icon color', '星星颜色']),
      name: 'iconColor',
      type: 'color',
      default: preference.iconColor
    },
    {
      label: i18n(['Icon name (SFSymbol)', '星星图标（SFSymbol）']),
      name: 'iconName',
      type: 'text',
      default: preference.iconName
    }
  ],
  render: async ({ family, settings }) => {
    family && (config.widgetFamily = family)
    Object.assign(preference, settings)
    const widget = await createWidget()
    return widget
  }
})
