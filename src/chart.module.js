/**
 * @version 0.0.1
 * @author github/Honye
 */

/**
 * @param {object} options
 * @param {number[]} options.data
 * @param {Size} options.size
 * @param {Color} options.lineColor
 * @param {Color} options.shadowColor
 */
const lineChart = (options) => {
  const { data, size, lineWidth, lineColor, radius, shadowColor } = {
    radius: 0.5,
    lineWidth: 0.5,
    ...options
  }
  const min = Math.min(...data)
  const max = Math.max(...data)
  const maxOffset = max - min
  const length = data.length
  const yUnit = (size.height - radius * 2) / maxOffset
  const xUnit = (size.width - radius * 2) / (length - 1)

  const context = new DrawContext()
  context.size = size
  context.respectScreenScale = true
  context.opaque = false
  context.setLineWidth(lineWidth)
  // const dotsPath = new Path()
  const linePath = new Path()
  const areaPath = new Path()
  const points = []
  for (const [i, num] of data.entries()) {
    // dotsPath.addEllipse(new Rect(
    //   i * xUnit,
    //   size.height - (num - min) * yUnit - radius * 2,
    //   radius * 2,
    //   radius * 2
    // ))

    const point = new Point(i * xUnit + radius, size.height - (num - min) * yUnit - radius * 2 + radius)
    points.push(point)
    if (i === 0) {
      linePath.move(point)
      areaPath.move(point)
    } else {
      linePath.addLine(point)
      areaPath.addLine(point)
    }
  }
  // context.addPath(dotsPath)
  // context.setFillColor(lineColor)
  // context.fillPath()

  context.addPath(linePath)
  context.setStrokeColor(lineColor)
  context.strokePath()

  areaPath.addLine(new Point(points[points.length - 1].x, size.height - radius))
  areaPath.addLine(new Point(radius, size.height - radius))
  context.addPath(areaPath)
  context.setFillColor(shadowColor)
  context.fillPath()

  const image = context.getImage()
  return image
}

module.exports = { lineChart }
