/**
 * 话费、流量和语音余额小组件小号 UI
 *
 * 原创 UI，修改套用请注明来源
 *
 * GitHub: https://github.com/honye
 *
 * @version 1.0.0
 * @author Honye
 */

if (typeof require === 'undefined') require = importModule
const { getImage, useCache, vw } = require('./utils.module')

const cache = useCache()

const cacheImage = async (url, filename) => {
  const cached = cache.readImage(filename)
  if (cached) return cached
  const image = await getImage(url)
  cache.writeImage(filename, image)
  return image
}

const createBg = async () => {
  const filename = 'unicom_bg.png'
  const cached = cache.readImage(filename)
  if (cached) return cached
  const ctx = new DrawContext()
  ctx.opaque = false
  ctx.respectScreenScale = true
  ctx.size = new Size(155, 155)
  ctx.drawImageInRect(
    await getImage('https://cdn.jsdelivr.net/gh/Honye/scriptable-scripts@master/static/unicom_bg.png'),
    new Rect(77, -22, 100, 100)
  )
  const image = ctx.getImage()
  cache.writeImage(filename, image)
  return image
}

/**
 * @param {Color} startColor
 * @param {Color} endColor
 * @param {number} factor 0.0 ~ 1.0
 */
const interpolateColor = (startColor, endColor, factor) => {
  const interpolate = (start, end) => {
    return start + (end - start) * factor
  }
  const r = interpolate(startColor.red, endColor.red)
  const g = interpolate(startColor.green, endColor.green)
  const b = interpolate(startColor.blue, endColor.blue)
  const a = interpolate(startColor.alpha, endColor.alpha)
  const hex = [r, g, b].map((n) => Math.round(n * 255).toString(16).padStart(2, '0')).join('')
  return new Color(hex, a)
}

/** @param {number} deg */
const deg2arc = (deg) => {
  return deg * Math.PI / 180
}

/**
 * @param {object} params
 * @param {Point} params.center
 * @param {number} params.radius
 * @param {number} params.deg
 */
const pointAtDeg = ({ center, radius, deg }) => {
  return new Point(
    center.x + radius * Math.cos(deg2arc(deg)),
    center.y + radius * Math.sin(deg2arc(deg))
  )
}

/**
 * @param {object} params
 * @param {Point} params.center
 * @param {number} params.radius
 * @param {number} params.startDeg
 * @param {number} params.drawDeg
 */
const arcPath = ({ center, radius, startDeg, drawDeg }) => {
  const startArc = deg2arc(startDeg)
  const path = new Path()
  path.move(pointAtDeg({ center, radius, deg: startDeg }))
  const l = Math.PI * radius * 2 * drawDeg / 360
  for (let i = 0; i <= l; i++) {
    path.addLine(
      new Point(
        center.x + radius * Math.cos(startArc + i / radius),
        center.y + radius * Math.sin(startArc + i / radius)
      )
    )
  }
  return path
}

/**
 * @param {DrawContext} ctx
 * @param {object} options
 * @param {Color} options.startColor
 * @param {Color} options.endColor
 * @param {number} options.lineWidth
 */
const drawGradientArc = (ctx, {
  center,
  radius,
  startDeg,
  drawDeg,
  startColor,
  endColor,
  lineWidth
}) => {
  const startArc = deg2arc(startDeg)
  let lastPoint = pointAtDeg({ center, radius, deg: startDeg })
  const l = Math.PI * radius * 2 * drawDeg / 360
  for (let i = 0; i <= l; i++) {
    const path = new Path()
    path.move(lastPoint)
    const nextPoint = new Point(
      center.x + radius * Math.cos(startArc + i / radius),
      center.y + radius * Math.sin(startArc + i / radius)
    )
    path.addLine(nextPoint)
    ctx.addPath(path)
    ctx.setLineWidth(lineWidth)
    ctx.setStrokeColor(interpolateColor(startColor, endColor, i / l))
    ctx.strokePath()
    lastPoint = nextPoint
  }
}

/**
 * @param {DrawContext} ctx
 * @param {object} options
 * @param {Color} options.startColor
 * @param {Color} options.endColor
 */
const drawArc = (ctx, { startColor, endColor, percent }) => {
  const { width } = ctx.size
  const lineWidth = 4
  const radius = (width - lineWidth) / 2
  const center = new Point(width / 2, width / 2)

  if (startColor === endColor) {
    ctx.addPath(arcPath({ center, radius, startDeg: 135, drawDeg: 270 * percent }))
    ctx.setStrokeColor(startColor)
    ctx.setLineWidth(lineWidth)
    ctx.strokePath()
  } else {
    drawGradientArc(ctx, {
      center,
      radius,
      startDeg: 135,
      drawDeg: 270 * percent,
      startColor,
      endColor,
      lineWidth
    })
  }

  //   ctx.addPath(
  //     arcPath({
  //       center: pointAtDeg({ center, radius, deg: 135 }),
  //       radius: lineWidth / 2,
  //       startDeg: -45,
  //       drawDeg: 180
  //     })
  //   )
  //   ctx.setFillColor(color)
  //   ctx.fillPath()

//   ctx.addPath(
//     arcPath({
//       center: pointAtDeg({ center, radius, deg: 45 }),
//       radius: lineWidth / 2,
//       startDeg: 45,
//       drawDeg: 180
//     })
//   )
//   ctx.setFillColor(color)
//   ctx.fillPath()
}

