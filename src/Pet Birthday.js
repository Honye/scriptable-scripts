if (typeof require === 'undefined') require = importModule
const { useCache, vw, i18n } = require('./utils.module')
const { withSettings } = require('./withSettings.module')

const cache = useCache()
const preference = {}

const rpt = (n) => {
  const designWith = { small: 155, medium: 329 }
  const { widgetFamily } = config
  return Math.floor(vw(n * 100 / designWith.medium, widgetFamily), config.widgetFamily)
}

/**
 * @param {string} name
 */
const chooseAvatar = async (name) => {
  const image = await Photos.fromLibrary()
  cache.writeImage(name, image)
}

const getContacts = async () => {
  const contacts = []
  const { pet1Name, pet1Birthday, pet2Name, pet2Birthday } = preference
  if (pet1Name) {
    contacts.push({
      nickname: pet1Name,
      birthday: new Date(pet1Birthday),
      image: cache.readImage('pet1Avatar') || SFSymbol.named('power.circle.fill').image
    })
  }
  if (pet2Name) {
    contacts.push({
      nickname: pet2Name,
      birthday: new Date(pet2Birthday),
      image: cache.readImage('pet2Avatar') || SFSymbol.named('power.circle.fill').image
    })
  }
  if (!contacts.length) {
    const containers = await ContactsContainer.all()
    const groups = await ContactsGroup.all(containers)
    const groupPet = groups.find(({ name }) => name === 'Pets')
    if (groupPet) {
      contacts.push(...(await Contact.inGroups([groupPet])))
    }
  }
  return contacts
}

/**
 * @param {WidgetStack} stack
 * @param {Contact} contact
 */
const addAvatarInfo = (stack, contact) => {
  const pet = stack.addStack()
  pet.layoutVertically()
  const avatarBox = pet.addStack()
  avatarBox.size = new Size(rpt(50), rpt(50))
  avatarBox.cornerRadius = rpt(25)
  avatarBox.borderWidth = rpt(4)
  avatarBox.borderColor = new Color('#1E1F24', 0.1)
  avatarBox.setPadding(rpt(2), rpt(2), rpt(2), rpt(2))

  const avatar = avatarBox.addImage(contact.image)
  avatar.imageSize = new Size(rpt(46), rpt(46))
  avatar.cornerRadius = rpt(23)
  avatar.applyFillingContentMode()

  pet.addSpacer(rpt(6))
  const nameWrap = pet.addStack()
  nameWrap.size = new Size(rpt(50), -1)
  const name = nameWrap.addText(contact.nickname.replace(/\s+/, '\n'))
  name.centerAlignText()
  name.font = new Font('Muyao-Softbrush', rpt(10))
  name.textColor = new Color('#80828D')
}

/**
 * @param {WidgetStack} stack
 * @param {object} options
 * @param {'tl'|'tr'|'bl'|'br'} options.position
 * @param {number} [options.radius]
 * @param {number} [options.width]
 * @param {number} options.borderWidth
 * @param {Color} options.borderColor
 */
const addCorner = (stack, {
  position,
  radius,
  width,
  borderWidth,
  borderColor
}) => {
  radius = radius || 0
  width = width ?? radius
  const container = stack.addStack()
  container.size = new Size(width, width)
  const paddings = [0, 0, 0, 0]
  if (/l$/.test(position)) paddings[1] = width
  if (/r$/.test(position)) paddings[3] = width
  if (/^b/.test(position)) container.bottomAlignContent()
  container.setPadding(...paddings)
  const circle = container.addStack()
  circle.size = new Size(width * 2, width * 2)
  circle.cornerRadius = radius
  circle.borderWidth = radius > 0 ? borderWidth * 2 : borderWidth
  circle.borderColor = borderColor
  return circle
}

/**
 * @param {WidgetStack} stack
 * @param {object} options
 * @param {number} options.width
 * @param {number} options.height
 * @param {[number,number,number,number]} options.radius [tl, bl, br, tr]
 * @param {number} borderWidth
 * @param {Color} borderColor
 */
