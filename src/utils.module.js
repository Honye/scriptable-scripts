const name = 'Utils'

/**
 * @param {object} options
 * @param {string} [options.title]
 * @param {string} [options.message]
 * @param {Array<{ title: string; [key: string]: any }>} options.options
 * @param {boolean} [options.showCancel = true]
 * @param {string} [options.cancelText = 'Cancel']
 */
const presentSheet = async (options) => {
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
const phoneSize = (height) => {
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

  const phone = phones[height]
  if (phone) {
    return phone
  }

  if (config.runsInWidget) {
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
const updateCode = async (options) => {
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
const i18n = (langs) => {
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

const getImage = async (url) => {
  const request = new Request(url)
  const image = await request.loadImage()
  return image
}

/** 是否同一天 */
const isSameDay = (a, b) => {
  const leftDate = new Date(a)
  leftDate.setHours(0)
  const rightDate = new Date(b)
  rightDate.setHours(0)
  return Math.abs(leftDate - rightDate) < 3600000
}

const isToday = (date) => isSameDay(new Date(), date)

const tintedImage = async (image, color) => {
  const html =
    `<img id="image" src="data:image/png;base64,${Data.fromPNG(image).toBase64String()}" />
    <canvas id="canvas"></canvas>`
  const js =
    `let img = document.getElementById("image");
     let canvas = document.getElementById("canvas");
     let color = 0x${color.hex};

     canvas.width = img.width;
     canvas.height = img.height;
     let ctx = canvas.getContext("2d");
     ctx.drawImage(img, 0, 0);
     let imgData = ctx.getImageData(0, 0, img.width, img.height);
     // ordered in RGBA format
     let data = imgData.data;
     for (let i = 0; i < data.length; i++) {
       // skip alpha channel
       if (i % 4 === 3) continue;
       // bit shift the color value to get the correct channel
       data[i] = (color >> (2 - i % 4) * 8) & 0xFF
     }
     ctx.putImageData(imgData, 0, 0);
     canvas.toDataURL("image/png").replace(/^data:image\\/png;base64,/, "");`
  const wv = new WebView()
  await wv.loadHTML(html)
  const base64 = await wv.evaluateJavaScript(js)
  return Image.fromData(Data.fromBase64String(base64))
}

/**
 * @param {...string} paths
 */
const joinPath = (...paths) => {
  const fm = FileManager.local()
  return paths.reduce((prev, curr) => {
    return fm.joinPath(prev, curr)
  }, '')
}

/**
 * 注意：桌面组件无法写入 cacheDirectory 和 temporaryDirectory
 * @param {object} options
 * @param {boolean} [options.useICloud]
 * @param {string} [options.basePath]
 */
const useFileManager = (options = {}) => {
  const { useICloud, basePath } = options
  const fm = useICloud ? FileManager.iCloud() : FileManager.local()
  const paths = [fm.documentsDirectory(), Script.name()]
  if (basePath) {
    paths.push(basePath)
  }
  const cacheDirectory = joinPath(...paths)
  /**
   * 删除路径末尾所有的 /
   * @param {string} filePath
   */
  const safePath = (filePath) => {
    return fm.joinPath(cacheDirectory, filePath).replace(/\/+$/, '')
  }
  /**
   * 如果上级文件夹不存在，则先创建文件夹
   * @param {string} filePath
   */
  const preWrite = (filePath) => {
    const i = filePath.lastIndexOf('/')
    const directory = filePath.substring(0, i)
    if (!fm.fileExists(directory)) {
      fm.createDirectory(directory, true)
    }
  }

  const writeString = (filePath, content) => {
    const nextPath = safePath(filePath)
    preWrite(nextPath)
    fm.writeString(nextPath, content)
  }

  const writeJSON = (filePath, jsonData) => writeString(filePath, JSON.stringify(jsonData))
  /**
   * @param {string} filePath
   * @param {Image} image
   */
  const writeImage = (filePath, image) => {
    const nextPath = safePath(filePath)
    preWrite(nextPath)
    return fm.writeImage(nextPath, image)
  }

  const readString = (filePath) => {
    return fm.readString(
      fm.joinPath(cacheDirectory, filePath)
    )
  }

  const readJSON = (filePath) => JSON.parse(readString(filePath))
  /**
   * @param {string} filePath
   */
  const readImage = (filePath) => {
    return fm.readImage(fm.joinPath(cacheDirectory, filePath))
  }

  return {
    cacheDirectory,
    writeString,
    writeJSON,
    writeImage,
    readString,
    readJSON,
    readImage
  }
}

const useCache = () => useFileManager({ basePath: 'cache' })

/**
 * @param {string} filename
 */
const isRunSelf = (filename) => {
  const matches = filename.match(/[^/]+$/)
  const name = matches ? matches[0].replace('.js', '') : ''
  return Script.name() === name
}

/**
 * @param {string} data
 */
const hashCode = (data) => {
  return Array.from(data).reduce((accumulator, currentChar) => Math.imul(31, accumulator) + currentChar.charCodeAt(0), 0)
}

module.exports = {
  name,
  i18n,
  phoneSize,
  presentSheet,
  updateCode,
  getImage,
  isSameDay,
  isToday,
  tintedImage,
  useFileManager,
  useCache,
  isRunSelf,
  hashCode
}
