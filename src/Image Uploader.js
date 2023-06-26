if (typeof require === 'undefined') require = importModule
const { useFileManager } = require('./utils.module')
const { loadHTML } = require('./Bridge.module')

const CONFIG_PATH = 'config.json'
const IMAGES_PATH = 'images.json'
const fm = useFileManager()

const config = fm.readJSON(CONFIG_PATH) || {}

/**
 * @typedef {object} ImageData
 * @property {string} hash
 * @property {string} url
 * @property {string} created_at
 */
/**
 * @returns {ImageData[]}
 */
const readImages = () => {
  return fm.readJSON(IMAGES_PATH) || []
}

/**
 * @param {ImageData} image
 */
const pushImage = (image) => {
  const images = readImages()
  images.unshift(image)
  fm.writeJSON(IMAGES_PATH, images)
}

/**
 * @param {Image|string} image
 */
const upload = async (image) => {
  const request = new Request('https://smms.app/api/v2/upload')
  request.method = 'POST'
  request.headers = {
    Authorization: config.smmsToken
  }
  if (typeof image === 'string') {
    request.addFileToMultipart(image, 'smfile')
  } else {
    request.addImageToMultipart(image, 'smfile')
  }
  const { data } = await request.loadJSON()
  data.created_at = new Date().toISOString()
  pushImage(data)
}

const main = async () => {
  if (!config.smmsToken) {
    const alert = new Alert()
    alert.addTextField('SM.MS API token')
    alert.addCancelAction('取消')
    alert.addAction('保存')
    const i = await alert.present()
    if (i < 0) return

    const value = alert.textFieldValue(i).trim()
    if (value) {
      config.smmsToken = value
      fm.writeJSON(CONFIG_PATH, config)
    }
  }

  const { fileURLs, images } = args
  if (fileURLs?.[0]) {
    await Promise.allSettled(
      fileURLs.map((item) => upload(item))
    )
  } else if (images?.[0]) {
    await Promise.allSettled(
      images.map((item) => upload(item))
    )
  }

  const _images = readImages()
  const imagesHTML = _images.map((image) => {
    return `<img class="image" src="${image.url}" referrerpolicy="no-referrer">`
  }).join('')

  const html =
`<html>
  <head>
    <meta name="charset" content="UTF-8">
    <meta name="viewport" content="width=device-width">
    <style>
      :root {
        --background: #f7f7f7;
        --text-color: #333;
      }
      body {
        background: var(--background);
        color: var(--text-color);
      }
      .images {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
        gap: 1rem;
      }
      .images:empty::before {
        content: '无上传数据';
        grid-column: 1 / -1;
        text-align: center;
        padding: 2rem 0;
        color: darkgray;
      }
      .image {
        display: block;
        width: 100%;
        aspect-ratio: 1 / 1;
        object-fit: cover;
        border-radius: 0.5rem;
        cursor: pointer;
        overflow: hidden;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --background: #000;
          --text-color: #fff;
        }
      }
    </style>
  </head>
  <body>
    <div class="images">${imagesHTML}</div>
    <script>
      const elImages = document.querySelector('.images')
      elImages.addEventListener('click', (e) => {
        const { target } = e
        if (target.nodeName === 'IMG') {
          console.log(target.src)
          window.ScriptableBridge.invoke('previewImage', { url: target.src })
        }
      })
    </script>
  </body>
</html>`

  const webView = new WebView()
  const methods = {
    previewImage ({ url }) {
      QuickLook.present(url)
    }
  }
  loadHTML(
    webView,
    { html, baseURL: 'https://imarkr.com' },
    { methods }
  )
  webView.present()
}

await main()
