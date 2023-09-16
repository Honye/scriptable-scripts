if (typeof require === 'undefined') require = importModule
const { i18n, phoneSize } = require('./utils.module')
const { withSettings } = require('./withSettings.module')

const preference = {
  cate: '6809637767543259144',
  fontSize: 14,
  /** 行间距 */
  gap: 8,
  tagMax: 2
}
const paddingVertical = 10

const getArticles = async () => {
  const { cate } = preference
  const url = 'https://api.juejin.cn/recommend_api/v1/article/recommend_cate_feed'
  const req = new Request(url)
  req.method = 'POST'
  req.headers = {
    'Content-Type': 'application/json; encoding=utf-8'
  }
  req.body = JSON.stringify({
    id_type: 2,
    cate_id: cate,
    sort_type: 200,
    cursor: '0',
    limit: 20
  })
  const res = await req.loadJSON()
  return res
}

const createWidget = (data) => {
  const { fontSize, gap, tagMax } = preference
  const screen = Device.screenResolution()
  const scale = Device.screenScale()
  const phone = phoneSize(screen.height)
  const { widgetFamily } = config
  const height = (widgetFamily === 'medium' ? phone.small : phone[widgetFamily]) / scale
  const limit = Math.floor((height - paddingVertical * 2 + gap) / (fontSize + gap))
  const { data: articles } = data
  const widget = new ListWidget()
  const paddingY = paddingVertical - (gap / 2)
  widget.setPadding(paddingY, 12, paddingY, 4)
  for (const article of articles.slice(0, limit)) {
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
    for (const tag of tags.slice(0, tagMax)) {
      addTag(stackTags, tag)
    }
    stackArticle.addSpacer()
  }
  return widget
}

const addTag = (widget, tag) => {
  const { fontSize } = preference
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

await withSettings({
  formItems: [
    {
      label: i18n(['Category', '分类']),
      name: 'cate',
      type: 'select',
      options: [
        { label: i18n(['Frond-End', '前端']), value: '6809637767543259144' },
        { label: i18n(['Back-End', '后端']), value: '6809637769959178254' },
        { label: i18n(['Android', '安卓']), value: '6809635626879549454' },
        { label: 'iOS', value: '6809635626661445640' },
        { label: i18n(['AI', '人工智能']), value: '6809637773935378440' },
        { label: i18n(['Tools', '开发工具']), value: '6809637771511070734' },
        { label: i18n(['Coding', '代码人生']), value: '6809637776263217160' },
        { label: i18n(['Reading', '阅读']), value: '6809637772874219534' }
      ],
      default: preference.cate
    },
    {
      label: i18n(['Text size', '字体大小']),
      name: 'fontSize',
      type: 'number',
      default: preference.fontSize
    },
    {
      label: i18n(['Line Spacing', '行间距']),
      name: 'gap',
      type: 'number',
      default: preference.gap
    },
    {
      label: i18n(['Tag max count', '标签最大数量']),
      name: 'tagMax',
      type: 'number',
      default: preference.tagMax
    }
  ],
  render: async ({ family, settings }) => {
    family && (config.widgetFamily = family)
    Object.assign(preference, settings)
    const { cate } = preference
    const data = await getArticles(cate)
    const widget = createWidget(data)
    return widget
  }
})
