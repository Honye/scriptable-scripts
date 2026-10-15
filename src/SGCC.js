if (typeof require === 'undefined') require = importModule
const { getImage, i18n, useCache, vmin, widgetSize } = require('./utils.module')
const { withSettings } = require('./withSettings.module')
const { useGrid } = require('./widgets.module')
const { SgApp, queryAccount, K } = require('./sgcc.module')
const rpt = (n) => vmin(n * 100 / 155, config.widgetFamily)

const preference = {
  phone: '',
  password: '',
  smsCode: '',
  /** @type {'daily'|'monthly'} */
  dimension: 'daily',
  barCount: 7,
  showStepProgress: true,
  oneLevelPq: 2160,
  twoLevelPq: 4800
}

const cache = useCache()
const sizes = widgetSize()
const dataFilename = 'data.v2.json'
/** @type {Date} */
let respDate

const KEYCHAIN_PREFIX = 'honye.sgcc.'

/**
 * SgApp 运行所需的存储与网络适配
 * @param {string} [smsCode] 新设备短信验证码
 */
const createCtx = (smsCode = '') => ({
  env: { SGCC_SMS: smsCode },
  storage: {
    getJSON: (k) => {
      const key = KEYCHAIN_PREFIX + k
      return Keychain.contains(key) ? JSON.parse(Keychain.get(key)) : null
    },
    setJSON: (k, v) => Keychain.set(KEYCHAIN_PREFIX + k, JSON.stringify(v))
  },
  http: {
    post: async (url, { headers = {}, body = '', timeout = 20000 }) => {
      const request = new Request(url)
      request.method = 'POST'
      request.headers = Object.fromEntries(
        Object.entries(headers).map(([k, v]) => [k, v == null ? '' : String(v)])
      )
      request.body = body
      request.timeoutInterval = timeout / 1000
      const text = await request.loadString()
      return {
        status: request.response?.statusCode ?? 200,
        text: async () => text
      }
    }
  }
})

const createApp = () => {
  const { phone, password, smsCode } = preference
  if (!phone || !password) {
    throw new Error('请先在设置中填写网上国网手机号和密码')
  }
  return new SgApp(createCtx(String(smsCode || '').trim()), phone, password)
}

const fetchData = async () => {
  const app = createApp()
  const { accounts = [] } = await app.ensure()
  if (!accounts.length) throw new Error('该网上国网账号未绑定户号')

  const list = []
  let error
  for (const account of accounts.slice(0, 6)) {
    try {
      list.push(await queryAccount(app, account))
    } catch (e) {
      console.error(e)
      error = e
      // 占位保证 Parameter 下标与户号顺序一致
      list.push(null)
    }
  }
  if (list.every((item) => !item)) throw error
  return list
}

const getData = async () => {
  const fm = FileManager.local()
  const filePath = fm.joinPath(cache.cacheDirectory, dataFilename)
  const mDate = fm.modificationDate(filePath)
  if (mDate && Date.now() - mDate.getTime() < 14400000) {
    console.log('[INFO] Request too frequent, using local cached data...')
    respDate = mDate
    return cache.readJSON(dataFilename)
  }

  try {
    const data = await fetchData()
    cache.writeJSON(dataFilename, data)
    respDate = new Date()
    return data
  } catch (e) {
    console.error(e)
    const data = cache.readJSON(dataFilename)
    if (!data) throw e
    console.log('[INFO] An exception occurred during the request; using cached data...')
    respDate = mDate
    return data
  }
}

const toNumber = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const currentYm = () => {
  const now = new Date()
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
}

/**
 * 将接口数据整理为组件所需字段
 */
