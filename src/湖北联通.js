if (typeof require === 'undefined') require = importModule
const { withSettings } = require('./withSettings.module')
const { i18n, useCache } = require('./utils.module')
const { createWidget: createUI } = require('./Unicom.ui')

const preference = {
  packages: [],
  authorization: ''
}

const cache = useCache()

const hbHeaders = () => {
  let { authorization } = preference
  if (!authorization) {
    try {
      const conf = importModule/* ignore */('Config')['10010']()
      authorization = conf.Authorization
    } catch (e) {
      console.warn('Not set Authorization')
    }
  }
  return {
    zx: '12',
    Authorization: authorization,
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.31(0x18001f2e) NetType/4G Language/en'
  }
}

const createWidget = async () => {
  const data = await getData()
  const { balenceData, flowData, voiceData } = data
  const widget = await createUI({
    hf: balenceData.amount,
    ll: (flowData.left / 1024).toFixed(2),
    totalLl: (flowData.total / 1024).toFixed(2),
    yy: voiceData.left,
    totalYy: voiceData.total
  })
  return widget
}

/**
 * 湖北联通余额
 * @returns {{ amount: string }}
 */
const getBalence = async () => {
  const request = new Request('https://wap.10010hb.net/zinfo/front/user/findFeePackage')
  request.headers = hbHeaders()
  request.method = 'POST'
  const res = await request.loadJSON()
  if (res.success) {
    return res.data
  }
  return Promise.reject(res)
}

/** 套餐余额 */
const getPackageLeft = async () => {
  const request = new Request('https://wap.10010hb.net/zinfo/front/user/findLeftPackage')
  request.headers = hbHeaders()
  request.method = 'POST'
  const res = await request.loadJSON()
  if (res.success) {
    return res.data
  }
  return Promise.reject(res)
}

const getData = async () => {
  try {
    const [balence, packageLeft] = await Promise.all([getBalence(), getPackageLeft()])
    const { addupInfoList } = packageLeft
    const flowData = { left: 0, total: 0 }
    const voiceData = { left: 0, total: 0 }
    const { packages } = preference
    const list = addupInfoList.filter((item) => packages.includes(item.FEE_POLICY_ID))
    for (const item of list) {
      // 语音
      if (item.ELEM_TYPE === '1') {
        voiceData.left += Number(item.X_CANUSE_VALUE)
        voiceData.total += Number(item.ADDUP_UPPER)
      }
      // 流量
      if (item.ELEM_TYPE === '3') {
        flowData.left += Number(item.X_CANUSE_VALUE)
        flowData.total += Number(item.ADDUP_UPPER)
      }
    }

    const data = {
      balenceData: balence,
      flowData,
      voiceData
    }
    cache.writeJSON('data.json', data)
    return data
  } catch (e) {
    /**
     * @type {{
     *  balenceData: { amount: string };
     *  flowData: { left: number, total: number };
     *  voiceData: { left: number, total: number };
     * }}
     */
    const data = cache.readJSON('data.json')
    console.warn('==== 数据请求失败，使用缓存数据 ====')
    console.warn(e)
    return data
  }
}

const { addupInfoList } = await getPackageLeft()
const cellularOptions = []
const voiceOptions = []
for (const item of addupInfoList) {
  const { ELEM_TYPE, FEE_POLICY_ID, FEE_POLICY_NAME } = item
  const option = { label: FEE_POLICY_NAME, value: FEE_POLICY_ID }
  if (ELEM_TYPE === '1') {
    // 语音
    voiceOptions.push(option)
  }
  if (ELEM_TYPE === '3') {
    // 流量
    cellularOptions.push(option)
  }
}

await withSettings({
  formItems: [
    {
      name: 'packages',
      label: i18n(['Packages', '套餐']),
      type: 'multi-select',
      options: [
        {
          label: '流量',
          children: cellularOptions
        },
        {
          label: '语音',
          children: voiceOptions
        }
      ],
      default: preference.packages
    },
    {
      name: 'authorization',
      label: 'Authorization',
      type: 'text',
      default: preference.authorization
    }
  ],
  render: async ({ settings }) => {
    Object.assign(preference, settings)
    const widget = await createWidget()
    return widget
  }
})
