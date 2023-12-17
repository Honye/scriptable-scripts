if (typeof require === 'undefined') require = importModule
const { withSettings } = require('./withSettings.module')
const { addAvatar } = require('./widgets.module')
const { i18n } = require('./utils.module')

const preference = {
  user: 'Honye',
  primaryColorLight: '#333333',
  primaryColorDark: '#ffffff',
  secondaryColorLight: '#808080',
  secondaryColorDark: '#808080'
}

const getProfile = async () => {
  const { user } = preference
  const url = `https://www.imarkr.com/api/github/${user}`
  const request = new Request(url)
  return await request.loadJSON()
}

/**
 * @param {WidgetStack} container
 */
const addCountItem = (container, { icon, num, text }) => {
  const {
    primaryColorLight, primaryColorDark,
    secondaryColorLight, secondaryColorDark
  } = preference
  const { widgetFamily } = config
  let fontSize = 15
  if (widgetFamily === 'small') { fontSize = 12 }
  const stack = container.addStack()
  stack.centerAlignContent()
  const sfs = SFSymbol.named(icon)
  sfs.applyFont(Font.systemFont(fontSize))
  const $icon = stack.addImage(sfs.image)
  $icon.tintColor = Color.dynamic(new Color(secondaryColorLight), new Color(secondaryColorDark))
  $icon.imageSize = new Size(fontSize, fontSize)
  const $num = stack.addText(` ${num} `)
  $num.font = Font.systemFont(fontSize)
  $num.textColor = Color.dynamic(new Color(primaryColorLight), new Color(primaryColorDark))
  if (widgetFamily !== 'small') {
    const $text = stack.addText(text)
    $text.font = Font.systemFont(fontSize)
    $text.textColor = Color.dynamic(new Color(secondaryColorLight), new Color(secondaryColorDark))
  }
}

const render = async () => {
  const {
    user,
    primaryColorLight, primaryColorDark,
    secondaryColorLight, secondaryColorDark
  } = preference
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
  name.textColor = Color.dynamic(new Color(primaryColorLight), new Color(primaryColorDark))
  name.font = Font.mediumSystemFont(16)
  if (widgetFamily === 'small') { name.minimumScaleFactor = 0.6 }
  if (widgetFamily !== 'small') {
    headContent.addSpacer(2)
    const status = headContent.addText(profile.status)
    status.textColor = Color.dynamic(new Color(secondaryColorLight), new Color(secondaryColorDark))
  }

  widget.addSpacer(10)
  const bio = widget.addText(profile.bio)
  bio.minimumScaleFactor = 0.7
  bio.textColor = Color.dynamic(new Color(primaryColorLight), new Color(primaryColorDark))

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
    num: profile.total_stargazer_count,
    text: 'stargazers'
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
    },
    {
      type: 'group',
      name: 'colors',
      label: i18n(['Colors', '颜色']),
      items: [
        {
          label: i18n(['Primary color', '主要颜色']),
          name: 'primaryColorLight',
          type: 'color',
          media: '(prefers-color-scheme: light)',
          default: preference.primaryColorLight
        },
        {
          label: i18n(['Primary color', '主要颜色']),
          name: 'primaryColorDark',
          type: 'color',
          media: '(prefers-color-scheme: dark)',
          default: preference.primaryColorDark
        },
        {
          label: i18n(['Secondary color', '次要颜色']),
          name: 'secondaryColorLight',
          type: 'color',
          media: '(prefers-color-scheme: light)',
          default: preference.secondaryColorLight
        },
        {
          label: i18n(['Secondary color', '次要颜色']),
          name: 'secondaryColorLight',
          type: 'color',
          media: '(prefers-color-scheme: dark)',
          default: preference.secondaryColorDark
        }
      ]
    }
  ],
  async render ({ settings, family }) {
    config.widgetFamily = family ?? config.widgetFamily
    Object.assign(preference, settings)
    return await render()
  }
})
