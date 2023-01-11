// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: link; icon-color: cyan;
/**
 * @version 1.2.0
 * @author Honye
 */

/**
 * @param {object} options
 * @param {string} [options.title]
 * @param {string} [options.message]
 * @param {Array<{ title: string; [key: string]: any }>} options.options
 * @param {boolean} [options.showCancel = true]
 * @param {string} [options.cancelText = 'Cancel']
 */
const presentSheet = async (options) => {
  options = {
    showCancel: true,
    cancelText: 'Cancel',
    ...options
  };
  const alert = new Alert();
  if (options.title) {
    alert.title = options.title;
  }
  if (options.message) {
    alert.message = options.message;
  }
  if (!options.options) {
    throw new Error('The "options" property of the parameter cannot be empty')
  }
  for (const option of options.options) {
    alert.addAction(option.title);
  }
  if (options.showCancel) {
    alert.addCancelAction(options.cancelText);
  }
  const value = await alert.presentSheet();
  return {
    value,
    option: options.options[value]
  }
};

/**
 * 多语言国际化
 * @param {{[language: string]: string} | [en:string, zh:string]} langs
 */
const i18n = (langs) => {
  const language = Device.language();
  if (Array.isArray(langs)) {
    langs = {
      en: langs[0],
      zh: langs[1],
      others: langs[0]
    };
  } else {
    langs.others = langs.others || langs.en;
  }
  return langs[language] || langs.others
};

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

/** 规范使用文件缓存。每个脚本使用独立文件夹 */
const useCache = () => useFileManager({ basePath: 'cache' });

/**
 * 轻松实现桌面组件可视化配置
 *
 * - 颜色选择器及更多表单控件
 * - 快速预览
 *
 * GitHub: https://github.com/honye
 *
 * @version 1.2.2
 * @author Honye
 */

/**
 * @returns {Promise<Settings>}
 */
const readSettings = async () => {
  const localFM = useFileManager();
  let settings = localFM.readJSON('settings.json');
  if (settings) {
    console.log('[info] use local settings');
    return settings
  }

  const iCloudFM = useFileManager({ useICloud: true });
  settings = iCloudFM.readJSON('settings.json');
  if (settings) {
    console.log('[info] use iCloud settings');
  }
  return settings
};

/**
 * @param {Record<string, unknown>} data
 * @param {{ useICloud: boolean; }} options
 */
const writeSettings = async (data, { useICloud }) => {
  const fm = useFileManager({ useICloud });
  fm.writeJSON('settings.json', data);
};

const removeSettings = async (settings) => {
  const cache = useFileManager({ useICloud: settings.useICloud });
  FileManager.local().remove(
    FileManager.local().joinPath(
      cache.cacheDirectory,
      'settings.json'
    )
  );
};

