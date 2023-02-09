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
  textColorLight: '#222222',
  textColorDark: '#ffffff',
  iconColor: '#facb19',
  iconName: 'star.fill',
  token: 'Mh8tGmSoW3fyH642Y+Eb3E',
  avatarSize: 32
}
const contentPadding = 8
const fm = FileManager.local()
const cache = useCache()
const constellations = new Map([
  ['Aries', {
    name: '️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️白羊座',
    value: 1,
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/1.png',
    range: '03/21 - 04/19'
  }],
  ['Taurus', {
    name: '金牛座',
    value: 2,
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/2.png',
    range: '04/20 - 05/20'
  }],
  ['Gemini', {
    name: '双子座',
    value: 3,
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/3.png',
    range: '05/21 - 06/21'
  }],
  ['Cancer', {
    name: '巨蟹座',
    value: 4,
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/4.png',
    range: '06/22 - 07/22'
  }],
  ['Leo', {
    name: '狮子座',
    value: 5,
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/5.png',
    range: '07/23 - 08/22'
  }],
  ['Virgo', {
    name: '处女座',
    value: 6,
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/6.png',
    range: '08/23 - 09/22'
  }],
  ['Libra', {
    name: '天秤座',
    value: 7,
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/7.png',
    range: '09/23 - 10/23'
  }],
  ['Scorpio', {
    name: '天蝎座',
    value: 8,
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/8.png',
    range: '10/24 - 11/22'
  }],
  ['Sagittarius', {
    name: '射手座',
    value: 9,
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/9.png',
    range: '11/23 - 12/21'
  }],
  ['Capricorn', {
    name: '魔羯座',
    value: 10,
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/10.png',
    range: '12/22 - 01/19'
  }],
  ['Aquarius', {
    name: '水瓶座',
    value: 11,
    image: 'https://m.xzw.com/static/public/images/prot_icon/xz/a/11.png',
    range: '01/20 - 02/18'
  }],
  ['Pisces', {
    name: '双鱼座',
    value: 12,
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
  const { token } = preference
  const id = constellations.get(constellation).value
  const request = new Request(`https://api.xzw.com/com/json/fortune/?id=${id}&vc=xcx&token=${token}`)
  const { code, data, message } = await request.loadJSON()
  if (Number(code) === 200) {
    return data
  }
  return Promise.reject(message)
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
  const { textColorLight, textColorDark, avatarSize } = preference
  const constellation = constellations.get(preference.constellation)
  const stack = container.addStack()
  stack.size = new Size(-1, 32)
  stack.centerAlignContent()
  await addAvatar(stack, { width: avatarSize, color })
  stack.addSpacer(8)
  const info = stack.addStack()
  info.layoutVertically()
  const title = info.addText(constellation.name)
  title.font = Font.systemFont(13)
  title.textColor = Color.dynamic(new Color(textColorLight), new Color(textColorDark))
  const df = new DateFormatter()
  df.dateFormat = 'yyyy-MM-dd'
  const date = info.addText(df.string(new Date()))
  date.font = Font.systemFont(10)
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
 * @param {WidgetStack} container
 * @param {{ t: string; s?: string; v: string }} data
 */
const addItem = (container, data) => {
  const { textColorLight, textColorDark } = preference
  const fontSize = 10
  const iconSize = fontSize + 3
  const height = iconSize
  const stack = container.addStack()
  stack.size = new Size(-1, height)
  stack.centerAlignContent()
  stack.spacing = 6
  const label = stack.addText(data.t)
  label.font = Font.systemFont(fontSize)
  label.textColor = Color.dynamic(
    new Color(textColorLight, 0.8),
    new Color(textColorDark, 0.8)
  )
  if (data.s) {
    addStars(stack, {
      value: Number(data.s),
      size: new Size(iconSize, iconSize)
    })
  } else {
    const text = stack.addText(data.v)
    text.font = Font.systemFont(fontSize)
    text.textColor = Color.dynamic(new Color(textColorLight), new Color(textColorDark))
  }
}

/**
 * @param {WidgetStack} container
 * @param {{index:{t:string;s:string}[]}} data
 */
const addSmallContent = async (container, { index: data }) => {
  const { borderColor } = preference

  container.layoutVertically()
  const { height } = container.size
  let gap = (height - contentPadding * 2 - 32 - 13 * 5 - 2) / 5
  console.log(`[info] max gap size: ${gap}`)
  gap = Math.min(gap, contentPadding)
  console.log(`[info] actual gap size: ${gap}`)
  await addHead(container, { color: borderColor })
  container.addSpacer(2)
  container.addSpacer(gap)
  addItem(container, data.find((item) => item.t === '事业学业'))
  container.addSpacer(gap)
  addItem(container, data.find((item) => item.t === '财富运势'))
  container.addSpacer(gap)
  addItem(container, data.find((item) => item.t === '爱情运势'))
  container.addSpacer(gap)
  // 幸运颜色
  addItem(container, data.find((item) => item.t === '幸运颜色'))
  container.addSpacer(gap)
  addItem(container, data.find((item) => item.t === '幸运数字'))
}

/**
 * @param {WidgetStack} container
 */
const addMediumContent = async (container, data) => {
  const { index: newList } = data
  const { borderColor, textColorLight, textColorDark } = preference
  const { height } = container.size
  const constellation = constellations.get(preference.constellation)
  const textColor = Color.dynamic(new Color(textColorLight), new Color(textColorDark))
  const leftStack = container.addStack()
  leftStack.layoutVertically()

  const headStack = leftStack.addStack()
  headStack.centerAlignContent()
  headStack.spacing = 6
  await addAvatar(headStack, { width: 36, color: borderColor })

  const hrStack = headStack.addStack()
  hrStack.layoutVertically()
  hrStack.centerAlignContent()
  const htStack = hrStack.addStack()
  htStack.topAlignContent()
  htStack.spacing = 4
  const hbStack = hrStack.addStack()
  hbStack.bottomAlignContent()
  hbStack.spacing = 4

  const nameStack = htStack.addStack()
  nameStack.layoutVertically()
  nameStack.topAlignContent()
  nameStack.size = new Size(10 * 6, -1)
  const nameText = nameStack.addText(constellation.name)
  nameText.leftAlignText()
  nameText.font = Font.systemFont(14)
  nameText.textColor = textColor

  const rangeStack = hbStack.addStack()
  rangeStack.bottomAlignContent()
  rangeStack.size = new Size(10 * 6, -1)
  const rangeText = rangeStack.addText(
    constellation.range.replace(/\//g, '.').replace(/\s/g, '')
  )
  rangeText.leftAlignText()
  rangeText.font = Font.systemFont(10)
  rangeText.textColor = textColor
  rangeText.lineLimit = 1
  rangeText.minimumScaleFactor = 0.6

  const df = new DateFormatter()
  df.dateFormat = 'MM月dd日'
  const dateText = htStack.addText(df.string(new Date()))
  dateText.font = Font.systemFont(14)
  dateText.textColor = textColor
  hrStack.addSpacer(2)

  const summary = newList.find((item) => item.t === '综合运势')
  addStars(hbStack, { size: new Size(13, 13), value: Number(summary.s) })

  leftStack.addSpacer(10)
  const contentText = leftStack.addText(data.content[0].v)
  contentText.font = Font.systemFont(12)
  contentText.minimumScaleFactor = 0.8
  contentText.textColor = textColor

  container.addSpacer(6)
  const lineStack = container.addStack()
  lineStack.layoutVertically()
  lineStack.size = new Size(0.5, -1)
  lineStack.addSpacer()
  lineStack.backgroundColor = new Color(Color.lightGray().hex, 0.2)
  container.addSpacer(6)

  const rightStack = container.addStack()
  rightStack.layoutVertically()
  let gap = (height - contentPadding * 2 - 13 * 7) / 6
  console.log(`[info] max gap size: ${gap}`)
  gap = Math.min(gap, contentPadding)
  console.log(`[info] actual gap size: ${gap}`)
  addItem(rightStack, newList.find((item) => item.t === '爱情运势'))
  rightStack.addSpacer(gap)
  addItem(rightStack, newList.find((item) => item.t === '事业学业'))
  rightStack.addSpacer(gap)
  addItem(rightStack, newList.find((item) => item.t === '财富运势'))
  rightStack.addSpacer(gap)
  addItem(rightStack, newList.find((item) => item.t === '健康指数'))
  rightStack.addSpacer(gap)
  addItem(rightStack, newList.find((item) => item.t === '幸运数字'))
  rightStack.addSpacer(gap)
  addItem(rightStack, newList.find((item) => item.t === '幸运颜色'))
  rightStack.addSpacer(gap)
  addItem(rightStack, newList.find((item) => item.t === '速配星座'))
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
  const family = config.widgetFamily
  const widget = new ListWidget()
  widget.setPadding(...Array(4).fill(0))
  widget.backgroundColor = new Color(borderColor)

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
    await addSmallContent(container, data[0])
  } else {
    await addMediumContent(container, data[0])
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
