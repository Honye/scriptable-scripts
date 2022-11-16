// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: calendar-alt; icon-color: orange;
/**
 * @version 1.0.0
 * @author Honye
 */

/**
 * @param {number} [height] The screen height measured in pixels
 */
const phoneSize = (height) => {
  const phones = {
    /** 12 Pro Max */
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
    /** 12 and 12 Pro */
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
    /** 11 Pro, XS, X, 12 mini */
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

/** 是否同一天 */
const isSameDay = (a, b) => {
  const leftDate = new Date(a);
  leftDate.setHours(0);
  const rightDate = new Date(b);
  rightDate.setHours(0);
  return Math.abs(leftDate - rightDate) < 3600000
};

const isToday = (date) => isSameDay(new Date(), date);

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
const [calendarTitle, symbolName, theme] = (args.widgetParameter || '').split(',').map((text) => text.trim());
if (calendarTitle) {
  calendar = await Calendar.forEventsByTitle(calendarTitle);
  const events = await CalendarEvent.between(firstDay, lastDay, [calendar]);
  dates = events.map((item) => item.startDate);
}

const titleSize = 12;
const columnGap = 2;
const rowGap = 2;

const addCalendar = async (container, options = {}) => {
  const {
    itemWidth = 18,
    fontSize = 10,
    gap = [columnGap, rowGap],
    addWeek,
    addDay
  } = options;
  const stack = container.addStack();
  const { add } = await useGrid(stack, {
    column: 7,
    gap
  });
  const _addItem = (stack, { text, color } = {}) => {
    const item = stack.addStack();
    item.size = new Size(itemWidth, itemWidth);
    item.cornerRadius = itemWidth / 2;
    item.centerAlignContent();
    if (text) {
      const textInner = item.addText(text);
      textInner.font = Font.semiboldSystemFont(fontSize);
      textInner.lineLimit = 1;
      textInner.minimumScaleFactor = 0.2;
      textInner.textColor = theme === 'light'
        ? Color.black()
        : theme === 'dark'
          ? Color.white()
          : Color.dynamic(Color.black(), Color.white());
      if (color) {
        textInner.textColor = color;
      }
      item.$text = textInner;
    }

    return item
  };
  const _addWeek = (stack, { day }) => {
    const sunday = new Date('1970/01/04');
    const weekFormat = new Intl.DateTimeFormat([], { weekday: 'narrow' }).format;

    return _addItem(stack, {
      text: weekFormat(new Date(sunday.getTime() + day * 86400000)),
      color: (day === 0 || day === 6) && Color.gray()
    })
  };
  const _addDay = (stack, { date }) => {
    const item = _addItem(stack, {
      text: `${date.getDate()}`,
      color: (() => {
        const week = date.getDay();
        if (isToday(date)) {
          return Color.white()
        }
        return (week === 0 || week === 6) && Color.gray()
      })()
    });
    if (isToday(date)) {
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
        ? await addDay(stack, { date, addItem: _addItem })
        : _addDay(stack, { date })
    );
  }

  return stack
};

const addTitle = (widget) => {
  const head = widget.addStack();
  head.setPadding(0, 4, 0, 4);
  const title = head.addText(new Date().toLocaleString('default', { month: 'short' }).toUpperCase());
  title.font = Font.semiboldSystemFont(11);
  title.textColor = Color.red();
  head.addSpacer();
  const lunarDate = sloarToLunar(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
  );
  const lunar = head.addText(`${lunarDate.lunarMonth}月${lunarDate.lunarDay}`);
  lunar.font = Font.semiboldSystemFont(11);
  lunar.textColor = Color.red();
};

const addDay = async (
  stack,
  { date, addItem } = {}
) => {
  const text = `${date.getDate()}`;
  const i = dates.findIndex((item) => isSameDay(item, date));
  if (isToday(date)) {
    const item = addItem(stack, { text, color: Color.white() });
    item.backgroundColor = Color.red();
  } else if (i > -1) {
    dates.splice(i, 1);
    const sfs = SFSymbol.named(symbolName || 'flag.fill');
    sfs.applyFont(Font.systemFont(18));
    const image = sfs.image;
    const item = addItem(stack, { text, color: Color.white() });
    item.backgroundImage = await tintedImage(image, calendar.color);
    item.$text.shadowColor = calendar.color;
    item.$text.shadowOffset = new Point(0.5, 0.5);
    item.$text.shadowRadius = 0.5;
  } else {
    addItem(stack, { text });
  }
};

const render = async () => {
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
  const lightColor = new Color('#fff');
  const darkColor = new Color('#242426');
  widget.backgroundColor = theme === 'light'
    ? lightColor
    : theme === 'dark'
      ? darkColor
      : Color.dynamic(lightColor, darkColor);
  widget.setPadding(12, 15, 12, 15);
  addTitle(widget);
  await addCalendar(widget, {
    itemWidth,
    gap: is7Rows ? [columnGap, rowGap - 1] : [columnGap, rowGap],
    addDay
  });
  return widget
};

if (config.runsInWidget) {
  const widget = await render();
  Script.setWidget(widget);
} else {
  config.widgetFamily = 'small';
  const widget = await render();
  widget.presentSmall();
}