const addRect = (stack, {
  width,
  height,
  radius,
  borderWidth,
  borderColor
}) => {
  const cornerWidth = Math.max(...radius) - 1
  const rect = stack.addStack()
  rect.size = new Size(width, height)
  rect.layoutVertically()
  const row1 = rect.addStack()
  addCorner(row1, {
    position: 'tl',
    width: cornerWidth,
    radius: radius[0],
    borderWidth,
    borderColor
  })
  const lineTop = row1.addStack()
  lineTop.size = new Size(-1, borderWidth)
  lineTop.addSpacer()
  lineTop.backgroundColor = borderColor
  addCorner(row1, {
    position: 'tr',
    width: cornerWidth,
    radius: radius[3],
    borderWidth,
    borderColor
  })

  const row2 = rect.addStack()
  const left = row2.addStack()
  const leftLine = left.addStack()
  leftLine.layoutVertically()
  leftLine.size = new Size(borderWidth, -1)
  leftLine.addSpacer()
  leftLine.backgroundColor = borderColor
  left.addSpacer(Math.max(...radius) - 1)

  const contentWrap = row2.addStack()
  contentWrap.layoutVertically()
  contentWrap.addStack().addSpacer()
  const content = contentWrap.addStack()

  const right = row2.addStack()
  right.addSpacer(Math.max(...radius) - 1)
  const rightLine = right.addStack()
  rightLine.layoutVertically()
  rightLine.size = new Size(borderWidth, -1)
  rightLine.addSpacer()
  rightLine.backgroundColor = borderColor

  const row3 = rect.addStack()
  row3.bottomAlignContent()
  addCorner(row3, {
    position: 'bl',
    width: cornerWidth,
    radius: radius[1],
    borderWidth,
    borderColor
  })
  const lineBottom = row3.addStack()
  lineBottom.size = new Size(-1, borderWidth)
  lineBottom.addSpacer()
  lineBottom.backgroundColor = borderColor
  addCorner(row3, {
    position: 'br',
    width: cornerWidth,
    radius: radius[2],
    borderWidth,
    borderColor
  })
  return content
}

/**
 * @param {WidgetStack} stack
 * @param {Contact} contact
 */
const addDays = (stack, contact, reverse) => {
  const { birthday } = contact
  const now = new Date()
  const dayCount = Math.ceil((now.getTime() - birthday) / (24 * 3600000))
  now.setHours(-now.getTimezoneOffset() / 60, 0, 0, 0)
  let full = now.getFullYear() - birthday.getFullYear()
  birthday.setFullYear(now.getFullYear())
  /** @type {number} */
  let start, end
  if (now.getTime() < birthday.getTime()) {
    full -= 1
    end = birthday.getTime()
    birthday.setFullYear(birthday.getFullYear() - 1)
    start = birthday.getTime()
  } else {
    start = birthday.getTime()
    birthday.setFullYear(birthday.getFullYear() + 1)
    end = birthday.getTime()
  }
  const time = now.getTime()
  const ageFloat = ((time - start) / (end - start)).toFixed(8)
  const ageNum = `${full}.${ageFloat.substring(2)}`

  const radius = [rpt(20), rpt(20), rpt(20), rpt(20)]
  reverse ? (radius[3] = 0) : (radius[0] = 0)
  const rect = addRect(stack, {
    width: -1,
    height: rpt(97),
    radius,
    borderWidth: rpt(3),
    borderColor: new Color('#1E1F24', 0.1)
  })
  const v = rect.addStack()
  v.layoutVertically()
  v.addSpacer()
  rect.centerAlignContent()
  const box = rect.addStack()
  box.layoutVertically()
  const ageWrap = box.addStack()
  ageWrap.centerAlignContent()
  const ageH = ageWrap.addStack()
  ageH.size = new Size(-1, rpt(33) * 0.7)
  ageH.centerAlignContent()
  const age = ageH.addText(ageNum)
  age.font = new Font('Muyao-Softbrush', rpt(33))
  age.textColor = new Color('#1E1F24')
  const ageSubWrap = ageWrap.addStack()
  ageSubWrap.centerAlignContent()
  ageSubWrap.setPadding(rpt(33 - 12) * 0.5, 0, 0, 0)
  const ageText = ageSubWrap.addText('岁了')
  ageText.font = Font.systemFont(rpt(12))
  ageText.textColor = new Color('#80828D')

  box.addSpacer(rpt(8))
  const daysWrap = box.addStack()
  daysWrap.centerAlignContent()
  const daysSubWrap = daysWrap.addStack()
  daysSubWrap.setPadding(rpt(24 - 12) * 0.5, 0, 0, 0)
  const dayPrefix = daysSubWrap.addText('在世界上已经存在了')
  dayPrefix.font = Font.systemFont(rpt(12))
  dayPrefix.textColor = new Color('#80828D')
  const days = daysWrap.addText(`${dayCount}`)
  days.font = new Font('Muyao-Softbrush', rpt(24))
  days.textColor = new Color('#1E1F24')
  const suffixSub = daysWrap.addStack()
  suffixSub.setPadding(rpt(24 - 12) * 0.5, 0, 0, 0)
  const daysSuffix = suffixSub.addText('天')
  daysSuffix.font = Font.systemFont(rpt(12))
  daysSuffix.textColor = new Color('#80828D')
}

