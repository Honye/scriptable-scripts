if (typeof require === 'undefined') require = importModule
const { i18n } = require('./utils.module')
const { loadHTML } = require('./Bridge.module')

const fm = FileManager.local()
const usedICloud = fm.isFileStoredIniCloud(module.filename)

/**
 * @param {string[]} fileURLs
 * @param {string} destPath
 */
const copyFiles = async (fileURLs, destPath) => {
  let isReplaceAll = false
  const fm = FileManager.local()
  for (const fileURL of fileURLs) {
    const fileName = fm.fileName(fileURL, true)
    const filePath = fm.joinPath(destPath, fileName)
    if (fm.fileExists(filePath)) {
      if (isReplaceAll) {
        fm.remove(filePath)
      } else {
        const alert = new Alert()
        alert.message = `“${fileName}”${i18n([' already exists. Do you want to replace it?', '已存在，是否替换？'])}`
        const actions = [i18n(['All Yes', '全是']), i18n(['Yes', '是']), i18n(['No', '否'])]
        for (const action of actions) alert.addAction(action)
        alert.addCancelAction(i18n(['Cancel', '取消']))
        const value = await alert.present()
        switch (actions[value]) {
          case i18n(['All Yes', '全是']):
            isReplaceAll = true
            fm.remove(filePath)
            break
          case i18n(['Yes', '是']):
            fm.remove(filePath)
            break
          case i18n(['No', '否']):
            continue
          default: // 取消
            return
        }
      }
    }
    fm.copy(fileURL, filePath)
  }
  const alert = new Alert()
  alert.title = i18n(['Import successful', '导入成功'])
  alert.message = i18n(['Re-enter this directory to view', '重新进入此目录可查看'])
  alert.addCancelAction(i18n(['OKay', '好的']))
  await alert.present()
}

/**
 * @param {string} destPath 输出目录
 */
const importFiles = async (destPath) => {
  let fileURLs = args.fileURLs
  if (!fileURLs.length) {
    try {
      fileURLs = await DocumentPicker.open()
    } catch (e) {
      // 用户取消
      return
    }
  }
  await copyFiles(fileURLs, destPath)
}

/**
 * @param {object} options
 * @param {string} options.title
 * @param {File[]} options.list
 * @param {string} [options.directory]
 */
