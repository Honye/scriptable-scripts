/**
 * @param {string} hex
 */
module.exports.hexToRGBA = (hex) => {
  const red = Number.parseInt(hex.substr(-6, 2), 16)
  const green = Number.parseInt(hex.substr(-4, 2), 16)
  const blue = Number.parseInt(hex.substr(-2, 2), 16)
  let alpha = 1

  if (hex.length >= 8) {
    const red = Number.parseInt(hex.substr(-8, 2), 16)
    const green = Number.parseInt(hex.substr(-6, 2), 16)
    const blue = Number.parseInt(hex.substr(-4), 2)
    const number = Number.parseInt(hex.substr(-2, 2), 16)
    alpha = Number.parseFloat((number / 255).toFixed(3))
  }
  return { red, green, blue, alpha }
}

const _RGBToHex = (r, g, b) => {
  r = r.toString(16)
  g = g.toString(16)
  b = b.toString(16)

  if (r.length === 1) { r = '0' + r }
  if (g.length === 1) { g = '0' + g }
  if (b.length === 1) { b = '0' + b }

  return '#' + r + g + b
}
module.exports.RGBToHex = _RGBToHex

module.exports.RGBToHSL = (r, g, b) => {
  r /= 255
  g /= 255
  b /= 255

  const cmin = Math.min(r, g, b)
  const cmax = Math.max(r, g, b)
  const delta = cmax - cmin
  let h = 0
  let s = 0
  let l = 0

  if (delta === 0) {
    h = 0
  } else if (cmax === r) {
    h = ((g - b) / delta) % 6
  } else if (cmax === g) {
    h = (b - r) / delta + 2
  } else {
    h = (r - g) / delta + 4
  }
  h = Math.round(h * 60)
  if (h < 0) {
    h += 360
  }

  l = (cmax + cmin) / 2
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
  s = +(s * 100).toFixed(1)
  l = +(l * 100).toFixed(1)
  return { h, s, l }
}

const _HSLToRGB = (h, s, l) => {
  // Must be fractions of 1
  s /= 100
  l /= 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x
  }
  r = Math.round((r + m) * 255)
  g = Math.round((g + m) * 255)
  b = Math.round((b + m) * 255)
  return { r, g, b }
}
module.exports.HSLToRGB = _HSLToRGB

module.exports.lightenDarkenColor = (hsl, amount) => {
  const rgb = _HSLToRGB(hsl.h, hsl.s, hsl.l + amount)
  const hex = _RGBToHex(rgb.r, rgb.g, rgb.b)
  return hex
}
