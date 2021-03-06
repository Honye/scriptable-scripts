// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: phone-volume;

/**
 * 中国联通信息展示和自动签到
 * 
 * 中国联通手机营业厅的 URL Scheme：`chinaunicom://`，可用于点击小组件打开手机营业厅客户端
 * 
 */

const files = FileManager.local()
/**
 * 修改为你的 cookie，cookie 获取方法，需安装 Stream 在联通客户端中进行抓包
 * 
 * 为方便多手机号使用多个组件优先采用本文件配置，其次使用 Config.js 配置
 */
let conf = {
  phone: '', // 联通手机号
  clientCookie: '', // m.client.10010.com API cookie
  actionCookie: '' // act.10010.com API cookie
}
if (!conf.phone) {
  try {
    conf = importModule('Config')['10010']()
  } catch (e) {
    console.error(e)
  }
}
const Tel = conf.phone
const clientCookie = conf.clientCookie
const Cookie = conf.actionCookie
const ringStackSize = 61 // 圆环大小
const ringTextSize = 14 // 圆环中心文字大小
const creditTextSize = 21 // 话费文本大小
const textSize = 13 // 文字模式下文字大小
const databgColor = new Color("12A6E4", 0.3) // 流量环背景颜色
const datafgColor = new Color("12A6E4") // 流量环前景颜色
const dataTextColor = Color.dynamic(Color.black(), Color.white())
const voicebgColor = new Color("F86527", 0.3) // 语音环背景颜色
const voicefgColor = new Color("F86527") // 语音环前景颜色
const newBG = 0  //是否设置或者使用新的背景图片，若要设置背景图片，请勿将下一行值设为true
const removeBG = 0 //是否需要清空背景图片，如果设置过背景图片，想再使用纯色背景，需将此设置为true清除背景图片缓存

const dataSfs = SFSymbol.named("antenna.radiowaves.left.and.right")
dataSfs.applyHeavyWeight()
const dataIcon = dataSfs.image
const iconColor = new Color("FE8900")
const canvSize = 178
const canvTextSize = 45
const canvas = new DrawContext()
const canvWidth = 18
const canvRadius = 80
const widget = new ListWidget()
widget.url = 'chinaunicom://' // 打开联通客户端
widget.setPadding(16, 16, 16, 16) // widget边距（上，下，左，右）

const main = async () => {
  if (config.runsInWidget) {
    render()
    return
  }
  
  const actions = ['Preview', 'Update']
  const alert = new Alert()
  alert.message = 'Preview the widget or update the script. Update will override the whole script.'
  for (const action of actions) {
    alert.addAction(action)
  }
  alert.addCancelAction('Cancel')
  const index = await alert.presentSheet()
  switch (actions[index]) {
    case 'Preview':
      render()
      break
    case 'Update':
      update()
      break
    default:
  }
}

const render = async () => {
  const data = await getData()
  /** [话费, 流量, 语音] */
  const [phoneData, credit, voice] = data.data.dataList
  await setBackground()
  await renderLogo(data)
  await renderBalance(phoneData)
  await renderArcs(credit, voice)

  if (!config.runsInWidget) {
    await widget.presentSmall()
  }
  Script.setWidget(widget)
  Script.complete()
}

// ############背景设置############
const appDir = files.joinPath(files.documentsDirectory(), Script.name())
const bgPath = files.joinPath(appDir, 'background')

const setBackground = () => {
  widget.backgroundColor = Color.dynamic(new Color("ffffff"), new Color("2b2b2b"))
  if (removeBG) {
    return rmBgImg()
  }
  return setBgImg()
}

/** 设置小组件背景 */
const setBgImg = async () => {
  if (newBG && config.runsInApp) {
    const img = await Photos.fromLibrary()
    widget.backgroundImage = img
    if (!files.fileExists(appDir)) {
      files.createDirectory(appDir, true)
    }
    files.writeImage(bgPath, img)
  } else {
    if (files.fileExists(bgPath)) { 
      try {
        widget.backgroundImage = files.readImage(bgPath)
        log("读取图片成功")
      } catch (e){
        log(e.message)
      }  
    }
  }
}

/** 删除小组件自定义背景图 */
async function rmBgImg () {
  if (files.fileExists(bgPath)) {
    try {
      files.remove(bgPath)
      log("背景图片清理成功")
    } catch (e) {
      log(e.message)
    }
  }
}

/** 联通 Logo 显示 */
const renderLogo = async ({signinState, _state}) => {
  const stackStatus = widget.addStack()
  stackStatus.addSpacer() 
  const iconStatus = stackStatus.addImage(SFSymbol.named('circle.fill').image)
  iconStatus.imageSize = new Size(6, 6)
  iconStatus.tintColor = _state === 'expired'
    ? Color.red()
    : _state === 'signin_failed'
      ? Color.orange()
      : signinState === '1'
        ? Color.gray()
        : Color.green()
  const cuIconUrl = "https://vkceyugu.cdn.bspapp.com/VKCEYUGU-imgbed/f77d3cdc-b757-4acd-9766-a64421bf0c6d.png"
  const headerStack = widget.addStack()
  headerStack.addSpacer()
  const logo = headerStack.addImage(await getImg(cuIconUrl))
  logo.imageSize = new Size(393 * 0.25, 118 * 0.25)
  headerStack.addSpacer()
  widget.addSpacer()
}