const normalize = (data) => {
  const { eleBill = {}, dayElecQuantity31 = {}, monthElecQuantity = {} } = data
  const daily = (dayElecQuantity31.sevenEleList || [])
    .filter(({ dayElePq }) => dayElePq !== '' && dayElePq != null && !Number.isNaN(Number(dayElePq)))
    .map(({ day, dayElePq }) => ({ day: String(day), value: Number(dayElePq) }))
    .sort((a, b) => a.day.localeCompare(b.day))
  const monthly = (monthElecQuantity.mothEleList || [])
    .map(({ month, monthEleNum, monthEleCost }) => ({
      month: String(month),
      pq: toNumber(monthEleNum),
      cost: toNumber(monthEleCost)
    }))
    .sort((a, b) => a.month.localeCompare(b.month))

  const ym = currentYm()
  // 最近一个已结算月份作为“上期”
  const settled = monthly.filter(({ month, pq, cost }) => month < ym && (pq > 0 || cost > 0))
  const last = settled[settled.length - 1]
  const yearPq = toNumber(monthElecQuantity.dataInfo?.totalEleNum)
  // 阶梯电量 = 年度已结算电量 + 本月未结算的日用电
  const pendingPq = monthly.some(({ month }) => month === ym)
    ? 0
    : daily.filter(({ day }) => day.startsWith(ym)).reduce((sum, { value }) => sum + value, 0)

  const arrearsOfFees = !!data.arrearsOfFees
  // 后付费用户 sumMoney 为账单应缴金额，余额应取账户预存款 accountBalance
  const isPostPaid = Object.prototype.hasOwnProperty.call(eleBill, 'accountBalance')
  const balance = isPostPaid && !arrearsOfFees ? eleBill.accountBalance : eleBill.sumMoney

  return {
    arrearsOfFees,
    balance: toNumber(balance).toFixed(2),
    lastAmount: last ? last.cost.toFixed(2) : '0.00',
    lastPq: last ? last.pq : 0,
    yearPq,
    yearAmount: toNumber(monthElecQuantity.dataInfo?.totalEleCost).toFixed(2),
    stepPq: Math.round(yearPq + pendingPq),
    daily,
    monthly
  }
}

const getWidgetData = async () => {
  const [i] = (args.widgetParameter || '')
    .split(';')
    .map((item) => item.trim() || undefined)
  const index = Number(i || 0)
  const data = await getData()
  const item = data[index]
  if (!item) throw new Error(`户号 ${index} 不存在或查询失败`)
  return normalize(item)
}

const getLogo = async () => {
  const filename = 'logo.png'
  const cached = cache.readImage(filename)
  if (cached) return cached
  const image = await getImage('https://raw.githubusercontent.com/Honye/scriptable-scripts/refs/heads/master/static/sgcc.png')
  cache.writeImage(filename, image)
  return image
}

/**
 * @param {WidgetStack} widget
 */
const addBarChart = (widget, data) => {
  const { barCount, dimension, oneLevelPq, twoLevelPq } = preference
  const getLevel = (total) => total > Number(twoLevelPq) ? 3 : total > Number(oneLevelPq) ? 2 : 1
  /** 每月对应的阶梯，按年累计 */
  const monthLevels = {}
  /** @type {{ value: number; level: number }[]} */
  let seven = []
  let year = ''
  let yearTotal = 0
  for (const { month, pq } of data.monthly) {
    if (month.slice(0, 4) !== year) {
      year = month.slice(0, 4)
      yearTotal = 0
    }
    yearTotal += pq
    const level = getLevel(yearTotal)
    monthLevels[month] = level
    if (dimension === 'monthly') {
      seven.push({ value: pq, level })
    }
  }
  if (dimension === 'daily') {
    const thisYear = String(new Date().getFullYear())
    const thisYearMonths = Object.keys(monthLevels).filter((m) => m.startsWith(thisYear))
    // 本月未结算时沿用今年最近一个月的阶梯
    const latestLevel = monthLevels[thisYearMonths[thisYearMonths.length - 1]] || 1
    for (const { day, value } of data.daily) {
      const month = day.slice(0, 6)
      // 非今年数据默认阶梯为 1
      const level = month.startsWith(thisYear) ? monthLevels[month] || latestLevel : 1
      seven.push({ value, level })
    }
  }

  seven = seven.slice(-barCount)
  const container = widget.addStack()
  const height = config.widgetFamily === 'medium' ? rpt(40) : rpt(68)
  container.size = new Size(-1, height)
  const vp = config.widgetFamily === 'medium' ? rpt(4) : rpt(10)
  const px = config.widgetFamily === 'medium' ? 0 : rpt(8)
  container.setPadding(vp, px, vp, px)
  container.layoutHorizontally()
  container.bottomAlignContent()

  const gap = config.widgetFamily === 'medium' ? rpt(6) : undefined
  const max = Math.max(0, ...seven.map(({ value }) => value)) || 1
  const maxHeight = height - vp * 2
  const w = config.widgetFamily === 'medium' ? rpt(6) : rpt(8)
  for (const [i, { value, level }] of seven.entries()) {
    const day = container.addStack()
    day.size = new Size(w, value / max * maxHeight)
    day.cornerRadius = w / 2
    const gradient = new LinearGradient()
    gradient.locations = [0, 1]
    const colors = [
      [new Color('#81CDC7'), new Color('#00706B')], // level 1
      [new Color('#FFEE8C'), new Color('#E8C70B')], // level 2
      [new Color('#FCBF94'), new Color('#D0580D')] // level 3
    ]
    gradient.colors = colors[level - 1]
    gradient.startPoint = new Point(0, 0)
    gradient.endPoint = new Point(0, 1)
    day.backgroundGradient = gradient
    if (i < seven.length - 1) {
      container.addSpacer(gap)
    }
  }
}

