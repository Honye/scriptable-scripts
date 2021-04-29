const widget = new ListWidget()

const main = async () => {
  if (config.runsInWidget) {
    await render()
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
      await render()
      break
    case 'Update':
      await update()
      break
    default:
  }
}

const render = async () => {
  const fmt = new DateFormatter()
  fmt.dateFormat = 'yyyy-MM-dd'
  const date = fmt.string(new Date())
  const url = `https://frodo.douban.com/api/v2/calendar/today?apikey=0ab215a8b1977939201640fa14c66bab&date=${date}&alt=json&_sig=tuOyn%2B2uZDBFGAFBLklc2GkuQk4%3D&_ts=1610703479`
  const request = new Request(url)
  request.headers = {
    'User-Agent': 'api-client/0.1.3 com.douban.frodo/6.50.0'
  }
  const data = await request.loadJSON()
  // console.log(data)
  
  const widgetFamily = config.widgetFamily
  switch (widgetFamily) {
    case 'small':
      await renderSmall(data)
     break
    case 'medium':
      await renderMedium(data)
      break
    default:
      await renderMedium(data)
  }
}

const renderSmall = async (data) => {
  widget.url = data.subject.url
  widget.setPadding(8, 8, 16, 8)
  const image = await getImage(data.comment.poster)
  widget.backgroundImage = await shadowImage(image)
  widget.addSpacer()
  const textTitle = widget.addText(`《${data.subject.title}》`)
  textTitle.font = Font.boldSystemFont(15)
  textTitle.textColor = Color.white()
  textTitle.lineLimit = 1
  textTitle.minimumScaleFactor = 0.5
  widget.addSpacer(5)
  const stackRating = widget.addStack()
  stackRating.addSpacer(6)
  await widgetRating(stackRating, data)
  stackRating.addSpacer()
  if (!config.runsInWidget) {
    await widget.presentSmall()
  }
}

const renderMedium = async (data) => {
  widget.url = data.subject.url
  widget.setPadding(8, 8, 16, 8)
  const image = await getImage(data.comment.poster)
  widget.backgroundImage = await shadowImage(image)
  widget.addSpacer()
  const stackRating = widget.addStack()
  stackRating.centerAlignContent()
  const textTitle = stackRating.addText(`《${data.subject.title}》`)
  textTitle.font = Font.boldSystemFont(15)
  textTitle.textColor = Color.white()
  textTitle.lineLimit = 1
  textTitle.minimumScaleFactor = 0.5
  await widgetRating(stackRating, data)
  stackRating.addSpacer()
  widget.addSpacer(5)
  const stackContent = widget.addStack()
  stackContent.addSpacer(6)
  const textContent = stackContent.addText(`“${data.comment.content}”`)
  textContent.font = Font.boldSystemFont(12)
  textContent.textColor = Color.white()
  textContent.lineLimit = 2
  textContent.minimumScaleFactor = 0.5
  if (!config.runsInWidget) {
    await widget.presentMedium()
  }
}

const widgetRating = async (widget, data) => {
  const stack = widget.addStack()
  stack.size = new Size(64, 15)
  stack.backgroundColor = new Color('#feac2d')
  stack.cornerRadius = 7.5
  stack.centerAlignContent()
  const ratingText = data.subject.rating === null ? '无' : data.subject.rating.value
  const textTitle = stack.addText(`豆瓣评分 ${ratingText}`)
  textTitle.font = Font.boldSystemFont(9)
  textTitle.textColor = Color.black()
  textTitle.lineLimit = 1
  textTitle.minimumScaleFactor = 0.5
}

const getImage = async (url) => {
  const request = new Request(url)
  const image = await request.loadImage()
  return image
}

const shadowImage = async (image) => {
  const size = image.size
  const ctx = new DrawContext()
  ctx.size = size
  ctx.drawImageInRect(image, new Rect(0, 0, size.width, size.height))
  ctx.setFillColor(new Color("#000000", 0.2))
  ctx.fillRect(new Rect(0, 0, size.width, size.height))
  const res = await ctx.getImage()
  return res
}

/** 更新脚本 */
const update = async () => {
  let fm = FileManager.local()
  if (fm.isFileStoredIniCloud(module.filename)) {
    fm = FileManager.iCloud()
  }
  const url = 'https://raw.githubusercontent.com/Honye/scriptable-scripts/master/douban/Douban.js'
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

await main()
Script.setWidget(widget)
Script.complete()
