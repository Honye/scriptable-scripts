import { phoneSize } from './utils/utils'

const fontSize = 14
const gap = 8
const paddingVertical = 10
const themes = {
  dark: {
    background: new Color('#242426', 1)
  },
  light: {
    background: new Color('#ffffff', 1)
  }
}
themes.system = Color.dynamic(themes.light.background, themes.dark.background)

const categories = {
  be: { id: '6809637769959178254', title: '后端' },
  fe: { id: '6809637767543259144', title: '前端' },
  android: { id: '6809635626879549454', title: 'Android' },
  ios: { id: '6809635626661445640', title: 'iOS' },
  ai: { id: '6809637773935378440', title: '人工智能' },
  tools: { id: '6809637771511070734', title: '开发工具' },
  coding: { id: '6809637776263217160', title: '代码人生' },
  reading: { id: '6809637772874219534', title: '阅读' }
}

/**
 * @param {string} cateID
 */
const getArticles = async (cateID) => {
  const screen = Device.screenResolution()
  const scale = Device.screenScale()
  const phone = phoneSize(screen.height)
  const widgetFamily = config.widgetFamily || 'medium'
  const height = (widgetFamily === 'medium' ? phone.small : phone[widgetFamily]) / scale
  const limit = Math.floor((height - paddingVertical * 2 + gap) / (fontSize + gap))

  const url = 'https://api.juejin.cn/recommend_api/v1/article/recommend_cate_feed'
  const req = new Request(url)
  req.method = 'POST'
  req.headers = {
    'Content-Type': 'application/json; encoding=utf-8'
  }
  req.body = JSON.stringify({
    id_type: 2,
    cate_id: cateID,
    sort_type: 200,
    cursor: '0',
    limit
  })
  const res = await req.loadJSON()
  return res
}

const createWidget = (data) => {
  const { data: articles } = data
  const widget = new ListWidget()
  widget.backgroundColor = themes.system
  const paddingY = paddingVertical - (gap / 2)
  widget.setPadding(paddingY, 12, paddingY, 12)
  for (const [, article] of articles.entries()) {
    const { article_info: info, tags } = article
    const stackArticle = widget.addStack()
    stackArticle.url = `https://juejin.cn/post/${info.article_id}`
    stackArticle.size = new Size(-1, fontSize + gap)
    stackArticle.centerAlignContent()
    const textTitle = stackArticle.addText(info.title)
    textTitle.font = Font.systemFont(fontSize)
    // Tags 最多显示2个标签
    stackArticle.addSpacer(6)
    const stackTags = stackArticle.addStack()
    stackTags.centerAlignContent()
    stackTags.spacing = 3
    for (const tag of tags.slice(0, 2)) {
      addTag(stackTags, tag)
    }
  }
  return widget
}

const addTag = (widget, tag) => {
  const stack = widget.addStack()
  stack.backgroundColor = new Color(tag.color)
  stack.centerAlignContent()
  stack.setPadding(0, 4, 0, 4)
  stack.size = new Size(-1, fontSize)
  stack.cornerRadius = 7
  const textTag = stack.addText(tag.tag_name)
  textTag.centerAlignText()
  textTag.textColor = Color.white()
  textTag.font = Font.lightSystemFont(fontSize * 0.7)
}

const main = async () => {
  let cateID = categories.fe.id
  if (config.runsInWidget) {
    const [cate] = (args.widgetParameter || '').split(',').map(text => text.trim())
    if (cate) {
      cateID = categories[cate] ? categories[cate].id : cate
    }
  }
  const data = await getArticles(cateID)
  const widget = createWidget(data)
  if (config.runsInApp) {
    widget.presentMedium()
  }
  Script.setWidget(widget)
  Script.complete()
}

await main()