const presentList = async (options) => {
  const { title, list, directory } = options
  const webView = new WebView()
  const css =
  `:root {
    --text-primary: #1e1f24;
    --text-secondary: #8b8d98;
    --color-primary: #007aff;
    --color-danger: #ea3939;
    --divider-color: #eff0f3;
    --card-background: #fff;
    --card-radius: 10px;
    --list-header-color: rgba(60,60,67,0.6);
    --bg-btn: rgba(4, 122, 246, 0.1);
    --fixed-btn-height: 3rem;
  }
  * {
    -webkit-user-select: none;
    user-select: none;
  }
  body {
    margin: 0;
    -webkit-font-smoothing: antialiased;
    font-family: "SF Pro Display","SF Pro Icons","Helvetica Neue","Helvetica","Arial",sans-serif;
    min-height: 100vh;
    box-sizing: border-box;
    accent-color: var(--color-primary);
    padding-top: env(safe-area-inset-top);
    background-color: var(--card-background);
    color: var(--text-primary);
  }
  .header {
    position: sticky;
    z-index: 99;
    top: env(safe-area-inset-top);
    left: 0;
    right: 0;
    height: 3.5rem;
    text-align: center;
    background: var(--card-background);
    display: flex;
    align-items: center;
    padding: 0 1rem;
  }
  .header__left,
  .header__right {
    flex: 1;
    min-width: 6rem;
  }
  .header__left {
    text-align: left;
  }
  .header__right {
    text-align: right;
  }
  .header__btn,
  .select-all,
  .select {
    height: 1.5rem;
    font-size: 0.875rem;
    background-color: var(--bg-btn);
    border-radius: 99px;
    border: none;
  }
  .title {
    font-size: 1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .list {
    padding: 0;
    margin: 0;
    list-style: none;
  }
  .icon-yuan {
    color: #666;
  }
  .icon-gouxuan {
    color: var(--color-primary);
  }
  .item {
    padding-left: 1rem;
  }
  .item,
  .item__body {
    flex: 1;
    display: flex;
    align-items: center;
    overflow: hidden;
  }
  .item__body {
    column-gap: 0.5rem;
  }
  .item__selection {
    font-size: 0;
    width: 0;
    height: 1.5rem;
    transition: all .3s;
  }
  .item__selection[hidden] {
    display: none;
  }
  .item__name {
    font-size: 0.875rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .item__content {
    flex: 1;
    padding: 0.75rem 0;
    border-bottom: 0.5px solid var(--divider-color);
  }
  .item__info {
    margin-top: 0.3rem;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
  .list-select .item__selection {
    margin-right: 0.5rem;
    width: 1.5rem;
    font-size: 1.5rem;
  }
  .fixed-bottom {
    position: fixed;
    z-index: 10;
    bottom: 0;
    left: 0;
    right: 0;
    padding-bottom: env(safe-area-inset-bottom);
    background: var(--card-background);
    border-top: 0.5px solid var(--divider-color);
    transform: translateY(100%);
    transition: all 0.25s;
  }
  .btn-del {
    margin: 0;
    display: flex;
    width: 100%;
    height: var(--fixed-btn-height);
    justify-content: center;
    align-items: center;
    column-gap: 0.125rem;
    font-size: 0.875rem;
    background-color: var(--card-background);
    color: var(--color-danger);
    padding: 0;
    border: none;
  }
  .fixed-bottom.show {
    transform: translateY(0);
  }
  .bottom-holder {
    margin-top: 2rem;
    box-sizing: content-box;
    height: var(--fixed-btn-height);
    padding-bottom: env(safe-area-inset-bottom);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --color-danger: #b22e2e;
      --text-primary: #fff;
      --text-secondary: #797b86;
      --divider-color: #292a2e;
      --card-background: #19191b;
      --list-header-color: rgba(235,235,245,0.6);
      --bg-btn: rgba(9, 109, 215, 0.1);
    }
  }`

  const js =
  `window.invoke = (code, data) => {
    ScriptableBridge.invoke(code, data)
  }

  const isSelectMode = () => {
    return document.querySelector('.list').classList.contains('list-select')
  }

  const removeItems = (items) => {
    const list = document.querySelector('.list')
    for (const item of items) {
      const el = document.querySelector(\`.item[data-name="\${item.name}"]\`)
      el.parentNode.remove()
    }
  }

  document.querySelector('.select').addEventListener('click', (e) => {
    /** @type {HTMLButtonElement} */
    const target = e.currentTarget
    target.innerText = target.innerText === ${i18n(['"Select"', '"选择"'])} ? ${i18n(['"Done"', '"完成"'])} : ${i18n(['"Select"', '"选择"'])}
  
    document.querySelector('.select-all').toggleAttribute('hidden')
    document.querySelector('#import')?.toggleAttribute('hidden')
    document.querySelector('.list').classList.toggle('list-select')
    document.querySelector('.fixed-bottom').classList.toggle('show')
  })
  
  document.querySelectorAll('.item')
    .forEach((el) => {
      el.addEventListener('click', (e) => {
        const target = e.currentTarget
        if (isSelectMode()) {
          target.querySelectorAll('.item__selection').forEach((el) => {
            el.toggleAttribute('hidden')
          })
        } else {
          const { name } = target.dataset
          invoke('view', JSON.parse(JSON.stringify(target.dataset)))
        }
      })
    })

  document.querySelector('.select-all').addEventListener('click', (e) => {
    /** @type {HTMLButtonElement} */
    const target = e.currentTarget
    const isSelected = target.innerText === ${i18n(['"Deselect All"', '"取消全选"'])}
    target.innerText = isSelected ? ${i18n(['"Select All"', '"全选"'])} : ${i18n(['"Deselect All"', '"取消全选"'])}
    document.querySelectorAll('.item__selection').forEach((e, i) => {
      if (isSelected) {
        if (i % 2) {
          e.setAttribute('hidden', '')
        } else {
          e.removeAttribute('hidden')
        }
      } else {
        if (i % 2) {
          e.removeAttribute('hidden')
        } else {
          e.setAttribute('hidden', '')
        }
      }
    })
  })

  document.querySelector('.fixed-bottom').addEventListener('click', () => {
    const selectedItems = []
    for (const el of document.querySelectorAll('.item__selection:nth-child(even):not([hidden])')) {
      selectedItems.push({ ...el.parentNode.dataset })
    }
    invoke('remove', selectedItems)
  })

  window.addEventListener('JWeb', (e) => {
    const { code, data } = e.detail
    switch (code) {
      case 'remove-success':
        removeItems(JSON.parse(data))
        break;
    }
  })`

  const html =
  `<!DOCTYPE html>
  <html lang="${i18n(['en', 'zh-CN'])}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>${title}</title>
    <style>${css}</style>
  </head>
  <body>
    <svg style="position: absolute;" width="0" height="0">
      <defs>
        <linearGradient id="paint0_linear_97_244" x1="16" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
          <stop stop-color="#047AF6" stop-opacity="0"/>
          <stop offset="1" stop-color="#047AF6" stop-opacity="0.1"/>
        </linearGradient>
        <linearGradient id="paint1_linear_97_244" x1="16" y1="8" x2="16" y2="24" gradientUnits="userSpaceOnUse">
          <stop stop-color="#047AF6" stop-opacity="0.1"/>
          <stop offset="1" stop-color="#047AF6"/>
        </linearGradient>
        <linearGradient id="paint0_linear_132_348" x1="16" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
          <stop stop-color="#1FCDEF" stop-opacity="0"/>
          <stop offset="1" stop-color="#1FCDEF" stop-opacity="0.1"/>
        </linearGradient>
        <linearGradient id="paint1_linear_132_348" x1="16.2298" y1="6" x2="16.2298" y2="26.2667" gradientUnits="userSpaceOnUse">
          <stop stop-color="#1FCDEF" stop-opacity="0"/>
          <stop offset="1" stop-color="#1FCDEF"/>
        </linearGradient>
        <linearGradient id="paint2_linear_132_348" x1="22.294" y1="21.6" x2="22.294" y2="25.6546" gradientUnits="userSpaceOnUse">
          <stop stop-color="#1FCDEF" stop-opacity="0"/>
          <stop offset="1" stop-color="#1FCDEF"/>
        </linearGradient>
        <clipPath id="clip0_132_348">
          <rect width="21.3333" height="21.3333" fill="white" transform="translate(5.33331 5.33334)"/>
        </clipPath>
      </defs>
    </svg>
    <div class="header">
      <div class="header__left">
        <button class="select-all" hidden>${i18n(['Select All', '全选'])}</button>
        ${directory
          ? `<button id="import" class="header__btn" onclick="invoke('import')">${i18n(['Import', '导入'])}</button>`
          : ''
        }
      </div>
      <h3 class="title">${title}</h3>
      <div class="header__right">
        <button class="select">${i18n(['Select', '选择'])}</button>
      </div>
    </div>
    <ul class="list">
    ${list.map((file) => (
      `<li>
        <label class="item" data-name="${file.name}"
          data-is-directory="${Number(file.isDirectory)}"
          data-file-path="${file.filePath}"
        >
          <svg class="item__selection" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="7.5" stroke="#8B8D98"/>
          </svg>
          <svg class="item__selection" hidden viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8" fill="#047AF6"/>
            <path d="M8 12L11 15L16 10" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div class="item__body">
            ${file.isDirectory
              ? `<svg width="2rem" height="2rem" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="16" fill="url(#paint0_linear_97_244)"/>
                <path d="M9 13.3333H23C23.2652 13.3333 23.5196 13.4582 23.7071 13.6805C23.8946 13.9027 24 14.2042 24 14.5185V22.8148C24 23.1291 23.8946 23.4306 23.7071 23.6529C23.5196 23.8751 23.2652 24 23 24H9C8.73478 24 8.48043 23.8751 8.29289 23.6529C8.10536 23.4306 8 23.1291 8 22.8148V14.5185C8 14.2042 8.10536 13.9027 8.29289 13.6805C8.48043 13.4582 8.73478 13.3333 9 13.3333ZM24 13.3333C24 13.019 23.8946 12.7175 23.7071 12.4953C23.5196 12.273 23.2652 12.1481 23 12.1481H9C8.73478 12.1481 8.48043 12.273 8.29289 12.4953C8.10536 12.7175 8 13.019 8 13.3333V9.18519C8 8.87085 8.10536 8.5694 8.29289 8.34713C8.48043 8.12487 8.73478 8 9 8H14.42C14.5963 8.00007 14.7694 8.05535 14.9218 8.16025C15.0742 8.26515 15.2006 8.41594 15.288 8.59733L15.857 9.77778H23C23.2652 9.77778 23.5196 9.90265 23.7071 10.1249C23.8946 10.3472 24 10.6486 24 10.963V13.3333Z" fill="url(#paint1_linear_97_244)"/>
              </svg>`
              : `<svg width="2rem" height="2rem" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="16" fill="url(#paint0_linear_132_348)"/>
                <g clip-path="url(#clip0_132_348)">
                  <path d="M23.0666 6H9.46663C8.66663 6 8.1333 6.53333 8.1333 7.33333V24.9333C8.1333 25.6 8.79997 26.2667 9.46663 26.2667H18C18.8 26.2667 19.3333 25.7333 19.3333 24.9333V22.1333C19.3333 21.4667 20 20.8 20.6666 20.8H22.9333C23.7333 20.8 24.2666 20.2667 24.2666 19.4667V7.2C24.5333 6.53333 23.8666 6 23.0666 6ZM18.6666 16.9333C18.6666 17.3333 18.4 17.6 18 17.6H12C11.6 17.6 11.3333 17.3333 11.3333 16.9333V16.8C11.3333 16.4 11.6 16.1333 12 16.1333H18C18.4 16.1333 18.6666 16.4 18.6666 16.9333ZM21.6 13.3333C21.6 13.7333 21.3333 14 20.9333 14H12C11.6 13.8667 11.2 13.6 11.2 13.3333V13.2C11.2 12.8 11.4666 12.5333 11.8666 12.5333H20.8C21.3333 12.5333 21.6 12.8 21.6 13.3333ZM21.6 9.73333C21.6 10.1333 21.3333 10.4 20.9333 10.4H12C11.6 10.4 11.3333 10.1333 11.3333 9.73333V9.6C11.3333 9.2 11.6 8.93333 12 8.93333H20.9333C21.3333 8.93333 21.6 9.2 21.6 9.73333Z" fill="url(#paint1_linear_132_348)"/>
                  <path d="M20.2667 23.0667V24.9333C20.2667 25.6 21.0667 25.8667 21.4667 25.4667L24.1333 22.8C24.5333 22.4 24.2667 21.6 23.6 21.6H21.7333C20.9333 21.6 20.2667 22.2667 20.2667 23.0667Z" fill="url(#paint2_linear_132_348)"/>
                </g>
              </svg>`
            }
            <div class="item__content">
              <div class="item__name">${file.name}</div>
              ${file.info ? `<div class="item__info">${file.info}</div>` : ''}
            </div>
          </div>
        </label>
      </li>`
    )).join('')}
    </ul>
    <div class="bottom-holder"></div>
    <div class="fixed-bottom">
      <button class="btn-del">
        <svg width="1.25rem" height="1.25rem" viewBox="0 0 21 20" fill="none">
          <path d="M3.61218 5.94891H4.69852V14.6609C4.69805 15.0146 4.76727 15.3648 4.90223 15.6917C5.03719 16.0186 5.23523 16.3157 5.48505 16.566C5.73487 16.8163 6.03157 17.015 6.35818 17.1506C6.6848 17.2862 7.03493 17.3561 7.38858 17.3563H13.6114C14.3247 17.3559 15.0087 17.0723 15.5131 16.5679C16.0175 16.0635 16.301 15.3796 16.3015 14.6663V5.95425H17.3878C17.551 5.95425 17.7075 5.88943 17.8228 5.77407C17.9382 5.6587 18.003 5.50223 18.003 5.33907C18.003 5.17592 17.9382 5.01945 17.8228 4.90408C17.7075 4.78871 17.551 4.7239 17.3878 4.7239H13.1901V4.29541C13.1896 4.07803 13.1463 3.86288 13.0627 3.66223C12.9791 3.46158 12.8568 3.27936 12.7027 3.12599C12.5487 2.97261 12.366 2.85107 12.165 2.76832C11.9639 2.68557 11.7486 2.64321 11.5312 2.64368H9.46346C9.02537 2.64415 8.60534 2.81827 8.2954 3.12787C7.98546 3.43748 7.8109 3.85732 7.80995 4.29541V4.71856H3.61218C3.44903 4.71856 3.29256 4.78338 3.17719 4.89874C3.06182 5.01411 2.99701 5.17058 2.99701 5.33374C2.99701 5.49689 3.06182 5.65336 3.17719 5.76873C3.29256 5.8841 3.44903 5.94891 3.61218 5.94891ZM9.04208 4.71856V4.29541C9.04255 4.18349 9.08734 4.07631 9.16665 3.99734C9.24595 3.91837 9.35332 3.87403 9.46524 3.87403H11.5312C11.5869 3.87356 11.6422 3.8841 11.6938 3.90505C11.7455 3.92599 11.7925 3.95693 11.8321 3.99608C11.8718 4.03523 11.9033 4.08183 11.9249 4.1332C11.9465 4.18456 11.9577 4.23969 11.9579 4.29541V4.71856H9.04208ZM5.93243 14.6752V5.96314H15.0694V14.6752C15.0694 15.062 14.9158 15.433 14.6425 15.7067C14.3691 15.9804 13.9983 16.1344 13.6114 16.1349H7.38858C7.19629 16.1346 7.00593 16.0964 6.82846 16.0224C6.65098 15.9484 6.48988 15.84 6.3544 15.7036C6.21893 15.5671 6.11175 15.4052 6.03903 15.2272C5.96631 15.0492 5.92948 14.8586 5.93065 14.6663L5.93243 14.6752Z" fill="currentColor"/>
          <path d="M10.5 14.2449C10.6631 14.2449 10.8196 14.1801 10.935 14.0647C11.0503 13.9494 11.1151 13.7929 11.1151 13.6297V7.76245C11.1151 7.68167 11.0992 7.60167 11.0683 7.52704C11.0374 7.4524 10.9921 7.38458 10.935 7.32746C10.8778 7.27033 10.81 7.22502 10.7354 7.19411C10.6608 7.16319 10.5808 7.14728 10.5 7.14728C10.4192 7.14728 10.3392 7.16319 10.2646 7.19411C10.1899 7.22502 10.1221 7.27033 10.065 7.32746C10.0079 7.38458 9.96254 7.4524 9.93162 7.52704C9.90071 7.60167 9.8848 7.68167 9.8848 7.76245V13.6297C9.8848 13.7929 9.94961 13.9494 10.065 14.0647C10.1803 14.1801 10.3368 14.2449 10.5 14.2449ZM7.73346 13.5533C7.89678 13.5533 8.05344 13.4885 8.16909 13.3732C8.28474 13.2579 8.34994 13.1014 8.35041 12.9381V8.44519C8.34194 8.28752 8.27334 8.13911 8.15873 8.03049C8.04413 7.92188 7.89224 7.86135 7.73435 7.86135C7.57646 7.86135 7.42457 7.92188 7.30997 8.03049C7.19536 8.13911 7.12676 8.28752 7.11829 8.44519V12.9381C7.11876 13.1011 7.18372 13.2573 7.29898 13.3726C7.41425 13.4878 7.57045 13.5528 7.73346 13.5533ZM12.9198 13.5533C13.0829 13.5533 13.2394 13.4885 13.3548 13.3731C13.4701 13.2577 13.535 13.1013 13.535 12.9381V8.44519C13.535 8.28204 13.4701 8.12556 13.3548 8.0102C13.2394 7.89483 13.0829 7.83002 12.9198 7.83002C12.7566 7.83002 12.6002 7.89483 12.4848 8.0102C12.3694 8.12556 12.3046 8.28204 12.3046 8.44519V12.9381C12.3046 13.1013 12.3694 13.2577 12.4848 13.3731C12.6002 13.4885 12.7566 13.5533 12.9198 13.5533Z" fill="currentColor"/>
        </svg>
        ${i18n(['Delete', '删除'])}
      </button>
    </div>
    <script>${js}</script>
  </body>
  </html>`

  const view = async (data) => {
    const { isDirectory, filePath, name } = data
    if (Number(isDirectory)) {
      const unit = i18n(['items', '项'])
      const list = fm.listContents(filePath)
        .map((name) => {
          const path = fm.joinPath(filePath, name)
          const isDirectory = fm.isDirectory(path)
          const date = fm.modificationDate(path).toLocaleDateString('zh-CN')
          const size = fm.fileSize(path)
          return {
            name,
            info: isDirectory
              ? `${date} - ${fm.listContents(path).length} ${unit}`
              : `${date} - ${size > 1024 ? `${(size / 1024).toFixed(1)} MB` : `${size} KB`}`,
            filePath: path,
            isDirectory
          }
        })
      presentList({
        title: name,
        list,
        directory: filePath
      })
    } else {
      if (!fm.isFileDownloaded(filePath)) {
        await fm.downloadFileFromiCloud(filePath)
      }
      if (/.(js|json)$/.test(filePath)) {
        QuickLook.present(filePath)
        return
      }
      if (/.(jpg|jpeg|gif|png|heic|heif|webp)$/i.test(filePath)) {
        QuickLook.present(filePath, false)
        return
      }
      try {
        const image = fm.readImage(filePath)
        QuickLook.present(image, false)
        return
      } catch (e) {
        console.warn(e)
      }
      try {
        const text = fm.readString(filePath)
        QuickLook.present(text)
        return
      } catch (e) {
        console.warn(e)
      }
      QuickLook.present(filePath)
    }
  }

  const remove = async (list) => {
    for (const file of list) {
      fm.remove(file.filePath)
    }
    webView.evaluateJavaScript(
      `window.dispatchEvent(new CustomEvent(
        'JWeb',
        { detail: {
          code: 'remove-success',
          data: '${JSON.stringify(list)}'
        } }
      ))`,
      false
    )
  }

  await loadHTML(
    webView,
    {
      html,
      baseURL: 'https://scriptore.imarkr.com/scriptables/Clean%20Files%202'
    },
    {
      methods: {
        view,
        remove,
        import: () => importFiles(directory)
      }
    }
  )
  webView.present()
}

/** @type {File[]} */
const directories = [
  {
    name: i18n(['Local Cache', '本地缓存']),
    filePath: FileManager.local().cacheDirectory(),
    isDirectory: true
  },
  {
    name: i18n(['Local Documents', '本地文件']),
    filePath: FileManager.local().documentsDirectory(),
    isDirectory: true
  },
  {
    name: i18n(['Local Library', '本地库存']),
    filePath: FileManager.local().libraryDirectory(),
    isDirectory: true
  },
  {
    name: i18n(['Local Temporary', '本地暂存']),
    filePath: FileManager.local().temporaryDirectory(),
    isDirectory: true
  }
]

if (usedICloud) {
  directories.push(
    {
      name: i18n(['iCloud Documents', 'iCloud 文件']),
      filePath: FileManager.iCloud().documentsDirectory(),
      isDirectory: true
    },
    {
      name: i18n(['iCloud Library', 'iCloud 库存']),
      filePath: FileManager.iCloud().libraryDirectory(),
      isDirectory: true
    }
  )
}

presentList({
  title: 'Clean Files',
  list: directories
})

/**
 * @typedef {object} File
 * @property {string} File.name
 * @property {string} [File.info]
 * @property {string} File.filePath
 * @property {boolean} File.isDirectory
 */
