// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: link; icon-color: cyan;
/**
 * @version 1.0.0
 * @author Honye
 */

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
// icon-color: deep-green; icon-glyph: chess-board;

/* -----------------------------------------------

Script      : no-background.js
Author      : me@supermamon.com
Version     : 1.7.0
Description :
  A module to create illusions of transparent
  backgrounds for Scriptable widgets

Adapted from Max Zeryck's (@mzeryck) amazing 
invisible widget shared on the Automtors discourse
https://talk.automators.fm/t/widget-examples/7994/135

Changelog   :
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


const ALERTS_AS_SHEETS = false;

const USES_ICLOUD = usesiCloud();
const fm = FileManagerAdaptive();
const CACHE_FOLDER = 'cache/nobg';
const cachePath = fm.joinPath(fm.documentsDirectory(), CACHE_FOLDER);


const _exports_ = {};

//------------------------------------------------
_exports_.cachePath = cachePath;
//------------------------------------------------
_exports_.generateSlices = async function ({ caller = 'none' }) {
  const opts = { caller };

  let appearance = (await isUsingDarkAppearance()) ? 'dark' : 'light';
  let altAppearance = appearance == 'dark' ? 'light' : 'dark';

  if (!fm.fileExists(cachePath)) {
    fm.createDirectory(cachePath, true);
  }

  let message;

  message = "To change background make sure you have a screenshot of you home screen. Go to your home screen and enter wiggle mode. Scroll to the empty page on the far right and take a screenshot.";
  let options = ["Pick Screenshot", "Exit to Take Screenshot"];
  let resp = await presentAlert(message, options, ALERTS_AS_SHEETS);
  if (resp == 1) return false

  // Get screenshot and determine phone size.
  let wallpaper = await Photos.fromLibrary();
  let height = wallpaper.size.height;
  let suffix = "";

  // Check for iPhone 12 Mini here:
  if (height == 2436) {
    // We'll save everything in the config, to keep things centralized
    let cfg = await loadConfig();
    if (cfg["phone-model"] === undefined) {
      // Doesn't exist, ask them which phone they want to generate for, 
      // the mini or the others?
      message = "What model of iPhone do you have?";
      let options = ["iPhone 12 mini", "iPhone 11 Pro, XS, or X"];
      resp = await presentAlert(message, options, ALERTS_AS_SHEETS);
      // 0 represents iPhone Mini and 1 others.
      cfg["phone-model"] = resp;
      await saveConfig(cfg); // Save the config
      if (resp === 0) {
        suffix = "_mini";
      }     
    } else {
      // Config already contains iPhone model, use it from cfg
      if (cfg["phone-model"]) {
        suffix = "_mini";
      }
    }
  }

  let phone = phoneSizes[height + suffix];
  if (!phone) {
    message = "It looks like you selected an image that isn't an iPhone screenshot, or your iPhone is not supported. Try again with a different image.";
    await presentAlert(message, ["OK"], ALERTS_AS_SHEETS);
    return false
  }

  const families = ['small', 'medium', 'large'];

  // generate crop rects for all sizes
  for (var i = 0; i < families.length; i++) {
    const widgetSize = families[i];

    let crops = widgetPositions[widgetSize].map(posName => {

      let position = posName.toLowerCase().replace(' ', '-');

      let crop = { pos: position, w: "", h: "", x: "", y: "" };
      crop.w = phone[widgetSize].w;
      crop.h = phone[widgetSize].h;
      crop.x = phone.left;

      let pos = position.split('-');

      crop.y = phone[pos[0]];

      if (widgetSize == 'large' && pos[0] == 'bottom') {
        crop.y = phone['middle'];
      }

      if (pos.length > 1) {
        crop.x = phone[pos[1]];
      }

      return crop
    });

    for (var c = 0; c < crops.length; c++) {
      const crop = crops[c];
      const imgCrop = cropImage(wallpaper, new Rect(crop.x, crop.y, crop.w, crop.h));

      const imgName = `${appearance}-${widgetSize}-${crop.pos}.jpg`;
      const imgPath = fm.joinPath(cachePath, imgName);

      if (fm.fileExists(imgPath)) {
        // sometimes it wouldn't overwrite. 
        // so better delete the file first
        if (USES_ICLOUD) await fm.downloadFileFromiCloud(imgPath);
        try { fm.remove(imgPath); } catch (e) { }
      }
      fm.writeImage(imgPath, imgCrop);

    }

  }

  if (opts.caller != 'self') {
    message = `Slices saved for ${appearance} mode. You can switch to ${altAppearance} mode and run this again to also generate slices.`;
  } else {
    message = 'Slices saved.';
  }
  await presentAlert(message, ["Ok"], ALERTS_AS_SHEETS);


  return true

};
//------------------------------------------------
_exports_.applyTint = function (widget, tint, alpha) {
  tint = tint || '#ffffff';
  alpha = alpha || 0.2;

  const col = new Color(tint, alpha);
  let gradient = new LinearGradient();
  gradient.locations = [0, 1];
  gradient.colors = [col, col];

  widget.backgroundGradient = gradient;
};
//------------------------------------------------
_exports_.getSlice = async function (name) {
  let appearance = (await isUsingDarkAppearance())
    ? 'dark'
    : 'light';

  let position = name;
  //log(position)
  const imgPath = fm.joinPath(cachePath, `${appearance}-${position}.jpg`);
  if (!fm.fileExists(imgPath)) {
    log('image does not exists. setup required.');
    var setupCompleted = await _exports_.generateSlices({ caller: 'getSliceForWidget' });
    if (!setupCompleted) {
      return null
    }
  }

  if (USES_ICLOUD) await fm.downloadFileFromiCloud(imgPath);

  let image = fm.readImage(imgPath);
  return image
};
//------------------------------------------------
_exports_.getPathForSlice = async function (slice_name) {
  let appearance = (await isUsingDarkAppearance())
    ? 'dark'
    : 'light';
  let imgPath = fm.joinPath(cachePath,
    `${appearance}-${slice_name}.jpg`);

  let fileExists = fm.fileExists(imgPath);
  if (!fileExists) {
    fileExists = await _exports_.generateSlices('self');
  } else {
    imgPath = null;
  }

  if (USES_ICLOUD && fileExists) await fm.downloadFileFromiCloud(imgPath);
  return imgPath
};
//------------------------------------------------
_exports_.getSliceForWidget = async function (
  instance_name,
  reset = false) {

  let appearance = (await isUsingDarkAppearance())
    ? 'dark'
    : 'light';
  var cfg = await loadConfig();
  var position = reset ? null : cfg[instance_name];
  if (!position) {
    log(`Background for "${instance_name}" is not yet set.`);

    // check if slices exists
    const testImage = fm.joinPath(cachePath, `${appearance}-medium-top.jpg`);
    let readyToChoose = false;
    if (!fm.fileExists(testImage)) {
      // need to generate slices
      readyToChoose = await _exports_.generateSlices({ caller: 'self' });
    } else {
      readyToChoose = true;
    }

    // now set the 
    if (readyToChoose) {
      var backgrounChosen = await _exports_.chooseBackgroundSlice(instance_name);
    }

    if (backgrounChosen) {
      cfg = await loadConfig();
      position = cfg[instance_name];
    } else {
      return null
    }

  }
  const imgPath = fm.joinPath(cachePath, `${appearance}-${position}.jpg`);
  if (!fm.fileExists(imgPath)) {
    log(`Slice does not exists - ${appearance}-${position}.jpg`);
    return null
  }

  if (USES_ICLOUD) await fm.downloadFileFromiCloud(imgPath);

  let image = fm.readImage(imgPath);
  return image
};
//------------------------------------------------
_exports_.for = _exports_.getSliceForWidget;
_exports_.transparent = _exports_.getSliceForWidget;
//------------------------------------------------
_exports_.chooseBackgroundSlice = async function (name) {

  // Prompt for widget size and position.
  let message = "What is the size of the widget?";
  let sizes = ["Small", "Medium", "Large", "Cancel"];
  let size = await presentAlert(message, sizes, ALERTS_AS_SHEETS);
  if (size == 3) return false
  let widgetSize = sizes[size].toLowerCase();

  message = "Where will it be placed on?";
  let positions = widgetPositions[widgetSize];
  positions.push('Cancel');
  let resp = await presentAlert(message, positions, ALERTS_AS_SHEETS);

  if (resp == positions.length - 1) return false
  let position = positions[resp].toLowerCase().replace(' ', '-');

  let cfg = await loadConfig();
  cfg[name] = `${widgetSize}-${position}`;

  await saveConfig(cfg);
  await presentAlert("Background saved.", ["Ok"], ALERTS_AS_SHEETS);
  return true

};
//------------------------------------------------
_exports_.resetConfig = async function () {
  await saveConfig({});
  log('config file cleared');
};

//-- [helpers] -----------------------------------
//------------------------------------------------
async function loadConfig() {
  const configPath = fm.joinPath(cachePath, "widget-positions.json");
  //log(` config exists == ${fm.fileExists(configPath)}`)
  if (!fm.fileExists(configPath)) {
    await fm.writeString(configPath, "{}");
    return {}
  } else {
    if (USES_ICLOUD) await fm.downloadFileFromiCloud(configPath);
    const strConf = fm.readString(configPath);
    const cfg = JSON.parse(strConf);
    return cfg
  }
}
//------------------------------------------------
async function saveConfig(cfg) {
  const configPath = fm.joinPath(
    cachePath,
    "widget-positions.json");
  if (USES_ICLOUD) {
    await fm.downloadFileFromiCloud(configPath);
  }
  await fm.writeString(configPath,
    JSON.stringify(cfg));
  return cfg
}
//------------------------------------------------
async function presentAlert(prompt = ""
  , items = ["OK"]
  , asSheet = false) {
  let alert = new Alert();
  alert.message = prompt;

  for (var n = 0; n < items.length; n++) {
    alert.addAction(items[n]);
  }
  let resp = asSheet
    ? await alert.presentSheet()
    : await alert.presentAlert();
  return resp
}
//------------------------------------------------
const widgetPositions = {
  "small": [
    "Top Left", "Top Right",
    "Middle Left", "Middle Right",
    "Bottom Left", "Bottom Right"
  ],
  "medium": ["Top", "Middle", "Bottom"],
  "large": ["Top", "Bottom"]
};
//------------------------------------------------
const phoneSizes = {
  "2778": {
    "models": ["12 Pro Max"],
    "small": { "w": 510, "h": 510 },
    "medium": { "w": 1092, "h": 510 },
    "large": { "w": 1092, "h": 1146 },
    "left": 96,
    "right": 678,
    "top": 246,
    "middle": 882,
    "bottom": 1518
  },

  "2532": {
    "models": ["12", "12 Pro"],
    "small": { "w": 474, "h": 474 },
    "medium": { "w": 1014, "h": 474 },
    "large": { "w": 1014, "h": 1062 },
    "left": 78,
    "right": 618,
    "top": 231,
    "middle": 819,
    "bottom": 1407
  },

  "2688": {
    "models": ["Xs Max", "11 Pro Max"],
    "small": { "w": 507, "h": 507 },
    "medium": { "w": 1080, "h": 507 },
    "large": { "w": 1080, "h": 1137 },
    "left": 81,
    "right": 654,
    "top": 228,
    "middle": 858,
    "bottom": 1488
  },

  "1792": {
    "models": ["11", "Xr"],
    "small": { "w": 338, "h": 338 },
    "medium": { "w": 720, "h": 338 },
    "large": { "w": 720, "h": 758 },
    "left": 54,
    "right": 436,
    "top": 160,
    "middle": 580,
    "bottom": 1000
  },

  "2436": {
    "models": ["X", "Xs", "11 Pro"],
    "small": { "w": 465, "h": 465 },
    "medium": { "w": 987, "h": 465 },
    "large": { "w": 987, "h": 1035 },
    "left": 69,
    "right": 591,
    "top": 213,
    "middle": 783,
    "bottom": 1353
  },

  "2436_mini": {
    "models": ["12 Mini"],
    "small": { "w": 465, "h": 465 },
    "medium": { "w": 987, "h": 465 },
    "large": { "w": 987, "h": 1035 },
    "left": 69,
    "right": 591,
    "top": 231,
    "middle": 801,
    "bottom": 1371
  },

  "2208": {
    "models": ["6+", "6s+", "7+", "8+"],
    "small": { "w": 471, "h": 471 },
    "medium": { "w": 1044, "h": 471 },
    "large": { "w": 1044, "h": 1071 },
    "left": 99,
    "right": 672,
    "top": 114,
    "middle": 696,
    "bottom": 1278
  },

  "1334": {
    "models": ["6", "6s", "7", "8"],
    "small": { "w": 296, "h": 296 },
    "medium": { "w": 642, "h": 296 },
    "large": { "w": 642, "h": 648 },
    "left": 54,
    "right": 400,
    "top": 60,
    "middle": 412,
    "bottom": 764
  },

  "1136": {
    "models": ["5", "5s", "5c", "SE"],
    "small": { "w": 282, "h": 282 },
    "medium": { "w": 584, "h": 282 },
    "large": { "w": 584, "h": 622 },
    "left": 30,
    "right": 332,
    "top": 59,
    "middle": 399,
    "bottom": 399
  }
};
//------------------------------------------------
function cropImage(img, rect) {
  let draw = new DrawContext();
  draw.size = new Size(rect.width, rect.height);
  draw.drawImageAtPoint(img, new Point(-rect.x, -rect.y));
  return draw.getImage()
}
//------------------------------------------------
async function isUsingDarkAppearance() {
  return !(Color.dynamic(Color.white(), Color.black()).red)
}
//------------------------------------------------
function usesiCloud() {
  return module.filename
    .includes('Documents/iCloud~')
}
//------------------------------------------------
function FileManagerAdaptive() {
  return module.filename
    .includes('Documents/iCloud~')
    ? FileManager.iCloud()
    : FileManager.local()
}

// -- END OF MODULE CODE --

// if running self run config
const module_name = module.filename.match(/[^\/]+$/)[0].replace('.js', '');
if (module_name == Script.name()) {
  await(async () => {
    let opts = [
      'Generate Slices',
      'Clear Widget Positions Cache',
      'Cancel'
    ];

    let resp = await presentAlert(
      'No Background Configurator', opts, ALERTS_AS_SHEETS);
    switch (opts[resp]) {
      case 'Generate Slices':
        await _exports_.generateSlices({});
        break;
      case 'Clear Widget Positions Cache':
        await _exports_.resetConfig();
        await presentAlert('Cleared');
        break;
    }
  })();

}

/* 应用快捷方式
    - 日历
    - 支付宝扫码、收/付款、健康码
    - 微信扫码 */

