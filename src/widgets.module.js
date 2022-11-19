const { getImage } = importModule('utils.module')

/**
 * @param {ListWidget | WidgetStack} stack container widget
 * @param {object} options
 * @param {string} [options.src] image url
 * @param {Image} [options.image]
 * @param {number} options.size
 */
module.exports.addAvatar = async (stack, options) => {
  const { image, src, size } = options
  const _image = stack.addImage(image || await getImage(src))
  _image.imageSize = new Size(size, size)
  _image.cornerRadius = size
  return _image
}

/**
 * @param {ListWidget | WidgetStack} stack
 * @param {object} options
 * @param {number} [options.column] column count
 * @param {number | [number, number]} [options.gap]
 * @param {'row' | 'column'} [options.direction]
 */
module.exports.useGrid = async (stack, options) => {
  const {
    column,
    gap = 0,
    direction = 'row'
  } = options
  const [columnGap, rowGap] = typeof gap === 'number' ? [gap, gap] : gap

  if (direction === 'row') {
    stack.layoutVertically()
  } else {
    stack.layoutHorizontally()
  }

  let i = -1
  const rows = []

  const add = async (fn) => {
    i++
    const r = Math.floor(i / column)
    if (i % column === 0) {
      if (r > 0) {
        stack.addSpacer(rowGap)
      }
      const rowStack = stack.addStack()
      if (direction === 'row') {
        rowStack.layoutHorizontally()
      } else {
        rowStack.layoutVertically()
      }
      rows.push(rowStack)
    }

    if (i % column > 0) {
      rows[r].addSpacer(columnGap)
    }
    await fn(rows[r])
  }

  return { add }
}

/**
 * @param {*} stack reserved for future use
 * @param {object} options
 * @param {number} [options.radius]
 * @param {number} [options.width]
 * @param {Color} [options.bgColor]
 * @param {Color} [options.fgColor]
 * @param {number} [options.angle] unit: degree
 */
module.exports.useArc = (stack, options) => {
  const {
    radius = 30,
    width = 8,
    bgColor,
    fgColor,
    angle = 45
  } = options
  const size = radius * 2 + width
  const diameter = radius * 2
  const canvas = new DrawContext()
  canvas.opaque = false
  canvas.respectScreenScale = true
  canvas.size = new Size(size, size)

  const bgRect = new Rect(width / 2, width / 2, diameter, diameter)
  canvas.setStrokeColor(bgColor)
  canvas.setLineWidth(width)
  canvas.strokeEllipse(bgRect)

  canvas.setFillColor(fgColor)
  for (let i = 0; i < angle; i++) {
    const x = radius + radius * Math.sin(Math.PI / 180 * i)
    const y = radius - radius * Math.cos(Math.PI / 180 * i)
    const rect = new Rect(x, y, width, width)
    canvas.fillEllipse(rect)
  }

  return {
    image: canvas.getImage()
  }
}
