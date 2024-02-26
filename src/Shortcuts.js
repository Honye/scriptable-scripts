if (typeof require === 'undefined') require = importModule
const { withSettings } = importModule('withSettings.module')
const { sloarToLunar } = require('lunar.module')
const { generateSlices, getConfig, hasConfig, removeConfig, transparent } = require('./nobg.module')
const { i18n, presentSheet } = require('./utils.module')
const { useGrid } = require('./widgets.module')

const shortcuts = [
  {
    symbol: 'qrcode.viewfinder',
    title: '支付宝',
    url: 'alipays://platformapi/startapp?saId=10000007'
  },
  {
    symbol: 'barcode.viewfinder',
    title: '收/付款',
    url: 'alipay://platformapi/startapp?appId=20000056'
  },
  {
    symbol: 'plus.viewfinder',
    title: '微信',
    url: 'weixin://scanqrcode'
  },
  {
    symbol: 'location.viewfinder',
    title: '公交',
    url: 'iosamap://realtimeBus/home'
  }
]
const $12Animals = {
  子: '鼠',
  丑: '牛',
  寅: '虎',
  卯: '兔',
  辰: '龙',
  巳: '蛇',
  午: '马',
  未: '羊',
  申: '猴',
  酉: '鸡',
  戌: '狗',
  亥: '猪'
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
 * @param {{ symbol: string; title: string; url: string }} options
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
  addSymbol(imageWrapper, options.symbol)
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

/** @type {WidgetStack} */
const addDate = (container) => {
  const stackDate = container.addStack()
  stackDate.url = 'calshow://'
  stackDate.layoutVertically()
  const dateFormatter = new DateFormatter()
  dateFormatter.locale = 'zh'
  dateFormatter.dateFormat = 'yyyy年MM月 E'
  const textDay = centerH(stackDate, (stack) => {
    return stack.addText(
      String(new Date().getDate())
    )
  })
  textDay.font = Font.regularRoundedSystemFont(52)
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
  const { lunarYear, lunarMonth, lunarDay } = sloarToLunar(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate()
  )
  stackDate.addSpacer(6)
  const textLunar = centerH(stackDate, (stack) => {
    return stack.addText(
      `${lunarYear}${$12Animals[lunarYear[1]]}年` +
      `${lunarMonth}月${lunarDay}`
    )
  })
  textLunar.font = Font.systemFont(13)
  textLunar.textColor = Color.white()
}

/**
 * @param {WidgetStack} widget
 */
const addShortcuts = async (widget) => {
  const grid = widget.addStack()
  const { add } = await useGrid(grid, { column: 2, gap: 8 })
  for (const item of shortcuts) {
    await add((stack) => addSquare(stack, item))
  }
}

const createWidget = async () => {
  const widget = new ListWidget()
  widget.setPadding(8, 0, 8, 8)
  const noBgConfig = await getConfig(Script.name())
  if (noBgConfig) {
    widget.backgroundImage = await transparent(Script.name())
  }

  const container = widget.addStack()
  container.centerAlignContent()
  container.addSpacer()
  addDate(container)
  container.addSpacer()
  container.addSpacer(8)
  await addShortcuts(container)

  return widget
}

await withSettings({
  formItems: [
    {
      name: 'transparentBg',
      label: i18n(['Transparent background', '透明背景']),
      type: 'cell'
    },
    {
      name: 'clearBgTransparent',
      label: i18n(['Remove transparent background', '清除透明背景']),
      type: 'cell'
    }
  ],
  onItemClick: async (item) => {
    const { name } = item
    if (name === 'clearBgTransparent') {
      await removeConfig(Script.name())
      const alert = new Alert()
      alert.message = i18n(['Removed', '已清除'])
      alert.addCancelAction(i18n(['OK', '好']))
      alert.presentAlert()
    } else if (name === 'transparentBg') {
      if (await hasConfig()) {
        const { option } = await presentSheet({
          options: [
            {
              title: i18n(['Update widget size and position', '修改组件尺寸和位置']),
              value: 'update'
            },
            {
              title: i18n(['Update wallpaper screenshot', '更新壁纸截图']),
              value: 'reset'
            }
          ],
          cancelText: i18n(['Cancel', '取消'])
        })
        if (option) {
          if (option.value === 'update') {
            await transparent(Script.name(), true)
          } else {
            await generateSlices({ caller: Script.name() })
          }
        }
      } else {
        await transparent(Script.name(), true)
      }
    }
  },
  render: async ({ family, settings }) => {
    config.widgetFamily = family ?? config.widgetFamily
    const widget = await createWidget()
    return widget
  }
})
