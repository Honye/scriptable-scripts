// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: images; icon-color: blue; share-sheet-inputs: file-url,image;
/**
 * @version 1.0.0
 * @author Honye
 */

/**
 * @param {...string} paths
 */
const joinPath = (...paths) => {
  const fm = FileManager.local();
  return paths.reduce((prev, curr) => {
    return fm.joinPath(prev, curr)
  }, '')
};

/**
 * 规范使用 FileManager。每个脚本使用独立文件夹
 *
 * 注意：桌面组件无法写入 cacheDirectory 和 temporaryDirectory
 * @param {object} options
 * @param {boolean} [options.useICloud]
 * @param {string} [options.basePath]
 */
const useFileManager = (options = {}) => {
  const { useICloud, basePath } = options;
  const fm = useICloud ? FileManager.iCloud() : FileManager.local();
  const paths = [fm.documentsDirectory(), Script.name()];
  if (basePath) {
    paths.push(basePath);
  }
  const cacheDirectory = joinPath(...paths);
  /**
   * 删除路径末尾所有的 /
   * @param {string} filePath
   */
  const safePath = (filePath) => {
    return fm.joinPath(cacheDirectory, filePath).replace(/\/+$/, '')
  };
  /**
   * 如果上级文件夹不存在，则先创建文件夹
   * @param {string} filePath
   */
  const preWrite = (filePath) => {
    const i = filePath.lastIndexOf('/');
    const directory = filePath.substring(0, i);
    if (!fm.fileExists(directory)) {
      fm.createDirectory(directory, true);
    }
  };

  const writeString = (filePath, content) => {
    const nextPath = safePath(filePath);
    preWrite(nextPath);
    fm.writeString(nextPath, content);
  };

  /**
   * @param {string} filePath
   * @param {*} jsonData
   */
  const writeJSON = (filePath, jsonData) => writeString(filePath, JSON.stringify(jsonData));
  /**
   * @param {string} filePath
   * @param {Image} image
   */
  const writeImage = (filePath, image) => {
    const nextPath = safePath(filePath);
    preWrite(nextPath);
    return fm.writeImage(nextPath, image)
  };

  /**
   * 文件不存在时返回 null
   * @param {string} filePath
   * @returns {string|null}
   */
  const readString = (filePath) => {
    const fullPath = fm.joinPath(cacheDirectory, filePath);
    if (fm.fileExists(fullPath)) {
      return fm.readString(
        fm.joinPath(cacheDirectory, filePath)
      )
    }
    return null
  };

  /**
   * @param {string} filePath
   */
  const readJSON = (filePath) => JSON.parse(readString(filePath));

  /**
   * @param {string} filePath
   */
  const readImage = (filePath) => {
    return fm.readImage(fm.joinPath(cacheDirectory, filePath))
  };

  return {
    cacheDirectory,
    writeString,
    writeJSON,
    writeImage,
    readString,
    readJSON,
    readImage
  }
};

/**
 * @typedef {object} Config
 * @property {Record<string, () => void>} methods
 */

/**
 * @param {WebView} webView
 * @param {Config} config
 * @returns {void}
 */
const inject = async (webView, config) => {
  const js =
`(() => {
  if (!window.ScriptableBridge) {
    window.ScriptableBridge = {
      queue: null,
      listeners: {},
      invoke(name, data, callback) {
        const detail = { name, data }
        // 添加事件订阅
        const { listeners } = ScriptableBridge
        if (!listeners[name]) {
          listeners[name] = []
        }
        if (callback) {
          listeners[name].push(callback)
        }

        if (ScriptableBridge.queue) {
          ScriptableBridge.queue.push(detail)
          completion()
        } else {
          completion(detail)
          ScriptableBridge.queue = []
        }
      },
      result(name, data) {
        const callbacks = ScriptableBridge.listeners[name] || []
        while (callbacks.length) {
          (callbacks.shift())(data)
        }
      }
    }
    window.dispatchEvent(
      new CustomEvent('ScriptableBridgeReady', { detail: window.ScriptableBridge })
    )
  }

  if (ScriptableBridge.queue) {
    completion(ScriptableBridge.queue)
    ScriptableBridge.queue = null
  }
})()`;

  /**
   * @typedef {object} Message
   * @property {string} name
   * @property {any} data
   */
  /** @type {Message | Message[] | undefined} */
  const res = await webView.evaluateJavaScript(js, true);
  if (!res) return inject(webView, config)

  /**
   * @param {string} name
   * @param {any} data
   */
  const sendResult = async (name, data) => {
    await webView.evaluateJavaScript(
      `window.ScriptableBridge.result('${name}', ${JSON.stringify(data)})`
    );
  };

  const methods = config.methods || {};

  if (Array.isArray(res)) {
    for (const { name, data } of res) {
      await sendResult(name, await methods[name]?.(data));
    }
  } else if (res) {
    const { name, data } = res;
    await sendResult(name, await methods[name]?.(data));
  }
  inject(webView, config);
};

/**
 * @param {WebView} webView
 * @param {object} args
 * @param {string} args.html
 * @param {string} [args.baseURL]
 * @param {Config} config
 */
const loadHTML = async (webView, args, config = {}) => {
  const { html, baseURL } = args;
  await webView.loadHTML(html, baseURL);
  inject(webView, config).catch((err) => console.error(err));
};

const CONFIG_PATH = 'config.json';
const IMAGES_PATH = 'images.json';
const fm = useFileManager();

const config = fm.readJSON(CONFIG_PATH) || {};

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
};

/**
 * @param {ImageData} image
 */
const pushImage = (image) => {
  const images = readImages();
  images.unshift(image);
  fm.writeJSON(IMAGES_PATH, images);
};

/**
 * @param {Image|string} image
 */
const upload = async (image) => {
  const request = new Request('https://smms.app/api/v2/upload');
  request.method = 'POST';
  request.headers = {
    Authorization: config.smmsToken
  };
  if (typeof image === 'string') {
    request.addFileToMultipart(image, 'smfile');
  } else {
    request.addImageToMultipart(image, 'smfile');
  }
  const { data } = await request.loadJSON();
  data.created_at = new Date().toISOString();
  pushImage(data);
};

const main = async () => {
  if (!config.smmsToken) {
    const alert = new Alert();
    alert.addTextField('SM.MS API token');
    alert.addCancelAction('取消');
    alert.addAction('保存');
    const i = await alert.present();
    if (i < 0) return

    const value = alert.textFieldValue(i).trim();
    if (value) {
      config.smmsToken = value;
      fm.writeJSON(CONFIG_PATH, config);
    }
  }

  const { fileURLs, images } = args;
  if (fileURLs?.[0]) {
    await Promise.allSettled(
      fileURLs.map((item) => upload(item))
    );
  } else if (images?.[0]) {
    await Promise.allSettled(
      images.map((item) => upload(item))
    );
  }

  const _images = readImages();
  const imagesHTML = _images.map((image) => {
    return `<img class="image" src="${image.url}" referrerpolicy="no-referrer">`
  }).join('');

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
</html>`;

  const webView = new WebView();
  const methods = {
    previewImage ({ url }) {
      QuickLook.present(url);
    }
  };
  loadHTML(
    webView,
    { html, baseURL: 'https://imarkr.com' },
    { methods }
  );
  webView.present();
};

await main();