const moveSettings = (useICloud, data) => {
  const localFM = useFileManager();
  const iCloudFM = useFileManager({ useICloud: true });
  const [i, l] = [
    FileManager.local().joinPath(
      iCloudFM.cacheDirectory,
      'settings.json'
    ),
    FileManager.local().joinPath(
      localFM.cacheDirectory,
      'settings.json'
    )
  ];
  try {
    writeSettings(data, { useICloud });
    if (useICloud) {
      FileManager.local().remove(l);
    } else {
      FileManager.iCloud().remove(i);
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * @typedef {object} FormItem
 * @property {string} name
 * @property {string} label
 * @property {string} [type]
 * @property {{ label: string; value: unknown }[]} [options]
 * @property {unknown} [default]
 */
/**
 * @typedef {Record<string, unknown>} Settings
 * @property {boolean} useICloud
 * @property {string} [backgroundImage]
 */
/**
 * @param {object} options
 * @param {FormItem[]} [options.formItems]
 * @param {(data: {
 *  settings: Settings;
 *  family?: 'small'|'medium'|'large';
 * }) => Promise<ListWidget>} options.render
 * @param {string} [options.homePage]
 * @param {(item: FormItem) => void} [options.onItemClick]
 * @returns {Promise<ListWidget|undefined>} 在 Widget 中运行时返回 ListWidget，其它无返回
 */
const withSettings = async (options) => {
  const {
    formItems = [],
    onItemClick,
    render,
    homePage = 'https://www.imarkr.com'
  } = options;
  const cache = useCache();

  let settings = await readSettings() || {};
  const imgPath = FileManager.local().joinPath(
    cache.cacheDirectory,
    'bg.png'
  );

  if (config.runsInWidget) {
    const widget = await render({ settings });
    if (settings.backgroundImage) {
      widget.backgroundImage = FileManager.local().readImage(imgPath);
    }
    Script.setWidget(widget);
    return widget
  }

  // ====== web start =======
  const style =
`:root {
  --color-primary: #007aff;
  --divider-color: rgba(60,60,67,0.36);
  --card-background: #fff;
  --card-radius: 10px;
  --list-header-color: rgba(60,60,67,0.6);
}
* {
  -webkit-user-select: none;
  user-select: none;
}
body {
  margin: 10px 0;
  -webkit-font-smoothing: antialiased;
  font-family: "SF Pro Display","SF Pro Icons","Helvetica Neue","Helvetica","Arial",sans-serif;
  accent-color: var(--color-primary);
}
input {
  -webkit-user-select: auto;
  user-select: auto;
}
body {
  background: #f2f2f7;
}
button {
  font-size: 16px;
  background: var(--color-primary);
  color: #fff;
  border-radius: 8px;
  border: none;
  padding: 0.24em 0.5em;
}
button .iconfont {
  margin-right: 6px;
}
.list {
  margin: 15px;
}
.list__header {
  margin: 0 20px;
  color: var(--list-header-color);
  font-size: 13px;
}
.list__body {
  margin-top: 10px;
  background: var(--card-background);
  border-radius: var(--card-radius);
  border-radius: 12px;
  overflow: hidden;
}
.form-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
  min-height: 2em;
  padding: 0.5em 20px;
  position: relative;
}
.form-item--link .icon-arrow_right {
  color: #86868b;
}
.form-item + .form-item::before {
  content: "";
  position: absolute;
  top: 0;
  left: 20px;
  right: 0;
  border-top: 0.5px solid var(--divider-color);
}
.form-item .iconfont {
  margin-right: 4px;
}
.form-item input,
.form-item select {
  font-size: 14px;
  text-align: right;
}
.form-item input[type="checkbox"] {
  width: 1.25em;
  height: 1.25em;
}
input[type="number"] {
  width: 4em;
}
input[type="date"] {
  min-width: 8em;
}
input[type='checkbox'][role='switch'] {
  position: relative;
  display: inline-block;
  appearance: none;
  width: 40px;
  height: 24px;
  border-radius: 24px;
  background: #ccc;
  transition: 0.3s ease-in-out;
}
input[type='checkbox'][role='switch']::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  transition: 0.3s ease-in-out;
}
input[type='checkbox'][role='switch']:checked {
  background: var(--color-primary);
}
input[type='checkbox'][role='switch']:checked::before {
  transform: translateX(16px);
}
.actions {
  margin: 15px;
}
.copyright {
  margin: 15px;
  font-size: 12px;
  color: #86868b;
}
.copyright a {
  color: #515154;
  text-decoration: none;
}
.preview.loading {
  pointer-events: none;
}
.icon-loading {
  display: inline-block;
  animation: 1s linear infinite spin;
}
@keyframes spin {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(1turn);
  }
}
@media (prefers-color-scheme: dark) {
  :root {
    --divider-color: rgba(84,84,88,0.65);
    --card-background: #1c1c1e;
    --list-header-color: rgba(235,235,245,0.6);
  }
  body {
    background: #000;
    color: #fff;
  }
}`;

  const js =
`(() => {
  const settings = ${JSON.stringify(settings)}
  const formItems = ${JSON.stringify(formItems)}
  
  window.invoke = (code, data) => {
    window.dispatchEvent(
      new CustomEvent(
        'JBridge',
        { detail: { code, data } }
      )
    )
  }
  
  const iCloudInput = document.querySelector('input[name="useICloud"]')
  iCloudInput.checked = settings.useICloud
  iCloudInput
    .addEventListener('change', (e) => {
      invoke('moveSettings', e.target.checked)
    })
  
  const formData = {};

  const fragment = document.createDocumentFragment()
  for (const item of formItems) {
    const value = settings[item.name] ?? item.default ?? null
    formData[item.name] = value;
    const label = document.createElement("label");
    label.className = "form-item";
    const div = document.createElement("div");
    div.innerText = item.label;
    label.appendChild(div);
    if (item.type === 'select') {
      const select = document.createElement('select')
      select.className = 'form-item__input'
      select.name = item.name
      select.value = value
      for (const opt of (item.options || [])) {
        const option = document.createElement('option')
        option.value = opt.value
        option.innerText = opt.label
        option.selected = value === opt.value
        select.appendChild(option)
      }
      select.addEventListener('change', (e) => {
        formData[item.name] = e.target.value
        invoke('changeSettings', formData)
      })
      label.appendChild(select)
    } else if (item.type === 'cell') {
      label.classList.add('form-item--link')
      const icon = document.createElement('i')
      icon.className = 'iconfont icon-arrow_right'
      label.appendChild(icon)
      label.addEventListener('click', () => {
        invoke('itemClick', item)
      })
    } else {
      const input = document.createElement("input")
      input.className = 'form-item__input'
      input.name = item.name
      input.type = item.type || "text";
      input.enterKeyHint = 'done'
      input.value = value
      // Switch
      if (item.type === 'switch') {
        input.type = 'checkbox'
        input.role = 'switch'
        input.checked = value
      }
      if (item.type === 'number') {
        input.inputMode = 'decimal'
      }
      if (input.type === 'text') {
        input.size = 12
      }
      input.addEventListener("change", (e) => {
        formData[item.name] =
          item.type === 'switch'
          ? e.target.checked
          : item.type === 'number'
          ? Number(e.target.value)
          : e.target.value;
        invoke('changeSettings', formData)
      });
      label.appendChild(input);
    }
    fragment.appendChild(label);
  }
  document.getElementById('form').appendChild(fragment)

  for (const btn of document.querySelectorAll('.preview')) {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget
      target.classList.add('loading')
      const icon = e.currentTarget.querySelector('.iconfont')
      const className = icon.className
      icon.className = 'iconfont icon-loading'
      const listener = (event) => {
        const { code } = event.detail
        if (code === 'previewStart') {
          target.classList.remove('loading')
          icon.className = className
          window.removeEventListener('JWeb', listener);
        }
      }
      window.addEventListener('JWeb', listener)
      invoke('preview', e.currentTarget.dataset.size)
    })
  }

  const reset = () => {
    for (const item of formItems) {
      const el = document.querySelector(\`.form-item__input[name="\${item.name}"]\`)
      formData[item.name] = item.default
      if (item.type === 'switch') {
        el.checked = item.default
      } else {
        el && (el.value = item.default)
      }
    }
    invoke('removeSettings', formData)
  }
  document.getElementById('reset').addEventListener('click', () => reset())

  document.getElementById('chooseBgImg')
    .addEventListener('click', () => invoke('chooseBgImg'))
})()`;

  const html =
`<html>
  <head>
    <meta name='viewport' content='width=device-width, user-scalable=no'>
    <link rel="stylesheet" href="//at.alicdn.com/t/c/font_3772663_kmo790s3yfq.css" type="text/css">
    <style>${style}</style>
  </head>
  <body>
  <div class="list">
    <div class="list__header">${i18n(['Common', '通用'])}</div>
    <form class="list__body" action="javascript:void(0);">
      <label class="form-item">
        <div>${i18n(['Sync with iCloud', 'iCloud 同步'])}</div>
        <input name="useICloud" type="checkbox" role="switch">
      </label>
      <label id="chooseBgImg" class="form-item form-item--link">
        <div>${i18n(['Background image', '背景图'])}</div>
        <i class="iconfont icon-arrow_right"></i>
      </label>
      <label id='reset' class="form-item form-item--link">
        <div>${i18n(['Reset', '重置'])}</div>
        <i class="iconfont icon-arrow_right"></i>
      </label>
    </form>
  </div>
  <div class="list">
    <div class="list__header">${i18n(['Settings', '设置'])}</div>
    <form id="form" class="list__body" action="javascript:void(0);"></form>
  </div>
  <div class="actions">
    <button class="preview" data-size="small"><i class="iconfont icon-yingyongzhongxin"></i>${i18n(['Small', '预览小号'])}</button>
    <button class="preview" data-size="medium"><i class="iconfont icon-daliebiao"></i>${i18n(['Medium', '预览中号'])}</button>
    <button class="preview" data-size="large"><i class="iconfont icon-dantupailie"></i>${i18n(['Large', '预览大号'])}</button>
  </div>
  <footer>
    <div class="copyright">Copyright © 2022 <a href="javascript:invoke('safari','https://www.imarkr.com');">iMarkr</a> All rights reserved.</div>
  </footer>
    <script>${js}</script>
  </body>
</html>`;

  const webView = new WebView();
  await webView.loadHTML(html, homePage);

  const clearBgImg = () => {
    delete settings.backgroundImage;
    const fm = FileManager.local();
    if (fm.fileExists(imgPath)) {
      fm.remove(imgPath);
    }
  };

  const chooseBgImg = async () => {
    const { option } = await presentSheet({
      options: [
        { key: 'choose', title: i18n(['Choose photo', '选择图片']) },
        { key: 'clear', title: i18n(['Clear background image', '清除背景图']) }
      ],
      cancelText: i18n(['Cancel', '取消'])
    });
    switch (option?.key) {
      case 'choose': {
        try {
          const image = await Photos.fromLibrary();
          cache.writeImage('bg.png', image);
          settings.backgroundImage = imgPath;
          writeSettings(settings, { useICloud: settings.useICloud });
        } catch (e) {}
        break
      }
      case 'clear':
        clearBgImg();
        writeSettings(settings, { useICloud: settings.useICloud });
        break
    }
  };

  const injectListener = async () => {
    const event = await webView.evaluateJavaScript(
      `(() => {
        const controller = new AbortController()
        const listener = (e) => {
          completion(e.detail)
          controller.abort()
        }
        window.addEventListener(
          'JBridge',
          listener,
          { signal: controller.signal }
        )
      })()`,
      true
    ).catch((err) => {
      console.error(err);
      throw err
    });
    const { code, data } = event;
    switch (code) {
      case 'preview': {
        const widget = await render({ settings, family: data });
        const { backgroundImage } = settings;
        if (backgroundImage) {
          widget.backgroundImage = FileManager.local().readImage(backgroundImage);
        }
        webView.evaluateJavaScript(
          'window.dispatchEvent(new CustomEvent(\'JWeb\', { detail: { code: \'previewStart\' } }))',
          false
        );
        widget[`present${data.replace(data[0], data[0].toUpperCase())}`]();
        break
      }
      case 'safari':
        Safari.openInApp(data, true);
        break
      case 'changeSettings':
        settings = { ...settings, ...data };
        writeSettings(settings, { useICloud: settings.useICloud });
        break
      case 'moveSettings':
        settings.useICloud = data;
        moveSettings(data, settings);
        break
      case 'removeSettings':
        settings = { ...settings, ...data };
        clearBgImg();
        removeSettings(settings);
        break
      case 'chooseBgImg':
        await chooseBgImg();
        break
      case 'itemClick':
        onItemClick?.(data);
        break
    }
    injectListener();
  };

  injectListener().catch((e) => {
    console.error(e);
    throw e
  });
  webView.present();
  // ======= web end =========
};

// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-gray; icon-glyph: cube;
/* 公历转农历代码思路：
1、建立农历年份查询表
2、计算输入公历日期与公历基准的相差天数
3、从农历基准开始遍历农历查询表，计算自农历基准之后每一年的天数，并用相差天数依次相减，确定农历年份
4、利用剩余相差天数以及农历每个月的天数确定农历月份
5、利用剩余相差天数确定农历哪一天 */

// 农历1949-2100年查询表
const lunarYearArr = [
  0x0b557, // 1949
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950-1959
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960-1969
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970-1979
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980-1989
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0, // 1990-1999
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010-2019
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020-2029
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040-2049
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, // 2050-2059
  0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060-2069
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070-2079
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080-2089
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252, // 2090-2099
  0x0d520 // 2100
];
const lunarMonth = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
const lunarDay = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '初', '廿'];
const tianGan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const diZhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 公历转农历函数
function sloarToLunar (sy, sm, sd) {
  // 输入的月份减1处理
  sm -= 1;

  // 计算与公历基准的相差天数
  // Date.UTC()返回的是距离公历1970年1月1日的毫秒数,传入的月份需要减1
  let daySpan = (Date.UTC(sy, sm, sd) - Date.UTC(1949, 0, 29)) / (24 * 60 * 60 * 1000) + 1;
  let ly, lm, ld;
  // 确定输出的农历年份
  for (let j = 0; j < lunarYearArr.length; j++) {
    daySpan -= lunarYearDays(lunarYearArr[j]);
    if (daySpan <= 0) {
      ly = 1949 + j;
      // 获取农历年份确定后的剩余天数
      daySpan += lunarYearDays(lunarYearArr[j]);
      break
    }
  }

  // 确定输出的农历月份
  for (let k = 0; k < lunarYearMonths(lunarYearArr[ly - 1949]).length; k++) {
    daySpan -= lunarYearMonths(lunarYearArr[ly - 1949])[k];
    if (daySpan <= 0) {
      // 有闰月时，月份的数组长度会变成13，因此，当闰月月份小于等于k时，lm不需要加1
      if (hasLeapMonth(lunarYearArr[ly - 1949]) && hasLeapMonth(lunarYearArr[ly - 1949]) <= k) {
        if (hasLeapMonth(lunarYearArr[ly - 1949]) < k) {
          lm = k;
        } else if (hasLeapMonth(lunarYearArr[ly - 1949]) === k) {
          lm = '闰' + k;
        } else {
          lm = k + 1;
        }
      } else {
        lm = k + 1;
      }
      // 获取农历月份确定后的剩余天数
      daySpan += lunarYearMonths(lunarYearArr[ly - 1949])[k];
      break
    }
  }

  // 确定输出农历哪一天
  ld = daySpan;

  // 将计算出来的农历月份转换成汉字月份，闰月需要在前面加上闰字
  if (hasLeapMonth(lunarYearArr[ly - 1949]) && (typeof (lm) === 'string' && lm.indexOf('闰') > -1)) {
    lm = `闰${lunarMonth[/\d/.exec(lm) - 1]}`;
  } else {
    lm = lunarMonth[lm - 1];
  }

  // 将计算出来的农历年份转换为天干地支年
  ly = getTianGan(ly) + getDiZhi(ly);

  // 将计算出来的农历天数转换成汉字
  if (ld < 11) {
    ld = `${lunarDay[10]}${lunarDay[ld - 1]}`;
  } else if (ld > 10 && ld < 20) {
    ld = `${lunarDay[9]}${lunarDay[ld - 11]}`;
  } else if (ld === 20) {
    ld = `${lunarDay[1]}${lunarDay[9]}`;
  } else if (ld > 20 && ld < 30) {
    ld = `${lunarDay[11]}${lunarDay[ld - 21]}`;
  } else if (ld === 30) {
    ld = `${lunarDay[2]}${lunarDay[9]}`;
  }

  // console.log(ly, lm, ld);

  return {
    lunarYear: ly,
    lunarMonth: lm,
    lunarDay: ld
  }
}

// 计算农历年是否有闰月，参数为存储农历年的16进制
// 农历年份信息用16进制存储，其中16进制的最后1位可以用于判断是否有闰月
function hasLeapMonth (ly) {
  // 获取16进制的最后1位，需要用到&与运算符
  if (ly & 0xf) {
    return ly & 0xf
  } else {
    return false
  }
}

// 如果有闰月，计算农历闰月天数，参数为存储农历年的16进制
// 农历年份信息用16进制存储，其中16进制的第1位（0x除外）可以用于表示闰月是大月还是小月
function leapMonthDays (ly) {
  if (hasLeapMonth(ly)) {
    // 获取16进制的第1位（0x除外）
    return (ly & 0xf0000) ? 30 : 29
  } else {
    return 0
  }
}

// 计算农历一年的总天数，参数为存储农历年的16进制
// 农历年份信息用16进制存储，其中16进制的第2-4位（0x除外）可以用于表示正常月是大月还是小月
function lunarYearDays (ly) {
  let totalDays = 0;

  // 获取正常月的天数，并累加
  // 获取16进制的第2-4位，需要用到>>移位运算符
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    const monthDays = (ly & i) ? 30 : 29;
    totalDays += monthDays;
  }
  // 如果有闰月，需要把闰月的天数加上
  if (hasLeapMonth(ly)) {
    totalDays += leapMonthDays(ly);
  }

  return totalDays
}

// 获取农历每个月的天数
// 参数需传入16进制数值
function lunarYearMonths (ly) {
  const monthArr = [];

  // 获取正常月的天数，并添加到monthArr数组中
  // 获取16进制的第2-4位，需要用到>>移位运算符
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    monthArr.push((ly & i) ? 30 : 29);
  }
  // 如果有闰月，需要把闰月的天数加上
  if (hasLeapMonth(ly)) {
    monthArr.splice(hasLeapMonth(ly), 0, leapMonthDays(ly));
  }

  return monthArr
}