/**
 * @param {WidgetStack} container
 */
const addStepProgress = (container, data) => {
  const { oneLevelPq, twoLevelPq } = preference
  const oneLevelColor = new Color('#00706B')
  const oneLevelBg = new Color(oneLevelColor.hex, 0.1)
  const twoLevelColor = new Color('#E8C70B')
  const twoLevelBg = new Color(twoLevelColor.hex, 0.1)
  const threeLevelColor = new Color('#D0580D')
  const threeLevelBg = new Color(threeLevelColor.hex, 0.1)
  const transparent = new Color('#000000', 0)
  const totalYearPq = data.stepPq

  const stack = container.addStack()
  stack.size = new Size(-1, rpt(4))
  stack.addSpacer()
  const gradient = new LinearGradient()
  const colors = [
    oneLevelBg, oneLevelBg, // 0~0.32
    transparent, transparent, // 0.32~0.34
    twoLevelBg, twoLevelBg, // 0.34~0.66
    transparent, transparent, // 0.66~0.68
    threeLevelBg, threeLevelBg // 0.68~1
  ]
  const locations = [
    0, 0.32,
    0.32, 0.34,
    0.34, 0.66,
    0.66, 0.68,
    0.68, 1
  ]
  gradient.startPoint = new Point(0, 0)
  gradient.endPoint = new Point(1, 0)
  const level = totalYearPq > twoLevelPq ? 3 : totalYearPq > oneLevelPq ? 2 : 1
  if (level > 0) {
    colors.splice(
      0, 0,
      oneLevelColor, oneLevelColor
    )
    const per = Math.min(totalYearPq / oneLevelPq, 1) * 0.32
    locations.splice(
      1, 0,
      per, per
    )
  }
  if (level > 1) {
    colors.splice(4 + 2, 0, twoLevelColor, twoLevelColor)
    const per = Math.min(totalYearPq / twoLevelPq, 1) * 0.32
    locations.splice(
      5 + 2, 0,
      0.34 + per, 0.34 + per
    )
  }
  if (level > 2) {
    colors.splice(8 + 2 * 2, 0, threeLevelColor, threeLevelColor)
    const per = Math.min(totalYearPq / (twoLevelPq + twoLevelPq - oneLevelPq), 1) * 0.32
    locations.splice(
      9 + 2 * 2, 0,
      0.68 + per, 0.68 + per
    )
  }
  gradient.colors = colors
  gradient.locations = locations
  stack.backgroundGradient = gradient
}

const addBarAndStep = (widget, data) => {
  const container = widget.addStack()
  container.layoutVertically()
  const gradient = new LinearGradient()
  gradient.locations = [0, 1]
  gradient.colors = [
    new Color('#00706B', 0),
    Color.dynamic(
      new Color('#00706B', 0.05),
      new Color('#04605B', 0.15)
    )
  ]
  gradient.startPoint = new Point(0, 0)
  gradient.endPoint = new Point(0, 1)
  container.cornerRadius = 6
  container.backgroundGradient = gradient
  addBarChart(container, data)
  addStepProgress(container, data)
}

/**
 * @param {WidgetStack} stack
 * @param {object} data
 * @param {string} data.label
 * @param {number} data.value
 */
