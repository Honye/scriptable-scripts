if (typeof require === 'undefined') require = importModule
const { i18n } = require('./utils.module')
const { withSettings, writeSettings, readSettings } = require('./withSettings.module')

const fm = FileManager.iCloud()

const preference = {
  folder: '/var/mobile/Library/Mobile Documents/iCloud~dk~simonbs~Scriptable/Documents/SharePhotos',
  yourName: 'Jun',
  otherName: 'Sillen'
}

const pickFolder = async () => {
  const folderPath = await DocumentPicker.openFolder()
  if (!fm.isFileStoredIniCloud(folderPath)) {
    throw new Error('Folder must be in iCloud!')
  }
  const attr = fm.readExtendedAttribute(folderPath, 'com.apple.metadata:kMDItemCollaborationIdentifier')
  if (!attr) {
    throw new Error('Folder must be shared with others people!')
  }
  preference.folder = folderPath
  writeSettings(preference)
}

const pickPhoto = async () => {
  const { folder, yourName } = preference
  const image = await Photos.fromLibrary()
  fm.writeImage(fm.joinPath(folder, yourName), image)
}

const createWidget = async () => {
  let { folder, otherName } = preference
  if (config.runsInWidget) {
    otherName = (args.widgetParameter || '').trim() || otherName
  }
  const widget = new ListWidget()
  const filePath = fm.joinPath(folder, otherName)
  if (!fm.fileExists(filePath)) {
    throw new Error('File not found!')
  }
  if (!fm.isFileDownloaded(filePath)) {
    fm.downloadFileFromiCloud(filePath)
  }

  const image = fm.readImage(filePath)
  if (!image) {
    throw new Error('Image not found')
  }
  widget.backgroundImage = image
  return widget
}

/**
 * @returns {Parameters<typeof withSettings>[0]['formItems']}
 */
const formItems = async () => {
  /** @type {typeof preference} */
  const { folder } = await readSettings() || preference
  const files = fm.listContents(folder)
  return [
    {
      name: 'folder',
      label: i18n(['Shared Folder', '共享文件夹']),
      type: 'cell',
      default: preference.folder
    },
    {
      name: 'yourName',
      label: i18n(['Your Name', '你的昵称']),
      default: preference.yourName
    },
    {
      name: 'otherName',
      label: i18n(['Other Name', '对方昵称']),
      type: 'select',
      options: files.map((name) => ({ label: name, value: name })),
      default: preference.otherName
    },
    {
      name: 'send',
      label: i18n(['Send Photo', '发送照片']),
      type: 'cell'
    }
  ]
}

await withSettings({
  formItems: await formItems(),
  async onItemClick ({ name }, { settings }) {
    Object.assign(preference, settings)
    await ({
      folder: pickFolder,
      send: pickPhoto
    })[name]?.()
  },
  render: async ({ settings }) => {
    Object.assign(preference, settings)
    const widget = await createWidget()
    return widget
  }
})
