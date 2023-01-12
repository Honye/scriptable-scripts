if (typeof require === 'undefined') require = importModule
const { phoneSize, getImage, useCache, hashCode, i18n } = require('./utils.module')
const { withSettings } = importModule('withSettings.module')

const paddingVertical = 10
const themes = {
  light: {
    background: new Color('#ffffff')
  },
  dark: {
    background: new Color('#242426')
  }
}
const preference = {
  /** @type {'light'|'dark'|'system'} */
  colorScheme: 'system',
  /** @type {'h5'|'international'} */
  client: 'h5',
  fontSize: 14,
  useShadow: false,
  lightColor: '#333333',
  darkColor: '#ffffff',
  indexLightColor: '',
  indexDarkColor: '',
  timeColor: '#666666',
  logoSize: 30,
  padding: [NaN, 12, NaN, 14],
  gap: 8
}

/** 微博国际版页面 */
const InternationalScheme = {
  hotSearch: () => 'weibointernational://hotsearch',
  search: (keyword) => `weibointernational://search?keyword=${encodeURIComponent(keyword)}`
}

/** 微博 H5 应用页面 */
const H5Page = {
  hotSearch: () => `https://m.weibo.cn/p/index?containerid=${encodeURIComponent('106003&filter_type=realtimehot')}`,
  search: (keyword) => `https://m.weibo.cn/search?containerid=${encodeURIComponent('100103type=1&t=10&q=' + keyword)}`
}

const conf = {}
const screen = Device.screenResolution()
const scale = Device.screenScale()
const phone = phoneSize(screen.height)
const cache = useCache()

if (config.runsInWidget) {
  const [colorScheme] = (args.widgetParameter || '').split(';').map(text => text.trim())
  preference.colorScheme = colorScheme || preference.colorScheme
}

const Pages = () => {
  switch (preference.client) {
    case 'international':
      return InternationalScheme
    case 'h5':
      return H5Page
  }
}

const fetchData = async () => {
  const url = 'https://weibointl.api.weibo.cn/portal.php?ct=feed&a=search_topic'
  const request = new Request(url)
  try {
    const res = await request.loadJSON()
    const df = new DateFormatter()
    df.dateFormat = 'HH:mm'
    const timeString = df.string(new Date())
    const data = {
      data: res,
      updatedAt: timeString
    }
    cache.writeJSON('trending.json', data)
    return data
  } catch (e) {
    const data = cache.readJSON('trending.json')
    return data
  }
}

/**
 * 优先使用缓存的 Logo，如果不存在缓存则使用线上 Logo 并缓存
 */
const getLogoImage = async () => {
  try {
    const image = cache.readImage('logo.png')
    if (!image) {
      throw new Error('no cache')
    }
    return image
  } catch (e) {
    const image = await getImage('https://www.sinaimg.cn/blog/developer/wiki/LOGO_64x64.png')
    cache.writeImage('logo.png', image)
    return image
  }
}

const createWidget = async ({ data, updatedAt }) => {
  const {
    fontSize,
    timeColor,
    colorScheme,
    logoSize,
    padding,
    gap
  } = preference
  const { widgetFamily } = config
  const heightPX = widgetFamily === 'medium' ? phone.small : phone[widgetFamily]
  const height = heightPX / scale
  conf.count = Math.floor((height - paddingVertical * 2 + gap) / (fontSize + gap))
  if (widgetFamily === 'small') {
    padding[1] = padding[3] = 6
  }

  let stackBottom
  let widgetBottom
  const widget = new ListWidget()
  widget.backgroundColor = colorScheme === 'system'
    ? Color.dynamic(themes.light.background, themes.dark.background)
    : themes[colorScheme].background
  widget.url = Pages().hotSearch()
  const paddingY = paddingVertical - (gap / 2)
  widget.setPadding(paddingY, padding[1], paddingY, padding[3])

  const max = conf.count
  const logoLines = logoSize ? Math.ceil((logoSize + gap) / (fontSize + gap)) : 0
  for (let i = 0; i < max; ++i) {
    const item = data.data[i]
    if (i === 0) {
      const stack = widget.addStack()
      await addItem(stack, item)
      stack.addSpacer()
      const textTime = stack.addText(`更新于 ${updatedAt}`)
      textTime.font = Font.systemFont(fontSize * 0.7)
      textTime.textColor = new Color(timeColor)
    } else if (i < max - logoLines) {
      await addItem(widget, item)
    } else {
      if (!widgetBottom) {
        stackBottom = widget.addStack()
        stackBottom.bottomAlignContent()
        widgetBottom = stackBottom.addStack()
        widgetBottom.layoutVertically()
        addItem(widgetBottom, item)
      } else {
        await addItem(widgetBottom, item)
      }
      widgetBottom.length = (widgetBottom.length || 0) + 1
      if (widgetBottom.length === logoLines) {
        stackBottom.addSpacer()
        const imageLogo = stackBottom.addImage(await getLogoImage())
        imageLogo.imageSize = new Size(logoSize, logoSize)
      }
    }
  }
  return widget
}

