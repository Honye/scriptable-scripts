// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: fire;
/** Scoped Keychain */
const KeyStorage = {
  set: (key, value) => {
    return Keychain.set(`$${Script.name()}.${key}`, JSON.stringify(value))
  },
  get: (key) => {
    const _key = `$${Script.name()}.${key}`
    if (Keychain.contains(_key)) {
      return JSON.parse(Keychain.get(_key))
    }
    return
  }
}

/** 微博国际版页面 */
const InternationalScheme = {
  hotSearch: () => 'weibointernational://hotsearch',
  search: (keyword) => `weibointernational://search?keyword=${encodeURIComponent(keyword)}`
}

/** 微博 H5 应用页面 */
const H5Page = {
  hotSearch: () => `https://m.weibo.cn/p/index?containerid=${encodeURIComponent('106003&filter_type=realtimehot')}`,
  search: (keyword) => `https://m.weibo.cn/search?containerid=${encodeURIComponent('100103type=1&t=10&q=' + keyword)}`
}

let conf = {
  /** items count */
  count: KeyStorage.get('count') || 7,
  client: KeyStorage.get('client') || 'h5'
}

const Pages = (() => {
  switch (conf.client) {
    case 'international':
      return InternationalScheme
    case 'h5':
      return H5Page
    default:
  }
})()

const dateFormat = new DateFormatter()
dateFormat.dateFormat = 'HH:mm'
const timeString = dateFormat.string(new Date())

const main = async () => {
  const url = 'https://weibointl.api.weibo.cn/portal.php?ct=feed&a=search_topic'
  const request = new Request(url)
  const data = await request.loadJSON()
  // console.log('国际版微博热搜 ===>')
  console.log(data)
  const widget = await createWidget(data)
  return widget
}

let stackBottom;
let widgetBottom;
const createWidget = async (data) => {
  const widget = new ListWidget()
  widget.url = Pages.hotSearch()
  widget.setPadding(12, 18, 12, 18)
  const max = conf.count
  for (let i = 0; i < max; ++i) {
    const item = data.data[i]
    const logoLines = 2
    if (i === 0) {
      const stack = widget.addStack()
      await addItem(stack, item)
      stack.addSpacer()
      const textTime = stack.addText(`更新于 ${timeString}`)
      textTime.font = Font.systemFont(10)
      textTime.textColor = Color.gray()
    } else if (i < max - logoLines) {
      await addItem(widget, item)
    } else {
      if (!widgetBottom) {
        stackBottom = widget.addStack()
        stackBottom.bottomAlignContent()
        widgetBottom = stackBottom.addStack()
        widgetBottom.layoutVertically()
        addItem(widgetBottom, item)
      } else {
        widgetBottom.addSpacer(5)
        await addItem(widgetBottom, item)
      }
      widgetBottom.length = (widgetBottom.length || 0) + 1
      if (widgetBottom.length === logoLines) {
        stackBottom.addSpacer()
        const imageLogo = stackBottom.addImage(await getImage('https://www.sinaimg.cn/blog/developer/wiki/LOGO_64x64.png'))
        imageLogo.imageSize = new Size(30, 30)
      }
    }
    if (i < max - 1) {
      widget.addSpacer(5)
    }
  }
  return widget
}

const addItem = async (widget, item) => {
  const stack = widget.addStack()
  let [path, queryString] = item.scheme.split('?')
  const query = {}
  // Scriptable url's query must be encoded
  queryString = queryString.split('&').map((item) => {
    const [key, value] = item.split('=')
    query[key] = value
    return `${key}=${encodeURIComponent(value)}`
  }).join('&')
  stack.url = Pages.search(query.keyword)
  stack.centerAlignContent()
  const textIndex = stack.addText(String(item.pic_id))
  textIndex.textColor = Color.yellow()
  stack.addSpacer(4)
  textIndex.font = Font.boldSystemFont(14)
  const textTitle = stack.addText(item.title)
  textTitle.font = Font.systemFont(14)
  textTitle.lineLimit = 1
  if (item.icon) {
    stack.addSpacer(4)
    const imageIcon = stack.addImage(await getImage(item.icon))
    imageIcon.imageSize = new Size(12, 12)
  }
  stack.addSpacer()
}

const getImage = async (url) => {
  const request = new Request(url)
  const image = await request.loadImage()
  return image
}

/** 更新脚本 */
const update = async () => {
  let fm = FileManager.local()
  if (fm.isFileStoredIniCloud(module.filename)) {
    fm = FileManager.iCloud()
  }
  const url = 'https://raw.githubusercontent.com/Honye/scriptable-scripts/master/weibo/Weibo.js'
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

/** Settings */
const settings = async () => {
  const alert = new Alert()
  alert.title = 'Settings'
  alert.message = 
  `1. 设置显示列表项数量
  2. 设置使用什么客户端查看详情（international 或 h5）`
  alert.addTextField('Items count', String(conf.count))
  alert.addTextField('"international"/"h5"', 'h5')
  alert.addCancelAction('Cancel')
  alert.addAction('Confirm')
  const index = await alert.presentAlert()
  switch (index) {
    case 0: {
      // Confirm
      const value = Number(alert.textFieldValue(0)) || conf.count
      KeyStorage.set('count', value)
      const client = alert.textFieldValue(1) || conf.client
      KeyStorage.set('client', client)
      conf.count = value
      conf.client = client
      break
    }
    default:
  }
}

if (config.runsInApp) {
  const actions = ['Preview', 'Settings', 'Update']
  const alert = new Alert()
  alert.message = 'Preview the widget or update the script. Update will override the whole script.'
  for (const action of actions) {
    alert.addAction(action)
  }
  alert.addCancelAction('Cancel')
  const index = await alert.presentSheet()
  switch (actions[index]) {
    case 'Preview':
      break
    case 'Settings':
      await settings()
      break
    case 'Update':
      update()
      return
    default:
      return
  }
}

const widget = await main()
if (config.runsInApp) {
  widget.presentMedium()
}
Script.setWidget(widget)
Script.complete()