// 将农历年转换为天干，参数为农历年
function getTianGan (ly) {
  let tianGanKey = (ly - 3) % 10;
  if (tianGanKey === 0) tianGanKey = 10;
  return tianGan[tianGanKey - 1]
}

// 将农历年转换为地支，参数为农历年
function getDiZhi (ly) {
  let diZhiKey = (ly - 3) % 12;
  if (diZhiKey === 0) diZhiKey = 12;
  return diZhi[diZhiKey - 1]
}

// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: chess-board;

/* -----------------------------------------------
Script      : no-background.js
Author      : dev@supermamon.com
Version     : 1.8.1
Description :
  A module to create illusions of transparent
  backgrounds for Scriptable widgets
Adapted from Max Zeryck's (@mzeryck) amazing
invisible widget shared on the Automtors discourse
https://talk.automators.fm/t/widget-examples/7994/135
Changelog   :
v1.8.1
- (fix) getPathForSlice returns empty string
v1.8.0
- (new) BREAKING CHANGE: background assignments
  are unique per device so that each device can
  have it's own wallpaper. Run "Regenerate Slices"
  on each device.
  But, there's a bug the current Scriptable version
  where Device.name() returns the model instead.
  So, the wallppapers actually can't be unique
  yet. Affects stable version 1.6.12 or beta 1.7
- (new) support for iPhone 14 Pro/Pro Max.
  Thank you @mzeryck & u/Senion-Ad-883
v1.7.0
- (new) support for iPhone 12 Mini. Thanks @blacksector
v1.6.0
- (new) `transparent` and `for` alias to `getSliceForWidget`
- (new) merged `No Background Config` code to maintain 1 code
- (new) auto-detect iCloud usage
v1.5.0
- (update) iPhone 12 Pro Max compatibility
v1.4.0
- (update) also prompt for setup on the getPathForSlice method
v1.3.0
- (update) automativally prompt for setup when
  slices are missing or if the widget's
  position is not yet stored.
v1.2.0
- (new) applyTint method to simulate a
  semi-tranparent look
v1.1.1
- (fix) syntax error on generateSlices
- (fix) incorrect iPhone 12 size
v1.1.0
- Support for iPhone 12 & 12 Pro
v1.0.2
- Typos on the documentation
v1.0.1
- Fix iamge does not exists issue
----------------------------------------------- */
if (typeof require === 'undefined') require = importModule;

