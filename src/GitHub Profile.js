const { withSettings } = importModule('withSettings.module')
const { addAvatar } = importModule('widgets.module')
const { i18n } = importModule('utils.module')

const preference = {
  user: 'Honye'
}

const getProfile = async () => {
  const { user } = preference
  const url = `https://www.imarkr.com/api/github/${user}`
  const request = new Request(url)
  return await request.loadJSON()
}

const addCountItem = (container, { icon, num, text }) => {
  const { widgetFamily } = config
  let fontSize = 15
  if (widgetFamily === 'small') { fontSize = 12 }
  const stack = container.addStack()
  stack.centerAlignContent()
  const sfs = SFSymbol.named(icon)
  sfs.applyFont(Font.systemFont(fontSize))
  const $icon = stack.addImage(sfs.image)
  $icon.tintColor = Color.gray()
  $icon.imageSize = new Size(fontSize, fontSize)
  const $num = stack.addText(` ${num} `)
  $num.font = Font.systemFont(fontSize)
  if (widgetFamily !== 'small') {
    const $text = stack.addText(text)
    $text.font = Font.systemFont(fontSize)
    $text.textColor = Color.gray()
  }
}

const render = async () => {
  const { user } = preference
  const profile = await getProfile()

  const { widgetFamily } = config
  const widget = new ListWidget()
  widget.url = `https://github.com/${user}`
  widget.setPadding(15, 15, 15, 15)

  const head = widget.addStack()
  head.centerAlignContent()
  await addAvatar(head, {
    size: 52,
    src: profile.avatar
  })
  head.addSpacer(6)
  const headContent = head.addStack()
  headContent.layoutVertically()
  const name = headContent.addText(profile.name)
  name.textColor = Color.dynamic(new Color('#333'), new Color('#fff'))
  name.font = Font.mediumSystemFont(16)
  if (widgetFamily === 'small') { name.minimumScaleFactor = 0.6 }
  if (widgetFamily !== 'small') {
    headContent.addSpacer(2)
    const status = headContent.addText(profile.status)
    status.textColor = Color.gray()
  }

  widget.addSpacer(10)
  const bio = widget.addText(profile.bio)
  bio.minimumScaleFactor = 0.7
  bio.textColor = Color.dynamic(new Color('#333'), new Color('#fff'))

  widget.addSpacer()
  const counts = widget.addStack()
  counts.centerAlignContent()
  addCountItem(counts, {
    icon: 'person',
    num: profile.followers,
    text: 'followers'
  })
  counts.addSpacer(12)
  addCountItem(counts, {
    icon: 'star',
    num: profile.stars,
    text: 'stars'
  })

  return widget
}

await withSettings({
  formItems: [
    {
      label: i18n(['User', '用户名']),
      name: 'user',
      type: 'input',
      default: preference.user
    }
  ],
  async render ({ settings, family }) {
    config.widgetFamily = family ?? config.widgetFamily
    Object.assign(preference, settings)
    return await render()
  }
})
