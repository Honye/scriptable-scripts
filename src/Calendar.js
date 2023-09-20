if (typeof require === 'undefined') require = importModule
const { i18n, phoneSize, tintedImage, isSameDay, isToday } = require('./utils.module')
const { useGrid } = require('./widgets.module')
const { sloarToLunar } = require('./lunar.module')
const { withSettings } = require('./withSettings.module')

const preference = {
  themeColor: '#ff0000',
  textColor: '#222222',
  textColorDark: '#ffffff',
  weekendColor: '#8e8e93',
  weekendColorDark: '#8e8e93',
  symbolName: 'flag.fill',
  eventMax: 3,
  eventFontSize: 13,
  includesReminder: false,
  /** @type {'calendar_events'|'events_calendar'} */
  layout: 'calendar_events'
}
const $12Animals = {
  子: '鼠',
  丑: '牛',
  寅: '虎',
  卯: '兔',
  辰: '龙',
  巳: '蛇',
  午: '马',
  未: '羊',
  申: '猴',
  酉: '鸡',
  戌: '狗',
  亥: '猪'
}
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
const [calendarTitle, theme] = (args.widgetParameter || '').split(',').map((text) => text.trim())
if (calendarTitle) {
  calendar = await Calendar.forEventsByTitle(calendarTitle)
  const events = await CalendarEvent.between(firstDay, lastDay, [calendar])
  dates = events.map((item) => item.startDate)
}

const titleSize = 12
const columnGap = 2
const rowGap = 2

/**
 * @param {ListWidget|WidgetStack} container
 * @param {object} options
 * @param {(
 *  stack: WidgetStack,
 *  options: {
 *    date: Date;
 *    width: number;
 *    addItem: (stack: WidgetStack, data: { text: string; color: Color }) => WidgetStack
 *  }
 * ) => void} [options.addDay] 自定义添加日期
 */
const addCalendar = async (container, options = {}) => {
  const {
    itemWidth = 18,
    fontSize = 10,
    gap = [columnGap, rowGap],
    addWeek,
    addDay
  } = options
  const { textColor, textColorDark, weekendColor, weekendColorDark } = preference
  const family = config.widgetFamily
  const stack = container.addStack()
  const { add } = await useGrid(stack, {
    column: 7,
    gap
  })
  /**
   * @param {WidgetStack} stack
   * @param {object} param1
   * @param {string} param1.text
   * @param {Color} param1.color
   */
  const _addItem = (stack, { text, color } = {}) => {
    const item = stack.addStack()
    item.size = new Size(itemWidth, itemWidth)
    item.centerAlignContent()
    if (text) {
      const content = item.addStack()
      content.layoutVertically()
      const textInner = content.addText(text)
      textInner.rightAlignText()
      textInner.font = Font.semiboldSystemFont(fontSize)
      textInner.lineLimit = 1
      textInner.minimumScaleFactor = 0.2
      textInner.textColor = theme === 'light'
        ? new Color(textColor)
        : theme === 'dark'
          ? new Color(textColorDark)
          : Color.dynamic(new Color(textColor), new Color(textColorDark))
      if (color) {
        textInner.textColor = color
      }

      item.$content = content
      item.$text = textInner
    }

    return item
  }
  const _addWeek = (stack, { day }) => {
    const sunday = new Date('1970/01/04')
    const weekFormat = new Intl.DateTimeFormat([], { weekday: family === 'large' ? 'short' : 'narrow' }).format

    return _addItem(stack, {
      text: weekFormat(new Date(sunday.getTime() + day * 86400000)),
      color: (day === 0 || day === 6) &&
        Color.dynamic(new Color(weekendColor), new Color(weekendColorDark))
    })
  }
  const _addDay = (stack, { date }) => {
    const color = (() => {
      const week = date.getDay()
      if (isToday(date)) {
        return Color.white()
      }
      return (week === 0 || week === 6) && Color.gray()
    })()
    const item = _addItem(stack, {
      text: `${date.getDate()}`,
      color
    })
    if (isToday(date)) {
      item.cornerRadius = itemWidth / 2
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
        ? await addDay(stack, {
          date,
          width: itemWidth,
          addItem: _addItem
        })
        : _addDay(stack, { date })
    )
  }

  return stack
}

/**
 * @param {ListWidget} widget
 */