const ALERTS_AS_SHEETS = false;
const fm = FileManager.local();
const CACHE_FOLDER = 'cache/nobg';
const cachePath = fm.joinPath(fm.documentsDirectory(), CACHE_FOLDER);
const deviceId = `${Device.model()}_${Device.name()}`.replace(/[^a-zA-Z0-9\-_]/, '').toLowerCase();

const generateSlices = async function ({ caller = 'none' }) {
  const opts = { caller };

  const appearance = (await isUsingDarkAppearance()) ? 'dark' : 'light';
  const altAppearance = appearance === 'dark' ? 'light' : 'dark';

  if (!fm.fileExists(cachePath)) {
    fm.createDirectory(cachePath, true);
  }

  let message;

  message = i18n([
    'To change background make sure you have a screenshot of you home screen. Go to your home screen and enter wiggle mode. Scroll to the empty page on the far right and take a screenshot.',
    '设置背景前先确认已有主屏截图。返回主屏打开编辑模式，滑动到最右边后截图'
  ]);
  const options = [
    i18n(['Pick Screenshot', '选择截图']),
    i18n(['Exit to Take Screenshot', '退出去截屏'])
  ];
  let resp = await presentAlert(message, options, ALERTS_AS_SHEETS);
  if (resp === 1) return false

  // Get screenshot and determine phone size.
  const wallpaper = await Photos.fromLibrary();
  const height = wallpaper.size.height;
  let suffix = '';

  // Check for iPhone 12 Mini here:
  if (height === 2436) {
    // We'll save everything in the config, to keep things centralized
    const cfg = await loadConfig();
    if (cfg['phone-model'] === undefined) {
      // Doesn't exist, ask them which phone they want to generate for,
      // the mini or the others?
      message = i18n(['What model of iPhone do you have?', '确认手机机型']);
      const options = ['iPhone 12 mini', 'iPhone 11 Pro, XS, or X'];
      resp = await presentAlert(message, options, ALERTS_AS_SHEETS);
      // 0 represents iPhone Mini and 1 others.
      cfg['phone-model'] = resp;
      await saveConfig(cfg); // Save the config
      if (resp === 0) {
        suffix = '_mini';
      }
    } else {
      // Config already contains iPhone model, use it from cfg
      if (cfg['phone-model']) {
        suffix = '_mini';
      }
    }
  }

  const phone = phoneSizes[height + suffix];
  if (!phone) {
    message = i18n([
      "It looks like you selected an image that isn't an iPhone screenshot, or your iPhone is not supported. Try again with a different image.",
      '看似你选的图不是屏幕截图或不支持你的机型，尝试使用其他截图'
    ]);
    await presentAlert(message, [i18n(['OK', '好的'])], ALERTS_AS_SHEETS);
    return false
  }

  /** @type {('small'|'medium'|'large')[]} */
  const families = ['small', 'medium', 'large'];

  // generate crop rects for all sizes
  for (let i = 0; i < families.length; i++) {
    const widgetSize = families[i];

    const crops = widgetPositions[widgetSize].map(item => {
      const position = item.value;

      const crop = { pos: position, w: 0, h: 0, x: 0, y: 0 };
      crop.w = phone[widgetSize].w;
      crop.h = phone[widgetSize].h;
      crop.x = phone.left;

      const pos = position.split('-');

      crop.y = phone[pos[0]];

      if (widgetSize === 'large' && pos[0] === 'bottom') {
        crop.y = phone.middle;
      }

      if (pos.length > 1) {
        crop.x = phone[pos[1]];
      }

      return crop
    });

    for (let c = 0; c < crops.length; c++) {
      const crop = crops[c];
      const imgCrop = cropImage(wallpaper, new Rect(crop.x, crop.y, crop.w, crop.h));

      const imgName = `${deviceId}-${appearance}-${widgetSize}-${crop.pos}.jpg`;
      const imgPath = fm.joinPath(cachePath, imgName);

      if (fm.fileExists(imgPath)) {
        try { fm.remove(imgPath); } catch (e) { }
      }
      fm.writeImage(imgPath, imgCrop);
    }
  }

  if (opts.caller !== 'self') {
    message = i18n([
      `Slices saved for ${appearance} mode. You can switch to ${altAppearance} mode and run this again to also generate slices.`,
      `已经保存${appearance === 'dark' ? '夜间' : '白天'}透明背景。你可以切换到${altAppearance === 'dark' ? '夜间' : '白天'}模式后再次运行`
    ]);
  } else {
    message = i18n(['Slices saved.', '已保存']);
  }
  await presentAlert(message, [i18n(['Ok', '好的'])], ALERTS_AS_SHEETS);

  return true
};
// ------------------------------------------------
/**
 * @param {string} instanceName
 * @param {boolean} reset
 */
