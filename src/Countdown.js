const { withSettings } = importModule('withSettings.module')

const preference = {
  title: '🇨🇳 Programmer',
  date: '2024-10-24'
}

const addTitle = (widget, { title }) => {
  const headStack = widget.addStack()
  headStack.setPadding(12, 12, 12, 12)
  const bg = new LinearGradient()
  bg.colors = [
    new Color('#9ce4c1'),
    new Color('#92d8e1')
  ]
  bg.locations = [0, 1]
  bg.startPoint = new Point(0, 0)
  bg.endPoint = new Point(1, 0)
  headStack.backgroundGradient = bg
  const titleText = headStack.addText(title)
  titleText.font = Font.semiboldSystemFont(16)
  titleText.textColor = Color.white()
  headStack.addSpacer()
}

const addText = (widget, { text, lineHeight }) => {
  const stack = widget.addStack()
  stack.setPadding(0, 0, 0, 0)
  stack.size = new Size(0, lineHeight)
  return stack.addText(text)
}

const createWidget = () => {
  const { title, date } = preference

  const widget = new ListWidget()
  widget.setPadding(0, 0, 0, 0)
  widget.backgroundColor = Color.white()

  addTitle(widget, { title })
  const bodyStack = widget.addStack()
  bodyStack.layoutVertically()
  bodyStack.setPadding(20, 12, 20, 12)
  bodyStack.addStack().addSpacer()
  bodyStack.addSpacer()
  const bg = new LinearGradient()
  bg.colors = [
    new Color('#fff', 0),
    new Color('#9ce4c1', 0.3)
  ]
  bg.locations = [0, 1]
  bg.startPoint = new Point(0, 0)
  bg.endPoint = new Point(1, 0)
  bodyStack.backgroundGradient = bg

  const days = bodyStack.addStack()
  days.bottomAlignContent()
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const d = Math.ceil((target - now) / (24 * 3600000))
  const num = addText(days, {
    text: `${d}`,
    lineHeight: 50
  })
  num.font = Font.boldSystemFont(50)
  num.textColor = new Color('#373655')
  //   const unit = addText(days,{
  //     text: 'days',
  //     lineHeight: 14
  //   })
  days.addSpacer(4)
  const unit = days.addText('days')
  unit.font = Font.systemFont(18)
  unit.textColor = new Color('#6e6e73')

  bodyStack.addSpacer(8)

  const df = new DateFormatter()
  df.dateFormat = 'yyyy/MM/dd'
  const dateText = bodyStack.addText(df.string(target))
  dateText.font = Font.regularRoundedSystemFont(14)
  dateText.textColor = new Color('#86868b')

  return widget
}

await withSettings({
  formItems: [
    {
      name: 'title',
      label: 'Text',
      default: preference.title
    },
    {
      name: 'date',
      label: 'Date',
      type: 'date',
      default: preference.date
    }
  ],
  render: ({ settings }) => {
    Object.assign(preference, settings)
    const widget = createWidget()
    return widget
  }
})