const addTitle = (widget) => {
  const { themeColor } = preference
  const family = config.widgetFamily
  const head = widget.addStack()
  head.setPadding(0, 4, 0, 4)
  const title = head.addText(
    new Date().toLocaleString('default', {
      month: family !== 'small' ? 'long' : 'short'
    }).toUpperCase()
  )
  title.font = Font.semiboldSystemFont(11)
  title.textColor = new Color(themeColor)
  head.addSpacer()
  const lunarDate = sloarToLunar(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
  )
  let lunarString = `${lunarDate.lunarMonth}月${lunarDate.lunarDay}`
  if (family !== 'small') {
    lunarString = `${lunarDate.lunarYear}${$12Animals[lunarDate.lunarYear[1]]}年${lunarString}`
  }
  const lunar = head.addText(lunarString)
  lunar.font = Font.semiboldSystemFont(11)
  lunar.textColor = new Color(themeColor)
}

/**
 * @type {Parameters<typeof addCalendar>[1]['addDay']}
 */
const addDay = async (
  stack,
  { date, width, addItem } = {}
) => {
  const { themeColor, textColor, textColorDark, weekendColor, weekendColorDark, symbolName } = preference
  const family = config.widgetFamily
  const text = `${date.getDate()}`
  const i = dates.findIndex((item) => isSameDay(item, date))
  const _dateColor = theme === 'light'
    ? new Color(textColor)
    : theme === 'dark'
      ? new Color(textColorDark)
      : Color.dynamic(new Color(textColor), new Color(textColorDark))
  const _weekendColor = theme === 'light'
    ? new Color(weekendColor)
    : theme === 'dark'
      ? new Color(weekendColorDark)
      : Color.dynamic(new Color(weekendColor), new Color(weekendColorDark))
  let color = (() => {
    const week = date.getDay()
    return (week === 0 || week === 6) ? _weekendColor : _dateColor
  })()
  if (isToday(date) || i > -1) {
    color = Color.white()
  }
  const item = addItem(stack, { text, color })
  if (family === 'large') {
    const lunar = sloarToLunar(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    )
    const lunarText = item.$content.addText(
      lunar.lunarDay === '初一' ? `${lunar.lunarMonth}月` : lunar.lunarDay
    )
    lunarText.font = Font.systemFont(10)
    lunarText.textColor = color
  }
  if (isToday(date)) {
    if (family !== 'large') {
      item.cornerRadius = width / 2
      item.backgroundColor = new Color(themeColor)
    } else {
      const cw = Math.min(12 * Math.sqrt(2) * 2, width)
      const cp = cw / 2 - 10
      item.$content.size = new Size(cw, cw)
      item.$content.setPadding(0, cp, 0, 0)
      item.$content.cornerRadius = cw / 2
      item.$content.backgroundColor = new Color(themeColor)
    }
  } else if (i > -1) {
    dates.splice(i, 1)
    const sfs = SFSymbol.named(symbolName)
    sfs.applyFont(Font.systemFont(18))
    const image = sfs.image
    item.backgroundImage = await tintedImage(image, calendar.color)
    item.$text.shadowColor = calendar.color
    item.$text.shadowOffset = new Point(0.5, 0.5)
    item.$text.shadowRadius = 0.5
  }
}

/**
 * @param {WidgetStack} stack
 * @param {CalendarEvent | Reminder} event
 */
