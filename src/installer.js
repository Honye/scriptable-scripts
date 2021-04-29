const filePath = module.filename
const appRoot = filePath.substring(0, filePath.lastIndexOf('/'))
const iCloudManager = FileManager.iCloud()
const fs = iCloudManager.isFileStoredIniCloud(filePath) ? iCloudManager : FileManager.local()

const main = () => {
  const urls = args.urls
  if (urls && urls.length) {
    for (const url of urls) {
      installByURL(url);
    }
  }

  const params = args.queryParameters
  const scriptURL = params && params.url
  if (scriptURL) {
    installByURL(scriptURL)
  }
}

/**
 * download and install script from the url
 * 
 * @param {string} url url of the script
 */
async function installByURL (url) {
  console.log('====== downloading... ======')
  const request = new Request(url)
  const text = await request.loadString()
  console.log('data => ' + text)
  const fileName = url.substring(url.lastIndexOf('/') + 1)
  console.log('fileName => ' + fileName)
  fs.writeString(`${appRoot}/${fileName}`, text)
  console.log('====== downloaded ======')
  await genAlert(`${fileName} installed success`)
}

async function genAlert (message) {
  const _alert = new Alert()
  _alert.message = message
  return _alert.presentAlert()
}

await main()
