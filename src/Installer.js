import { presentSheet, i18n } from './utils/utils'

const filePath = module.filename
const appRoot = filePath.substring(0, filePath.lastIndexOf('/'))
const iCloudManager = FileManager.iCloud()
const fs = iCloudManager.isFileStoredIniCloud(filePath) ? iCloudManager : FileManager.local()

const main = async () => {
  if (config.runsInApp) {
    const params = args.queryParameters
    const scriptURL = params && params.url
    if (scriptURL) {
      installByURL(scriptURL)
      return
    }

    const { value } = await presentSheet({
      message: i18n([
        'Where does the code come form? \n☞ Notice Development will override local file!',
        '代码从哪里来？\n☞注意开发服会覆盖本地文件！'
      ]),
      options: [
        { title: i18n(['Clipborad', '剪贴板的链接']) },
        { title: i18n(['Development', '开发服']) }
      ],
      cancelText: i18n(['Cancel', '取消'])
    })
    switch (value) {
      /** Development */
      case 1: {
        const alert = new Alert()
        alert.title = i18n(['Development', '开发服'])
        alert.message = i18n([
          'The file will be overwritten if it exists!',
          '如果文件已存在将会被覆盖！'
        ])
        const host = (Keychain.contains('dev-host') && Keychain.get('dev-host')) || ''
        const port = (Keychain.contains('dev-port') && Keychain.get('dev-port')) || ''
        const name = (Keychain.contains('dev-name') && Keychain.get('dev-name')) || ''
        alert.addTextField('host', host)
        alert.addTextField('port', port)
        alert.addTextField(
          i18n(['name', '文件名']),
          name
        )
        alert.addAction(i18n(['Download', '下载']))
        alert.addCancelAction(i18n(['Cancel', '取消']))
        const number = await alert.present()
        /** Download */
        if (number === 0) {
          const host = alert.textFieldValue(0)
          const port = alert.textFieldValue(1)
          const name = alert.textFieldValue(2)
          Keychain.set('dev-host', host)
          Keychain.set('dev-port', port)
          Keychain.set('dev-name', name)
          installByURL(
            `http://${host}:${port}/${name}.js`,
            { override: true }
          )
        }
        break
      }
    }
  }

  const urls = args.urls
  if (urls && urls.length) {
    for (const url of urls) {
      installByURL(url)
    }
  }
}

/**
 * download and install script from the url
 *
 * @param {string} url url of the script
 * @param {object} options
 * @param {boolean} [options.override] weather override the existed file
 */
async function installByURL (url, options) {
  const { override } = {
    override: false,
    ...options
  }

  const blobRegxp = /^https:\/\/github\.com\/(.+)\/blob\/(.+\.js$)/
  if (blobRegxp.test(url)) {
    url = url.replace(blobRegxp, 'https://raw.githubusercontent.com/$1/$2')
  }

  const request = new Request(url)
  const text = await request.loadString()
    .catch(async (e) => {
      console.error(e)
      const notification = new Notification()
      notification.title = Script.name()
      notification.body = e.toString()
      await notification.schedule()
      throw e
    })
  const fileName = url.substring(url.lastIndexOf('/') + 1)
  let filePath = `${appRoot}/${fileName}`
  if (fs.fileExists(filePath) && !override) {
    const alert = new Alert()
    alert.message = i18n([
      `${fileName} existed, please rename`,
      `${fileName} 已存在，请重命名`
    ])
    alert.addTextField(
      i18n(['new file name', '新文件名']),
      fs.fileName(filePath) + '1'
    )
    alert.addAction(i18n(['Save', '保存']))
    alert.addCancelAction(i18n(['Cancel', '取消']))
    const num = await alert.present()
    if (num === -1) return
    const newName = alert.textFieldValue(0)
    if (newName) {
      filePath = `${appRoot}/${newName}.js`
    } else {
      return
    }
  }
  fs.writeString(filePath, text)
  await genAlert(i18n([
    `${fileName} installed success`,
    `${fileName} 安装成功`
  ]))
}

async function genAlert (message) {
  const _alert = new Alert()
  _alert.message = message
  return _alert.presentAlert()
}

await main()
