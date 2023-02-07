if (typeof require === 'undefined') require = importModule
const { withSettings } = require('./withSettings.module')
const { getImage, i18n, phoneSize, useCache, hashCode } = require('./utils.module')

const preference = {
  /** 星座 */
  constellation: 'Aries',
  borderWidth: 6,
  borderColor: '',
  cornerRadius: 16,
  backgroundColorLight: '#ffffff',
  backgroundColorDark: '#242426',
  backgroundImage: '',
  textColorLight: '#222222',
  textColorDark: '#ffffff',
  iconColor: '#facb19',
  iconName: 'star.fill',
  avatarSize: 32
}
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
const colors = {
  红色: '#ff4015',
  橙色: '#feb43f',
  黄色: '#fff76b',
  绿色: '#96d35f',
  青色: '#cde8b5',
  蓝色: '#01c7fc',
  紫色: '#e292fe',
  灰色: '#adadad',
  粉色: '#f4a4c0',
  黑色: '#333333',
  白色: '#ebebeb',
  棕色: '#7a4a00'
}

/**
 * @param {string} constellation 星座
 */
const getData = async (constellation) => {
  const request = new Request(`https://interface.sina.cn/ast/get_app_fate.d.json?type=astro&class=${constellation}`)
  const { result } = await request.loadJSON()
  const { status, data } = result
  if (status.code === 0) {
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
 */
const addHead = async (container, { color }) => {
  const { textColorLight, textColorDark } = preference
  const constellation = constellations.get(preference.constellation)
  const stack = container.addStack()
  stack.centerAlignContent()
  const avatar = stack.addStack()
  const avatarSize = new Size(...Array(2).fill(preference.avatarSize))
  avatar.size = avatarSize
  avatar.backgroundImage = getAvatarBg(color)
  const img = avatar.addImage(await getImg(constellation.image))
  img.imageSize = avatarSize
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
 */
const addProgress = (container, data) => {
  const { textColorLight, textColorDark, iconName, iconColor } = preference
  const stack = container.addStack()
  stack.centerAlignContent()
  stack.spacing = 6
  const label = stack.addText(data.name)
  label.font = Font.systemFont(10)
  label.textColor = Color.dynamic(
    new Color(textColorLight, 0.8),
    new Color(textColorDark, 0.8)
  )
  const progress = stack.addStack()
  progress.centerAlignContent()
  const percent = Number(data.value.slice(0, -1))
  // 至少1星
  const n = Math.max(Math.round(percent / 100 * 5), 1)
  for (let i = 0; i < 5; i++) {
    const sfs = SFSymbol.named(iconName)
    const star = progress.addImage(sfs.image)
    star.tintColor = i < n ? new Color(iconColor) : Color.lightGray()
    star.imageSize = new Size(13, 13)
  }
}

/**
 * @param {WidgetStack} container
 */
const addItem = (container, data) => {
  const { textColorLight, textColorDark } = preference
  const stack = container.addStack()
  stack.centerAlignContent()
  stack.spacing = 6
  const label = stack.addText(data.name)
  label.font = Font.systemFont(10)
  label.textColor = Color.dynamic(
    new Color(textColorLight, 0.8),
    new Color(textColorDark, 0.8)
  )
  const text = stack.addText(data.value)
  text.font = Font.systemFont(10)
  text.textColor = Color.dynamic(new Color(textColorLight), new Color(textColorDark))
}

/**
 * @param {{name:string;value:string}[]} data
 */
const createSmallWidget = async (data) => {
  const {
    borderWidth,
    borderColor,
    cornerRadius,
    backgroundColorLight,
    backgroundColorDark,
    backgroundImage
  } = preference
  const widget = new ListWidget()
  widget.setPadding(...Array(4).fill(0))
  const lucky = data.find((item) => item.name === '幸运颜色')
  widget.backgroundColor = new Color(borderColor || colors[lucky.value])

  const widgetSize = getWidgetSize()
  const container = widget.addStack()
  container.size = new Size(
    widgetSize.width - borderWidth * 2,
    widgetSize.height - borderWidth * 2
  )
  container.setPadding(...Array(4).fill(8))
  container.layoutVertically()
  container.cornerRadius = cornerRadius
  container.backgroundColor = Color.dynamic(
    new Color(backgroundColorLight),
    new Color(backgroundColorDark)
  )
  if (backgroundImage && fm.fileExists(backgroundImage)) {
    container.backgroundColor = undefined
  }

  await addHead(container, { color: borderColor || colors[lucky.value] })
  container.addSpacer(2)
  container.addSpacer()
  addProgress(container, data.find((item) => item.name === '工作指数'))
  container.addSpacer()
  addProgress(container, data.find((item) => item.name === '财运指数'))
  container.addSpacer()
  addProgress(container, data.find((item) => item.name === '爱情指数'))
  container.addSpacer()
  // 幸运颜色
  addItem(container, lucky)
  container.addSpacer()
  addItem(container, data.find((item) => item.name === '幸运数字'))

  return widget
}

const createWidget = async () => {
  const { constellation } = preference
  const data = await getData(constellation)
  return await createSmallWidget(data.today.new_list)
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
