const { withSettings } = importModule('./withSettings.module')
const { getImage, i18n, useCache } = importModule('./utils.module')

const preference = {
  apiKey: '',
  titleColor: '#8e8e93',
  contentColor: '#333333'
}
const cache = useCache()

const getBalance = async () => {
  const { apiKey } = preference
  const request = new Request('https://api.openai.com/dashboard/billing/credit_grants')
  request.headers = {
    Authorization: `Bearer ${apiKey}`
  }
  try {
    const json = await request.loadJSON()
    cache.writeJSON('credit_grants.json', json)
    return json
  } catch (e) {
    const json = cache.readJSON('credit_grants.json')
    return json
  }
}

const genSmallBg = () => {
  const image = Image.fromData(Data.fromBase64String(
    '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'
  ))
  return image
}

const addItem = (container, data) => {
  const { titleColor, contentColor } = preference
  const { title, content } = data
  const titleText = container.addText(title)
  titleText.textColor = new Color(titleColor)
  titleText.font = Font.systemFont(14)
  container.addSpacer(2)
  const contentText = container.addText(content)
  contentText.textColor = new Color(contentColor)
  contentText.font = Font.mediumSystemFont(18)
}

const createWidget = async () => {
  const widget = new ListWidget()
  const bg = genSmallBg()
  widget.backgroundImage = bg
  const { grants } = await getBalance()
  const [data] = grants.data
  const { grant_amount, used_amount, expires_at } = data
  addItem(widget, {
    title: '已使用',
    content: `$${used_amount}`
  })
  widget.addSpacer(5)
  addItem(widget, {
    title: '总额',
    content: `$${grant_amount}`
  })
  widget.addSpacer(5)
  addItem(widget, {
    title: '有效时间',
    content: new Date(expires_at * 1000).toLocaleDateString('zh-CN')
  })
  return widget
}

await withSettings({
  formItems: [
    {
      label: 'API Key',
      name: 'apiKey',
      type: 'string',
      default: preference.apiKey
    },
    {
      label: i18n(['Title color', '标题颜色']),
      name: 'titleColor',
      type: 'color',
      default: preference.titleColor
    },
    {
      label: i18n(['Content color', '文字颜色']),
      name: 'contentColor',
      type: 'color',
      default: preference.contentColor
    }
  ],
  async render ({ settings }) {
    Object.assign(preference, settings)
    const widget = await createWidget()
    return widget
  }
})