const addLabelValue = (stack, { label, value }) => {
  const c = stack.addStack()
  c.layoutVertically()
  c.addStack().addSpacer()
  c.backgroundColor = Color.dynamic(new Color('#00706B', 0.05), new Color('#04605B', 0.15))
  c.cornerRadius = rpt(6)
  c.setPadding(rpt(6), rpt(12), rpt(6), rpt(12))
  const title = c.addText(label)
  title.font = Font.systemFont(rpt(8))
  title.textColor = Color.dynamic(new Color('#18231C', 0.7), new Color('#FFFFFF', 0.7))
  const number = c.addText(`${value}`)
  number.font = Font.boldRoundedSystemFont(14)
  number.textColor = Color.dynamic(new Color('#18231C'), new Color('#FFFFFF'))
}

/**
 * @param {WidgetStack} stack
 */
const addMediumSteps = (stack, data, { width }) => {
  const { oneLevelPq, twoLevelPq } = preference
  const totalYearPq = data.stepPq

  const c = stack.addStack()
  c.layoutVertically()
  c.backgroundColor = Color.dynamic(new Color('#00706B', 0.05), new Color('#04605B', 0.15))
  c.cornerRadius = rpt(6)
  const paddingX = rpt(12)
  c.setPadding(rpt(6), paddingX, rpt(6), paddingX)
  c.addStack().addSpacer()

  const level = totalYearPq > twoLevelPq ? 3 : totalYearPq > oneLevelPq ? 2 : 1
  let percent = totalYearPq / [oneLevelPq, twoLevelPq, twoLevelPq + twoLevelPq - oneLevelPq][level - 1]
  percent = Math.min(percent, 1)
  const head = c.addStack()
  const title = head.addText(`第${['一', '二', '三'][level - 1]}梯度：${Number((percent * 100).toFixed(2))}%`)
  title.font = Font.systemFont(rpt(8))
  title.textColor = Color.dynamic(new Color('#18231C', 0.7), new Color('#FFFFFF', 0.7))
  head.addSpacer()
  const time = head.addStack()
  time.centerAlignContent()
  const clock = time.addImage(SFSymbol.named('clock.arrow.circlepath').image)
  clock.tintColor = Color.dynamic(new Color('#18231C', 0.7), new Color('#FFFFFF', 0.7))
  clock.imageSize = new Size(rpt(8), rpt(8))
  const df = new DateFormatter()
  df.locale = 'zh-CN'
  df.dateFormat = 'HH:mm'
  const timeText = time.addText(` ${df.string(respDate)}`)
  timeText.font = Font.systemFont(rpt(8))
  timeText.textColor = Color.dynamic(new Color('#18231C', 0.7), new Color('#FFFFFF', 0.7))

  c.addSpacer(rpt(4))
  const p = c.addStack()
  const barGap = rpt(2)
  const t = Math.floor((width - paddingX * 2 + barGap) / (2 + barGap))
  /** one step bar counts */
  const n = Math.floor(t / 3)
  const colors = [
    Color.dynamic(new Color('#00706B'), new Color('#04605B')), // level 1
    Color.dynamic(new Color('#E8C70B'), new Color('#CBAD02')), // level 2
    Color.dynamic(new Color('#D0580D'), new Color('#D0580D')) // level 3
  ]
  const bgColors = [
    Color.dynamic(new Color('#00706B', 0.1), new Color('#04605B', 0.1)), // level 1
    Color.dynamic(new Color('#E8C70B', 0.1), new Color('#CBAD02', 0.1)), // level 2
    Color.dynamic(new Color('#D0580D', 0.1), new Color('#D0580D', 0.1)) // level 3
  ]
  for (let i = 0; i < n * 3; i++) {
    const bar = p.addStack()
    bar.layoutVertically()
    bar.addSpacer()
    bar.size = new Size(2, -1)
    const end = Math.floor(n * level * percent)
    bar.backgroundColor = (i > end ? bgColors : colors)[Math.floor(i / n)]
    bar.cornerRadius = 1
    if (i < n * 3 - 1) {
      p.addSpacer(barGap)
    }
  }
}

