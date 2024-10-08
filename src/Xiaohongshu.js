if (typeof require === 'undefined') require = importModule
const { phoneSize, getImage, useCache, hashCode, i18n } = require('./utils.module')
const { withSettings } = require('./withSettings.module')
const { useGrid } = require('./widgets.module')

const paddingVertical = 10
const preference = {
  /** @type {'light'|'dark'|'system'} */
  colorScheme: 'system',
  fontSize: 14,
  useShadow: false,
  lightColor: '#333333',
  darkColor: '#ffffff',
  indexLightColor: '',
  indexDarkColor: '',
  timeColor: '#666666',
  logoSize: 30,
  padding: [NaN, 12, NaN, 14],
  gap: 8,
  columns: '1'
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

const fetchData = async () => {
  const url = 'https://edith.xiaohongshu.com/api/sns/v1/search/hot_list'
  const request = new Request(url)
  request.headers = {
    'User-Agent': 'discover/8.27 (iPhone; iOS 17.4; Scale/2.00) Resolution/828*1792 Version/8.27 Build/8270555 Device/(Apple Inc.;iPhone12,1) NetType/CellNetwork',
    'xy-direction': '11',
    'Accept-Language': 'en-CN;q=1, zh-Hans-CN;q=0.9',
    shield: 'XYAAAAAQAAAAEAAABTAAAAUzUWEe4xG1IYD9/c+qCLOlKGmTtFa+lG434LeOBXRqtCwIG0n8AVP53/i+Ytz8QursR+2dM1ZAw9FWKBZM6A31hp8uUzKCEBoUmKRKKeHM3/tlWY',
    'xy-platform-info': 'platform=iOS&version=8.54.1&build=8541126&deviceId=05541FBC-7D6B-44B9-8A7D-C4790ED3C9D1&bundle=com.xingin.discover',
    'xy-common-params': 'app_id=ECFAAF02&build=8541126&channel=AppStore&deviceId=05541FBC-7D6B-44B9-8A7D-C4790ED3C9D1&device_fingerprint=2020111813402415850d0efad8f9e4c36e80fb5930417d0175b0e50fd1adc8&device_fingerprint1=2020111813402415850d0efad8f9e4c36e80fb5930417d0175b0e50fd1adc8&device_model=phone&fid=1608005629-0-0-eed79a78f1907a1d38d9d05dcddae6bc&gid=7c4ed0bf25ed547a1267ed41d1df9eaf51de4a284735941f77a554c8&identifier_flag=1&is_mac=0&lang=en&launch_id=748588941&overseas_channel=0&platform=iOS&project_id=ECFAAF&sid=session.1726768676545524226817&t=1726896157&teenager=0&tz=Asia/Shanghai&uis=light&version=8.54.1',
    Referer: 'https://app.xhs.cn/'
  }
  try {
    const res = await request.loadJSON()
    console.log(res)
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
    const image = await getImage('https://cdn.jsdelivr.net/gh/Honye/scriptable-scripts@master/docs/assets/logo_xhs.png')
    cache.writeImage('logo.png', image)
    return image
  }
}

const createWidget = async ({ data, updatedAt }) => {
  const {
    fontSize,
    logoSize,
    padding,
    gap,
    columns
  } = preference
  const { widgetFamily } = config
  const heightPX = widgetFamily === 'medium' ? phone.small : phone[widgetFamily]
  let height = heightPX / scale
  if (columns > 1) {
    // 当列数大于 1 时 Logo 和时间占满一行
    height -= logoSize
  }
  conf.count = Math.floor((height - paddingVertical * 2 + gap) / (fontSize + gap))
  if (widgetFamily === 'small') {
    padding[1] = padding[3] = 6
  }

  let stackBottom
  let widgetBottom
  const widget = new ListWidget()
  widget.url = 'xhsdiscover://home'
  const paddingY = paddingVertical - (gap / 2)
  widget.setPadding(paddingY, padding[1], paddingY, padding[3])

  const max = Math.min(conf.count, data.data.items.length)
  const logoLines = logoSize ? Math.ceil((logoSize + gap) / (fontSize + gap)) : 0
  if (columns > 1) {
    await addLogoTime(widget, { time: updatedAt })
    const stackItems = widget.addStack()
    const { add } = await useGrid(stackItems, { column: columns })
    for (let i = 0; i < max * columns; ++i) {
      await add((stack) => addItem(stack, data.data.items[i]), i)
    }
  } else {
    for (let i = 0; i < max; ++i) {
      const item = data.data.items[i]
      if (i === 0) {
        const stack = widget.addStack()
        await addItem(stack, item, i)
        stack.addSpacer()
        await addTime(stack, updatedAt)
      } else if (i < max - logoLines) {
        await addItem(widget, item, i)
      } else {
        if (!widgetBottom) {
          stackBottom = widget.addStack()
          stackBottom.bottomAlignContent()
          widgetBottom = stackBottom.addStack()
          widgetBottom.layoutVertically()
          addItem(widgetBottom, item, i)
        } else {
          await addItem(widgetBottom, item, i)
        }
        widgetBottom.length = (widgetBottom.length || 0) + 1
        if (widgetBottom.length === logoLines) {
          stackBottom.addSpacer()
          await addLogo(stackBottom)
        }
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

/**
 * @param {WidgetStack} widget
 * @param {*} item
 * @param {number} i
 */
const addItem = async (widget, item, i) => {
  const {
    fontSize,
    useShadow,
    lightColor,
    darkColor,
    indexLightColor,
    indexDarkColor,
    gap
  } = preference
  i += 1
  const { title, icon } = item
  const stack = widget.addStack()
  stack.url = `xhsdiscover://search/result?keyword=${encodeURIComponent(title)}`
  stack.centerAlignContent()
  stack.size = new Size(-1, fontSize + gap)
  const stackIndex = stack.addStack()
  stackIndex.size = new Size(fontSize * 1.4, -1)
  const textIndex = stackIndex.addText(`${i}`)
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
    : i > 3 ? new Color('#f5c94c') : new Color('#fe4f67')
  textIndex.font = Font.boldSystemFont(fontSize)
  stack.addSpacer(4)
  const textTitle = stack.addText(title)
  textTitle.font = Font.systemFont(fontSize)
  textTitle.textColor = Color.dynamic(new Color(lightColor), new Color(darkColor))
  textTitle.lineLimit = 1
  if (useShadow) {
    textTitle.shadowColor = Color.dynamic(
      new Color(lightColor, 0.2),
      new Color(darkColor, 0.2)
    )
    textTitle.shadowOffset = new Point(1, 1)
    textTitle.shadowRadius = 0.5
  }
  if (icon) {
    stack.addSpacer(4)
    const imageIcon = stack.addImage(await getIcon(icon))
    imageIcon.imageSize = new Size(12, 12)
  }
  stack.addSpacer()
}

/**
 * @param {WidgetStack} container
 */
const addLogo = async (container) => {
  const { logoSize } = preference
  const image = container.addImage(await getLogoImage())
  image.imageSize = new Size(logoSize, logoSize)
  return image
}

/**
 * @param {WidgetStack} container
 * @param {string} time
 */
const addTime = async (container, time) => {
  const { fontSize, timeColor } = preference
  const textTime = container.addText(`更新于 ${time}`)
  textTime.font = Font.systemFont(fontSize * 0.7)
  textTime.textColor = new Color(timeColor)
  return textTime
}

/**
 * @param {WidgetStack} container
 * @param {object} data
 * @param {string} data.time
 */
const addLogoTime = async (container, { time }) => {
  const stack = container.addStack()
  stack.centerAlignContent()
  await addLogo(stack)
  stack.addSpacer()
  await addTime(stack, time)
  return stack
}

const main = async () => {
  const data = await fetchData()

  await withSettings({
    homePage: 'https://github.com/Honye/scriptable-scripts',
    formItems: [
      {
        name: 'lightColor',
        label: i18n(['Text color', '文字颜色']),
        type: 'color',
        media: '(prefers-color-scheme: light)',
        default: preference.lightColor
      },
      {
        name: 'darkColor',
        label: i18n(['Text color', '文字颜色']),
        type: 'color',
        media: '(prefers-color-scheme: dark)',
        default: preference.darkColor
      },
      {
        name: 'indexLightColor',
        label: i18n(['Index color', '序号颜色']),
        type: 'color',
        media: '(prefers-color-scheme: light)',
        default: preference.indexLightColor
      },
      {
        name: 'indexDarkColor',
        label: i18n(['Index color', '序号颜色']),
        type: 'color',
        media: '(prefers-color-scheme: dark)',
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
      },
      {
        name: 'columns',
        label: i18n(['Column count', '列数']),
        type: 'select',
        options: [
          { label: '1', value: '1' },
          { label: '2', value: '2' },
          { label: '3', value: '3' }
        ],
        default: preference.columns
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
