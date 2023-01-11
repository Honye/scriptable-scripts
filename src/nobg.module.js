// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: chess-board;

/* -----------------------------------------------
Script      : no-background.js
Author      : dev@supermamon.com
Version     : 1.8.1
Description :
  A module to create illusions of transparent
  backgrounds for Scriptable widgets
Adapted from Max Zeryck's (@mzeryck) amazing
invisible widget shared on the Automtors discourse
https://talk.automators.fm/t/widget-examples/7994/135
Changelog   :
v1.8.1
- (fix) getPathForSlice returns empty string
v1.8.0
- (new) BREAKING CHANGE: background assignments
  are unique per device so that each device can
  have it's own wallpaper. Run "Regenerate Slices"
  on each device.
  But, there's a bug the current Scriptable version
  where Device.name() returns the model instead.
  So, the wallppapers actually can't be unique
  yet. Affects stable version 1.6.12 or beta 1.7
- (new) support for iPhone 14 Pro/Pro Max.
  Thank you @mzeryck & u/Senion-Ad-883
v1.7.0
- (new) support for iPhone 12 Mini. Thanks @blacksector
v1.6.0
- (new) `transparent` and `for` alias to `getSliceForWidget`
- (new) merged `No Background Config` code to maintain 1 code
- (new) auto-detect iCloud usage
v1.5.0
- (update) iPhone 12 Pro Max compatibility
v1.4.0
- (update) also prompt for setup on the getPathForSlice method
v1.3.0
- (update) automativally prompt for setup when
  slices are missing or if the widget's
  position is not yet stored.
v1.2.0
- (new) applyTint method to simulate a
  semi-tranparent look
v1.1.1
- (fix) syntax error on generateSlices
- (fix) incorrect iPhone 12 size
v1.1.0
- Support for iPhone 12 & 12 Pro
v1.0.2
- Typos on the documentation
v1.0.1
- Fix iamge does not exists issue
----------------------------------------------- */
if (typeof require === 'undefined') require = importModule
const { i18n } = require('./utils.module')

const ALERTS_AS_SHEETS = false

const USES_ICLOUD = false
const fm = FileManager.local()
const CACHE_FOLDER = 'cache/nobg'
const cachePath = fm.joinPath(fm.documentsDirectory(), CACHE_FOLDER)
const deviceId = `${Device.model()}_${Device.name()}`.replace(/[^a-zA-Z0-9\-_]/, '').toLowerCase()