const createMediumWidget = async () => {
  const { barCount } = preference
  const data = await getWidgetData()
  const widget = new ListWidget()
  const widgetPadding = rpt(12)
  widget.setPadding(widgetPadding, widgetPadding, widgetPadding, widgetPadding)
  const widgetGradient = new LinearGradient()
  widgetGradient.colors = [
    Color.dynamic(new Color('#00706B', 0.18), new Color('#00706B', 0)),
    new Color('#00706B', 0)
  ]
  widgetGradient.locations = [0, 0.35]
  widgetGradient.startPoint = new Point(0, 0)
  widgetGradient.endPoint = new Point(sizes.small / sizes.medium, 1)
  widget.backgroundGradient = widgetGradient

  const container = widget.addStack()
  container.layoutHorizontally()

  const lpx = rpt(4)
  const barItemWith = rpt(6)
  const barGap = rpt(6)
  const leftWidth = Math.max(barCount, 7) * (barItemWith + barGap) - barGap + lpx * 2
  const left = container.addStack()
  left.size = new Size(leftWidth, -1)
  left.layoutVertically()
  const gradient = new LinearGradient()
  gradient.locations = [0, 1]
  gradient.colors = [
    new Color('#00706B', 0),
    Color.dynamic(new Color('#00706B', 0.05), new Color('#04605B', 0.15))
  ]
  gradient.startPoint = new Point(0, 0.4)
  gradient.endPoint = new Point(0, 1)
  left.backgroundGradient = gradient
  left.cornerRadius = rpt(6)
  left.setPadding(0, lpx, 0, lpx)

  const logo = left.addImage(await getLogo())
  const lw = rpt(24)
  logo.imageSize = new Size(lw, lw)

  left.addSpacer(rpt(12))
  const label = left.addText(!data.arrearsOfFees ? '剩余电费' : '待缴电费')
  label.font = Font.systemFont(rpt(10))
  label.textColor = Color.dynamic(new Color('#18231C', 0.7), new Color('#FFFFFF', 0.7))
  const number = left.addText(data.balance)
  number.minimumScaleFactor = 0.5
  number.font = Font.boldRoundedSystemFont(rpt(18))
  number.textColor = Color.dynamic(new Color('#18231C'), new Color('#FFFFFF'))

  left.addSpacer()
  addBarChart(left, data)

  const lrGap = rpt(12)
  container.addSpacer(lrGap)
  const right = container.addStack()
  right.layoutVertically()
  const { add } = await useGrid(right, {
    column: 2,
    gap: [rpt(8), rpt(6)]
  })
  await add((stack) => addLabelValue(stack, {
    label: '上期电费',
    value: data.lastAmount
  }))
  await add((stack) => addLabelValue(stack, {
    label: '上期电量',
    value: data.lastPq
  }))
  await add((stack) => addLabelValue(stack, {
    label: '年度电费',
    value: data.yearAmount
  }))
  await add((stack) => addLabelValue(stack, {
    label: '年度电量',
    value: data.yearPq
  }))
  right.addSpacer(rpt(6))
  addMediumSteps(right, data, { width: sizes.medium - widgetPadding * 2 - leftWidth - lrGap })
  return widget
}

const createWidget = async () => {
  if (config.widgetFamily === 'medium') {
    const widget = await createMediumWidget()
    return widget
  }

  const data = await getWidgetData()
  const widget = new ListWidget()
  widget.setPadding(12, 12, 12, 12)
  widget.backgroundColor = Color.dynamic(
    new Color('#ffffff'),
    new Color('#171A18')
  )
  const gradient = new LinearGradient()
  gradient.colors = [
    new Color('#00706B', 0),
    Color.dynamic(new Color('#00706B', 0.18), new Color('#00706B', 0))
  ]
  gradient.locations = [0.65, 1]
  gradient.startPoint = new Point(0, 0)
  gradient.endPoint = new Point(1, 1)
  widget.backgroundGradient = gradient

  addBarAndStep(widget, data)

  widget.addSpacer()
  const bottom = widget.addStack()
  bottom.layoutVertically()
  const { lastAmount } = data
  const l = bottom.addText(`余额${Number(lastAmount) ? `(上期:${lastAmount})` : ''}`)
  l.font = Font.systemFont(rpt(12))
  l.textColor = Color.dynamic(new Color('#18231C', 0.7), new Color('#ffffff', 0.7))
  const w = bottom.addStack()
  w.centerAlignContent()
  const p = w.addText(data.balance)
  p.font = Font.boldRoundedSystemFont(rpt(24))
  p.textColor = Color.dynamic(new Color('#18231C'), new Color('#ffffff'))
  w.addSpacer()
  const logo = w.addImage(await getLogo())
  const lw = rpt(24)
  logo.imageSize = new Size(lw, lw)
  return widget
}