/**
 * @param {WidgetStack} widget
 */
const addPet = (widget, contact, reverse) => {
  const stack = widget.addStack()
  reverse ? addDays(stack, contact, reverse) : addAvatarInfo(stack, contact)
  stack.addSpacer(rpt(16))
  reverse ? addAvatarInfo(stack, contact) : addDays(stack, contact, reverse)
}

const render = async () => {
  let contacts = await getContacts()
  const widget = new ListWidget()
  widget.setPadding(0, rpt(20), 0, rpt(20))
  widget.backgroundColor = Color.white()

  const title = widget.addText('猫猫我呀\n有在好好长大哦')
  title.font = new Font('MuyaoPleased', rpt(24))
  title.textColor = new Color('#1E1F24')

  widget.addSpacer(rpt(23))
  if (config.widgetFamily === 'medium') {
    contacts = contacts.slice(0, 1)
  }
  for (const [i, contact] of contacts.entries()) {
    addPet(widget, contact, i % 2)
    if (i < contacts.length - 1) {
      widget.addSpacer(rpt(24))
    }
  }
  return widget
}

await withSettings({
  formItems: [
    {
      label: i18n(['Pet 1', '宠物 1']),
      name: 'pet1',
      type: 'page',
      formItems: [
        {
          label: i18n(['Name', '名字']),
          name: 'pet1Name',
          type: 'textarea'
        },
        {
          label: i18n(['Avatar', '头像']),
          name: 'pet1Avatar',
          type: 'cell'
        },
        {
          label: i18n(['Birthday', '生日']),
          name: 'pet1Birthday',
          type: 'date'
        }
      ],
      onItemClick: ({ name }) => {
        if (/pet\dAvatar/.test(name)) {
          chooseAvatar(name)
        }
      }
    },
    {
      label: i18n(['Pet 2', '宠物 2']),
      name: 'pet2',
      type: 'page',
      formItems: [
        {
          label: i18n(['Name', '名字']),
          name: 'pet2Name',
          type: 'textarea'
        },
        {
          label: i18n(['Avatar', '头像']),
          name: 'pet2Avatar',
          type: 'cell'
        },
        {
          label: i18n(['Birthday', '生日']),
          name: 'pet2Birthday',
          type: 'date'
        }
      ],
      onItemClick: ({ name }) => {
        if (/pet\dAvatar/.test(name)) {
          chooseAvatar(name)
        }
      }
    }
  ],
  render: async ({ family, settings }) => {
    family && (config.widgetFamily = family)
    Object.assign(preference, settings)
    const widget = await render()
    return widget
  }
})