const getSliceForWidget = async function (instanceName, reset = false) {
  const appearance = (await isUsingDarkAppearance()) ? 'dark' : 'light';
  let position = reset ? null : await getConfig(instanceName);
  if (!position) {
    log(`Background for "${instanceName}" is not yet set.`);

    // check if slices exists
    const testImage = fm.joinPath(cachePath, `${deviceId}-${appearance}-medium-top.jpg`);
    let readyToChoose = false;
    if (!fm.fileExists(testImage)) {
      // need to generate slices
      // FIXME
      readyToChoose = await generateSlices({ caller: instanceName || 'self' });
    } else {
      readyToChoose = true;
    }

    // now set the
    let backgrounChosen;
    if (readyToChoose) {
      backgrounChosen = await chooseBackgroundSlice(instanceName);
    }

    if (backgrounChosen) {
      const cfg = await loadConfig();
      position = cfg[instanceName];
    } else {
      return null
    }
  }
  const imgPath = fm.joinPath(cachePath, `${deviceId}-${appearance}-${position}.jpg`);
  if (!fm.fileExists(imgPath)) {
    log(`Slice does not exists - ${deviceId}-${appearance}-${position}.jpg`);
    return null
  }

  const image = fm.readImage(imgPath);
  return image
};
// ------------------------------------------------
const transparent = getSliceForWidget;
// ------------------------------------------------
const chooseBackgroundSlice = async function (name) {
  // Prompt for widget size and position.
  let message = i18n(['What is the size of the widget?', '组件尺寸']);
  /** @type {{label:string;value:'small'|'medium'|'large'}[]} */
  const sizes = [
    { label: i18n(['Small', '小号']), value: 'small' },
    { label: i18n(['Medium', '中号']), value: 'medium' },
    { label: i18n(['Large', '大号']), value: 'large' },
    { label: i18n(['Cancel', '取消']), value: 'cancel' }
  ];
  const size = await presentAlert(message, sizes, ALERTS_AS_SHEETS);
  if (size === 3) return false
  const widgetSize = sizes[size].value;

  message = i18n(['Where will it be placed on?', '组件位置']);
  const positions = widgetPositions[widgetSize];
  positions.push(i18n(['Cancel', '取消']));
  const resp = await presentAlert(message, positions, ALERTS_AS_SHEETS);

  if (resp === positions.length - 1) return false
  const position = positions[resp].value;

  const cfg = await loadConfig();
  cfg[name] = `${widgetSize}-${position}`;

  await saveConfig(cfg);
  await presentAlert(i18n(['Background saved.', '已保存']), [i18n(['Ok', '好'])], ALERTS_AS_SHEETS);
  return true
};
/**
 * @param {string} instance
 * @returns {Promise<string|undefined>}
 */
