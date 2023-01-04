if (typeof require === 'undefined') require = importModule
const { proxy } = require('./Proxy.module')
const { withSettings } = require('./withSettings.module')
const { i18n } = require('./utils.module')

proxy.call(this)

const preference = {
  title: '🇨🇳 Programmer',
  titleBgOpacity: 1,
  titleColor: '#ffffff',
  date: '2024-10-24',
  numColor: '#373655',
  unitColor: '#6e6e73',
  dateColor: '#86868b',
  useTextShadow: false
}

const addTitle = (widget, { title }) => {
  const { titleBgOpacity, titleColor, useTextShadow } = preference
  const bg = new LinearGradient()
  bg.colors = [
    new Color('#9ce4c1', titleBgOpacity),
    new Color('#92d8e1', titleBgOpacity)
  ]
  bg.locations = [0, 1]
  bg.startPoint = new Point(0, 0)
  bg.endPoint = new Point(1, 0)

  widget.addStack()
    .setBackgroundGradient(bg)
    .setPadding(10, 12, 10, 12)
    .layoutVertically()
    .next((stack) => {
      stack.addText(title)
        .setFont(Font.semiboldSystemFont(16))
        .setTextColor(new Color(titleColor))
        .next((text) => {
          if (useTextShadow) {
            text.setShadowColor(new Color(titleColor, 0.25))
              .setShadowRadius(0.5)
              .setShadowOffset(new Point(1, 1))
          }
        })
    })
    .next((stack) => stack.addStack().addSpacer())
}

const addText = (widget, { text, lineHeight }) => {
  const stack = widget.addStack()
  stack.setPadding(0, 0, 0, 0)
  stack.size = new Size(0, lineHeight)
  return stack.addText(text)
}

const createWidget = () => {
  const { title, date, numColor, unitColor, dateColor, useTextShadow } = preference

  const gradient = new LinearGradient()
  gradient.colors = [
    new Color('#fff', 0),
    new Color('#9ce4c1', 0.3)
  ]
  gradient.locations = [0, 1]
  gradient.startPoint = new Point(0, 0)
  gradient.endPoint = new Point(1, 0)

  const widget = new ListWidget()
    .setBackgroundColor(Color.white())
    .setBackgroundGradient(gradient)
    .setPadding(0, 0, 0, 0)
    .next((widget) => addTitle(widget, { title }))

  const bodyStack = widget.addStack()
    .layoutVertically()
    .setPadding(12, 12, 18, 12)
    .next((stack) => stack.addSpacer())

  const days = bodyStack.addStack().bottomAlignContent()
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const d = Math.ceil((target - now) / (24 * 3600000))
  addText(days, {
    text: `${d}`,
    lineHeight: 48
  })
    .setFont(Font.boldSystemFont(48))
    .setTextColor(new Color(numColor))
    .next((text) => {
      if (useTextShadow) {
        text.setShadowColor(new Color(numColor, 0.25))
          .setShadowRadius(0.5)
          .setShadowOffset(new Point(1, 1))
      }
    })
  days.addSpacer(4)
  days.addText('days')
    .setFont(Font.systemFont(18))
    .setLineLimit(1)
    .setMinimumScaleFactor(0.2)
    .setTextColor(new Color(unitColor))
    .next((text) => {
      if (useTextShadow) {
        text.setShadowColor(new Color(unitColor, 0.25))
          .setShadowRadius(0.5)
          .setShadowOffset(new Point(1, 1))
      }
    })

  bodyStack.addSpacer(8)

  const df = new DateFormatter()
  df.dateFormat = 'yyyy/MM/dd'
  bodyStack.addText(df.string(target))
    .setFont(Font.regularRoundedSystemFont(14))
    .setTextColor(new Color(dateColor))
    .next((text) => {
      if (useTextShadow) {
        text.setShadowColor(new Color(dateColor, 0.25))
          .setShadowRadius(0.5)
          .setShadowOffset(new Point(1, 1))
      }
    })

  return widget
}

await withSettings({
  formItems: [
    {
      name: 'title',
      label: i18n(['Title', '标题']),
      default: preference.title
    },
    {
      name: 'titleBgOpacity',
      label: i18n(['Title background opacity', '标题背景透明度']),
      type: 'number',
      default: preference.titleBgOpacity
    },
    {
      name: 'titleColor',
      label: i18n(['Title color', '标题颜色']),
      type: 'color',
      default: preference.titleColor
    },
    {
      name: 'date',
      label: i18n(['Date', '日期']),
      type: 'date',
      default: preference.date
    },
    {
      name: 'numColor',
      label: i18n(['Number color', '数字颜色']),
      type: 'color',
      default: preference.numColor
    },
    {
      name: 'unitColor',
      label: i18n(['Unit color', '单位颜色']),
      type: 'color',
      default: preference.unitColor
    },
    {
      name: 'dateColor',
      label: i18n(['Date color', '日期颜色']),
      type: 'color',
      default: preference.dateColor
    },
    {
      name: 'useTextShadow',
      label: i18n(['Text shadow', '文字阴影']),
      type: 'switch',
      default: preference.useTextShadow
    }
  ],
  render: ({ settings }) => {
    Object.assign(preference, settings)
    const widget = createWidget()
    return widget
  }
})