const generateSlices = async function ({ caller = 'none' }) {
  const opts = { caller }

  const appearance = (await isUsingDarkAppearance()) ? 'dark' : 'light'
  const altAppearance = appearance === 'dark' ? 'light' : 'dark'

  if (!fm.fileExists(cachePath)) {
    fm.createDirectory(cachePath, true)
  }

  let message

  message = i18n([
    'To change background make sure you have a screenshot of you home screen. Go to your home screen and enter wiggle mode. Scroll to the empty page on the far right and take a screenshot.',
    '设置背景前先确认已有主屏截图。返回主屏打开编辑模式，滑动到最右边后截图'
  ])
  const options = [
    i18n(['Pick Screenshot', '选择截图']),
    i18n(['Exit to Take Screenshot', '退出去截屏'])
  ]
  let resp = await presentAlert(message, options, ALERTS_AS_SHEETS)
  if (resp === 1) return false

  // Get screenshot and determine phone size.
  const wallpaper = await Photos.fromLibrary()
  const height = wallpaper.size.height
  let suffix = ''

  // Check for iPhone 12 Mini here:
  if (height === 2436) {
    // We'll save everything in the config, to keep things centralized
    const cfg = await loadConfig()
    if (cfg['phone-model'] === undefined) {
      // Doesn't exist, ask them which phone they want to generate for,
      // the mini or the others?
      message = i18n(['What model of iPhone do you have?', '确认手机机型'])
      const options = ['iPhone 12 mini', 'iPhone 11 Pro, XS, or X']
      resp = await presentAlert(message, options, ALERTS_AS_SHEETS)
      // 0 represents iPhone Mini and 1 others.
      cfg['phone-model'] = resp
      await saveConfig(cfg) // Save the config
      if (resp === 0) {
        suffix = '_mini'
      }
    } else {
      // Config already contains iPhone model, use it from cfg
      if (cfg['phone-model']) {
        suffix = '_mini'
      }
    }
  }

  const phone = phoneSizes[height + suffix]
  if (!phone) {
    message = i18n([
      "It looks like you selected an image that isn't an iPhone screenshot, or your iPhone is not supported. Try again with a different image.",
      '看似你选的图不是屏幕截图或不支持你的机型，尝试使用其他截图'
    ])
    await presentAlert(message, [i18n(['OK', '好的'])], ALERTS_AS_SHEETS)
    return false
  }

  /** @type {('small'|'medium'|'large')[]} */
  const families = ['small', 'medium', 'large']

  // generate crop rects for all sizes
  for (let i = 0; i < families.length; i++) {
    const widgetSize = families[i]

    const crops = widgetPositions[widgetSize].map(item => {
      const position = item.value

      const crop = { pos: position, w: 0, h: 0, x: 0, y: 0 }
      crop.w = phone[widgetSize].w
      crop.h = phone[widgetSize].h
      crop.x = phone.left

      const pos = position.split('-')

      crop.y = phone[pos[0]]

      if (widgetSize === 'large' && pos[0] === 'bottom') {
        crop.y = phone.middle
      }

      if (pos.length > 1) {
        crop.x = phone[pos[1]]
      }

      return crop
    })

    for (let c = 0; c < crops.length; c++) {
      const crop = crops[c]
      const imgCrop = cropImage(wallpaper, new Rect(crop.x, crop.y, crop.w, crop.h))

      const imgName = `${deviceId}-${appearance}-${widgetSize}-${crop.pos}.jpg`
      const imgPath = fm.joinPath(cachePath, imgName)

      if (fm.fileExists(imgPath)) {
        // sometimes it wouldn't overwrite.
        // so better delete the file first
        if (USES_ICLOUD) await fm.downloadFileFromiCloud(imgPath)
        try { fm.remove(imgPath) } catch (e) { }
      }
      fm.writeImage(imgPath, imgCrop)
    }
  }

  if (opts.caller !== 'self') {
    message = i18n([
      `Slices saved for ${appearance} mode. You can switch to ${altAppearance} mode and run this again to also generate slices.`,
      `已经保存${appearance === 'dark' ? '夜间' : '白天'}透明背景。你可以切换到${altAppearance === 'dark' ? '夜间' : '白天'}模式后再次运行`
    ])
  } else {
    message = i18n(['Slices saved.', '已保存'])
  }
  await presentAlert(message, [i18n(['Ok', '好的'])], ALERTS_AS_SHEETS)

  return true
}
// ------------------------------------------------
const applyTint = function (widget, tint, alpha) {
  tint = tint || '#ffffff'
  alpha = alpha || 0.2

  const col = new Color(tint, alpha)
  const gradient = new LinearGradient()
  gradient.locations = [0, 1]
  gradient.colors = [col, col]

  widget.backgroundGradient = gradient
}
// ------------------------------------------------
const getSlice = async function (position) {
  const appearance = (await isUsingDarkAppearance()) ? 'dark' : 'light'

  const imgPath = fm.joinPath(cachePath, `${deviceId}-${appearance}-${position}.jpg`)
  if (!fm.fileExists(imgPath)) {
    log('image does not exists. setup required.')
    const setupCompleted = await generateSlices({ caller: 'getSliceForWidget' })
    if (!setupCompleted) {
      return null
    }
  }

  if (USES_ICLOUD) await fm.downloadFileFromiCloud(imgPath)

  const image = fm.readImage(imgPath)
  return image
}
// ------------------------------------------------
const getPathForSlice = async function (sliceName) {
  const appearance = (await isUsingDarkAppearance()) ? 'dark' : 'light'
  const imgPath = fm.joinPath(
    cachePath,
    `${deviceId}-${appearance}-${sliceName}.jpg`
  )

  let fileExists = fm.fileExists(imgPath)
  if (!fileExists) {
    fileExists = await generateSlices('self')
  }

  if (USES_ICLOUD && fileExists) await fm.downloadFileFromiCloud(imgPath)
  return imgPath
}
// ------------------------------------------------
/**
 * @param {string} instanceName
 * @param {boolean} reset
 */