/**
 * 优先使用线上最新 Icon 并缓存，请求失败时使用缓存
 */
const getIcon = async (src) => {
  const hash = `${hashCode(src)}`
  try {
    const image = await getImage(src)
    cache.writeImage(hash, image)
    return image
  } catch (e) {
    return cache.readImage(hash)
  }
}

const addItem = async (widget, item) => {
  const {
    fontSize,
    useShadow,
    lightColor,
    darkColor,
    indexLightColor,
    indexDarkColor,
    colorScheme,
    gap
  } = preference
  const stack = widget.addStack()
  const [, queryString] = item.scheme.split('?')
  const query = {}
  queryString.split('&').forEach((item) => {
    const [key, value] = item.split('=')
    query[key] = value
  })
  stack.url = Pages().search(query.keyword)
  stack.centerAlignContent()
  stack.size = new Size(-1, fontSize + gap)
  const stackIndex = stack.addStack()
  stackIndex.size = new Size(fontSize * 1.4, -1)
  const textIndex = stackIndex.addText(String(item.pic_id))
  textIndex.rightAlignText()
  let colors
  if (indexLightColor) {
    colors = [new Color(indexLightColor), new Color(indexLightColor)]
  }
  if (indexDarkColor) {
    colors = colors || [new Color(indexDarkColor)]
    colors[1] = new Color(indexDarkColor)
  }
  textIndex.textColor = colors
    ? Color.dynamic(...colors)
    : item.pic_id > 3 ? new Color('#f5c94c') : new Color('#fe4f67')
  textIndex.font = Font.boldSystemFont(fontSize)
  stack.addSpacer(4)
  const textTitle = stack.addText(item.title)
  textTitle.font = Font.systemFont(fontSize)
  textTitle.textColor = colorScheme === 'system'
    ? Color.dynamic(new Color(lightColor), new Color(darkColor))
    : colorScheme === 'light'
      ? new Color(lightColor)
      : new Color(darkColor)
  textTitle.lineLimit = 1
  if (useShadow) {
    textTitle.shadowColor = Color.dynamic(
      new Color(lightColor, 0.2),
      new Color(darkColor, 0.2)
    )
    textTitle.shadowOffset = new Point(1, 1)
    textTitle.shadowRadius = 0.5
  }
  if (item.icon) {
    stack.addSpacer(4)
    const imageIcon = stack.addImage(await getIcon(item.icon))
    imageIcon.imageSize = new Size(12, 12)
  }
  stack.addSpacer()
}

const main = async () => {
  const data = await fetchData()

  await withSettings({
    homePage: 'https://github.com/Honye/scriptable-scripts',
    formItems: [
      {
        name: 'client',
        label: i18n(['Client', '客户端']),
        type: 'select',
        options: [
          { label: 'H5 (微博)', value: 'h5' },
          { label: i18n(['Weibo intl.', '微博国际版']), value: 'international' }
        ],
        default: preference.client
      },
      {
        name: 'lightColor',
        label: i18n(['Text color (light)', '文字颜色（白天）']),
        type: 'color',
        default: preference.lightColor
      },
      {
        name: 'darkColor',
        label: i18n(['Text color (dark)', '文字颜色（夜间）']),
        type: 'color',
        default: preference.darkColor
      },
      {
        name: 'indexLightColor',
        label: i18n(['Index color (light)', '序号颜色（白天）']),
        type: 'color',
        default: preference.indexLightColor
      },
      {
        name: 'indexDarkColor',
        label: i18n(['Index color (dark)', '序号颜色（夜间）']),
        type: 'color',
        default: preference.indexDarkColor
      },
      {
        name: 'useShadow',
        label: i18n(['Text shadow', '文字阴影']),
        type: 'switch',
        default: preference.useShadow
      },
      {
        name: 'fontSize',
        label: i18n(['Font size', '字体大小']),
        type: 'number',
        default: preference.fontSize
      },
      {
        name: 'timeColor',
        label: i18n(['Time color', '时间颜色']),
        type: 'color',
        default: preference.timeColor
      },
      {
        name: 'logoSize',
        label: i18n(['Logo size (0: hidden)', 'Logo 大小（0：隐藏）']),
        type: 'number',
        default: preference.logoSize
      }
    ],
    render: async ({ family, settings }) => {
      family && (config.widgetFamily = family)
      Object.assign(preference, settings)
      try {
        return await createWidget(data)
      } catch (e) {
        console.error(e)
      }
    }
  })

  Script.complete()
}

await main()
