if (typeof require === 'undefined') require = importModule
const { i18n, widgetSize } = require('./utils.module')
const { withSettings } = require('./withSettings.module')

/**
 * 小组件参数（优先于应用内设置）：
 * - `year` / `年`：本年剩余天数
 * - `month` / `月`：本月剩余天数
 */

const DAY = 24 * 3600000

const preference = {
  /** @type {'year'|'month'} */
  mode: 'year',
  /** @type {'sunday'|'monday'} 月视图一周的开始 */
  weekStart: 'monday',
  showPercent: true,
  backgroundColorLight: '#ffffff',
  backgroundColorDark: '#1c1c1e',
  titleColorLight: '#000000',
  titleColorDark: '#ffffff',
  percentColorLight: '#8e8e93',
  percentColorDark: '#8e8e93',
  passedColorLight: '#1c1c1e',
  passedColorDark: '#ffffff',
  leftColorLight: '#d1d1d6',
  leftColorDark: '#3a3a3c'
}

/**
 * @param {'title'|'percent'|'passed'|'left'|'background'} name
 */
const dynamicColor = (name) => Color.dynamic(
  new Color(preference[`${name}ColorLight`]),
  new Color(preference[`${name}ColorDark`])
)

/**
 * @param {string} [param]
 * @returns {'year'|'month'|undefined}
 */
const parseMode = (param) => {
  const [mode] = (param || '').split(',').map((s) => s.trim().toLowerCase())
  if (['month', 'm', '月'].includes(mode)) return 'month'
  if (['year', 'y', '年'].includes(mode)) return 'year'
}

/**
 * @param {'year'|'month'} mode
 */
const getProgress = (mode) => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  if (mode === 'month') {
    const total = new Date(year, month + 1, 0).getDate()
    const firstDay = new Date(year, month, 1).getDay()
    // 1 号之前的空位数，与日历月视图对齐
    const offset = preference.weekStart === 'monday' ? (firstDay + 6) % 7 : firstDay
    return { total, passed: now.getDate() - 1, offset }
  }
  const today = new Date(year, month, now.getDate())
  const total = Math.round((new Date(year + 1, 0, 1) - new Date(year, 0, 1)) / DAY)
  const passed = Math.round((today - new Date(year, 0, 1)) / DAY)
  return { total, passed, offset: 0 }
}

/**
 * 拉伸横纵间距，使网格铺满整个区域
 * @param {{ columns: number; rows: number; dot: number }} grid
 * @param {number} width
 * @param {number} height
 */
const stretch = ({ columns, rows, dot }, width, height) => ({
  columns,
  rows,
  dot,
  gapX: columns > 1 ? (width - columns * dot) / (columns - 1) : 0,
  gapY: rows > 1 ? (height - rows * dot) / (rows - 1) : 0
})

/**
 * 在给定区域内找到让圆点最大的列数
 * @param {number} count
 * @param {number} width
 * @param {number} height
 * @param {number} gapRatio 间距与圆点直径之比
 */
const layoutGrid = (count, width, height, gapRatio) => {
  let best = { columns: count, rows: 1, dot: 0 }
  for (let columns = 1; columns <= count; columns++) {
    const rows = Math.ceil(count / columns)
    const dot = Math.min(
      width / (columns + (columns - 1) * gapRatio),
      height / (rows + (rows - 1) * gapRatio)
    )
    if (dot > best.dot) best = { columns, rows, dot }
  }
  return stretch(best, width, height)
}

/**
 * 固定列数排列，行数由圆点数决定
 * @param {number} count
 * @param {number} columns
 * @param {number} width
 * @param {number} height
 * @param {number} gapRatio 间距与圆点直径之比
 */
const layoutFixedColumns = (count, columns, width, height, gapRatio) => {
  const rows = Math.ceil(count / columns)
  const dot = Math.min(
    width / (columns + (columns - 1) * gapRatio),
    height / (rows + (rows - 1) * gapRatio)
  )
  return stretch({ columns, rows, dot }, width, height)
}

/**
 * 标题行与圆点网格同宽，高度之和等于内容区高度
 * @param {WidgetStack} container
 * @param {object} options
 * @param {number} options.total
 * @param {number} options.passed
 * @param {number} options.offset 第一个圆点前的空位数
 * @param {ReturnType<typeof layoutGrid>} options.layout
 * @param {number} options.width
 * @param {number} options.fontSize
 * @param {number} options.lineHeight 标题行高度
 * @param {number} options.spacing 标题与圆点的间距
 */