const getConfig = async (instance) => {
  try {
    const conf = await loadConfig();
    return conf[instance]
  } catch (err) {}
};
/**
 * @param {string} instance
 */
const removeConfig = async (instance) => {
  const conf = await loadConfig();
  delete conf[instance];
  await saveConfig(conf);
};

// -- [helpers] -----------------------------------
// ------------------------------------------------
/**
 * @returns {Promise<Record<string, string>>}
 */
async function loadConfig () {
  const configPath = fm.joinPath(cachePath, 'widget-positions.json');
  if (!fm.fileExists(configPath)) {
    await fm.writeString(configPath, '{}');
    return {}
  } else {
    const strConf = fm.readString(configPath);
    const cfg = JSON.parse(strConf);
    return cfg
  }
}

const hasConfig = async () => {
  try {
    const conf = await loadConfig();
    return conf
  } catch (err) {
    return false
  }
};
// ------------------------------------------------
/**
 * @param {Record<string, string>} cfg
 */
async function saveConfig (cfg) {
  const configPath = fm.joinPath(cachePath, 'widget-positions.json');
  await fm.writeString(configPath, JSON.stringify(cfg));
  return cfg
}
// ------------------------------------------------
async function presentAlert (
  prompt = '',
  items = ['OK'],
  asSheet = false
) {
  const alert = new Alert();
  alert.message = prompt;

  for (let n = 0; n < items.length; n++) {
    const item = items[n];
    if (typeof item === 'string') {
      alert.addAction(item);
    } else {
      alert.addAction(item.label);
    }
  }
  const resp = asSheet
    ? await alert.presentSheet()
    : await alert.presentAlert();
  return resp
}
// ------------------------------------------------
/**
 * @type {Record<'small'|'medium'|'large', {label:string;value:string}[]>}
 */
const widgetPositions = {
  small: [
    { label: i18n(['Top Left', '左上']), value: 'top-left' },
    { label: i18n(['Top Right', '右上']), value: 'top-right' },
    { label: i18n(['Middle Left', '左中']), value: 'middle-left' },
    { label: i18n(['Middle Right', '右中']), value: 'middle-right' },
    { label: i18n(['Bottom Left', '左下']), value: 'bottom-left' },
    { label: i18n(['Bottom Right', '右下']), value: 'bottom-right' }
  ],
  medium: [
    { label: i18n(['Top', '上方']), value: 'top' },
    { label: i18n(['Middle', '中部']), value: 'middle' },
    { label: i18n(['Bottom', '下方']), value: 'bottom' }
  ],
  large: [
    { label: i18n(['Top', '上方']), value: 'top' },
    { label: i18n(['Bottom', '下方']), value: 'bottom' }
  ]
};
// ------------------------------------------------
/**
 * @type {Record<string|number, {
 * models: string[];
 * small: { w: number; h: number };
 * medium: { w: number; h: number };
 * large: { w: number; h: number };
 * left:number; right:number; top:number; middle:number; bottom:number;
 * }>}
 */
