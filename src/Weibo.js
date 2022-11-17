const { phoneSize } = importModule('utils.module')
const { withSettings } = importModule('withSettings.module')

// ====== 清除旧版本无用缓存 =====
// FIXME 下个版本删除
try {
  Keychain.remove(`$${Script.name()}.client`)
} catch (e) {}
// ===========================

let fontSize = 14
const gap = 8
const logoSize = 30
const paddingVertical = 10
const themes = {
  light: {
    background: new Color('#ffffff')
  },
  dark: {
    background: new Color('#242426', 1)
  }
}
const preference = {
  /** @type {'h5'|'international'} */
  client: 'h5',
  useShadow: false,
  lightColor: new Color('#333'),
  darkColor: Color.white(),
  timeColor: new Color('#666')
}

/** Scoped Keychain */
const KeyStorage = {
  set: (key, value) => {
    return Keychain.set(`$${Script.name()}.${key}`, JSON.stringify(value))
  },
  get: (key) => {
    const _key = `$${Script.name()}.${key}`
    if (Keychain.contains(_key)) {
      return JSON.parse(Keychain.get(_key))
    }
  }
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

const conf = {
  theme: 'system'
}
const screen = Device.screenResolution()
const scale = Device.screenScale()
const phone = phoneSize(screen.height)

if (config.runsInWidget) {
  const [client, theme] = (args.widgetParameter || '').split(',').map(text => text.trim())
  preference.client = client === '2' ? 'international' : preference.client
  conf.theme = theme || conf.theme
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
    KeyStorage.set('cache', data)
    return data
  } catch (e) {
    const data = KeyStorage.get('cache')
    return data
  }
}

const createWidget = async ({ data, updatedAt }) => {
  const { timeColor } = preference
  let stackBottom
  let widgetBottom
  const widget = new ListWidget()
  const { widgetFamily } = config
  const height = (widgetFamily === 'medium' ? phone.small : phone[widgetFamily]) / scale
  conf.count = Math.floor((height - paddingVertical * 2 + gap) / (fontSize + gap))
  widget.backgroundColor = conf.theme === 'system'
    ? Color.dynamic(themes.light.background, themes.dark.background)
    : themes[conf.theme].background
  widget.url = Pages().hotSearch()
  const paddingY = paddingVertical - (gap / 2)
  widget.setPadding(paddingY, 12, paddingY, 14)
  const max = conf.count
  const logoLines = Math.ceil((logoSize + gap) / (fontSize + gap))
  for (let i = 0; i < max; ++i) {
    const item = data.data[i]
    if (i === 0) {
      const stack = widget.addStack()
      await addItem(stack, item)
      stack.addSpacer()
      const textTime = stack.addText(`更新于 ${updatedAt}`)
      textTime.font = Font.systemFont(fontSize * 0.7)
      textTime.textColor = timeColor
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
        const imageLogo = stackBottom.addImage(await getImage('https://www.sinaimg.cn/blog/developer/wiki/LOGO_64x64.png'))
        imageLogo.imageSize = new Size(logoSize, logoSize)
      }
    }
  }
  return widget
}

const addItem = async (widget, item) => {
  const { useShadow, lightColor, darkColor } = preference
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
  textIndex.textColor = item.pic_id > 3 ? new Color('#f5c94c', 1) : new Color('#fe4f67', 1)
  textIndex.font = Font.boldSystemFont(fontSize)
  stack.addSpacer(4)
  const textTitle = stack.addText(item.title)
  textTitle.font = Font.systemFont(fontSize)
  textTitle.textColor = conf.theme === 'system'
    ? Color.dynamic(lightColor, darkColor)
    : conf.theme === 'light'
      ? lightColor
      : darkColor
  textTitle.lineLimit = 1
  if (useShadow) {
    textTitle.shadowColor = new Color('#000000', 0.2)
    textTitle.shadowOffset = new Point(1, 1)
    textTitle.shadowRadius = 0.5
  }
  if (item.icon) {
    stack.addSpacer(4)
    const imageIcon = stack.addImage(await getImage(item.icon))
    imageIcon.imageSize = new Size(12, 12)
  }
  stack.addSpacer()
}

const getImage = async (url) => {
  const request = new Request(url)
  const image = await request.loadImage()
  return image
}

/** 更新脚本 */
const update = async () => {
  let fm = FileManager.local()
  if (fm.isFileStoredIniCloud(module.filename)) {
    fm = FileManager.iCloud()
  }
  const url = 'https://raw.githubusercontent.com/Honye/scriptable-scripts/master/weibo/Weibo.js'
  const request = new Request(url)
  try {
    const code = await request.loadString()
    fm.writeString(module.filename, code)
    const alert = new Alert()
    alert.message = 'The code has been updated. If the script is open, close it for the change to take effect.'
    alert.addAction('OK')
    alert.presentAlert()
  } catch (e) {
    console.error(e)
  }
}

const main = async () => {
  const data = await fetchData()

  const widget = await withSettings({
    homePage: 'https://github.com/Honye/scriptable-scripts',
    formItems: [
      {
        name: 'client',
        label: 'Client',
        type: 'select',
        options: [
          { label: 'H5 (微博)', value: 'h5' },
          { label: 'Weibo intl.', value: 'international' }
        ],
        default: 'h5'
      },
      {
        name: 'lightColor',
        label: 'Text color (light)',
        type: 'color',
        default: '#333333'
      },
      {
        name: 'darkColor',
        label: 'Text color (dark)',
        type: 'color',
        default: '#ffffff'
      },
      {
        name: 'useShadow',
        label: 'Text shadow',
        type: 'switch',
        default: preference.useShadow
      },
      {
        name: 'fontSize',
        label: 'Font size',
        type: 'number',
        default: fontSize
      },
      {
        name: 'timeColor',
        label: 'Time color',
        type: 'color',
        default: preference.timeColor.hex
      }
    ],
    render: async ({ family, settings }) => {
      family && (config.widgetFamily = family)
      console.log(`[Weibo.js] ${JSON.stringify(settings)}`)
      Object.assign(preference, {
        ...settings,
        fontSize: Number(settings.fontSize) || preference.fontSize,
        lightColor: settings.lightColor ? new Color(settings.lightColor) : preference.lightColor,
        darkColor: settings.lightColor ? new Color(settings.darkColor) : preference.darkColor,
        timeColor: settings.timeColor ? new Color(settings.timeColor) : preference.timeColor
      })
      fontSize = Number(settings.fontSize) || fontSize
      try {
        return await createWidget(data)
      } catch (e) {
        console.error(e)
      }
    }
  })
  if (config.runsInWidget) {
    Script.setWidget(widget)
  }
  // if (config.runsInApp) {
  //   const res = await presentSheet({
  //     message: 'Preview the widget or update the script. Update will override the whole script.',
  //     options: [
  //       { title: 'Update', value: 'Update' }
  //     ]
  //   })
  //   const value = res.option?.value
  //   switch (value) {
  //     case 'Update':
  //       update()
  //       break
  //   }
  // }

  Script.complete()
}

main()