const getSliceForWidget = async function (instanceName, reset = false) {
  const appearance = (await isUsingDarkAppearance()) ? 'dark' : 'light'
  let position = reset ? null : await getConfig(instanceName)
  if (!position) {
    log(`Background for "${instanceName}" is not yet set.`)

    // check if slices exists
    const testImage = fm.joinPath(cachePath, `${deviceId}-${appearance}-medium-top.jpg`)
    let readyToChoose = false
    if (!fm.fileExists(testImage)) {
      // need to generate slices
      // FIXME
      readyToChoose = await generateSlices({ caller: instanceName || 'self' })
    } else {
      readyToChoose = true
    }

    // now set the
    let backgrounChosen
    if (readyToChoose) {
      backgrounChosen = await chooseBackgroundSlice(instanceName)
    }

    if (backgrounChosen) {
      const cfg = await loadConfig()
      position = cfg[instanceName]
    } else {
      return null
    }
  }
  const imgPath = fm.joinPath(cachePath, `${deviceId}-${appearance}-${position}.jpg`)
  if (!fm.fileExists(imgPath)) {
    log(`Slice does not exists - ${deviceId}-${appearance}-${position}.jpg`)
    return null
  }

  if (USES_ICLOUD) await fm.downloadFileFromiCloud(imgPath)

  const image = fm.readImage(imgPath)
  return image
}
// ------------------------------------------------
const transparent = getSliceForWidget
// ------------------------------------------------
const chooseBackgroundSlice = async function (name) {
  // Prompt for widget size and position.
  let message = i18n(['What is the size of the widget?', '组件尺寸'])
  /** @type {{label:string;value:'small'|'medium'|'large'}[]} */
  const sizes = [
    { label: i18n(['Small', '小号']), value: 'small' },
    { label: i18n(['Medium', '中号']), value: 'medium' },
    { label: i18n(['Large', '大号']), value: 'large' },
    { label: i18n(['Cancel', '取消']), value: 'cancel' }
  ]
  const size = await presentAlert(message, sizes, ALERTS_AS_SHEETS)
  if (size === 3) return false
  const widgetSize = sizes[size].value

  message = i18n(['Where will it be placed on?', '组件位置'])
  const positions = widgetPositions[widgetSize]
  positions.push(i18n(['Cancel', '取消']))
  const resp = await presentAlert(message, positions, ALERTS_AS_SHEETS)

  if (resp === positions.length - 1) return false
  const position = positions[resp].value

  const cfg = await loadConfig()
  cfg[name] = `${widgetSize}-${position}`

  await saveConfig(cfg)
  await presentAlert(i18n(['Background saved.', '已保存']), [i18n(['Ok', '好'])], ALERTS_AS_SHEETS)
  return true
}
// ------------------------------------------------
const resetConfig = async function () {
  await saveConfig({})
  log('config file cleared')
}
/**
 * @param {string} instance
 * @returns {Promise<string|undefined>}
 */
const getConfig = async (instance) => {
  try {
    const conf = await loadConfig()
    return conf[instance]
  } catch (err) {}
}
/**
 * @param {string} instance
 */
const removeConfig = async (instance) => {
  const conf = await loadConfig()
  delete conf[instance]
  await saveConfig(conf)
}

// -- [helpers] -----------------------------------
// ------------------------------------------------
/**
 * @returns {Promise<Record<string, string>>}
 */
async function loadConfig () {
  const configPath = fm.joinPath(cachePath, 'widget-positions.json')
  if (!fm.fileExists(configPath)) {
    await fm.writeString(configPath, '{}')
    return {}
  } else {
    if (USES_ICLOUD) await fm.downloadFileFromiCloud(configPath)
    const strConf = fm.readString(configPath)
    const cfg = JSON.parse(strConf)
    return cfg
  }
}

const hasConfig = async () => {
  try {
    const conf = await loadConfig()
    return conf
  } catch (err) {
    return false
  }
}
// ------------------------------------------------
/**
 * @param {Record<string, string>} cfg
 */
async function saveConfig (cfg) {
  const configPath = fm.joinPath(cachePath, 'widget-positions.json')
  if (USES_ICLOUD) {
    await fm.downloadFileFromiCloud(configPath)
  }
  await fm.writeString(configPath, JSON.stringify(cfg))
  return cfg
}
// ------------------------------------------------
async function presentAlert (
  prompt = '',
  items = ['OK'],
  asSheet = false
) {
  const alert = new Alert()
  alert.message = prompt

  for (let n = 0; n < items.length; n++) {
    const item = items[n]
    if (typeof item === 'string') {
      alert.addAction(item)
    } else {
      alert.addAction(item.label)
    }
  }
  const resp = asSheet
    ? await alert.presentSheet()
    : await alert.presentAlert()
  return resp
}
// ------------------------------------------------
/**
 * @type {Record<'small'|'medium'|'large', {label:string;value:string}[]>}
 */