const phoneSizes = {
  2796: {
    models: ['14 Pro Max'],
    small: { w: 510, h: 510 },
    medium: { w: 1092, h: 510 },
    large: { w: 1092, h: 1146 },
    left: 99,
    right: 681,
    top: 282,
    middle: 918,
    bottom: 1554
  },

  2556: {
    models: ['14 Pro'],
    small: { w: 474, h: 474 },
    medium: { w: 1014, h: 474 },
    large: { w: 1014, h: 1062 },
    left: 82,
    right: 622,
    top: 270,
    middle: 858,
    bottom: 1446
  },

  2778: {
    models: ['12 Pro Max', '13 Pro Max', '14 Plus'],
    small: { w: 510, h: 510 },
    medium: { w: 1092, h: 510 },
    large: { w: 1092, h: 1146 },
    left: 96,
    right: 678,
    top: 246,
    middle: 882,
    bottom: 1518
  },

  2532: {
    models: ['12', '12 Pro', '13', '14'],
    small: { w: 474, h: 474 },
    medium: { w: 1014, h: 474 },
    large: { w: 1014, h: 1062 },
    left: 78,
    right: 618,
    top: 231,
    middle: 819,
    bottom: 1407
  },

  2688: {
    models: ['Xs Max', '11 Pro Max'],
    small: { w: 507, h: 507 },
    medium: { w: 1080, h: 507 },
    large: { w: 1080, h: 1137 },
    left: 81,
    right: 654,
    top: 228,
    middle: 858,
    bottom: 1488
  },

  1792: {
    models: ['11', 'Xr'],
    small: { w: 338, h: 338 },
    medium: { w: 720, h: 338 },
    large: { w: 720, h: 758 },
    left: 54,
    right: 436,
    top: 160,
    middle: 580,
    bottom: 1000
  },

  2436: {
    models: ['X', 'Xs', '11 Pro'],
    small: { w: 465, h: 465 },
    medium: { w: 987, h: 465 },
    large: { w: 987, h: 1035 },
    left: 69,
    right: 591,
    top: 213,
    middle: 783,
    bottom: 1353
  },

  '2436_mini': {
    models: ['12 Mini'],
    small: { w: 465, h: 465 },
    medium: { w: 987, h: 465 },
    large: { w: 987, h: 1035 },
    left: 69,
    right: 591,
    top: 231,
    middle: 801,
    bottom: 1371
  },

  2208: {
    models: ['6+', '6s+', '7+', '8+'],
    small: { w: 471, h: 471 },
    medium: { w: 1044, h: 471 },
    large: { w: 1044, h: 1071 },
    left: 99,
    right: 672,
    top: 114,
    middle: 696,
    bottom: 1278
  },

  1334: {
    models: ['6', '6s', '7', '8'],
    small: { w: 296, h: 296 },
    medium: { w: 642, h: 296 },
    large: { w: 642, h: 648 },
    left: 54,
    right: 400,
    top: 60,
    middle: 412,
    bottom: 764
  },

  1136: {
    models: ['5', '5s', '5c', 'SE'],
    small: { w: 282, h: 282 },
    medium: { w: 584, h: 282 },
    large: { w: 584, h: 622 },
    left: 30,
    right: 332,
    top: 59,
    middle: 399,
    bottom: 399
  }
};
// ------------------------------------------------
function cropImage (img, rect) {
  const draw = new DrawContext();
  draw.size = new Size(rect.width, rect.height);
  draw.drawImageAtPoint(img, new Point(-rect.x, -rect.y));
  return draw.getImage()
}
// ------------------------------------------------
async function isUsingDarkAppearance () {
  return !(Color.dynamic(Color.white(), Color.black()).red)
}

/**
 * @param {ListWidget | WidgetStack} stack
 * @param {object} options
 * @param {number} [options.column] column count
 * @param {number | [number, number]} [options.gap]
 * @param {'row' | 'column'} [options.direction]
 */
const useGrid = async (stack, options) => {
  const {
    column,
    gap = 0,
    direction = 'row'
  } = options;
  const [columnGap, rowGap] = typeof gap === 'number' ? [gap, gap] : gap;

  if (direction === 'row') {
    stack.layoutVertically();
  } else {
    stack.layoutHorizontally();
  }

  let i = -1;
  const rows = [];

  const add = async (fn) => {
    i++;
    const r = Math.floor(i / column);
    if (i % column === 0) {
      if (r > 0) {
        stack.addSpacer(rowGap);
      }
      const rowStack = stack.addStack();
      if (direction === 'row') {
        rowStack.layoutHorizontally();
      } else {
        rowStack.layoutVertically();
      }
      rows.push(rowStack);
    }

    if (i % column > 0) {
      rows[r].addSpacer(columnGap);
    }
    await fn(rows[r]);
  };

  return { add }
};

/* 应用快捷方式
    - 日历
    - 支付宝扫码、收/付款、健康码
    - 微信扫码 */
if (typeof require === 'undefined') require = importModule;