/**
 * @param {object} params
 * @param {Color} params.color
 */
const getArc = ({ color, percent }) => {
  const ctx = new DrawContext()
  ctx.opaque = false
  ctx.respectScreenScale = true
  const width = 62
  ctx.size = new Size(width, width)
  const aColor = new Color(color.hex, 0.1)
  drawArc(ctx, {
    startColor: aColor,
    endColor: aColor,
    percent: 1
  })
  drawArc(ctx, {
    startColor: color,
    endColor: new Color(color.hex, 0.4),
    percent
  })

  return ctx.getImage()
}

/**
 * @param {WidgetStack} container
 * @param {(s: WidgetStack) => void} fn
 */
const centerH = (container, fn) => {
  const stack = container.addStack()
  stack.size = new Size(vw(50 * 100 / 155), -1)
  stack.centerAlignContent()
  fn(stack)
}

/**
 * @param {WidgetStack} stack
 * @param {object} options
 * @param {Color} options.color
 */
const addItem = async (stack, { title, balance, total, icon, color }) => {
  const container = stack.addStack()
  container.centerAlignContent()
  const cs = vw(62 * 100 / 155)
  container.size = new Size(cs, cs)
  container.setPadding(0, 0, 0, 0)
  // container.borderWidth = vw(8 * 100 / 155)
  container.backgroundImage = getArc({
    color,
    percent: balance / total
  })

  const contentStack = container.addStack()
  const cts = vw(50 * 100 / 155)
  contentStack.size = new Size(cts, cts)
  contentStack.cornerRadius = cts / 2
  contentStack.layoutVertically()
  contentStack.setPadding(vw(8 * 100 / 155), 0, 0, 0)
  const gradient = new LinearGradient()
  gradient.colors = [new Color(color.hex, 0.2), new Color(color.hex, 0)]
  gradient.locations = [0, 1]
  gradient.startPoint = new Point(0, 0)
  gradient.endPoint = new Point(0, 1)
  contentStack.backgroundGradient = gradient

  centerH(contentStack, (s) => {
    const label = s.addText(title)
    label.font = Font.systemFont(vw(8 * 100 / 155))
    label.textColor = Color.dynamic(new Color('#221f1f', 0.7), new Color('#ffffff', 0.7))
  })

  centerH(contentStack, (s) => {
    const value = s.addText(`${balance}`)
    value.lineLimit = 1
    value.minimumScaleFactor = 0.5
    value.font = Font.boldRoundedSystemFont(vw(14 * 100 / 155))
  })

  centerH(contentStack, (s) => {
    const stack = s.addStack()
    const size = vw(16 * 100 / 155)
    stack.size = new Size(size, size)
    stack.cornerRadius = size / 2
    stack.backgroundColor = color
    stack.centerAlignContent()
    const ic = stack.addImage(SFSymbol.named(icon).image)
    const is = vw(12 * 100 / 155)
    ic.imageSize = new Size(is, is)
    ic.tintColor = Color.white()
  })
}

/**
 * @param {object} data
 * @param {number} data.hf
 * @param {number} data.ll
 * @param {number} data.totalLl
 * @param {number} data.yy
 * @param {number} data.totalYy
 */
const createWidget = async ({ hf, ll, totalLl, yy, totalYy }) => {
  const widget = new ListWidget()
  widget.backgroundImage = await createBg()
  widget.setPadding(0, 0, 0, 0)

  const container = widget.addStack()
  container.layoutVertically()
  const p = vw(14 * 100 / 155)
  container.setPadding(p, p, p, p)

  const top = container.addStack()
  top.layoutHorizontally()
  const hfStack = top.addStack()
  hfStack.layoutVertically()
  const hflabel = hfStack.addText('剩余话费')
  hflabel.font = Font.systemFont(vw(12 * 100 / 155))
  hflabel.textColor = Color.dynamic(new Color('#221f1f', 0.7), new Color('#ffffff', 0.7))
  const hfBalance = hfStack.addText(`${hf}`)
  hfBalance.minimumScaleFactor = 0.5
  hfBalance.font = Font.boldRoundedSystemFont(vw(24 * 100 / 155))
  hfBalance.textColor = Color.dynamic(new Color('#221f1f'), new Color('#ffffff'))
  top.addSpacer()
  // logo
  const logo = top.addImage(
    await cacheImage('https://cdn.jsdelivr.net/gh/Honye/scriptable-scripts@master/static/unicom.png', 'chinaunicom.png')
  )
  logo.imageSize = new Size(vw(24 * 100 / 155), vw(24 * 100 / 155))
  container.addSpacer(vw(18 * 100 / 155))
  const bottom = container.addStack()
  await addItem(bottom, {
    title: '剩余流量',
    balance: ll,
    total: totalLl,
    icon: 'antenna.radiowaves.left.and.right',
    color: new Color('#3bc9ec')
  })
  bottom.addSpacer()
  await addItem(bottom, {
    title: '剩余语音',
    balance: yy,
    total: totalYy,
    icon: 'phone',
    color: new Color('#a2cf39')
  })
  return widget
}

module.exports = { createWidget }
