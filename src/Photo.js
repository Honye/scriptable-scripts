if (typeof require === 'undefined') require = importModule
const { i18n, useCache, vmin } = require('./utils.module')
const { sloarToLunar } = require('lunar.module')
const { withSettings } = require('./withSettings.module')

const preference = {
  titleFont: 'DFPKanTingLiuW9-GB',
  text: 'MOMO\nMIANMIAN',
  textColor: '#1e1f24',
  textColorDark: '#ffffff',
  secondaryColor: '#80828d',
  secondaryColorDark: '#b3b3bd',
  imageRadius: 0
}

const rpt = (n) => vmin(n * 100 / 329, config.widgetFamily)
const cache = useCache()

const getPhoto = async (filename) => {
  const image = cache.readImage(filename)
  return image
}

const $12Animals = {
  子: '鼠',
  丑: '牛',
  寅: '虎',
  卯: '兔',
  辰: '龙',
  巳: '蛇',
  午: '马',
  未: '羊',
  申: '猴',
  酉: '鸡',
  戌: '狗',
  亥: '猪'
}

/**
 * @param {number} index
 */
const choosePhoto = async (index) => {
  const image = await Photos.fromLibrary()
  const filename = `photo_${index}`
  cache.writeImage(filename, image)
}

const createWidget = async () => {
  const { text, titleFont, imageRadius } = preference
  const textColor = Color.dynamic(
    new Color(preference.textColor),
    new Color(preference.textColorDark)
  )
  const secondaryColor = Color.dynamic(
    new Color(preference.secondaryColor),
    new Color(preference.secondaryColorDark)
  )
  const widget = new ListWidget()
  widget.backgroundColor = Color.dynamic(new Color('#fff'), new Color('#19191b'))
  widget.setPadding(0, rpt(16), 0, rpt(16))

  const head = widget.addStack()
  const title = head.addText(text)
  title.font = titleFont ? new Font(titleFont, rpt(28)) : Font.boldSystemFont(rpt(28))
  title.textColor = textColor

  const now = new Date()
  head.addSpacer()
  head.centerAlignContent()
  const right = head.addStack()
  right.centerAlignContent()

  const date = right.addText(`${now.getDate()}`.padStart(2, '0'))
  date.font = new Font('DIN Alternate', rpt(38))
  date.textColor = textColor
  right.addSpacer(rpt(6))
  const rr = right.addStack()
  rr.layoutVertically()

  const secondaryTextSize = rpt(10)
  const { lunarYear, lunarMonth, lunarDay } = sloarToLunar(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate()
  )
  const monthDf = new DateFormatter()
  monthDf.locale = 'zh-CN'
  monthDf.dateFormat = 'MMMM'
  const weekDf = new DateFormatter()
  weekDf.locale = 'zh-CN'
  weekDf.dateFormat = 'E'
  const monthWeek = rr.addText(`${monthDf.string(now)}｜${weekDf.string(now)}`)
  monthWeek.font = Font.systemFont(secondaryTextSize)
  monthWeek.textColor = secondaryColor
  rr.addSpacer(rpt(4))
  const l = rr.addText(`${$12Animals[lunarYear[1]]}年${lunarMonth}月${lunarDay}`)
  l.font = Font.systemFont(secondaryTextSize)
  l.textColor = secondaryColor

  widget.addSpacer(rpt(12))
  const photos = widget.addStack()
  photos.layoutHorizontally()
  photos.centerAlignContent()

  const addOne = async (filename) => {
    const image = photos.addStack()
    image.size = new Size(rpt(80), rpt(152))
    image.backgroundImage = await getPhoto(filename)
    image.cornerRadius = imageRadius
    return image
  }
  await addOne('photo_1')

  photos.addSpacer(rpt(4))
  await addOne('photo_2')

  photos.addSpacer(rpt(8))
  const photosRight = photos.addStack()
  photosRight.layoutVertically()

  const third = photosRight.addStack()
  third.size = new Size(rpt(125), rpt(121))
  third.cornerRadius = imageRadius
  third.backgroundImage = await getPhoto('photo_3')

  photosRight.addSpacer(rpt(4))
  const fourth = photosRight.addStack()
  fourth.size = new Size(rpt(125), rpt(100))
  fourth.cornerRadius = imageRadius
  fourth.backgroundImage = await getPhoto('photo_4')
  return widget
}

await withSettings({
  formItems: [
    {
      label: i18n(['Title', '标题']),
      name: 'text',
      type: 'textarea',
      default: preference.text
    },
    {
      label: i18n(['Title Font', '标题字体']),
      name: 'titleFont',
      default: preference.titleFont
    },
    {
      label: i18n(['Text Color', '文本颜色']),
      name: 'textColor',
      type: 'color',
      media: '(prefers-color-scheme: light)',
      default: preference.textColor
    },
    {
      label: i18n(['Text Color', '文本颜色']),
      name: 'textColorDark',
      type: 'color',
      media: '(prefers-color-scheme: dark)',
      default: preference.textColorDark
    },
    {
      label: i18n(['Secondary Color', '副文本颜色']),
      name: 'secondaryColor',
      type: 'color',
      media: '(prefers-color-scheme: light)',
      default: preference.secondaryColor
    },
    {
      label: i18n(['Secondary Color', '副文本颜色']),
      name: 'secondaryColorDark',
      type: 'color',
      media: '(prefers-color-scheme: dark)',
      default: preference.secondaryColorDark
    },
    {
      label: i18n(['Image Radius', '图片圆角']),
      name: 'imageRadius',
      type: 'number',
      default: preference.imageRadius
    },
    {
      label: i18n(['Choose Photo', '选择图片']),
      name: 'photos',
      type: 'group',
      items: [
        {
          label: i18n(['Photo 1', '图1']),
          name: 'photo1',
          type: 'cell'
        },
        {
          label: i18n(['Photo 2', '图2']),
          name: 'photo2',
          type: 'cell'
        },
        {
          label: i18n(['Photo 3', '图3']),
          name: 'photo3',
          type: 'cell'
        },
        {
          label: i18n(['Photo 4', '图4']),
          name: 'photo4',
          type: 'cell'
        }
      ]
    }
  ],
  onItemClick: ({ name }) => {
    const match = name.match(/photo(\d+)$/)
    if (match) {
      choosePhoto(Number(match[1]))
    }
  },
  render: async ({ family, settings }) => {
    if (family) config.widgetFamily = family
    Object.assign(preference, settings)
    const widget = await createWidget()
    return widget
  }
})