const addContent = (container, {
  total, passed, offset, layout, width, fontSize, lineHeight, spacing
}) => {
  const { columns, rows, dot, gapX, gapY } = layout

  const head = container.addStack()
  head.size = new Size(width, lineHeight)
  head.centerAlignContent()
  const left = total - passed
  const title = head.addText(i18n([`${left} days left`, `剩余 ${left} 天`]))
  title.font = Font.semiboldSystemFont(fontSize)
  title.textColor = dynamicColor('title')
  title.lineLimit = 1
  title.minimumScaleFactor = 0.6
  head.addSpacer()
  if (preference.showPercent) {
    const percent = head.addText(`${Math.round(passed / total * 100)}%`)
    percent.font = Font.mediumSystemFont(fontSize)
    percent.textColor = dynamicColor('percent')
    percent.lineLimit = 1
  }

  container.addSpacer(spacing)

  const passedColor = dynamicColor('passed')
  const leftColor = dynamicColor('left')
  const grid = container.addStack()
  grid.layoutVertically()
  grid.spacing = gapY
  for (let row = 0; row < rows; row++) {
    const rowStack = grid.addStack()
    rowStack.spacing = gapX
    const start = row * columns - offset
    const end = Math.min(start + columns, total)
    for (let i = start; i < end; i++) {
      const cell = rowStack.addStack()
      cell.size = new Size(dot, dot)
      // 1 号之前的空位保持透明
      if (i >= 0) {
        cell.cornerRadius = dot / 2
        cell.backgroundColor = i < passed ? passedColor : leftColor
      }
    }
    // 最后一行不满时靠左
    if (end - start < columns) rowStack.addSpacer()
  }
}

/**
 * @param {'small'|'medium'|'large'} family
 */
const createWidget = (family) => {
  const { mode } = preference
  const size = widgetSize()
  const width = size[family === 'small' ? 'small' : 'medium']
  const height = size[family === 'large' ? 'large' : 'small']
  const padding = family === 'small' ? 14 : 16
  const fontSize = family === 'large' ? 17 : family === 'medium' ? 15 : 14
  const spacing = family === 'small' ? 8 : 10
  // 中文回退到苹方字体，行高比 SF 大，按 1.4 倍字号预留
  const lineHeight = Math.ceil(fontSize * 1.4)

  const { total, passed, offset } = getProgress(mode)

  const widget = new ListWidget()
  widget.backgroundColor = dynamicColor('background')
  widget.setPadding(padding, padding, padding, padding)
  const tomorrow = new Date()
  tomorrow.setHours(24, 0, 0, 0)
  widget.refreshAfterDate = tomorrow

  const contentWidth = width - padding * 2
  const dotsHeight = height - padding * 2 - lineHeight - spacing
  const gapRatio = 0.5
  const count = offset + total
  const layout = mode === 'month'
    ? layoutFixedColumns(count, 7, contentWidth, dotsHeight, gapRatio)
    : layoutGrid(count, contentWidth, dotsHeight, gapRatio)

  const container = widget.addStack()
  container.layoutVertically()
  addContent(container, {
    total, passed, offset, layout, width: contentWidth, fontSize, lineHeight, spacing
  })
  // 内容固定在顶部
  widget.addSpacer()

  return widget
}

/**
 * @param {string} name
 * @param {[en: string, zh: string]} label
 */
const colorItems = (name, label) => [
  {
    name: `${name}ColorLight`,
    label: i18n(label),
    type: 'color',
    media: '(prefers-color-scheme: light)',
    default: preference[`${name}ColorLight`]
  },
  {
    name: `${name}ColorDark`,
    label: i18n(label),
    type: 'color',
    media: '(prefers-color-scheme: dark)',
    default: preference[`${name}ColorDark`]
  }
]

await withSettings({
  formItems: [
    {
      name: 'mode',
      label: i18n(['Progress type', '进度类型']),
      type: 'select',
      options: [
        { label: i18n(['Year', '本年']), value: 'year' },
        { label: i18n(['Month', '本月']), value: 'month' }
      ],
      default: preference.mode
    },
    {
      name: 'weekStart',
      label: i18n(['Week starts on (month)', '每周开始于（月）']),
      type: 'select',
      options: [
        { label: i18n(['Sunday', '周日']), value: 'sunday' },
        { label: i18n(['Monday', '周一']), value: 'monday' }
      ],
      default: preference.weekStart
    },
    {
      name: 'showPercent',
      label: i18n(['Show percentage', '显示百分比']),
      type: 'switch',
      default: preference.showPercent
    },
    ...colorItems('title', ['Title color', '标题颜色']),
    ...colorItems('percent', ['Percentage color', '百分比颜色']),
    ...colorItems('passed', ['Passed dot color', '已过圆点颜色']),
    ...colorItems('left', ['Remaining dot color', '剩余圆点颜色'])
  ],
  render: ({ family, settings }) => {
    for (const key of Object.keys(preference)) {
      if (settings[key] !== undefined && settings[key] !== null) {
        preference[key] = settings[key]
      }
    }
    if (config.runsInWidget) {
      preference.mode = parseMode(args.widgetParameter) || preference.mode
    }
    family = family || config.widgetFamily
    return createWidget(
      ['small', 'medium', 'large'].includes(family) ? family : 'large'
    )
  }
})
