const { i18n } = importModule('utils.module')
const localFM = FileManager.local()
const iCloudFM = FileManager.iCloud()

/**
 * @param {string} dir
 */
const presentList = (dir) => {
  const contents = localFM.listContents(dir)
  const table = new UITable()
  for (const item of contents) {
    const path = localFM.joinPath(dir, item)
    const isDirectory = localFM.isDirectory(path)
    const row = new UITableRow()
    const title = row.addText(item, localFM.getUTI(path))
    title.titleFont = Font.headline()
    title.subtitleFont = Font.footnote()
    title.subtitleColor = Color.gray()
    if (isDirectory) {
      title.titleColor = Color.dynamic(Color.blue(), new Color('#8aefef'))
    }
    row.dismissOnSelect = false
    row.onSelect = () => {
      if (localFM.isDirectory(path)) {
        presentList(path)
      }
    }
    const del = row.addButton('Delete')
    del.rightAligned()
    del.onTap = async () => {
      const alert = new Alert()
      alert.message = i18n([`Are you sure delete "${item}"?`, `确定删除"${item}"吗？`])
      alert.addAction(i18n(['Delete', '删除']))
      alert.addCancelAction(i18n(['Cancel', '取消']))
      const value = await alert.presentAlert()
      if (value === 0) {
        localFM.remove(path)
        table.removeRow(row)
        table.reload()
      }
    }
    table.addRow(row)
  }
  table.present()
}

const table = new UITable()
const addRow = (title, path) => {
  const row = new UITableRow()
  const name = row.addText(title, localFM.getUTI(path))
  name.titleFont = Font.headline()
  name.subtitleFont = Font.footnote()
  name.subtitleColor = Color.gray()
  name.titleColor = Color.dynamic(Color.blue(), new Color('#8aefef'))
  row.dismissOnSelect = false
  row.onSelect = () => presentList(path)
  table.addRow(row)
}
addRow('Local cache directory', localFM.cacheDirectory())
addRow('Local document directory', localFM.documentsDirectory())
addRow('Local library directory', localFM.libraryDirectory())
addRow('Local temporary directory', localFM.temporaryDirectory())
addRow('iCloud document directory', iCloudFM.documentsDirectory())
addRow('iCloud library directory', iCloudFM.libraryDirectory())
table.present()
