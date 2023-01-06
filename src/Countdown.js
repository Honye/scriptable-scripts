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
  numFontSize: 48,
  unitColor: '#6e6e73',
  unitFontSize: 18,
  dateColor: '#86868b',
  dateFontSize: 14,
  useTextShadow: false
}

/**
 * @param {WidgetText} widget
 */
const setTextShadow = (widget) => {
  widget.setShadowColor(new Color(Color.gray().hex, 0.25))
    .setShadowRadius(0.5)
    .setShadowOffset(new Point(1, 1))
}

const renderTitle = (widget) => {
  const { title, titleBgOpacity, titleColor, useTextShadow } = preference
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
        .next((widget) => {
          if (useTextShadow) {
            setTextShadow(widget)
          }
        })
    })
    .next((stack) => stack.addStack().addSpacer())
}

const addText = (widget, { text, lineHeight }) => {
  return widget.addStack()
    .setPadding(0, 0, 0, 0)
    .setSize(new Size(0, lineHeight))
    .addText(text)
}

/**
 * @param {WidgetStack} container
 */
const renderDays = (container) => {
  const {
    date,
    numColor, numFontSize,
    unitColor, unitFontSize,
    useTextShadow
  } = preference

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const days = Math.ceil(Math.abs(target - now) / (24 * 3600000))

  const row = container.addStack().bottomAlignContent()
  // render number
  addText(row, {
    text: `${days}`,
    lineHeight: numFontSize
  })
    .setFont(Font.boldSystemFont(numFontSize))
    .setTextColor(new Color(numColor))
    .next((widget) => {
      if (useTextShadow) {
        setTextShadow(widget)
      }
    })

  row.addSpacer(4)
  // render unit
  row.addText(i18n(['days', '天']))
    .setFont(Font.systemFont(unitFontSize))
    .setLineLimit(1)
    .setMinimumScaleFactor(0.2)
    .setTextColor(new Color(unitColor))
    .next((widget) => {
      if (useTextShadow) {
        setTextShadow(widget)
      }
    })
}

/**
 * @param {WidgetStack} container
 */
const renderDate = (container) => {
  const { date, dateColor, dateFontSize, useTextShadow } = preference

  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const df = new DateFormatter()
  df.dateFormat = 'yyyy/MM/dd'

  container.addText(df.string(target))
    .setFont(Font.regularRoundedSystemFont(dateFontSize))
    .setTextColor(new Color(dateColor))
    .next((widget) => {
      if (useTextShadow) {
        setTextShadow(widget)
      }
    })
}

const createWidget = () => {
  const { backgroundImage } = preference

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
    .next((widget) => {
      if (!backgroundImage) {
        widget.setBackgroundGradient(gradient)
      }
    })
    .setPadding(0, 0, 0, 0)
    .next(renderTitle)

  widget.addStack()
    .layoutVertically()
    .setPadding(12, 12, 18, 12)
    .next((stack) => stack.addSpacer())
    .next(renderDays)
    .next((stack) => stack.addSpacer(8))
    .next(renderDate)

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
      name: 'numFontSize',
      label: i18n(['Number font size', '数字字体大小']),
      type: 'number',
      default: preference.numFontSize
    },
    {
      name: 'unitColor',
      label: i18n(['Unit color', '单位颜色']),
      type: 'color',
      default: preference.unitColor
    },
    {
      name: 'unitFontSize',
      label: i18n(['Unit font size', '单位字体大小']),
      type: 'number',
      default: preference.unitFontSize
    },
    {
      name: 'dateColor',
      label: i18n(['Date color', '日期颜色']),
      type: 'color',
      default: preference.dateColor
    },
    {
      name: 'dateFontSize',
      label: i18n(['Date font size', '日期字体大小']),
      type: 'number',
      default: preference.dateFontSize
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
