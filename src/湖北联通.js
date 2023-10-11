if (typeof require === 'undefined') require = importModule
const { withSettings } = require('./withSettings.module')
const { getImage, i18n, useCache } = require('./utils.module')

const preference = {
  textColorLight: '#222222',
  textColorDark: '#ffffff',
  authorization: '',
  isShowFreeFlow: false
}

const cache = useCache()
const ringStackSize = 61 // 圆环大小
const ringTextSize = 14 // 圆环中心文字大小
const creditTextSize = 21 // 话费文本大小
const databgColor = new Color('12A6E4', 0.3) // 流量环背景颜色
const datafgColor = new Color('12A6E4') // 流量环前景颜色
let dataTextColor = Color.dynamic(
  new Color(preference.textColorLight),
  new Color(preference.textColorDark)
)
const voicebgColor = new Color('F86527', 0.3) // 语音环背景颜色
const voicefgColor = new Color('F86527') // 语音环前景颜色

const dataSfs = SFSymbol.named('antenna.radiowaves.left.and.right')
dataSfs.applyHeavyWeight()
const dataIcon = dataSfs.image
const canvSize = 178
const canvas = new DrawContext()
const canvWidth = 18
const canvRadius = 80

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
  const { balenceData, flowData, voiceData, _state } = data
  const widget = new ListWidget()
  widget.setPadding(16, 16, 16, 16)
  widget.backgroundColor = Color.dynamic(new Color('ffffff'), new Color('242426'))

  const status = _state === 'expired'
    ? 'failed' // 余额信息请求失败，检查授权信息是否有效
    : 'success'
  addStatusDot(widget, status)
  await addLogo(widget, status)
  await renderBalance(widget, balenceData.amount)
  await renderArcs(widget, flowData, voiceData)
  return widget
}

/**
 * 状态显示
 * @param {'waiting'|'success'|'warning'|'failed'} status
 */
const addStatusDot = (widget, status) => {
  const stackStatus = widget.addStack()
  stackStatus.addSpacer()
  const iconStatus = stackStatus.addImage(SFSymbol.named('circle.fill').image)
  iconStatus.imageSize = new Size(6, 6)
  const colors = {
    waiting: Color.gray(),
    success: Color.green(),
    warning: Color.orange(),
    failed: Color.red()
  }
  iconStatus.tintColor = colors[status]
}

const getLogo = async () => {
  const url = 'https://jun.fly.dev/imgs/chinaunicom.png'
  const path = 'chinaunicom.png'
  const cached = cache.readImage(path)
  if (cached) {
    return cached
  }

  const image = await getImage(url)
  cache.writeImage(path, image)
  return image
}

/** 联通 Logo 显示 */
const addLogo = async (widget) => {
  const headerStack = widget.addStack()
  headerStack.addSpacer()
  const logo = headerStack.addImage(await getLogo())
  logo.imageSize = new Size(393 * 0.25, 118 * 0.25)
  headerStack.addSpacer()
  widget.addSpacer()
}

/** 余额显示 */
const renderBalance = async (widget, balance) => {
  const stack = widget.addStack()
  stack.centerAlignContent()
  stack.addSpacer()
  const elText = stack.addText(balance)
  elText.textColor = dataTextColor
  elText.font = Font.mediumRoundedSystemFont(creditTextSize)
  stack.addSpacer()
  widget.addSpacer()
}

/**
 * @param {Data} flowData
 * @param {Data} voiceData
 */
const renderArcs = async (widget, flowData, voiceData) => {
  const bodyStack = widget.addStack()
  bodyStack.layoutVertically()

  canvas.size = new Size(canvSize, canvSize)
  canvas.opaque = false
  canvas.respectScreenScale = true

  const dataGap = (flowData.left / flowData.total * 100) * 3.6
  const voiceGap = (voiceData.left / voiceData.total * 100) * 3.6

  drawArc(dataGap, datafgColor, databgColor)
  const ringStack = bodyStack.addStack()
  const ringLeft = ringStack.addStack()
  ringLeft.layoutVertically()
  ringLeft.size = new Size(ringStackSize, ringStackSize)
  ringLeft.backgroundImage = canvas.getImage()
  await ringContent(
    ringLeft,
    dataIcon,
    datafgColor,
    `${Number((flowData.left / 1024).toFixed(2))}`,
    'GB'
  )
  ringStack.addSpacer()

  drawArc(voiceGap, voicefgColor, voicebgColor)
  const ringRight = ringStack.addStack()
  ringRight.layoutVertically()
  ringRight.size = new Size(ringStackSize, ringStackSize)
  ringRight.backgroundImage = canvas.getImage()
  await ringContent(
    ringRight,
    SFSymbol.named('phone.fill').image,
    voicefgColor,
    `${voiceData.left}`,
    '分钟'
  )
}

