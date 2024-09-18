if (typeof require === 'undefined') require = importModule
const { withSettings } = require('./withSettings.module')
const { i18n } = require('./utils.module')
const { lineChart } = require('./chart.module')

const preference = {
  province: '31',
  max: 3
}

const base = 'https://cx.sinopecsales.com/yjkqiantai'
const provinces = [
  { label: '北京', value: '11' },
  { label: '天津', value: '12' },
  { label: '河北', value: '13' },
  { label: '山西', value: '14' },
  { label: '河南', value: '41' },
  { label: '山东', value: '37' },
  { label: '上海', value: '31' },
  { label: '江苏', value: '32' },
  { label: '浙江', value: '33' },
  { label: '安徽', value: '34' },
  { label: '福建', value: '35' },
  { label: '江西', value: '36' },
  { label: '湖北', value: '42' },
  { label: '湖南', value: '43' },
  { label: '广东', value: '44' },
  { label: '广西', value: '45' },
  { label: '云南', value: '53' },
  { label: '贵州', value: '52' },
  { label: '海南', value: '46' },
  { label: '重庆', value: '50' },
  { label: '四川', value: '51' },
  { label: '新疆', value: '65' },
  { label: '内蒙古', value: '15' },
  { label: '辽宁', value: '21' },
  { label: '吉林', value: '22' },
  { label: '宁夏', value: '64' },
  { label: '陕西', value: '61' },
  { label: '黑龙江', value: '23' },
  { label: '西藏', value: '54' },
  { label: '青海', value: '63' },
  { label: '甘肃', value: '62' }
]

const names = new Map([
  ['GAS_92', '92#'],
  ['GAS_95', '95#'],
  ['GAS_98', '98#'],
  ['E92', 'E92#'],
  ['E95', 'E95#'],
  ['AIPAO95', '爱跑95#'],
  ['AIPAO98', '爱跑98#'],
  ['AIPAOE92', '爱跑E92#'],
  ['AIPAOE95', '爱跑E95#'],
  ['AIPAOE98', '爱跑E98#'],
  ['CHAI_0', '0#'],
  ['CHAI_10', '-10#'],
  ['CHAI_20', '-20#'],
  ['CHAI_35', '-35#']
])
let _cookies = []

const initMainData = async () => {
  const url = `${base}/data/initMainData`
  const request = new Request(url)
  const json = await request.loadJSON()
  const { customized } = json
  const { cookies } = request.response
  if (customized) {
    _cookies = cookies
    return [
      await switchProvince({ provinceId: preference.province }),
      await initOilPrice()
    ]
  } else {
    return [
      json,
      await initOilPrice()
    ]
  }
}

const switchProvince = async (params) => {
  const url = `${base}/data/switchProvince`
  const request = new Request(url)
  request.method = 'POST'
  request.headers = {
    'Content-Type': 'application/json;charset=UTF-8',
    Cookie: _cookies.map(({ name, value }) => `${name}=${value}`).join(';\n')
  }
  request.body = JSON.stringify(params)
  const json = await request.loadJSON()
  return json
}

const initOilPrice = async () => {
  const url = `${base}/data/initOilPrice`
  const request = new Request(url)
  const json = await request.loadJSON()
  return json
}

/**
 * @param {WidgetStack} container
 * @param {number[]} history
 */
const addLineChart = async (container, history, color) => {
  const size = new Size(100, 26)
  const image = container.addImage(
    lineChart({
      data: history,
      size,
      lineWidth: 1.5,
      lineColor: color,
      shadowColor: new Color(color.hex, 0.06)
    })
  )
  image.imageSize = size
}

/**
 * @param {WidgetStack} container
 */
const addItem = async (container, data) => {
  const stack = container.addStack()
  stack.centerAlignContent()
  const color = data.offset > 0 ? Color.red() : Color.green()
  const symbol = stack.addText(data.offset > 0 ? '▲' : '▼')
  symbol.font = Font.systemFont(14)
  symbol.textColor = color
  stack.addSpacer(2)
  const name = stack.addText(data.name)
  name.font = Font.semiboldSystemFont(16)
  stack.addSpacer()
  await addLineChart(stack, data.history, color)

  stack.addSpacer(30)
  const priceStack = stack.addStack()
  priceStack.size = new Size(60, -1)
  priceStack.layoutVertically()
  const pStack = priceStack.addStack()
  pStack.addSpacer()
  const price = pStack.addText(`¥ ${data.price}`)
  price.font = Font.semiboldSystemFont(14)
  const oStack = priceStack.addStack()
  oStack.addSpacer()
  const offset = oStack.addText(`${data.offset > 0 ? '+' : ''}${data.offset}`)
  offset.font = Font.mediumSystemFont(12)
  offset.textColor = color
}

const createWidget = async ({ data }, { data: history }) => {
  const { provinceCheck, provinceData } = data
  if (config.widgetFamily === 'large') {
    preference.max = 6
  }
  const widget = new ListWidget()
  widget.setPadding(0, 12, 0, 12)
  widget.backgroundColor = Color.dynamic(new Color('#fff'), new Color('#242426'))
  const promises = []
  for (const [k, name] of names.entries()) {
    if (provinceCheck[k] === 'Y') {
      const key = ({
        CHAI_0: 'CHECHAI_0',
        CHAI_10: 'CHECHAI_10',
        AIPAO95: 'AIPAO_GAS_95',
        AIPAO98: 'AIPAO_GAS_98',
        AIPAOE92: 'AIPAO_GAS_E92',
        AIPAOE95: 'AIPAO_GAS_E95',
        AIPAOE98: 'AIPAO_GAS_E98'
      }[k] || k)
      promises.push(
        (async () => {
          widget.addSpacer()
          await addItem(widget, {
            name,
            price: provinceData[key],
            offset: provinceData[`${key}_STATUS`],
            history: history.provinceData.map((item) => item[key])
          })
        })()
      )
    }
    if (promises.length >= preference.max) break
  }
  await Promise.all(promises)
  widget.addSpacer()
  return widget
}

const showWeb = async () => {
  const wv = new WebView()
  wv.loadURL(base)
  wv.present()
}

await withSettings({
  formItems: [
    {
      name: 'province',
      label: i18n(['Province', '地区']),
      type: 'select',
      options: provinces,
      default: preference.province
    },
    {
      name: 'site',
      label: i18n(['Sinopec', '中国石化']),
      type: 'cell'
    }
  ],
  onItemClick: ({ name }) => {
    if (name === 'site') {
      showWeb()
    }
  },
  render: async ({ settings, family }) => {
    config.widgetFamily = family
    Object.assign(preference, settings)
    await switchProvince({ provinceId: preference.province })
    const [data, history] = await initMainData()
    const widget = await createWidget(data, history)
    return widget
  }
})