const preference = {
  lightBgColor: '#b18cf1',
  darkBgColor: '#e63b7a'
};
const shortcuts = [
  {
    symbol: 'qrcode.viewfinder',
    title: '支付宝',
    url: 'alipays://platformapi/startapp?saId=10000007'
  },
  {
    symbol: 'barcode.viewfinder',
    title: '收/付款',
    url: 'alipay://platformapi/startapp?appId=20000056'
  },
  {
    symbol: 'plus.viewfinder',
    title: '微信',
    url: 'weixin://scanqrcode'
  },
  {
    symbol: 'location.viewfinder',
    title: '健康码',
    url: 'alipays://platformapi/startapp?appId=20000067&url=https%3A%2F%2F68687564.h5app.alipay.com%2Fwww%2Findex.html'
  }
];
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
};

const centerH = (widget, callback) => {
  const stack = widget.addStack();
  stack.addSpacer();
  const ret = callback(stack);
  stack.addSpacer();
  return ret
};

/**
 * @param {ListWidget | WidgetStack} widget
 * @param {{ symbol: string; title: string; url: string }} options
 */
const addSquare = (widget, options) => {
  const stack = widget.addStack();
  stack.url = options.url;
  stack.size = new Size(78, 68);
  stack.cornerRadius = 10;
  stack.backgroundColor = new Color('#000', 0.15);
  stack.layoutVertically();
  // add symbol
  const imageWrapper = stack.addStack();
  imageWrapper.addSpacer();
  addSymbol(imageWrapper, options.symbol);
  imageWrapper.addSpacer();
  stack.addSpacer(2);
  // add title
  const textWrapper = stack.addStack();
  textWrapper.addSpacer();
  const text = textWrapper.addText(options.title);
  text.textColor = Color.white();
  text.font = Font.systemFont(12);
  textWrapper.addSpacer();
};

const addSymbol = (widget, name) => {
  const sfs = SFSymbol.named(name);
  sfs.applyFont(
    Font.thinMonospacedSystemFont(36)
  );
  const image = widget.addImage(sfs.image);
  image.imageSize = new Size(38, 38);
  image.tintColor = Color.white();
};

/** @type {WidgetStack} */
const addDate = (container) => {
  const stackDate = container.addStack();
  stackDate.url = 'calshow://';
  stackDate.layoutVertically();
  const dateFormatter = new DateFormatter();
  dateFormatter.dateFormat = 'yyyy年MM月 E';
  const textDay = centerH(stackDate, (stack) => {
    return stack.addText(
      String(new Date().getDate())
    )
  });
  textDay.font = Font.regularRoundedSystemFont(52);
  textDay.textColor = Color.white();
  stackDate.addSpacer(14);
  const textDate = centerH(stackDate, (stack) => {
    return stack.addText(
      dateFormatter.string(new Date())
    )
  });
  textDate.font = Font.systemFont(16);
  textDate.textColor = Color.white();
  const now = new Date();
  const { lunarYear, lunarMonth, lunarDay } = sloarToLunar(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate()
  );
  stackDate.addSpacer(6);
  const textLunar = centerH(stackDate, (stack) => {
    return stack.addText(
      `${lunarYear}${$12Animals[lunarYear[1]]}年` +
      `${lunarMonth}月${lunarDay}`
    )
  });
  textLunar.font = Font.systemFont(13);
  textLunar.textColor = Color.white();
};

/**
 * @param {WidgetStack} widget
 */
const addShortcuts = async (widget) => {
  const grid = widget.addStack();
  const { add } = await useGrid(grid, { column: 2, gap: 8 });
  for (const item of shortcuts) {
    await add((stack) => addSquare(stack, item));
  }
};

const createWidget = async () => {
  const { lightBgColor, darkBgColor } = preference;

  const widget = new ListWidget();
  widget.setPadding(8, 0, 8, 8);
  widget.backgroundColor = Color.dynamic(new Color(lightBgColor), new Color(darkBgColor));
  const noBgConfig = await getConfig(Script.name());
  if (noBgConfig) {
    widget.backgroundImage = await transparent(Script.name());
  }

  const container = widget.addStack();
  container.centerAlignContent();
  container.addSpacer();
  addDate(container);
  container.addSpacer();
  container.addSpacer(8);
  await addShortcuts(container);

  return widget
};

await withSettings({
  formItems: [
    {
      name: 'lightBgColor',
      label: i18n(['Background color (light)', '背景色（白天）']),
      type: 'color',
      default: preference.lightBgColor
    },
    {
      name: 'darkBgColor',
      label: i18n(['Background color (dark)', '背景色（夜间）']),
      type: 'color',
      default: preference.darkBgColor
    },
    {
      name: 'transparentBg',
      label: i18n(['Transparent background', '透明背景']),
      type: 'cell'
    },
    {
      name: 'clearBgTransparent',
      label: i18n(['Remove transparent background', '清除透明背景']),
      type: 'cell'
    }
  ],
  onItemClick: async (item) => {
    const { name } = item;
    if (name === 'clearBgTransparent') {
      await removeConfig(Script.name());
      const alert = new Alert();
      alert.message = i18n(['Removed', '已清除']);
      alert.addCancelAction(i18n(['OK', '好']));
      alert.presentAlert();
    } else if (name === 'transparentBg') {
      if (await hasConfig()) {
        const { option } = await presentSheet({
          options: [
            {
              title: i18n(['Update widget size and position', '修改组件尺寸和位置']),
              value: 'update'
            },
            {
              title: i18n(['Update wallpaper screenshot', '更新壁纸截图']),
              value: 'reset'
            }
          ],
          cancelText: i18n(['Cancel', '取消'])
        });
        if (option) {
          if (option.value === 'update') {
            await transparent(Script.name(), true);
          } else {
            await generateSlices({ caller: Script.name() });
          }
        }
      } else {
        await transparent(Script.name(), true);
      }
    }
  },
  render: async ({ family, settings }) => {
    config.widgetFamily = family ?? config.widgetFamily;
    Object.assign(preference, settings);
    const widget = await createWidget();
    return widget
  }
});