function sinDeg (deg) {
  return Math.sin((deg * Math.PI) / 180)
}

function cosDeg (deg) {
  return Math.cos((deg * Math.PI) / 180)
}

function ringContent (widget, icon, iconColor, text, unit) {
  const rowIcon = widget.addStack()
  rowIcon.addSpacer()
  const iconElement = rowIcon.addImage(icon)
  iconElement.tintColor = iconColor
  iconElement.imageSize = new Size(12, 12)
  iconElement.imageOpacity = 0.7
  rowIcon.addSpacer()

  widget.addSpacer(1)

  const rowText = widget.addStack()
  rowText.addSpacer()
  const textElement = rowText.addText(text)
  textElement.textColor = dataTextColor
  textElement.font = Font.mediumSystemFont(ringTextSize)
  rowText.addSpacer()

  const rowUnit = widget.addStack()
  rowUnit.addSpacer()
  const unitElement = rowUnit.addText(unit)
  unitElement.textColor = dataTextColor
  unitElement.font = Font.boldSystemFont(8)
  unitElement.textOpacity = 0.5
  rowUnit.addSpacer()
}

function drawArc (deg, fillColor, strokeColor) {
  const ctr = new Point(canvSize / 2, canvSize / 2)
  const bgx = ctr.x - canvRadius
  const bgy = ctr.y - canvRadius
  const bgd = 2 * canvRadius
  const bgr = new Rect(bgx, bgy, bgd, bgd)

  canvas.setFillColor(fillColor)
  canvas.setStrokeColor(strokeColor)
  canvas.setLineWidth(canvWidth)
  canvas.strokeEllipse(bgr)

  for (let t = 0; t < deg; t++) {
    const rectX = ctr.x + canvRadius * sinDeg(t) - canvWidth / 2
    const rectY = ctr.y - canvRadius * cosDeg(t) - canvWidth / 2
    const rectR = new Rect(rectX, rectY, canvWidth, canvWidth)
    canvas.fillEllipse(rectR)
  }
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
    const { isShowFreeFlow } = preference
    for (const item of addupInfoList) {
      // 语音
      if (item.elemtype === '1') {
        voiceData.left += Number(item.xcanusevalue)
        voiceData.total += Number(item.addupupper)
      }
      // 流量
      if (isShowFreeFlow) {
        if (item.elemtype === '3') {
          flowData.left += Number(item.xcanusevalue)
          flowData.total += Number(item.addupupper)
        }
      } else {
        if (item.elemtype === '3' && item.resourcetype != '13') {
          flowData.left += Number(item.xcanusevalue)
          flowData.total += Number(item.addupupper)
        }
      }
      
    }

    const data = {
      balenceData: balence,
      flowData,
      voiceData
    }
    cache.writeJSON('data.json', data)
    data._state = 'approved'
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
    data._state = 'expired'
    console.warn('==== 数据请求失败，使用缓存数据 ====')
    console.warn(e)
    return data
  }
}

await withSettings({
  formItems: [
    {
      name: 'textColorLight',
      label: i18n(['Text color (light)', '文字颜色（白天）']),
      type: 'color',
      default: preference.textColorLight
    },
    {
      name: 'textColorDark',
      label: i18n(['Text color (dark)', '文字颜色（黑夜）']),
      type: 'color',
      default: preference.textColorDark
    },
    {
      name: 'authorization',
      label: 'Authorization',
      type: 'text',
      default: preference.authorization
    },
    {
      name: 'isShowFreeFlow',
      label: i18n(['Show Free Flow', '显示免流包']),
      type: 'switch',
      default: preference.isShowFreeFlow
    }
  ],
  render: async ({ settings }) => {
    Object.assign(preference, settings)
    const { textColorLight, textColorDark } = preference
    dataTextColor = Color.dynamic(
      new Color(textColorLight),
      new Color(textColorDark)
    )
    const widget = await createWidget()
    return widget
  }
})
