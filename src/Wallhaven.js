const { withSettings } = importModule('./withSettings.module')
const { getImage, i18n } = importModule('./utils.module')

const preference = {
  categories: '010',
  sorting: 'date_added',
  colors: '',
  purity: '100',
  count: '1',
  gap: '4',
  borderWidth: '0',
  cornerRadius: '0',
  itemCornerRadius: '0',
  apikey: ''
}

const getWallpapers = async () => {
  const params = {
    q: preference.q,
    categories: preference.categories,
    sorting: preference.sorting,
    colors: preference.colors,
    purity: preference.purity,
    apikey: preference.apikey
  }
  let search = []
  for (const k in params) {
    const v = preference[k]
    if (v) {
      search.push(`${k}=${encodeURIComponent(v)}`)
    }
  }
  search = search.join('&')
  const api = 'https://wallhaven.cc/api/v1/search'
  const url = `${api}?${search}`
  const request = new Request(url)
  const json = await request.loadJSON()
  return json
}

const addItem = async (widget, data) => {
  const { itemCornerRadius } = preference
  const wrapper = widget.addStack()
  wrapper.url = data.url
  const imageStack = wrapper.addStack()
  imageStack.cornerRadius = Number(itemCornerRadius)
  imageStack.layoutVertically()
  imageStack.addSpacer()
  imageStack.addStack().addSpacer()
  const image = await getImage(data.path)
  imageStack.backgroundImage = image
}

const addOne = async (widget, data) => {
  const { cornerRadius } = preference
  const item = widget.addStack()
  item.cornerRadius = Number(cornerRadius)
  await addItem(item, data)
}

const addTwo = async (widget, data) => {
  const { cornerRadius, gap } = preference
  const stack = widget.addStack()
  stack.cornerRadius = Number(cornerRadius)
  for (const [i, item] of data.entries()) {
    if (i > 0) {
      stack.addSpacer(Number(gap))
    }
    await addItem(stack, item)
  }
}

const addThree = async (widget, data) => {
  const { cornerRadius, gap } = preference
  const stack = widget.addStack()
  stack.cornerRadius = Number(cornerRadius)
  await addItem(stack, data[0])
  stack.addSpacer(Number(gap))
  const right = stack.addStack()
  right.layoutVertically()
  right.addStack().addSpacer()
  for (const [i, item] of data.slice(1).entries()) {
    if (i > 0) {
      right.addSpacer(Number(gap))
    }
    await addItem(right, item)
  }
}

const addFour = async (widget, data) => {
  const { cornerRadius, gap } = preference
  const stack = widget.addStack()
  stack.cornerRadius = Number(cornerRadius)
  for (let i = 0; i < 2; i++) {
    if (i > 0) {
      stack.addSpacer(Number(gap))
    }
    const half = stack.addStack()
    half.layoutVertically()
    for (const [j, item] of data.slice(i * 2, i * 2 + 2).entries()) {
      if (j > 0) {
        half.addSpacer(Number(gap))
      }
      log(`${i}-${j}`)
      await addItem(half, item)
    }
  }
}

const createWidget = async () => {
  const { borderWidth, count, purity, apikey } = preference
  const family = config.widgetFamily
  const widget = new ListWidget()
  widget.setPadding(...Array(4).fill(Number(borderWidth)))
  if (purity === '001' && !apikey) {
    const text = widget.addText(
      i18n(['"NSFW" need API Key', '“垂涎若渴”需要 API Key'])
    )
    text.centerAlignText()
    text.textColor = Color.red()
    return widget
  }

  const { data } = await getWallpapers()
  if (!data.length) {
    const text = widget.addText(i18n(['Not match was found', '未发现匹配项目']))
    text.centerAlignText()
    text.textColor = Color.red()
    return widget
  }

  if (family === 'small') {
    widget.url = count > 1
      ? 'https://wallhaven.cc/'
      : data[0].url
  }
  const n = Math.min(count, data.length)
  if (n === 1) {
    await addOne(widget, data[0])
  } else if (n === 2) {
    await addTwo(widget, data.slice(0, 2))
  } else if (n === 3) {
    await addThree(widget, data.slice(0, 3))
  } else if (n === 4) {
    await addFour(widget, data.slice(0, 4))
  }

  return widget
}