/** 余额显示 */
const renderBalance = async (data) => {
  const stack = widget.addStack()
  stack.centerAlignContent()
  stack.addSpacer()
  const elText = stack.addText(data.number)
  elText.textColor = dataTextColor
  elText.font = Font.mediumRoundedSystemFont(creditTextSize)
  stack.addSpacer()
  widget.addSpacer()
}

const renderArcs = async (flowData, voiceData) => {
  const bodyStack = widget.addStack()
  bodyStack.layoutVertically()

  canvas.size = new Size(canvSize, canvSize)
  canvas.opaque = false
  canvas.respectScreenScale = true

  const dataGap = (100 - flowData.persent) * 3.6
  const voiceGap = (100 - voiceData.persent) * 3.6

  drawArc(dataGap, datafgColor, databgColor)
  let ringStack = bodyStack.addStack()
  let ringLeft = ringStack.addStack()
  ringLeft.layoutVertically()
  ringLeft.size = new Size(ringStackSize, ringStackSize)
  ringLeft.backgroundImage = canvas.getImage()
  await ringContent(ringLeft, dataIcon, datafgColor, flowData.number, flowData.unit);
  ringStack.addSpacer()

  drawArc(voiceGap, voicefgColor, voicebgColor)
  let ringRight = ringStack.addStack()
  ringRight.layoutVertically()
  ringRight.size = new Size(ringStackSize, ringStackSize)
  ringRight.backgroundImage = canvas.getImage()
  await ringContent(
    ringRight,
    SFSymbol.named("phone.fill").image,
    voicefgColor,
    voiceData.number,
    voiceData.unit
  )
}

async function getImg(url) {
  const req = new Request(url)
  const img = await req.loadImage()
  return img
}

function sinDeg	(deg) {
    return Math.sin((deg * Math.PI) / 180)
  }

function cosDeg(deg) {
    return Math.cos((deg * Math.PI) / 180)
  }

function ringContent(widget, icon, iconColor, text, unit){
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
  textElement.textColor = dataTextColor;
  textElement.font = Font.mediumSystemFont(ringTextSize)
  rowText.addSpacer()
  
  const rowUnit = widget.addStack()
  rowUnit.addSpacer()
  const unitElement = rowUnit.addText(unit)
  unitElement.textColor = dataTextColor;
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
    rect_x = ctr.x + canvRadius * sinDeg(t) - canvWidth / 2
    rect_y = ctr.y - canvRadius * cosDeg(t) - canvWidth / 2
    rect_r = new Rect(rect_x, rect_y, canvWidth, canvWidth)
    canvas.fillEllipse(rect_r)
  }
}

const getData = async () => {
  const cachePath = files.joinPath(files.documentsDirectory(), "Chinaunicom-anker")
  const headers = {
    'User-Agent':'ChinaUnicom4.x/1.0 CFNetwork/1220.1 Darwin/20.3.0'
  }

  const url= 'https://m.client.10010.com/mobileserviceimportant/home/queryUserInfoSeven?version=iphone_c@8.0102&desmobiel='+Tel+'&showType=0'
  const req = new Request(url)
  req.headers = {
    ...headers,
    cookie: clientCookie,
  }
  try {
    const data = await req.loadJSON()
    console.log("余额信息请求成功 => ")
    // console.log(data)
    if (data.code === 'Y') {
      data._state = 'approved' // 正常通过请求
      files.writeString(cachePath, JSON.stringify(data))
    } else {
      throw data.message
    }
    if (data.signinState === '1') {
      // case '0'：已签到；'1'：未签到
      const url1 = 'https://act.10010.com/SigninApp/signin/daySign'
      const req1 = new Request(url1)
      req1.headers = {
        ...headers,
        cookie: Cookie,
        Host: 'act.10010.com'
      }
      try {
        const data1 = await req1.loadJSON()
        console.log("签到信息请求成功 => ")
        // console.log(data1)
        if (data1.status === '0000') {
          data.signinState = '0'
        } else {
          throw data1.msg
        }
      } catch (e) {
        console.warn('=== 签到失败 ===')
        console.warn(e)
        data._state = 'signin_failed' // 签到失败的
      }
    }
    return data
  } catch (e) {
    const data = JSON.parse(files.readString(cachePath))
    data._state = 'expired' // 缓存的数据
    console.warn("=== 数据请求失败，使用缓存数据 ===")
    console.warn(e)
    return data
  }
}

/** 更新脚本 */
const update = async () => {
  let fm = FileManager.local()
  if (fm.isFileStoredIniCloud(module.filename)) {
    fm = FileManager.iCloud()
  }
  const url = 'https://raw.githubusercontent.com/Honye/scriptable-scripts/master/10010/10010.js'
  const request = new Request(url)
  try {
    const code = await request.loadString()
    fm.writeString(module.filename, code)
    const alert = new Alert()
    alert.message = 'The code has been updated. If the script is open, close it for the change to take effect.'
    alert.addAction('OK')
    alert.presentAlert()
  } catch (e) {
    console.error(e)
  }
}

main()
