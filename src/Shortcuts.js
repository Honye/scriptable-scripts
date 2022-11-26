/* 应用快捷方式
    - 日历
    - 支付宝扫码、收/付款、健康码
    - 微信扫码 */
const { withSettings } = importModule('withSettings.module')
const { sloarToLunar } = importModule('lunar.module')
const NoBg = importModule('no-background')

const preference = {
  lightBgColor: '#ffffff',
  darkBgColor: '#242426'
}

/**
 * @param {number} cols
 */
const Grid = (widget, cols) => {
  const gap = 8
  const rows = []
  let cursor = 0
  const grid = widget
  grid.layoutVertically()

  const addStack = () => {
    if (cursor % cols === 0) {
      if (cursor >= cols) {
        grid.addSpacer(gap)
      }
      rows.push(grid.addStack())
    }
    const row = rows[rows.length - 1]
    if (cursor % cols !== 0) {
      row.addSpacer(gap)
    }
    const stack = row.addStack()
    cursor++
    return stack
  }

  return { addStack }
}

const centerH = (widget, callback) => {
  const stack = widget.addStack()
  stack.addSpacer()
  const ret = callback(stack)
  stack.addSpacer()
  return ret
}

/**
 * @param {ListWidget | WidgetStack} widget
 * @param {{ symbolName: string; title: string; url: string }} options
 */
const addSquare = (widget, options) => {
  const stack = widget.addStack()
  stack.url = options.url
  stack.size = new Size(78, 68)
  stack.cornerRadius = 10
  stack.backgroundColor = new Color('#000', 0.15)
  stack.layoutVertically()
  // add symbol
  const imageWrapper = stack.addStack()
  imageWrapper.addSpacer()
  addSymbol(imageWrapper, options.symbolName)
  imageWrapper.addSpacer()
  stack.addSpacer(2)
  // add title
  const textWrapper = stack.addStack()
  textWrapper.addSpacer()
  const text = textWrapper.addText(options.title)
  text.textColor = Color.white()
  text.font = Font.systemFont(12)
  textWrapper.addSpacer()
}

const addSymbol = (widget, name) => {
  const sfs = SFSymbol.named(name)
  sfs.applyFont(
    Font.thinMonospacedSystemFont(36)
  )
  const image = widget.addImage(sfs.image)
  image.imageSize = new Size(38, 38)
  image.tintColor = Color.white()
}

const createWidget = async () => {
  const { lightBgColor, darkBgColor } = preference

  const widget = new ListWidget()
  widget.setPadding(8, 0, 8, 8)
  widget.backgroundColor = Color.dynamic(new Color(lightBgColor), new Color(darkBgColor))
  const noBgConfig = await NoBg.loadConfig()
  if (noBgConfig[Script.name()]) {
    widget.backgroundImage = await NoBg.transparent(Script.name())
  }

  const container = widget.addStack()
  container.centerAlignContent()
  container.addSpacer()
  const stackDate = container.addStack()
  stackDate.url = 'calshow://'
  stackDate.layoutVertically()
  const dateFormatter = new DateFormatter()
  dateFormatter.dateFormat = 'MMM yyyy, E'
  const textDay = centerH(stackDate, (stack) => {
    return stack.addText(
      String(new Date().getDate())
    )
  })
  textDay.font = Font.systemFont(42)
  textDay.textColor = Color.white()
  stackDate.addSpacer(14)
  const textDate = centerH(stackDate, (stack) => {
    return stack.addText(
      dateFormatter.string(new Date())
    )
  })
  textDate.font = Font.systemFont(16)
  textDate.textColor = Color.white()
  const now = new Date()
  const lunarDate = sloarToLunar(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate()
  )
  stackDate.addSpacer(6)
  const textLunar = centerH(stackDate, (stack) => {
    return stack.addText(
      lunarDate.lunarYear + lunarDate.lunarMonth + lunarDate.lunarDay
    )
  })
  textLunar.font = Font.systemFont(13)
  textLunar.textColor = Color.white()
  container.addSpacer()
  container.addSpacer(8)
  // shortcuts
  const grid = container.addStack()
  const { addStack } = Grid(grid, 2)
  addSquare(addStack(), {
    symbolName: 'qrcode.viewfinder',
    title: '支付宝',
    url: 'alipays://platformapi/startapp?saId=10000007'
  })
  addSquare(addStack(), {
    symbolName: 'barcode.viewfinder',
    title: '收/付款',
    url: 'alipay://platformapi/startapp?appId=20000056'
  })
  addSquare(addStack(), {
    symbolName: 'plus.viewfinder',
    title: '微信',
    url: 'weixin://scanqrcode'
  })
  addSquare(addStack(), {
    symbolName: 'location.viewfinder',
    title: '健康码',
    url: 'alipays://platformapi/startapp?appId=20000067&url=https%3A%2F%2F68687564.h5app.alipay.com%2Fwww%2Findex.html'
  })

  return widget
}

await withSettings({
  formItems: [
    {
      name: 'lightBgColor',
      label: 'Background color (light)',
      type: 'color',
      default: preference.lightBgColor
    },
    {
      name: 'darkBgColor',
      label: 'Background color (dark)',
      type: 'color',
      default: preference.darkBgColor
    },
    {
      name: 'transparentBg',
      label: 'Transparent background',
      type: 'cell'
    },
    {
      name: 'clearBgTransparent',
      label: 'Clear transparent background',
      type: 'cell'
    }
  ],
  onItemClick: (item) => {
    const { name } = item
    if (name === 'clearBgTransparent') {
      NoBg.clean()
    } else if (name === 'transparentBg') {
      NoBg.transparent(Script.name())
    }
  },
  render: async ({ family, settings }) => {
    config.widgetFamily = family ?? config.widgetFamily
    Object.assign(preference, settings)
    const widget = await createWidget()
    return widget
  }
})