const addEvent = (stack, event) => {
  const { eventFontSize } = preference
  const row = stack.addStack()
  row.layoutHorizontally()
  row.centerAlignContent()
  row.size = new Size(-1, 28)
  const line = row.addStack()
  line.layoutVertically()
  line.size = new Size(2.4, -1)
  line.cornerRadius = 1.2
  line.backgroundColor = event.calendar.color
  line.addSpacer()

  row.addSpacer(8)
  const content = row.addStack()
  content.layoutVertically()
  const title = content.addText(event.title)
  title.font = Font.systemFont(eventFontSize)
  const dateFormat = new Intl.DateTimeFormat([], {
    month: '2-digit',
    day: '2-digit'
  }).format
  const timeFormat = new Intl.DateTimeFormat([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format
  const items = []
  const eventDate = event.startDate || event.dueDate
  if (isToday(eventDate)) {
    items.push(i18n(['Today', '今天']))
  } else {
    items.push(dateFormat(eventDate))
  }
  if (!event.isAllDay || event.dueDateIncludesTime) items.push(timeFormat(eventDate))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDayDate = new Date(eventDate)
  startDayDate.setHours(0, 0, 0, 0)
  const diff = (startDayDate - today) / (24 * 3600000)
  if (diff > 0) items.push(`T+${Math.round(diff)}`)
  const date = content.addText(items.join(' '))
  date.font = Font.systemFont(eventFontSize * 12 / 13)
  date.textColor = Color.gray()
  row.addSpacer()
}

const getReminders = async () => {
  const calendars = await Calendar.forReminders()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const later7Date = new Date(today.getTime() + 7 * 24 * 3600000)
  today.setHours(0, 0, 0, -1)
  const reminders = await Reminder.incompleteDueBetween(today, later7Date, calendars)
  return reminders
}

const getEvents = async () => {
  const calendars = await Calendar.forEvents()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const later7Date = new Date(today.getTime() + 7 * 24 * 3600000)
  const events = await CalendarEvent.between(today, later7Date, calendars)
  return events
}

/**
 * @param {WidgetStack} stack
 */
const addEvents = async (stack) => {
  const { eventMax, includesReminder } = preference
  const promises = [getEvents()]
  if (includesReminder) {
    promises.push(getReminders())
  }
  const eventsList = await Promise.all(promises)
  const _events = eventsList.flat().sort(
    (a, b) => (a.startDate || a.dueDate) - (b.startDate || b.dueDate)
  )
  const list = stack.addStack()
  list.layoutVertically()
  for (const event of _events.slice(0, eventMax)) {
    list.addSpacer(4)
    addEvent(list, event)
  }
  return list
}

const createWidget = async () => {
  const { layout } = preference
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
  widget.url = 'calshow://'
  const lightColor = new Color('#fff')
  const darkColor = new Color('#242426')
  widget.backgroundColor = theme === 'light'
    ? lightColor
    : theme === 'dark'
      ? darkColor
      : Color.dynamic(lightColor, darkColor)
  widget.setPadding(12, 15, 12, 15)
  addTitle(widget)
  const row = widget.addStack()
  const actions = [
    () =>
      addCalendar(row, {
        itemWidth,
        gap: is7Rows ? [columnGap, rowGap - 1] : [columnGap, rowGap],
        addDay
      })
  ]
  if (family === 'medium') {
    if (layout === 'calendar_events') {
      actions.push(() => addEvents(row))
    } else {
      actions.unshift(() => addEvents(row))
    }
  }
  for (const [i, action] of actions.entries()) {
    if (layout === 'calendar_events' && i > 0) {
      row.addSpacer(10)
    }
    await action()
  }
  return widget
}

const {
  themeColor,
  textColor,
  textColorDark,
  weekendColor,
  weekendColorDark,
  symbolName
} = preference
const eventSettings = {
  name: 'event',
  type: 'group',
  label: i18n(['Events', '事件']),
  items: [
    {
      name: 'eventFontSize',
      type: 'number',
      label: i18n(['Text size', '字体大小']),
      default: preference.eventFontSize
    },
    {
      name: 'eventMax',
      type: 'number',
      label: i18n(['Max count', '最大显示数量']),
      default: preference.eventMax
    },
    {
      name: 'includesReminder',
      type: 'switch',
      label: i18n(['Show reminders', '显示提醒事项']),
      default: preference.includesReminder
    },
    {
      name: 'layout',
      type: 'select',
      label: i18n(['Content placement', '排列方式']),
      options: [
        { label: i18n(['Calendar-Events', '日历-事件']), value: 'calendar_events' },
        { label: i18n(['Events-Calendar', '事件-日历']), value: 'events_calendar' }
      ],
      default: preference.layout
    }
  ]
}
const widget = await withSettings({
  formItems: [
    {
      name: 'themeColor',
      type: 'color',
      label: i18n(['Theme color', '主题色']),
      default: themeColor
    },
    {
      name: 'textColor',
      type: 'color',
      label: i18n(['Text color (light)', '文字颜色（白天）']),
      default: textColor
    },
    {
      name: 'textColorDark',
      type: 'color',
      label: i18n(['Text color (dark)', '文字颜色（夜晚）']),
      default: textColorDark
    },
    {
      name: 'weekendColor',
      type: 'color',
      label: i18n(['Weekend color (light)', '周末文字颜色（白天）']),
      default: weekendColor
    },
    {
      name: 'weekendColorDark',
      type: 'color',
      label: i18n(['Weekend color (dark)', '周末文字颜色（夜晚）']),
      default: weekendColorDark
    },
    {
      name: 'symbolName',
      label: i18n(['Calendar SFSymbol icon', '事件 SFSymbol 图标']),
      default: symbolName
    },
    eventSettings
  ],
  render: async ({ family, settings }) => {
    if (family) {
      config.widgetFamily = family
    }
    Object.assign(preference, settings)
    const widget = await createWidget()
    return widget
  }
})
if (config.runsInWidget) {
  Script.setWidget(widget)
}
