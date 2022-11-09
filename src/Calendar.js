const { phoneSize, tintedImage, isSameDay, isToday } = importModule('utils.module')
const { useGrid } = importModule('widgets.module')
const { sloarToLunar } = importModule('lunar.module')

const today = new Date()
const firstDay = (() => {
  const date = new Date(today)
  date.setDate(1)
  return date
})()
const lastDay = (() => {
  const date = new Date(today)
  date.setMonth(date.getMonth() + 1, 0)
  return date
})()
let dates = []
let calendar
const [calendarTitle, symbolName, theme] = (args.widgetParameter || '').split(',').map((text) => text.trim())
if (calendarTitle) {
  calendar = await Calendar.forEventsByTitle(calendarTitle)
  const events = await CalendarEvent.between(firstDay, lastDay, [calendar])
  dates = events.map((item) => item.startDate)
}

const titleSize = 12
const columnGap = 2
const rowGap = 2

const addCalendar = async (container, options = {}) => {
  const {
    itemWidth = 18,
    fontSize = 10,
    gap = [columnGap, rowGap],
    addWeek,
    addDay
  } = options
  const stack = container.addStack()
  const { add } = await useGrid(stack, {
    column: 7,
    gap
  })
  const _addItem = (stack, { text, color } = {}) => {
    const item = stack.addStack()
    item.size = new Size(itemWidth, itemWidth)
    item.cornerRadius = itemWidth / 2
    item.centerAlignContent()
    if (text) {
      const textInner = item.addText(text)
      textInner.font = Font.semiboldSystemFont(fontSize)
      textInner.lineLimit = 1
      textInner.minimumScaleFactor = 0.2
      textInner.textColor = theme === 'light'
        ? Color.black()
        : theme === 'dark'
          ? Color.white()
          : Color.dynamic(Color.black(), Color.white())
      if (color) {
        textInner.textColor = color
      }
      item.$text = textInner
    }

    return item
  }
  const _addWeek = (stack, { day }) => {
    const sunday = new Date('1970/01/04')
    const weekFormat = new Intl.DateTimeFormat([], { weekday: 'narrow' }).format

    return _addItem(stack, {
      text: weekFormat(new Date(sunday.getTime() + day * 86400000)),
      color: (day === 0 || day === 6) && Color.gray()
    })
  }
  const _addDay = (stack, { date }) => {
    const item = _addItem(stack, {
      text: `${date.getDate()}`,
      color: (() => {
        const week = date.getDay()
        if (isToday(date)) {
          return Color.white()
        }
        return (week === 0 || week === 6) && Color.gray()
      })()
    })
    if (isToday(date)) {
      item.backgroundColor = Color.red()
    }

    return item
  }
  for (let i = 0; i < 7; i++) {
    await add((stack) => _addWeek(stack, { day: i }))
  }
  for (let i = 0; i < firstDay.getDay(); i++) {
    await add((stack) => _addItem(stack))
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(lastDay)
    date.setDate(i)
    await add(
      async (stack) => addDay
        ? await addDay(stack, { date, addItem: _addItem })
        : _addDay(stack, { date })
    )
  }

  return stack
}

const addTitle = (widget) => {
  const head = widget.addStack()
  head.setPadding(0, 4, 0, 4)
  const title = head.addText(new Date().toLocaleString('default', { month: 'short' }).toUpperCase())
  title.font = Font.semiboldSystemFont(11)
  title.textColor = Color.red()
  head.addSpacer()
  const lunarDate = sloarToLunar(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
  )
  const lunar = head.addText(`${lunarDate.lunarMonth}月${lunarDate.lunarDay}`)
  lunar.font = Font.semiboldSystemFont(11)
  lunar.textColor = Color.red()
}

const addDay = async (
  stack,
  { date, addItem } = {}
) => {
  const text = `${date.getDate()}`
  const i = dates.findIndex((item) => isSameDay(item, date))
  if (isToday(date)) {
    const item = addItem(stack, { text, color: Color.white() })
    item.backgroundColor = Color.red()
  } else if (i > -1) {
    dates.splice(i, 1)
    const sfs = SFSymbol.named(symbolName || 'flag.fill')
    sfs.applyFont(Font.systemFont(18))
    const image = sfs.image
    const item = addItem(stack, { text, color: Color.white() })
    item.backgroundImage = await tintedImage(image, calendar.color)
    item.$text.shadowColor = calendar.color
    item.$text.shadowOffset = new Point(0.5, 0.5)
    item.$text.shadowRadius = 0.5
  } else {
    addItem(stack, { text })
  }
}

const render = async () => {
  const phone = phoneSize()
  const scale = Device.screenScale()
  const family = config.widgetFamily
  const widgetWidth = phone[family === 'large' ? 'medium' : family] / scale
  const widgetHeight = phone[family === 'medium' ? 'small' : family] / scale
  const is7Rows = (firstDay.getDay() + lastDay.getDate()) > 35
  let itemWidth = (widgetHeight - titleSize - 12 * 2 + rowGap) / (is7Rows ? 7 : 6) - rowGap
  const w = (widgetWidth - 15 * 2 + columnGap) / 7 - columnGap
  itemWidth = Math.min(itemWidth, w)

  const widget = new ListWidget()
  const lightColor = new Color('#fff')
  const darkColor = new Color('#242426')
  widget.backgroundColor = theme === 'light'
    ? lightColor
    : theme === 'dark'
      ? darkColor
      : Color.dynamic(lightColor, darkColor)
  widget.setPadding(12, 15, 12, 15)
  addTitle(widget)
  await addCalendar(widget, {
    itemWidth,
    gap: is7Rows ? [columnGap, rowGap - 1] : [columnGap, rowGap],
    addDay
  })
  return widget
}

if (config.runsInWidget) {
  const widget = await render()
  Script.setWidget(widget)
} else {
  config.widgetFamily = 'small'
  const widget = await render()
  widget.presentSmall()
}