const createErrorWidget = (message) => {
  const widget = new ListWidget()
  widget.setPadding(12, 12, 12, 12)
  const title = widget.addText('网上国网')
  title.font = Font.boldSystemFont(14)
  title.textColor = Color.dynamic(new Color('#18231C'), new Color('#ffffff'))
  widget.addSpacer(6)
  const text = widget.addText(message)
  text.font = Font.systemFont(12)
  text.minimumScaleFactor = 0.6
  text.textColor = Color.dynamic(new Color('#18231C', 0.7), new Color('#ffffff', 0.7))
  widget.addSpacer()
  return widget
}

const presentAlert = async (title, message) => {
  const alert = new Alert()
  alert.title = title
  alert.message = message
  alert.addAction(i18n(['OK', '确定']))
  await alert.presentAlert()
}

const sendSms = async () => {
  let app
  try {
    app = createApp()
  } catch (e) {
    await presentAlert('提示', e.message)
    return
  }
  try {
    const codeKey = await app.sendDeviceSms()
    app.st(app.sk(K.sms), { user: app.user, codeKey, ts: Date.now(), used: '' })
    await presentAlert(
      '短信验证码已发送',
      `验证码已发至 ${app.user.slice(0, 3)}****${app.user.slice(-4)}，请在 15 分钟内填入「短信验证码」后预览组件`
    )
  } catch (e) {
    console.error(e)
    await presentAlert('发送失败', e.message || String(e))
  }
}

const clearCache = async () => {
  const fm = FileManager.local()
  const filePath = fm.joinPath(cache.cacheDirectory, dataFilename)
  if (fm.fileExists(filePath)) fm.remove(filePath)
  await presentAlert('已清除', '下次刷新将重新请求国网数据')
}

await withSettings({
  formItems: [
    {
      label: i18n(['Account', '网上国网账号']),
      type: 'group',
      items: [
        {
          label: i18n(['Phone', '手机号']),
          name: 'phone',
          type: 'tel',
          default: preference.phone
        },
        {
          label: i18n(['Password', '密码']),
          name: 'password',
          type: 'password',
          default: preference.password
        },
        {
          label: i18n(['Send SMS code', '发送短信验证码']),
          name: 'sendSms',
          type: 'cell'
        },
        {
          label: i18n(['SMS code', '短信验证码']),
          name: 'smsCode',
          type: 'text',
          default: preference.smsCode
        },
        {
          label: i18n(['Clear data cache', '清除数据缓存']),
          name: 'clearCache',
          type: 'cell'
        }
      ]
    },
    {
      label: i18n(['Daily or monthly', '每日或每月']),
      name: 'dimension',
      type: 'select',
      options: [
        { label: i18n(['Daily', '每日']), value: 'daily' },
        { label: i18n(['Monthly', '每月']), value: 'monthly' }
      ],
      default: preference.dimension
    },
    {
      label: i18n(['Bar count', '柱状图数量']),
      name: 'barCount',
      type: 'number',
      default: preference.barCount
    },
    {
      label: i18n(['Show tiered progress', '显示阶梯进度']),
      name: 'showStepProgress',
      type: 'switch',
      default: preference.showStepProgress
    },
    {
      label: i18n(['First level cap', '第一阶梯上限']),
      name: 'oneLevelPq',
      type: 'number',
      default: preference.oneLevelPq
    },
    {
      label: i18n(['Second level cap', '第二阶梯上限']),
      name: 'twoLevelPq',
      type: 'number',
      default: preference.twoLevelPq
    }
  ],
  onItemClick: async ({ name }, { settings }) => {
    Object.assign(preference, settings)
    switch (name) {
      case 'sendSms':
        await sendSms()
        break
      case 'clearCache':
        await clearCache()
        break
    }
  },
  render: async ({ family, settings }) => {
    family && (config.widgetFamily = family)
    Object.assign(preference, settings)
    try {
      return await createWidget()
    } catch (e) {
      console.error(e)
      return createErrorWidget(e.message || String(e))
    }
  }
})