await withSettings({
  formItems: [
    {
      label: i18n(['Search', '搜索']),
      name: 'q',
      type: 'text',
      default: ''
    },
    {
      label: i18n(['Categories', '分类']),
      name: 'categories',
      type: 'select',
      options: [
        { label: i18n(['All', '全部']), value: '111' },
        { label: i18n(['General', '普遍的']), value: '100' },
        { label: i18n(['Anime', '动漫']), value: '010' },
        { label: i18n(['People', '真人']), value: '001' }
      ],
      default: preference.categories
    },
    {
      label: i18n(['Sorting', '排序']),
      name: 'sorting',
      type: 'select',
      options: [
        { label: i18n(['Date added', '上传时间']), value: 'date_added' },
        { label: i18n(['Relevance', '相关性']), value: 'relevance' },
        { label: i18n(['Random', '随机']), value: 'random' },
        { label: i18n(['Views', '浏览量']), value: 'views' },
        { label: i18n(['Favorites', '收藏量']), value: 'favorites' },
        { label: i18n(['Toplist', '榜单']), value: 'toplist' }
      ],
      default: preference.sorting
    },
    {
      label: i18n(['Colors', '色彩']),
      name: 'colors',
      type: 'select',
      options: [
        { label: i18n(['🔘 All', '🔘 全部']), value: '' },
        { label: i18n(['🔴 red', '🔴 红色']), value: 'cc0000' },
        { label: i18n(['🟣 purple', '🟣 紫色']), value: '993399' },
        { label: i18n(['🔵 blue', '🔵 蓝色']), value: '0066cc' },
        { label: i18n(['🟢 green', '🟢 绿色']), value: '77cc33' },
        { label: i18n(['🟡 yellow', '🟡 黄色']), value: 'ffff00' },
        { label: i18n(['🟤 brown', '🟤 棕色']), value: '663300' },
        { label: i18n(['🟠 orange', '🟠 橙色']), value: 'ff6600' },
        { label: i18n(['⚫️ black', '⚫️ 黑色']), value: '000000' },
        { label: i18n(['⚪️ white', '⚪️ 白色']), value: 'ffffff' }
      ],
      default: preference.colors
    },
    {
      label: i18n(['Purity', '纯净模式']),
      name: 'purity',
      type: 'select',
      options: [
        { label: i18n(['SFW', '心平如水']), value: '100' },
        { label: i18n(['Sketchy', '若隐若现']), value: '010' },
        { label: i18n(['NSFW', '垂涎若渴']), value: '001' }
      ],
      default: preference.purity
    },
    {
      label: i18n(['Count', '显示数量']),
      name: 'count',
      type: 'select',
      options: [
        { label: '1', value: '1' },
        { label: '2', value: '2' },
        { label: '3', value: '3' },
        { label: '4', value: '4' }
      ],
      default: 1
    },
    {
      label: i18n(['Gap size', '间隙大小']),
      name: 'gap',
      type: 'number',
      default: '4'
    },
    {
      label: i18n(['Border width', '边框宽度']),
      name: 'borderWidth',
      type: 'number',
      default: '0'
    },
    {
      label: i18n(['Corner radius', '圆角']),
      name: 'cornerRadius',
      type: 'number',
      default: '0'
    },
    {
      label: i18n(['Item corner radius', '每项圆角']),
      name: 'itemCornerRadius',
      type: 'number',
      default: '0'
    },
    {
      label: 'API Key',
      name: 'apikey',
      type: 'text',
      default: ''
    }
  ],
  render: async ({ settings }) => {
    Object.assign(preference, settings)
    const widget = await createWidget()
    return widget
  }
})