/**
 * @param {number} cols
 */
const Grid = (widget, cols) => {
  const gap = 8;
  const rows = [];
  let cursor = 0;
  const grid = widget;
  grid.layoutVertically();

  const addStack = () => {
    if (cursor % cols === 0) {
      if (cursor >= cols) {
        grid.addSpacer(gap);
      }
      rows.push(grid.addStack());
    }
    const row = rows[rows.length - 1];
    if (cursor % cols !== 0) {
      row.addSpacer(gap);
    }
    const stack = row.addStack();
    cursor++;
    return stack
  };

  return { addStack }
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
 * @param {{ symbolName: string; title: string; url: string }} options
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
  addSymbol(imageWrapper, options.symbolName);
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

const createWidget = async () => {
  const widget = new ListWidget();
  widget.setPadding(8, 0, 8, 8);
  widget.backgroundColor = Color.dynamic(new Color('#ffffff', 1), new Color('#242426', 1));
  widget.backgroundImage = await _exports_.transparent(Script.name());

  const container = widget.addStack();
  container.centerAlignContent();
  container.addSpacer();
  const stackDate = container.addStack();
  stackDate.url = 'calshow://';
  stackDate.layoutVertically();
  const dateFormatter = new DateFormatter();
  dateFormatter.dateFormat = 'MMM yyyy, E';
  const textDay = centerH(stackDate, (stack) => {
    return stack.addText(
      String(new Date().getDate())
    )
  });
  textDay.font = Font.systemFont(42);
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
  const lunarDate = sloarToLunar(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate()
  );
  stackDate.addSpacer(6);
  const textLunar = centerH(stackDate, (stack) => {
    return stack.addText(
      lunarDate.lunarYear + lunarDate.lunarMonth + lunarDate.lunarDay
    )
  });
  textLunar.font = Font.systemFont(13);
  textLunar.textColor = Color.white();
  container.addSpacer();
  container.addSpacer(8);
  // shortcuts
  const grid = container.addStack();
  const { addStack } = Grid(grid, 2);
  addSquare(addStack(), {
    symbolName: 'qrcode.viewfinder',
    title: '支付宝',
    url: 'alipays://platformapi/startapp?saId=10000007'
  });
  addSquare(addStack(), {
    symbolName: 'barcode.viewfinder',
    title: '收/付款',
    url: 'alipay://platformapi/startapp?appId=20000056'
  });
  addSquare(addStack(), {
    symbolName: 'plus.viewfinder',
    title: '微信',
    url: 'weixin://scanqrcode'
  });
  addSquare(addStack(), {
    symbolName: 'location.viewfinder',
    title: '健康码',
    url: 'alipays://platformapi/startapp?appId=20000067&url=https%3A%2F%2F68687564.h5app.alipay.com%2Fwww%2Findex.html'
  });

  return widget
};

const widget = await createWidget();
Script.setWidget(widget);
widget.presentMedium();
