const { phoneSize } = importModule('utils.module')
const { addAvatar, useGrid } = importModule('widgets.module')

let user = 'Honye'
let columns = 20
const widgetFamily = config.widgetFamily || 'medium'
let theme = 'system'
const themes = {
  dark: {
    background: new Color('#242426', 1),
    colors: ['#45454a', '#9be9a8', '#40c463', '#30a14e', '#216e39']
  },
  light: {
    background: new Color('#ffffff', 1),
    colors: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']
  }
}
if (config.runsInWidget) {
  [
    user = user,
    theme = theme
  ] = (args.widgetParameter || '')
    .split(',')
    .map(item => item.trim() || undefined)
  columns = widgetFamily === 'small' ? 9 : columns
}
const gap = { x: 3, y: 2 }

const screen = Device.screenResolution()
const scale = Device.screenScale()
const widgetWidth = phoneSize(screen.height)[widgetFamily === 'large' ? 'medium' : widgetFamily] / scale
const rectWidth = (widgetWidth - 24 - gap.x * (columns - 1)) / columns
const url = `https://www.imarkr.com/api/github/${user}`

const widget = new ListWidget()
widget.url = `https://github.com/${user}`
widget.backgroundColor = theme === 'system'
  ? Color.dynamic(
    themes.light.background,
    themes.dark.background
  )
  : themes[theme].background

const req = new Request(url)
const resp = await req.loadJSON()

const avatar = resp.avatar
const name = resp.name || user
const countText = `${resp.contributions_count} contributions`
const colorsData = resp.contributions.slice(-(columns * 7 - 7 + new Date().getDay() + 1)).map((item) => item.level)

const head = widget.addStack()
head.layoutHorizontally()
head.centerAlignContent()

// avatar
await addAvatar(head, { src: avatar, size: 20 })
head.addSpacer(3)

// user name
const textName = head.addText(name.toUpperCase())
textName.font = Font.boldSystemFont(13)
textName.textColor = new Color('#aeaeb7', 1)
head.addSpacer(3)

// contributions count, would not show on small
if (widgetFamily !== 'small') {
  const textCount = head.addText(`(${countText})`.toUpperCase())
  textCount.font = Font.systemFont(12)
  textCount.textColor = new Color('#aeaeb7', 1)
}

widget.addSpacer(10)

const gridStack = widget.addStack()
const { add } = await useGrid(gridStack, {
  direction: 'vertical',
  column: 7,
  gap: [gap.y, gap.x]
})
const addItem = (stack, level) => {
  const rect = stack.addStack()
  rect.size = new Size(rectWidth, rectWidth)
  rect.cornerRadius = 2
  rect.backgroundColor = theme === 'system'
    ? Color.dynamic(
      new Color(themes.light.colors[level], 1),
      new Color(themes.dark.colors[level], 1)
    )
    : new Color(themes[theme].colors[level], 1)
}
for (const level of colorsData) {
  await add((stack) => addItem(stack, level))
}

Script.setWidget(widget)
widget.presentMedium()
