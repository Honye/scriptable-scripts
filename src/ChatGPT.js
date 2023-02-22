const { withSettings } = importModule('withSettings.module')
const { getImage, i18n } = importModule('utils.module')

const preference = {
  prompt: '讲个笑话',
  fontSize: 14,
  showPrompt: true,
  useImageAPI: false,
  apiKey: '',
  model: 'text-davinci-003'
}

/**
 * @param {object} options
 * @param {string} options.url
 * @param {any} options.data
 */
const request = async ({ url, data }) => {
  const { apiKey } = preference
  const req = new Request(`https://api.openai.com/v1${url}`)
  req.method = 'POST'
  req.headers = {
    'Content-Type': 'application/json',
    Authorization: apiKey ? `Bearer ${apiKey}` : undefined
  }
  req.body = JSON.stringify(data)
  const json = await req.loadJSON()
  if (json.error) {
    return Promise.reject(json.error)
  }
  return json
}

const fetchAnswer = async () => {
  const { prompt, model } = preference
  const json = await request({
    url: '/completions',
    data: {
      model,
      prompt,
      temperature: 1,
      top_p: 1,
      max_tokens: 500
    }
  })
  return json
}

const createImage = async () => {
  const { prompt } = preference
  const json = await request({
    url: '/images/generations',
    data: {
      prompt,
      n: 1,
      size: '512x512'
    }
  })
  return json
}

/**
 * @param {string} message
 */
const createErrorWidget = (message) => {
  const widget = new ListWidget()
  widget.addText(message).textColor = Color.red()
  return widget
}

const createImageWidget = async () => {
  const { prompt, showPrompt, fontSize } = preference
  const { data } = await createImage()
  const [{ url }] = data
  const widget = new ListWidget()
  widget.url = url
  widget.backgroundImage = await getImage(url)
  if (showPrompt) {
    const promptText = widget.addText(prompt)
    promptText.font = Font.systemFont(fontSize)
    promptText.textColor = Color.gray()
    promptText.shadowColor = new Color(Color.gray().hex, 0.25)
    promptText.shadowRadius = 0.5
    promptText.shadowOffset = new Point(1, 1)
    widget.addSpacer()
  }
  return widget
}

const createWidget = async () => {
  const { apiKey, fontSize, showPrompt, useImageAPI } = preference
  if (!apiKey) {
    return createErrorWidget(i18n(['Have to enter API Key', '必须填写 API Key']))
  }

  if (useImageAPI) {
    return await createImageWidget()
  }

  const { choices } = await fetchAnswer()
  const widget = new ListWidget()
  if (showPrompt) {
    const promptText = widget.addText(preference.prompt)
    promptText.font = Font.systemFont(fontSize)
    promptText.textColor = Color.gray()
    widget.addSpacer(fontSize)
  }
  const contentText = widget.addText(choices[0].text.trim())
  contentText.font = Font.systemFont(fontSize)
  contentText.minimumScaleFactor = 0.8
  return widget
}

await withSettings({
  formItems: [
    {
      label: i18n(['Prompt', '提示']),
      name: 'prompt',
      default: preference.prompt
    },
    {
      label: i18n(['Font size', '字体大小']),
      name: 'fontSize',
      type: 'number',
      default: preference.fontSize
    },
    {
      label: i18n(['Show prompt', '显示提示']),
      name: 'showPrompt',
      type: 'switch',
      default: preference.showPrompt
    },
    {
      label: 'API',
      type: 'group',
      items: [
        {
          label: i18n(['Use Image API', 'AI 图片']),
          name: 'useImageAPI',
          type: 'switch',
          default: preference.useImageAPI
        },
        {
          label: 'API Key',
          name: 'apiKey',
          default: preference.apiKey
        },
        {
          label: i18n(['Model', '训练模型']),
          name: 'model',
          default: preference.model
        }
      ]
    }
  ],
  render: async ({ settings }) => {
    Object.assign(preference, settings)
    const widget = await createWidget()
    return widget
  }
})
