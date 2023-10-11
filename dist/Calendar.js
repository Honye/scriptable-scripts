// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: calendar-alt; icon-color: orange;
/**
 * @version 1.4.5
 * @author Honye
 */

/**
 * Thanks @mzeryck
 *
 * @param {number} [height] The screen height measured in pixels
 */
const phoneSize = (height) => {
  const phones = {
    /** 14 Pro Max */
    2796: {
      small: 510,
      medium: 1092,
      large: 1146,
      left: 99,
      right: 681,
      top: 282,
      middle: 918,
      bottom: 1554
    },
    /** 14 Pro */
    2556: {
      small: 474,
      medium: 1014,
      large: 1062,
      left: 82,
      right: 622,
      top: 270,
      middle: 858,
      bottom: 1446
    },
    /** 13 Pro Max, 12 Pro Max */
    2778: {
      small: 510,
      medium: 1092,
      large: 1146,
      left: 96,
      right: 678,
      top: 246,
      middle: 882,
      bottom: 1518
    },
    /** 13, 13 Pro, 12, 12 Pro */
    2532: {
      small: 474,
      medium: 1014,
      large: 1062,
      left: 78,
      right: 618,
      top: 231,
      middle: 819,
      bottom: 1407
    },
    /** 11 Pro Max, XS Max */
    2688: {
      small: 507,
      medium: 1080,
      large: 1137,
      left: 81,
      right: 654,
      top: 228,
      middle: 858,
      bottom: 1488
    },
    /** 11, XR */
    1792: {
      small: 338,
      medium: 720,
      large: 758,
      left: 55,
      right: 437,
      top: 159,
      middle: 579,
      bottom: 999
    },
    /** 13 mini, 12 mini / 11 Pro, XS, X */
    2436: {
      small: 465,
      medium: 987,
      large: 1035,
      x: {
        left: 69,
        right: 591,
        top: 213,
        middle: 783,
        bottom: 1353
      },
      mini: {
        left: 69,
        right: 591,
        top: 231,
        middle: 801,
        bottom: 1371
      }
    },
    /** Plus phones */
    2208: {
      small: 471,
      medium: 1044,
      large: 1071,
      left: 99,
      right: 672,
      top: 114,
      middle: 696,
      bottom: 1278
    },
    /** SE2 and 6/6S/7/8 */
    1334: {
      small: 296,
      medium: 642,
      large: 648,
      left: 54,
      right: 400,
      top: 60,
      middle: 412,
      bottom: 764
    },
    /** SE1 */
    1136: {
      small: 282,
      medium: 584,
      large: 622,
      left: 30,
      right: 332,
      top: 59,
      middle: 399,
      bottom: 399
    },
    /** 11 and XR in Display Zoom mode */
    1624: {
      small: 310,
      medium: 658,
      large: 690,
      left: 46,
      right: 394,
      top: 142,
      middle: 522,
      bottom: 902
    },
    /** Plus in Display Zoom mode */
    2001: {
      small: 444,
      medium: 963,
      large: 972,
      left: 81,
      right: 600,
      top: 90,
      middle: 618,
      bottom: 1146
    }
  };
  height = height || Device.screenResolution().height;
  const scale = Device.screenScale();

  const phone = phones[height];
  if (phone) {
    return phone
  }

  if (config.runsInWidget) {
    const pc = {
      small: 164 * scale,
      medium: 344 * scale,
      large: 354 * scale
    };
    return pc
  }

  // in app screen fixed 375x812 pt
  return {
    small: 155 * scale,
    medium: 329 * scale,
    large: 345 * scale
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
 * 是否同一天
 * @param {string|number|Date} a
 * @param {string|number|Date} b
 */
const isSameDay = (a, b) => {
  const leftDate = new Date(a);
  leftDate.setHours(0);
  const rightDate = new Date(b);
  rightDate.setHours(0);
  return Math.abs(leftDate - rightDate) < 3600000
};

/**
 * 是否是今天
 * @param {string|number|Date} date
 */
const isToday = (date) => isSameDay(new Date(), date);

/**
 * 图标换色
 * @param {Image} image
 * @param {Color} color
 */
const tintedImage = async (image, color) => {
  const html =
    `<img id="image" src="data:image/png;base64,${Data.fromPNG(image).toBase64String()}" />
    <canvas id="canvas"></canvas>`;
  const js =
    `let img = document.getElementById("image");
     let canvas = document.getElementById("canvas");
     let color = 0x${color.hex};

     canvas.width = img.width;
     canvas.height = img.height;
     let ctx = canvas.getContext("2d");
     ctx.drawImage(img, 0, 0);
     let imgData = ctx.getImageData(0, 0, img.width, img.height);
     // ordered in RGBA format
     let data = imgData.data;
     for (let i = 0; i < data.length; i++) {
       // skip alpha channel
       if (i % 4 === 3) continue;
       // bit shift the color value to get the correct channel
       data[i] = (color >> (2 - i % 4) * 8) & 0xFF
     }
     ctx.putImageData(imgData, 0, 0);
     canvas.toDataURL("image/png").replace(/^data:image\\/png;base64,/, "");`;
  const wv = new WebView();
  await wv.loadHTML(html);
  const base64 = await wv.evaluateJavaScript(js);
  return Image.fromData(Data.fromBase64String(base64))
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
 * @param {WidgetStack} stack
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

// 事件颜色换算，浅色换深色
function getDarkerColor(color, factor = 0.6) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return 'Invalid color';
  }

  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  const darkerR = Math.max(Math.floor(r * factor), 0);
  const darkerG = Math.max(Math.floor(g * factor), 0);
  const darkerB = Math.max(Math.floor(b * factor), 0);

  return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
}

/**
 * @file Scriptable WebView JSBridge native SDK
 * @version 1.0.2
 * @author Honye
 */

/**
 * @typedef Options
 * @property {Record<string, () => void>} methods
 */

const sendResult = (() => {
  let sending = false;
  /** @type {{ code: string; data: any }[]} */
  const list = [];

  /**
   * @param {WebView} webView
   * @param {string} code
   * @param {any} data
   */
  return async (webView, code, data) => {
    if (sending) return

    sending = true;
    list.push({ code, data });
    const arr = list.splice(0, list.length);
    for (const { code, data } of arr) {
      const eventName = `ScriptableBridge_${code}_Result`;
      const res = data instanceof Error ? { err: data.message } : data;
      await webView.evaluateJavaScript(
        `window.dispatchEvent(
          new CustomEvent(
            '${eventName}',
            { detail: ${JSON.stringify(res)} }
          )
        )`
      );
    }
    if (list.length) {
      const { code, data } = list.shift();
      sendResult(webView, code, data);
    } else {
      sending = false;
    }
  }
})();

/**
 * @param {WebView} webView
 * @param {Options} options
 */
const inject = async (webView, options) => {
  const js =
`(() => {
  const queue = window.__scriptable_bridge_queue
  if (queue && queue.length) {
    completion(queue)
  }
  window.__scriptable_bridge_queue = null

  if (!window.ScriptableBridge) {
    window.ScriptableBridge = {
      invoke(name, data, callback) {
        const detail = { code: name, data }

        const eventName = \`ScriptableBridge_\${name}_Result\`
        const controller = new AbortController()
        window.addEventListener(
          eventName,
          (e) => {
            callback && callback(e.detail)
            controller.abort()
          },
          { signal: controller.signal }
        )

        if (window.__scriptable_bridge_queue) {
          window.__scriptable_bridge_queue.push(detail)
          completion()
        } else {
          completion(detail)
          window.__scriptable_bridge_queue = []
        }
      }
    }
    window.dispatchEvent(
      new CustomEvent('ScriptableBridgeReady')
    )
  }
})()`;

  const res = await webView.evaluateJavaScript(js, true);
  if (!res) return inject(webView, options)

  const methods = options.methods || {};
  const events = Array.isArray(res) ? res : [res];
  // 同时执行多次 webView.evaluateJavaScript Scriptable 存在问题
  // 可能是因为 JavaScript 是单线程导致的
  const sendTasks = events.map(({ code, data }) => {
    return (() => {
      try {
        return Promise.resolve(methods[code](data))
      } catch (e) {
        return Promise.reject(e)
      }
    })()
      .then((res) => sendResult(webView, code, res))
      .catch((e) => sendResult(webView, code, e instanceof Error ? e : new Error(e)))
  });
  await Promise.all(sendTasks);
  inject(webView, options);
};

/**
 * @param {WebView} webView
 * @param {object} args
 * @param {string} args.html
 * @param {string} [args.baseURL]
 * @param {Options} options
 */
const loadHTML = async (webView, args, options = {}) => {
  const { html, baseURL } = args;
  await webView.loadHTML(html, baseURL);
  inject(webView, options).catch((err) => console.error(err));
};

/**
 * 轻松实现桌面组件可视化配置
 *
 * - 颜色选择器及更多表单控件
 * - 快速预览
 *
 * GitHub: https://github.com/honye
 *
 * @version 1.4.1
 * @author Honye
 */

const fm = FileManager.local();
const fileName = 'settings.json';

const toast = (message) => {
  const notification = new Notification();
  notification.title = Script.name();
  notification.body = message;
  notification.schedule();
};

const isUseICloud = () => {
  const ifm = useFileManager({ useICloud: true });
  const filePath = fm.joinPath(ifm.cacheDirectory, fileName);
  return fm.fileExists(filePath)
};

/** 查看配置文件可导出分享 */
const exportSettings = () => {
  const scopedFM = useFileManager({ useICloud: isUseICloud() });
  const filePath = fm.joinPath(scopedFM.cacheDirectory, fileName);
  if (fm.isFileStoredIniCloud(filePath)) {
    fm.downloadFileFromiCloud(filePath);
  }
  if (fm.fileExists(filePath)) {
    QuickLook.present(filePath);
  } else {
    const alert = new Alert();
    alert.message = i18n(['Using default configuration', '使用的默认配置，未做任何修改']);
    alert.addCancelAction(i18n(['OK', '好的']));
    alert.present();
  }
};

const importSettings = async () => {
  const alert1 = new Alert();
  alert1.message = i18n([
    'Will replace existing configuration',
    '会替换已有配置，确认导入吗？可将现有配置导出备份后再导入其他配置'
  ]);
  alert1.addAction(i18n(['Import', '导入']));
  alert1.addCancelAction(i18n(['Cancel', '取消']));
  const i = await alert1.present();
  if (i === -1) return

  const pathList = await DocumentPicker.open(['public.json']);
  for (const path of pathList) {
    const fileName = fm.fileName(path, true);
    const scopedFM = useFileManager({ useICloud: isUseICloud() });
    const destPath = fm.joinPath(scopedFM.cacheDirectory, fileName);
    if (fm.fileExists(destPath)) {
      fm.remove(destPath);
    }
    const i = destPath.lastIndexOf('/');
    const directory = destPath.substring(0, i);
    if (!fm.fileExists(directory)) {
      fm.createDirectory(directory, true);
    }
    fm.copy(path, destPath);
  }
  const alert = new Alert();
  alert.message = i18n(['Imported success', '导入成功']);
  alert.addAction(i18n(['Restart', '重新运行']));
  await alert.present();
  const callback = new CallbackURL('scriptable:///run');
  callback.addParameter('scriptName', Script.name());
  callback.open();
};

/**
 * @returns {Promise<Settings>}
 */
const readSettings = async () => {
  const useICloud = isUseICloud();
  console.log(`[info] use ${useICloud ? 'iCloud' : 'local'} settings`);
  const fm = useFileManager({ useICloud });
  const settings = fm.readJSON(fileName);
  return settings
};

/**
 * @param {Record<string, unknown>} data
 * @param {{ useICloud: boolean; }} options
 */
const writeSettings = async (data, { useICloud }) => {
  const fm = useFileManager({ useICloud });
  fm.writeJSON(fileName, data);
};

const removeSettings = async (settings) => {
  const cache = useFileManager({ useICloud: settings.useICloud });
  fm.remove(
    fm.joinPath(cache.cacheDirectory, fileName)
  );
};

const moveSettings = (useICloud, data) => {
  const localFM = useFileManager();
  const iCloudFM = useFileManager({ useICloud: true });
  const [i, l] = [
    fm.joinPath(iCloudFM.cacheDirectory, fileName),
    fm.joinPath(localFM.cacheDirectory, fileName)
  ];
  try {
    // 移动文件需要创建父文件夹，写入操作会自动创建文件夹
    writeSettings(data, { useICloud });
    if (useICloud) {
      if (fm.fileExists(l)) fm.remove(l);
    } else {
      if (fm.fileExists(i)) fm.remove(i);
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * @typedef {object} NormalFormItem
 * @property {string} name
 * @property {string} label
 * @property {'text'|'number'|'color'|'select'|'date'|'cell'} [type]
 *  - HTML <input> type 属性
 *  - `'cell'`: 可点击的
 * @property {{ label: string; value: unknown }[]} [options]
 * @property {unknown} [default]
 */
/**
 * @typedef {Pick<NormalFormItem, 'label'|'name'> & { type: 'group', items: FormItem[] }} GroupFormItem
 */
/**
 * @typedef {Omit<NormalFormItem, 'type'> & { type: 'page' } & Pick<Options, 'formItems'|'onItemClick'>} PageFormItem 单独的页面
 */
/**
 * @typedef {NormalFormItem|GroupFormItem|PageFormItem} FormItem
 */
/**
 * @typedef {object} CommonSettings
 * @property {boolean} useICloud
 * @property {string} [backgroundImage] 背景图路径
 * @property {string} [backgroundColorLight]
 * @property {string} [backgroundColorDark]
 */
/**
 * @typedef {CommonSettings & Record<string, unknown>} Settings
 */
/**
 * @typedef {object} Options
 * @property {(data: {
 *  settings: Settings;
 *  family?: typeof config.widgetFamily;
 * }) => ListWidget | Promise<ListWidget>} render
 * @property {string} [head] 顶部插入 HTML
 * @property {FormItem[]} [formItems]
 * @property {(item: FormItem) => void} [onItemClick]
 * @property {string} [homePage] 右上角分享菜单地址
 * @property {(data: any) => void} [onWebEvent]
 */
/**
 * @template T
 * @typedef {T extends infer O ? {[K in keyof O]: O[K]} : never} Expand
 */

const previewsHTML =
`<div class="actions">
  <button class="preview" data-size="small"><i class="iconfont icon-yingyongzhongxin"></i>${i18n(['Small', '预览小号'])}</button>
  <button class="preview" data-size="medium"><i class="iconfont icon-daliebiao"></i>${i18n(['Medium', '预览中号'])}</button>
  <button class="preview" data-size="large"><i class="iconfont icon-dantupailie"></i>${i18n(['Large', '预览大号'])}</button>
</div>`;

const copyrightHTML =
`<footer>
  <div class="copyright">© UI powered by <a href="javascript:invoke('safari','https://www.imarkr.com');">iMarkr</a>.</div>
</footer>`;

/**
 * @param {Expand<Options>} options
 * @param {boolean} [isFirstPage]
 * @param {object} [others]
 * @param {Settings} [others.settings]
 * @returns {Promise<ListWidget|undefined>} 仅在 Widget 中运行时返回 ListWidget
 */
const present = async (options, isFirstPage, others = {}) => {
  const {
    formItems = [],
    onItemClick,
    render,
    head,
    homePage = 'https://www.imarkr.com',
    onWebEvent
  } = options;
  const cache = useCache();

  const settings = others.settings || await readSettings() || {};

  /**
   * @param {Parameters<Options['render']>[0]} param
   */
  const getWidget = async (param) => {
    const widget = await render(param);
    const { backgroundImage, backgroundColorLight, backgroundColorDark } = settings;
    if (backgroundImage && fm.fileExists(backgroundImage)) {
      widget.backgroundImage = fm.readImage(backgroundImage);
    }
    if (!widget.backgroundColor || backgroundColorLight || backgroundColorDark) {
      widget.backgroundColor = Color.dynamic(
        new Color(backgroundColorLight || '#ffffff'),
        new Color(backgroundColorDark || '#242426')
      );
    }
    return widget
  };

  if (config.runsInWidget) {
    const widget = await getWidget({ settings });
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
  min-width: 6.4em;
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
  margin-inline: 18px;
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
}
`;

  const js =
`(() => {
  const settings = ${JSON.stringify({
    ...settings,
    useICloud: isUseICloud()
  })}
  const formItems = ${JSON.stringify(formItems)}

  window.invoke = (code, data, cb) => {
    ScriptableBridge.invoke(code, data, cb)
  }

  const formData = {};

  const createFormItem = (item) => {
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
    } else if (
      item.type === 'cell' ||
      item.type === 'page'
    ) {
      label.classList.add('form-item--link')
      const icon = document.createElement('i')
      icon.className = 'iconfont icon-arrow_right'
      label.appendChild(icon)
      label.addEventListener('click', () => {
        const { name } = item
        switch (name) {
          case 'backgroundImage':
            invoke('chooseBgImg')
            break
          case 'clearBackgroundImage':
            invoke('clearBgImg')
            break
          case 'reset':
            reset()
            break
          default:
            invoke('itemClick', item)
        }
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
        if (item.name === 'useICloud') {
          input.addEventListener('change', (e) => {
            invoke('moveSettings', e.target.checked)
          })
        }
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
    return label
  }

  const createList = (list, title) => {
    const fragment = document.createDocumentFragment()

    let elBody;
    for (const item of list) {
      if (item.type === 'group') {
        const grouped = createList(item.items, item.label)
        fragment.appendChild(grouped)
      } else {
        if (!elBody) {
          const groupDiv = fragment.appendChild(document.createElement('div'))
          groupDiv.className = 'list'
          if (title) {
            const elTitle = groupDiv.appendChild(document.createElement('div'))
            elTitle.className = 'list__header'
            elTitle.textContent = title
          }
          elBody = groupDiv.appendChild(document.createElement('div'))
          elBody.className = 'list__body'
        }
        const label = createFormItem(item)
        elBody.appendChild(label)
      }
    }
    return fragment
  }

  const fragment = createList(formItems)
  document.getElementById('settings').appendChild(fragment)

  for (const btn of document.querySelectorAll('.preview')) {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget
      target.classList.add('loading')
      const icon = e.currentTarget.querySelector('.iconfont')
      const className = icon.className
      icon.className = 'iconfont icon-loading'
      invoke(
        'preview',
        e.currentTarget.dataset.size,
        () => {
          target.classList.remove('loading')
          icon.className = className
        }
      )
    })
  }

  const setFieldValue = (name, value) => {
    const input = document.querySelector(\`.form-item__input[name="\${name}"]\`)
    if (!input) return
    if (input.type === 'checkbox') {
      input.checked = value
    } else {
      input.value = value
    }
  }

  const reset = (items = formItems) => {
    for (const item of items) {
      if (item.type === 'group') {
        reset(item.items)
      } else if (item.type === 'page') {
        continue;
      } else {
        setFieldValue(item.name, item.default)
      }
    }
    invoke('removeSettings', formData)
  }
})()`;

  const html =
`<html>
  <head>
    <meta name='viewport' content='width=device-width, user-scalable=no'>
    <link rel="stylesheet" href="//at.alicdn.com/t/c/font_3772663_kmo790s3yfq.css" type="text/css">
    <style>${style}</style>
  </head>
  <body>
  ${head || ''}
  <section id="settings"></section>
  ${isFirstPage ? (previewsHTML + copyrightHTML) : ''}
  <script>${js}</script>
  </body>
</html>`;

  const webView = new WebView();
  const methods = {
    async preview (data) {
      const widget = await getWidget({ settings, family: data });
      widget[`present${data.replace(data[0], data[0].toUpperCase())}`]();
    },
    safari (data) {
      Safari.openInApp(data, true);
    },
    changeSettings (data) {
      Object.assign(settings, data);
      writeSettings(settings, { useICloud: settings.useICloud });
    },
    moveSettings (data) {
      settings.useICloud = data;
      moveSettings(data, settings);
    },
    removeSettings (data) {
      Object.assign(settings, data);
      clearBgImg();
      removeSettings(settings);
    },
    chooseBgImg (data) {
      chooseBgImg();
    },
    clearBgImg () {
      clearBgImg();
    },
    async itemClick (data) {
      if (data.type === 'page') {
        // `data` 经传到 HTML 后丢失了不可序列化的数据，因为需要从源数据查找
        const item = (() => {
          const find = (items) => {
            for (const el of items) {
              if (el.name === data.name) return el

              if (el.type === 'group') {
                const r = find(el.items);
                if (r) return r
              }
            }
            return null
          };
          return find(formItems)
        })();
        await present(item, false, { settings });
      } else {
        await onItemClick?.(data, { settings });
      }
    },
    native (data) {
      onWebEvent?.(data);
    }
  };
  await loadHTML(
    webView,
    { html, baseURL: homePage },
    { methods }
  );

  const clearBgImg = () => {
    const { backgroundImage } = settings;
    delete settings.backgroundImage;
    if (backgroundImage && fm.fileExists(backgroundImage)) {
      fm.remove(backgroundImage);
    }
    writeSettings(settings, { useICloud: settings.useICloud });
    toast(i18n(['Cleared success!', '背景已清除']));
  };

  const chooseBgImg = async () => {
    try {
      const image = await Photos.fromLibrary();
      cache.writeImage('bg.png', image);
      const imgPath = fm.joinPath(cache.cacheDirectory, 'bg.png');
      settings.backgroundImage = imgPath;
      writeSettings(settings, { useICloud: settings.useICloud });
    } catch (e) {
      console.log('[info] 用户取消选择图片');
    }
  };

  webView.present();
  // ======= web end =========
};

/**
 * @param {Options} options
 */
const withSettings = async (options) => {
  const { formItems, onItemClick, ...restOptions } = options;
  return present({
    formItems: [
      {
        label: i18n(['Common', '通用']),
        type: 'group',
        items: [
          {
            label: i18n(['Sync with iCloud', 'iCloud 同步']),
            type: 'switch',
            name: 'useICloud',
            default: false
          },
          {
            label: i18n(['Background', '背景']),
            type: 'page',
            name: 'background',
            formItems: [
              {
                label: i18n(['Background', '背景']),
                type: 'group',
                items: [
                  {
                    name: 'backgroundColorLight',
                    type: 'color',
                    label: i18n(['Background color (light)', '背景色（白天）']),
                    default: '#ffffff'
                  },
                  {
                    name: 'backgroundColorDark',
                    type: 'color',
                    label: i18n(['Background color (dark)', '背景色（夜间）']),
                    default: '#242426'
                  },
                  {
                    label: i18n(['Background image', '背景图']),
                    type: 'cell',
                    name: 'backgroundImage'
                  }
                ]
              },
              {
                type: 'group',
                items: [
                  {
                    label: i18n(['Clear background image', '清除背景图']),
                    type: 'cell',
                    name: 'clearBackgroundImage'
                  }
                ]
              }
            ]
          },
          {
            label: i18n(['Reset', '重置']),
            type: 'cell',
            name: 'reset'
          }
        ]
      },
      {
        type: 'group',
        items: [
          {
            label: i18n(['Export settings', '导出配置']),
            type: 'cell',
            name: 'export'
          },
          {
            label: i18n(['Import settings', '导入配置']),
            type: 'cell',
            name: 'import'
          }
        ]
      },
      {
        label: i18n(['Settings', '设置']),
        type: 'group',
        items: formItems
      }
    ],
    onItemClick: (item, ...args) => {
      const { name } = item;
      if (name === 'export') {
        exportSettings();
      }
      if (name === 'import') {
        importSettings().catch((err) => {
          console.error(err);
          throw err
        });
      }
      onItemClick?.(item, ...args);
    },
    ...restOptions
  }, true)
};

const preference = {
  themeColor: '#ff0000',
  textColor: '#222222',
  textColorDark: '#ffffff',
  weekendColor: '#8e8e93',
  weekendColorDark: '#8e8e93',
  symbolName: 'flag.fill',
  eventMax: 3,
  eventMaxDays: 7,
  eventFontSize: 13,
  includesReminder: false,
  /** @type {'calendar_events'|'events_calendar'} */
  layout: 'calendar_events'
};
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
const today = new Date();
const firstDay = (() => {
  const date = new Date(today);
  date.setDate(1);
  return date
})();
const lastDay = (() => {
  const date = new Date(today);
  date.setMonth(date.getMonth() + 1, 0);
  return date
})();
let dates = [];
let calendar;
const [calendarTitle, theme] = (args.widgetParameter || '').split(',').map((text) => text.trim());
if (calendarTitle) {
  calendar = await Calendar.forEventsByTitle(calendarTitle);
  const events = await CalendarEvent.between(firstDay, lastDay, [calendar]);
  dates = events.map((item) => item.startDate);
}

const titleSize = 12;
const columnGap = 2;
const rowGap = 2;

/**
 * @param {ListWidget|WidgetStack} container
 * @param {object} options
 * @param {(
 *  stack: WidgetStack,
 *  options: {
 *    date: Date;
 *    width: number;
 *    addItem: (stack: WidgetStack, data: { text: string; color: Color }) => WidgetStack
 *  }
 * ) => void} [options.addDay] 自定义添加日期
 */
const addCalendar = async (container, options = {}) => {
  const {
    itemWidth = 18,
    fontSize = 10,
    gap = [columnGap, rowGap],
    addWeek,
    addDay
  } = options;
  const { textColor, textColorDark, weekendColor, weekendColorDark } = preference;
  const family = config.widgetFamily;
  const stack = container.addStack();
  const { add } = await useGrid(stack, {
    column: 7,
    gap
  });
  /**
   * @param {WidgetStack} stack
   * @param {object} param1
   * @param {string} param1.text
   * @param {Color} param1.color
   */
  const _addItem = (stack, { text, color } = {}) => {
    const item = stack.addStack();
    item.size = new Size(itemWidth, itemWidth);
    item.centerAlignContent();
    if (text) {
      const content = item.addStack();
      content.layoutVertically();
      const textInner = content.addText(text);
      textInner.rightAlignText();
      textInner.font = Font.semiboldSystemFont(fontSize);
      textInner.lineLimit = 1;
      textInner.minimumScaleFactor = 0.2;
      textInner.textColor = theme === 'light'
        ? new Color(textColor)
        : theme === 'dark'
          ? new Color(textColorDark)
          : Color.dynamic(new Color(textColor), new Color(textColorDark));
      if (color) {
        textInner.textColor = color;
      }

      item.$content = content;
      item.$text = textInner;
    }

    return item
  };
  const _addWeek = (stack, { day }) => {
    const sunday = new Date('1970/01/04');
    const weekFormat = new Intl.DateTimeFormat([], { weekday: family === 'large' ? 'short' : 'narrow' }).format;

    return _addItem(stack, {
      text: weekFormat(new Date(sunday.getTime() + day * 86400000)),
      color: (day === 0 || day === 6) &&
        Color.dynamic(new Color(weekendColor), new Color(weekendColorDark))
    })
  };
  const _addDay = (stack, { date }) => {
    const color = (() => {
      const week = date.getDay();
      if (isToday(date)) {
        return Color.white()
      }
      return (week === 0 || week === 6) && Color.gray()
    })();
    const item = _addItem(stack, {
      text: `${date.getDate()}`,
      color
    });
    if (isToday(date)) {
      item.cornerRadius = itemWidth / 2;
      item.backgroundColor = Color.red();
    }

    return item
  };
  for (let i = 0; i < 7; i++) {
    await add((stack) => _addWeek(stack, { day: i }));
  }
  for (let i = 0; i < firstDay.getDay(); i++) {
    await add((stack) => _addItem(stack));
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(lastDay);
    date.setDate(i);
    await add(
      async (stack) => addDay
        ? await addDay(stack, {
          date,
          width: itemWidth,
          addItem: _addItem
        })
        : _addDay(stack, { date })
    );
  }

  return stack
};

/**
 * @param {ListWidget} widget
 */
const addTitle = (widget) => {
  const { themeColor } = preference;
  const family = config.widgetFamily;
  const head = widget.addStack();
  head.setPadding(0, 4, 0, 4);
  const title = head.addText(
    new Date().toLocaleString('default', {
      month: family !== 'small' ? 'long' : 'short'
    }).toUpperCase()
  );
  title.font = Font.semiboldSystemFont(11);
  title.textColor = new Color(themeColor);
  head.addSpacer();
  const lunarDate = sloarToLunar(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
  );
  let lunarString = `${lunarDate.lunarMonth}月${lunarDate.lunarDay}`;
  if (family !== 'small') {
    lunarString = `${lunarDate.lunarYear}${$12Animals[lunarDate.lunarYear[1]]}年${lunarString}`;
  }
  const lunar = head.addText(lunarString);
  lunar.font = Font.semiboldSystemFont(11);
  lunar.textColor = new Color(themeColor);
};

/**
 * @type {Parameters<typeof addCalendar>[1]['addDay']}
 */
const addDay = async (
  stack,
  { date, width, addItem } = {}
) => {
  const { themeColor, textColor, textColorDark, weekendColor, weekendColorDark, symbolName } = preference;
  const family = config.widgetFamily;
  const text = `${date.getDate()}`;
  const i = dates.findIndex((item) => isSameDay(item, date));
  const _dateColor = theme === 'light'
    ? new Color(textColor)
    : theme === 'dark'
      ? new Color(textColorDark)
      : Color.dynamic(new Color(textColor), new Color(textColorDark));
  const _weekendColor = theme === 'light'
    ? new Color(weekendColor)
    : theme === 'dark'
      ? new Color(weekendColorDark)
      : Color.dynamic(new Color(weekendColor), new Color(weekendColorDark));
  let color = (() => {
    const week = date.getDay();
    return (week === 0 || week === 6) ? _weekendColor : _dateColor
  })();
  if (isToday(date) || i > -1) {
    color = Color.white();
  }
  const item = addItem(stack, { text, color });
  if (family === 'large') {
    const lunar = sloarToLunar(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );
    const lunarText = item.$content.addText(
      lunar.lunarDay === '初一' ? `${lunar.lunarMonth}月` : lunar.lunarDay
    );
    lunarText.font = Font.systemFont(10);
    lunarText.textColor = color;
  }
  if (isToday(date)) {
    if (family !== 'large') {
      item.cornerRadius = width / 2;
      item.backgroundColor = new Color(themeColor);
    } else {
      const cw = Math.min(12 * Math.sqrt(2) * 2, width);
      const cp = cw / 2 - 10;
      item.$content.size = new Size(cw, cw);
      item.$content.setPadding(0, cp, 0, 0);
      item.$content.cornerRadius = cw / 2;
      item.$content.backgroundColor = new Color(themeColor);
    }
  } else if (i > -1) {
    dates.splice(i, 1);
    const sfs = SFSymbol.named(symbolName);
    sfs.applyFont(Font.systemFont(18));
    const image = sfs.image;
    item.backgroundImage = await tintedImage(image, calendar.color);
    item.$text.shadowColor = calendar.color;
    item.$text.shadowOffset = new Point(0.5, 0.5);
    item.$text.shadowRadius = 0.5;
  }
};

/**
 * @param {WidgetStack} stack
 * @param {CalendarEvent | Reminder} event
 */
const addEvent = (stack, event) => {
  const { eventFontSize } = preference;
  const { color } = event.calendar;
  const row = stack.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  row.size = new Size(-1, 28);
  const line = row.addStack();
  line.layoutVertically();
  line.size = new Size(2.4, -1);
  line.cornerRadius = 1.2;
  line.backgroundColor = color;
  line.addSpacer();

  row.addSpacer(6);
  const content = row.addStack();
  content.layoutVertically();
  const title = content.addText(event.title);
  title.font = Font.boldSystemFont(eventFontSize);
  const darkerColor = getDarkerColor(`#${color.hex}`);
  title.textColor = Color.dynamic(new Color(darkerColor), color);
  const dateFormat = new Intl.DateTimeFormat([], {
    month: '2-digit',
    day: '2-digit'
  }).format;
  const timeFormat = new Intl.DateTimeFormat([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format;
  const items = [];
  const eventDate = event.startDate || event.dueDate;
  if (isToday(eventDate)) {
    items.push(i18n(['Today', '今天']));
  } else {
    items.push(dateFormat(eventDate));
  }
  // Don't use `!isAllDay`, Reminder does not have `isAllDay` attribute
  if (event.isAllDay === false || event.dueDateIncludesTime) items.push(timeFormat(eventDate));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDayDate = new Date(eventDate);
  startDayDate.setHours(0, 0, 0, 0);
  const diff = (startDayDate - today) / (24 * 3600000);
  if (diff > 0) items.push(`T+${Math.round(diff)}`);
  const date = content.addText(items.join(' '));
  date.font = Font.systemFont(eventFontSize * 12 / 13);
  date.textColor = Color.gray();
  row.addSpacer();
};

const getReminders = async () => {
  const { eventMaxDays } = preference;
  const calendars = await Calendar.forReminders();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const later7Date = new Date(today.getTime() + eventMaxDays * 24 * 3600000);
  today.setHours(0, 0, 0, -1);
  const reminders = await Reminder.incompleteDueBetween(today, later7Date, calendars);
  return reminders
};

const getEvents = async () => {
  const { eventMaxDays } = preference;
  const calendars = await Calendar.forEvents();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const later7Date = new Date(today.getTime() + eventMaxDays * 24 * 3600000);
  const events = await CalendarEvent.between(today, later7Date, calendars);
  return events
};

/**
 * @param {WidgetStack} stack
 */
const addEvents = async (stack) => {
  const { eventMax, includesReminder } = preference;
  const promises = [getEvents()];
  if (includesReminder) {
    promises.push(getReminders());
  }
  const eventsList = await Promise.all(promises);
  const _events = eventsList.flat().sort(
    (a, b) => (a.startDate || a.dueDate) - (b.startDate || b.dueDate)
  );
  const list = stack.addStack();
  const holder = stack.addStack();
  holder.layoutHorizontally();
  holder.addSpacer();
  list.layoutVertically();
  for (const event of _events.slice(0, eventMax)) {
    list.addSpacer(4);
    addEvent(list, event);
  }
  return list
};

const createWidget = async () => {
  const { layout } = preference;
  const phone = phoneSize();
  const scale = Device.screenScale();
  const family = config.widgetFamily;
  const widgetWidth = phone[family === 'large' ? 'medium' : family] / scale;
  const widgetHeight = phone[family === 'medium' ? 'small' : family] / scale;
  const is7Rows = (firstDay.getDay() + lastDay.getDate()) > 35;
  let itemWidth = (widgetHeight - titleSize - 12 * 2 + rowGap) / (is7Rows ? 7 : 6) - rowGap;
  const w = (widgetWidth - 15 * 2 + columnGap) / 7 - columnGap;
  itemWidth = Math.min(itemWidth, w);

  const widget = new ListWidget();
  widget.url = 'calshow://';
  const lightColor = new Color('#fff');
  const darkColor = new Color('#242426');
  widget.backgroundColor = theme === 'light'
    ? lightColor
    : theme === 'dark'
      ? darkColor
      : Color.dynamic(lightColor, darkColor);
  widget.setPadding(12, 15, 12, 15);
  addTitle(widget);
  const row = widget.addStack();
  const actions = [
    () =>
      addCalendar(row, {
        itemWidth,
        gap: is7Rows ? [columnGap, rowGap - 1] : [columnGap, rowGap],
        addDay
      })
  ];
  if (family === 'medium') {
    if (layout === 'calendar_events') {
      actions.push(() => addEvents(row));
    } else {
      actions.unshift(() => addEvents(row));
    }
  }
  for (const [i, action] of actions.entries()) {
    if (layout === 'calendar_events' && i > 0) {
      row.addSpacer(10);
    }
    await action();
  }
  return widget
};

const {
  themeColor,
  textColor,
  textColorDark,
  weekendColor,
  weekendColorDark,
  symbolName
} = preference;
const eventSettings = {
  name: 'event',
  type: 'group',
  label: i18n(['Events', '事件']),
  items: [
    {
      name: 'eventFontSize',
      type: 'number',
      label: i18n(['Text size', '字体大小']),
      default: preference.eventFontSize
    },
    {
      name: 'eventMax',
      type: 'number',
      label: i18n(['Max count', '最大显示数量']),
      default: preference.eventMax
    },
    {
      name: 'eventMaxDays',
      type: 'number',
      label: i18n(['Max days', '最大事件天数']),
      default: preference.eventMaxDays
    },
    {
      name: 'includesReminder',
      type: 'switch',
      label: i18n(['Show reminders', '显示提醒事项']),
      default: preference.includesReminder
    },
    {
      name: 'layout',
      type: 'select',
      label: i18n(['Content placement', '排列方式']),
      options: [
        { label: i18n(['Calendar-Events', '日历-事件']), value: 'calendar_events' },
        { label: i18n(['Events-Calendar', '事件-日历']), value: 'events_calendar' }
      ],
      default: preference.layout
    }
  ]
};
const widget = await withSettings({
  formItems: [
    {
      name: 'themeColor',
      type: 'color',
      label: i18n(['Theme color', '主题色']),
      default: themeColor
    },
    {
      name: 'textColor',
      type: 'color',
      label: i18n(['Text color (light)', '文字颜色（白天）']),
      default: textColor
    },
    {
      name: 'textColorDark',
      type: 'color',
      label: i18n(['Text color (dark)', '文字颜色（夜晚）']),
      default: textColorDark
    },
    {
      name: 'weekendColor',
      type: 'color',
      label: i18n(['Weekend color (light)', '周末文字颜色（白天）']),
      default: weekendColor
    },
    {
      name: 'weekendColorDark',
      type: 'color',
      label: i18n(['Weekend color (dark)', '周末文字颜色（夜晚）']),
      default: weekendColorDark
    },
    {
      name: 'symbolName',
      label: i18n(['Calendar SFSymbol icon', '事件 SFSymbol 图标']),
      default: symbolName
    },
    eventSettings
  ],
  render: async ({ family, settings }) => {
    if (family) {
      config.widgetFamily = family;
    }
    Object.assign(preference, settings);
    const widget = await createWidget();
    return widget
  }
});
if (config.runsInWidget) {
  Script.setWidget(widget);
}