const widgetPositions = {
  small: [
    { label: i18n(['Top Left', '左上']), value: 'top-left' },
    { label: i18n(['Top Right', '右上']), value: 'top-right' },
    { label: i18n(['Middle Left', '左中']), value: 'middle-left' },
    { label: i18n(['Middle Right', '右中']), value: 'middle-right' },
    { label: i18n(['Bottom Left', '左下']), value: 'bottom-left' },
    { label: i18n(['Bottom Right', '右下']), value: 'bottom-right' }
  ],
  medium: [
    { label: i18n(['Top', '上方']), value: 'top' },
    { label: i18n(['Middle', '中部']), value: 'middle' },
    { label: i18n(['Bottom', '下方']), value: 'bottom' }
  ],
  large: [
    { label: i18n(['Top', '上方']), value: 'top' },
    { label: i18n(['Bottom', '下方']), value: 'bottom' }
  ]
}
// ------------------------------------------------
/**
 * @type {Record<string|number, {
 * models: string[];
 * small: { w: number; h: number };
 * medium: { w: number; h: number };
 * large: { w: number; h: number };
 * left:number; right:number; top:number; middle:number; bottom:number;
 * }>}
 */
const phoneSizes = {
  2796: {
    models: ['14 Pro Max'],
    small: { w: 510, h: 510 },
    medium: { w: 1092, h: 510 },
    large: { w: 1092, h: 1146 },
    left: 99,
    right: 681,
    top: 282,
    middle: 918,
    bottom: 1554
  },

  2556: {
    models: ['14 Pro'],
    small: { w: 474, h: 474 },
    medium: { w: 1014, h: 474 },
    large: { w: 1014, h: 1062 },
    left: 82,
    right: 622,
    top: 270,
    middle: 858,
    bottom: 1446
  },

  2778: {
    models: ['12 Pro Max', '13 Pro Max', '14 Plus'],
    small: { w: 510, h: 510 },
    medium: { w: 1092, h: 510 },
    large: { w: 1092, h: 1146 },
    left: 96,
    right: 678,
    top: 246,
    middle: 882,
    bottom: 1518
  },

  2532: {
    models: ['12', '12 Pro', '13', '14'],
    small: { w: 474, h: 474 },
    medium: { w: 1014, h: 474 },
    large: { w: 1014, h: 1062 },
    left: 78,
    right: 618,
    top: 231,
    middle: 819,
    bottom: 1407
  },

  2688: {
    models: ['Xs Max', '11 Pro Max'],
    small: { w: 507, h: 507 },
    medium: { w: 1080, h: 507 },
    large: { w: 1080, h: 1137 },
    left: 81,
    right: 654,
    top: 228,
    middle: 858,
    bottom: 1488
  },

  1792: {
    models: ['11', 'Xr'],
    small: { w: 338, h: 338 },
    medium: { w: 720, h: 338 },
    large: { w: 720, h: 758 },
    left: 54,
    right: 436,
    top: 160,
    middle: 580,
    bottom: 1000
  },

  2436: {
    models: ['X', 'Xs', '11 Pro'],
    small: { w: 465, h: 465 },
    medium: { w: 987, h: 465 },
    large: { w: 987, h: 1035 },
    left: 69,
    right: 591,
    top: 213,
    middle: 783,
    bottom: 1353
  },

  '2436_mini': {
    models: ['12 Mini'],
    small: { w: 465, h: 465 },
    medium: { w: 987, h: 465 },
    large: { w: 987, h: 1035 },
    left: 69,
    right: 591,
    top: 231,
    middle: 801,
    bottom: 1371
  },

  2208: {
    models: ['6+', '6s+', '7+', '8+'],
    small: { w: 471, h: 471 },
    medium: { w: 1044, h: 471 },
    large: { w: 1044, h: 1071 },
    left: 99,
    right: 672,
    top: 114,
    middle: 696,
    bottom: 1278
  },

  1334: {
    models: ['6', '6s', '7', '8'],
    small: { w: 296, h: 296 },
    medium: { w: 642, h: 296 },
    large: { w: 642, h: 648 },
    left: 54,
    right: 400,
    top: 60,
    middle: 412,
    bottom: 764
  },

  1136: {
    models: ['5', '5s', '5c', 'SE'],
    small: { w: 282, h: 282 },
    medium: { w: 584, h: 282 },
    large: { w: 584, h: 622 },
    left: 30,
    right: 332,
    top: 59,
    middle: 399,
    bottom: 399
  }
}
// ------------------------------------------------
function cropImage (img, rect) {
  const draw = new DrawContext()
  draw.size = new Size(rect.width, rect.height)
  draw.drawImageAtPoint(img, new Point(-rect.x, -rect.y))
  return draw.getImage()
}
// ------------------------------------------------
async function isUsingDarkAppearance () {
  return !(Color.dynamic(Color.white(), Color.black()).red)
}
// ------------------------------------------------

module.exports = {
  cachePath,
  generateSlices,
  applyTint,
  getSlice,
  getPathForSlice,
  getSliceForWidget,
  transparent,
  chooseBackgroundSlice,
  hasConfig,
  resetConfig,
  getConfig,
  removeConfig
}
