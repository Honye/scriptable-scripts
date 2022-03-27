/**
 * @param {object} options
 * @param {string} [options.title]
 * @param {string} [options.message]
 * @param {Array<{ title: string; [key: string]: any }>} options.options
 * @param {boolean} [options.showCancel = true]
 * @param {string} [options.cancelText = 'Cancel']
 */
module.exports.presentSheet = async function (options) {
  options = {
    showCancel: true,
    cancelText: 'Cancel',
    ...options
  }
  const alert = new Alert()
  if (options.title) {
    alert.title = options.title
  }
  if (options.message) {
    alert.message = options.message
  }
  if (!options.options) {
    throw new Error('The "options" property of the parameter cannot be empty')
  }
  for (const option of options.options) {
    alert.addAction(option.title)
  }
  if (options.showCancel) {
    alert.addCancelAction(options.cancelText)
  }
  const value = await alert.presentSheet()
  return {
    value,
    option: options.options[value]
  }
}

/**
 * @param {number} [height] The screen height measured in pixels
 */
module.exports.phoneSize = (height) => {
  const phones = {
    /** 12 Pro Max */
    2778: {
      small: 510,
      medium: 1092,
      large: 1146,
      left: 96,
      right: 678,
      top: 246,
      middle: 882,
      bottom: 1518
    },
    /** 12 and 12 Pro */
    2532: {
      small: 474,
      medium: 1014,
      large: 1062,
      left: 78,
      right: 618,
      top: 231,
      middle: 819,
      bottom: 1407
    },
    /** 11 Pro Max, XS Max */
    2688: {
      small: 507,
      medium: 1080,
      large: 1137,
      left: 81,
      right: 654,
      top: 228,
      middle: 858,
      bottom: 1488
    },
    /** 11, XR */
    1792: {
      small: 338,
      medium: 720,
      large: 758,
      left: 55,
      right: 437,
      top: 159,
      middle: 579,
      bottom: 999
    },
    /** 11 Pro, XS, X, 12 mini */
    2436: {
      small: 465,
      medium: 987,
      large: 1035,
      x: {
        left: 69,
        right: 591,
        top: 213,
        middle: 783,
        bottom: 1353
      },
      mini: {
        left: 69,
        right: 591,
        top: 231,
        middle: 801,
        bottom: 1371
      }
    },
    /** Plus phones */
    2208: {
      small: 471,
      medium: 1044,
      large: 1071,
      left: 99,
      right: 672,
      top: 114,
      middle: 696,
      bottom: 1278
    },
    /** SE2 and 6/6S/7/8 */
    1334: {
      small: 296,
      medium: 642,
      large: 648,
      left: 54,
      right: 400,
      top: 60,
      middle: 412,
      bottom: 764
    },
    /** SE1 */
    1136: {
      small: 282,
      medium: 584,
      large: 622,
      left: 30,
      right: 332,
      top: 59,
      middle: 399,
      bottom: 399
    },
    /** 11 and XR in Display Zoom mode */
    1624: {
      small: 310,
      medium: 658,
      large: 690,
      left: 46,
      right: 394,
      top: 142,
      middle: 522,
      bottom: 902
    },
    /** Plus in Display Zoom mode */
    2001: {
      small: 444,
      medium: 963,
      large: 972,
      left: 81,
      right: 600,
      top: 90,
      middle: 618,
      bottom: 1146
    }
  }
  height = height || Device.screenResolution().height
  const scale = Device.screenScale()

  if (config.runsInWidget) {
    const phone = phones[height]
    if (phone) {
      return phone
    }

    const pc = {
      small: 164 * scale,
      medium: 344 * scale,
      large: 354 * scale
    }
    return pc
  }

  // in app screen fixed 375x812 pt
  return {
    small: 155 * scale,
    medium: 329 * scale,
    large: 345 * scale
  }
}

/**
 * download code
 * @param {object} options
 * @param {string} options.fileURL
 */
module.exports.updateCode = async (options) => {
  const { fileURL } = options
  let fm = FileManager.local()
  if (fm.isFileStoredIniCloud(module.filename)) {
    fm = FileManager.iCloud()
  }
  const request = new Request(fileURL)
  try {
    const code = await request.loadString()
    fm.writeString(module.filename, code)
    const alert = new Alert()
    alert.message = 'The code has been updated. If the script is open, close it for the change to take effect.'
    alert.addAction('OK')
    alert.presentAlert()
  } catch (e) {
    console.error(e)
  }
}

/**
 * @param {{[language: string]: string} | string[]} langs
 */
module.exports.i18n = (langs) => {
  const language = Device.language()
  if (Array.isArray(langs)) {
    langs = {
      en: langs[0],
      zh: langs[1],
      others: langs[0]
    }
  } else {
    langs.others = langs.others || langs.en
  }
  return langs[language] || langs.others
}

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
