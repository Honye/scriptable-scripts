if (typeof require === 'undefined') require = importModule
const { withSettings } = require('./withSettings.module')
const { useCache } = require('./utils.module')

const preference = {
  green: '#00b578',
  yellow: '#ffc300',
  red: '#ea0000',
  /** 有效周期，单位：天 */
  period: 3,
  widgetURL: ''
}
const cache = useCache()

/**
 * @returns {Promise<NATData>}
 */
const getData = async () => {
  const { getNATData } = require/* ignore */('./Config')
  if (getNATData) {
    try {
      const data = await getNATData()
      cache.writeJSON('data.json', data)
      return data
    } catch (e) {
      const data = cache.readJSON('data.json')
      return data
    }
  }
  // return {
  //   natResultName: '阳性',
  //   sampleDate: '2022-11-24 17:24:00'
  // }
}

const createWidget = async () => {
  const { green, yellow, red, period, widgetURL } = preference

  const data = await getData()
  const { natResultName } = data
  const sampleDate = new Date(data.sampleDate)
  const now = new Date()
  const diff = now.getTime() - (new Date(sampleDate).getTime())
  const leftTime = period * 24 * 3600000 - diff

  const widget = new ListWidget()
  if (widgetURL) {
    widget.url = widgetURL
  }
  widget.backgroundColor = new Color(green)
  if (leftTime < 0) {
    widget.backgroundColor = new Color(yellow)
  }
  if (natResultName === '阳性') {
    widget.backgroundColor = new Color(red)
  }

  const stackCapsule = widget.addStack()
  stackCapsule.size = new Size(24 * 2.8, 24 * 1.6)
  stackCapsule.backgroundColor = Color.white()
  stackCapsule.cornerRadius = 10
  stackCapsule.centerAlignContent()
  const capText = (() => {
    if (leftTime >= 0) {
      return Math.ceil(diff / (24 * 3600000)) * 24 + 'h'
    }
    return '>' + Math.ceil(Math.abs(leftTime / (24 * 3600000))) + 'd'
  })()
  const textCapsule = stackCapsule.addText(capText)
  textCapsule.font = Font.boldSystemFont(24)
  textCapsule.textColor = new Color(green)
  if (leftTime < 0) {
    textCapsule.textColor = new Color(yellow)
  }
  if (natResultName === '阳性') {
    textCapsule.textColor = new Color(red)
  }

  widget.addSpacer(10)
  const df = new DateFormatter()
  df.dateFormat = 'yyyy/MM/dd hh:mm'
  const textDate = widget.addText(`检测时间 ${df.string(sampleDate)}`)
  textDate.font = Font.systemFont(10)
  textDate.textColor = Color.white()
  textDate.lineLimit = 1
  textDate.minimumScaleFactor = 0.1

  widget.addSpacer(10)
  const textTip = widget.addText(`有效期${period}d剩余`)
  textTip.font = Font.boldSystemFont(16)
  textTip.textColor = Color.white()

  const unit = leftTime < 3600000 ? '分钟' : '小时'
  const leftText = (() => {
    if (leftTime < 0) {
      return 0
    }
    if (unit === '小时') {
      return Math.round(leftTime / 3600000)
    }
    return Math.round(leftTime / 60000)
  })()
  widget.addSpacer(4)
  const stackBottom = widget.addStack()
  stackBottom.bottomAlignContent()
  const stackLeft = stackBottom.addStack()
  stackLeft.size = new Size(-1, 34)
  const textLeft = stackLeft.addText(`${leftText}`)
  textLeft.font = Font.boldSystemFont(34)
  textLeft.textColor = Color.white()
  const stackUnit = stackBottom.addStack()
  stackUnit.size = new Size(-1, 15 + 3)
  const textUnit = stackUnit.addText(unit)
  textUnit.font = Font.systemFont(15)
  textUnit.textColor = Color.white()

  if (config.widgetFamily === 'large') {
    widget.addSpacer()
  }

  return widget
}

const widget = await withSettings({
  homePage: 'https://github.com/Honye/scriptable-scripts/blob/master/dist/NAT.js',
  formItems: [
    {
      name: 'period',
      label: 'Effective time',
      type: 'select',
      options: [
        { label: 'a day', value: '1' },
        { label: '2 days', value: '2' },
        { label: '3 day', value: '3' },
        { label: '4 days', value: '4' },
        { label: '5 days', value: '5' },
        { label: '6 days', value: '6' },
        { label: '7 days', value: '7' }
      ],
      default: `${preference.period}`
    },
    {
      name: 'widgetURL',
      label: 'Widget URL'
    }
  ],
  render: async ({ family, settings }) => {
    config.widgetFamily = family ?? config.widgetFamily
    Object.assign(preference, {
      period: Number(settings.period || '3'),
      ...settings
    })
    const widget = createWidget()

    return widget
  }
})

if (config.runsInWidget) {
  Script.setWidget(widget)
}

/**
 * @typedef {object} NATData
 * @property {'阴性'|'阳性'} natResultName 核酸检测结果
 * @property {string} sampleDate 采样时间
 */
