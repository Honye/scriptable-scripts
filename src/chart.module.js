/**
 * @version 0.0.2
 * @author github/Honye
 */

/**
 * @param {object} options
 * @param {number[]} options.data
 * @param {Size} options.size
 * @param {Color} options.lineColor
 * @param {Color} options.shadowColor
 */
const lineChart = async (options) => {
  let { data, size: imageSize, lineWidth, lineColor, radius, shadowColor } = {
    radius: 0.5,
    lineWidth: 0.5,
    ...options
  }
  const scale = Device.screenScale()
  const width = imageSize.width * scale
  const height = imageSize.height * scale
  lineWidth *= scale
  radius *= scale
  const min = Math.min(...data)
  const max = Math.max(...data)
  const maxOffset = max - min
  const { length } = data
  const yUnit = (height - radius * 2) / maxOffset
  const xUnit = (width - radius * 2) / (length - 1)
  const createStyle = ({ red, green, blue, alpha }) =>
    `rgba(${red * 255},${green * 255},${blue * 255},${alpha})`
  const lineStyle = createStyle(lineColor)
  const shadowStyle = createStyle(shadowColor)
  const transparentStyle = createStyle(new Color(shadowColor.hex, 0))

  const js =
  `const data = ${JSON.stringify(data)}
  const canvas = document.createElement('canvas')
  canvas.width = ${width}
  canvas.height = ${height}
  const ctx = canvas.getContext('2d')
  ctx.beginPath()
  for (const [i, num] of data.entries()) {
    const point = [i * ${xUnit} + ${radius}, ${height} - (num - ${min}) * ${yUnit} - ${radius} * 2 + ${radius}]
    if (i === 0) {
      ctx.moveTo(...point)
    } else {
      ctx.lineTo(...point)
    }
  }
  ctx.strokeStyle = '${lineStyle}'
  ctx.lineWidth = ${lineWidth}
  ctx.stroke()

  ctx.beginPath()
  for (const [i, num] of data.entries()) {
    const point = [i * ${xUnit} + ${radius}, ${height} - (num - ${min}) * ${yUnit} - ${radius} * 2 + ${radius}]
    if (i === 0) {
      ctx.moveTo(${radius}, ${height - radius})
      ctx.lineTo(...point)
    } else {
      ctx.lineTo(...point)
    }
    if (i === data.length - 1) {
      ctx.lineTo(point[0], ${height - radius})
    }
  }
  const gradient = ctx.createLinearGradient(0, 0, 0, ${height})
  gradient.addColorStop(0, '${shadowStyle}')
  gradient.addColorStop(1, '${transparentStyle}')
  ctx.fillStyle = gradient
  ctx.fill()
  const uri = canvas.toDataURL()
  completion(uri)`
  const webView = new WebView()
  const uri = await webView.evaluateJavaScript(js, true)
  const base64str = uri.replace(/^data:image\/\w+;base64,/, '')
  const image = Image.fromData(Data.fromBase64String(base64str))
  return image
}

module.exports = { lineChart }
