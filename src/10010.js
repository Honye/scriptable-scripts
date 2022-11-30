const { withSettings } = importModule('withSettings.module')
const { getImage, updateCode, useCache } = importModule('utils.module')

/**
 * 修改为你的 cookie，cookie 获取方法，需在联通客户端中进行抓包
 *
 * 为方便多手机号使用多个组件优先采用本文件配置，其次使用 Config.js 配置
 */
let conf = {
  /** 手机号 */
  phone: '',
  /** m.client.10010.com API cookie */
  clientCookie: '',
  /** act.10010.com API cookie  */
  actionCookie: ''
}
const preference = {
  textColorLight: '#222222',
  textColorDark: '#ffffff',
  /** 签到时间 */
  checkInAfter: '10:10'
}
if (!conf.phone) {
  try {
    conf = importModule/* ignore */('Config')['10010']()
  } catch (e) {
    console.error(e)
  }
}
const cache = useCache()
const Tel = conf.phone
const clientCookie = conf.clientCookie
const Cookie = conf.actionCookie
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

const createWidget = async () => {
  const data = await getData()
  /** [话费, 流量, 语音] */
  const [phoneData, credit, voice] = data.data.dataList
  const widget = new ListWidget()
  // widget.url = 'chinaunicom://'
  widget.setPadding(16, 16, 16, 16)
  widget.backgroundColor = Color.dynamic(new Color('ffffff'), new Color('242426'))

  const { signinState, _state } = data
  const status = _state === 'expired'
    ? 'failed'
    : _state === 'signin_failed'
      ? 'warning'
      : signinState === '1'
        ? 'waiting'
        : 'success'
  await renderLogo(widget, status)
  await renderBalance(widget, phoneData.number)
  await renderArcs(widget, credit, voice)
  return widget
}

/**
 * 联通 Logo 显示
 * @param {'waiting'|'success'|'warning'|'failed'} status
 */
const renderLogo = async (widget, status) => {
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
  const cuIconUrl = 'https://jun.fly.dev/imgs/chinaunicom.png'
  const headerStack = widget.addStack()
  headerStack.addSpacer()
  const logo = headerStack.addImage(await getImage(cuIconUrl))
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
 * @typedef {object} Data
 * @property {number} number
 * @property {string} unit
 * @property {number} percent
 */

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

  const dataGap = (100 - flowData.persent) * 3.6
  const voiceGap = (100 - voiceData.persent) * 3.6

  drawArc(dataGap, datafgColor, databgColor)
  const ringStack = bodyStack.addStack()
  const ringLeft = ringStack.addStack()
  ringLeft.layoutVertically()
  ringLeft.size = new Size(ringStackSize, ringStackSize)
  ringLeft.backgroundImage = canvas.getImage()
  await ringContent(ringLeft, dataIcon, datafgColor, flowData.number, flowData.unit)
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
    voiceData.number,
    voiceData.unit
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

const daySign = async () => {
  const url = 'https://act.10010.com/SigninApp/signin/daySign'
  const req = new Request(url)
  req.headers = {
    'User-Agent': 'ChinaUnicom4.x/1.0 CFNetwork/1220.1 Darwin/20.3.0',
    cookie: Cookie,
    Host: 'act.10010.com'
  }
  const data = await req.loadJSON()
  if (data.status === '0000' || (data.msg || '').includes('已经签到')) {
    return data
  }
  return Promise.reject(data.msg)
}

const getData = async () => {
  const headers = {
    'User-Agent': 'ChinaUnicom4.x/1.0 CFNetwork/1220.1 Darwin/20.3.0'
  }

  const url = 'https://m.client.10010.com/mobileserviceimportant/home/queryUserInfoSeven?version=iphone_c@9.0500&desmobiel=' + Tel + '&showType=0'
  const req = new Request(url)
  req.headers = {
    ...headers,
    cookie: clientCookie
  }
  try {
    // FIXME 联通已限制 IP 访问次数
    const data = await req.loadJSON()
    console.log('余额信息请求成功 => ')
    if (data.code === 'Y') {
      data._state = 'approved' // 正常通过请求
      cache.writeJSON('data.json', data)
    } else {
      throw data.message
    }

    const { checkInAfter } = preference
    const checkInDate = new Date()
    checkInDate.setHours(...(checkInAfter.split(':')))
    const date = new Date()
    if (
      date.getTime() > checkInDate.getTime() &&
      data.signinState === '1'
    ) {
      // case '0'：已签到；'1'：未签到
      await daySign()
        .then(() => {
          console.log('签到信息请求成功 => ')
          data.signinState = '0'
        })
        .catch((e) => {
          console.warn('=== 签到失败 ===')
          console.warn(e)
          data._state = 'signin_failed' // 签到失败的
        })
    }
    return data
  } catch (e) {
    const data = cache.readJSON('data.json')
    data._state = 'expired' // 缓存的数据
    console.warn('=== 数据请求失败，使用缓存数据 ===')
    console.warn(e)
    return data
  }
}

await withSettings({
  formItems: [
    {
      name: 'textColorLight',
      label: 'Text color (light)',
      type: 'color',
      default: preference.textColorLight
    },
    {
      name: 'textColorDark',
      label: 'Text color (dark)',
      type: 'color',
      default: preference.textColorDark
    },
    {
      name: 'checkInAfter',
      label: 'Check in after time',
      type: 'time',
      default: '10:10'
    },
    {
      name: 'updateCode',
      label: 'Update code',
      type: 'cell'
    }
  ],
  onItemClick: async (item) => {
    const { name } = item
    if (name === 'updateCode') {
      const alert = new Alert()
      alert.message = 'Update will override the whole script.'
      alert.addAction('Update')
      alert.addCancelAction('Cancel')
      const index = await alert.presentSheet()
      switch (index) {
        case 0:
          updateCode({
            fileURL: 'https://raw.githubusercontent.com/Honye/scriptable-scripts/master/dist/10010.js'
          })
          break
        default:
      }
    }
  },
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
