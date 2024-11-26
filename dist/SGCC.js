// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: globe; icon-color: teal;
/**
 * 网上国网小组件
 * 如何添加多户：长按桌面小组件，编辑添加参数，输入从 0 开始的整数，0 代表第一户，1 代表第二户，以此类推
 * 重写: https://raw.githubusercontent.com/dompling/Script/master/wsgw/index.js
 *
 * @version 1.0.0
 * @author Honye
 */

/**
 * @version 1.2.2
 */


/**
 * @returns {Record<'small'|'medium'|'large'|'extraLarge', number>}
 */
const widgetSize = () => {
  const phones = {
    /** 16 Pro Max */
    956: { small: 170, medium: 364, large: 382 },
    /** 16 Pro */
    874: { small: 162, medium: 344, large: 366 },
    /** 16 Plus, 15 Pro Max, 15 Plus, 14 Pro Max */
    932: { small: 170, medium: 364, large: 382 },
    /** 13 Pro Max, 12 Pro Max */
    926: { small: 170, medium: 364, large: 382 },
    /** 11 Pro Max, 11, XS Max, XR */
    896: { small: 169, medium: 360, large: 379 },
    /** Plus phones */
    736: { small: 157, medium: 348, large: 357 },
    /** 16, 15 Pro, 15, 14 Pro */
    852: { small: 158, medium: 338, large: 354 },
    /** 13, 13 Pro, 12, 12 Pro */
    844: { small: 158, medium: 338, large: 354 },
    /** 13 mini, 12 mini / 11 Pro, XS, X */
    812: { small: 155, medium: 329, large: 345 },
    /** SE2 and 6/6S/7/8 */
    667: { small: 148, medium: 321, large: 324 },
    /** iPad Pro 2 */
    1194: { small: 155, medium: 342, large: 342, extraLarge: 715.5 },
    /** iPad 6 */
    1024: { small: 141, medium: 305.5, large: 305.5, extraLarge: 634.5 }
  };
  let { width, height } = Device.screenSize();
  if (width > height) height = width;

  if (phones[height]) return phones[height]

  if (config.runsInWidget) {
    const pc = { small: 164, medium: 344, large: 344 };
    return pc
  }

  // in app screen fixed 375x812 pt
  return { small: 155, medium: 329, large: 329 }
};

/**
 * @param {number} num
 */
const vw = (num) => {
  const family = config.widgetFamily || 'small';
  if (!family) throw new Error('`vw` only work in widget')
  const size = widgetSize();
  const width = size[family === 'large' ? 'medium' : family];
  return num * width / 100
};

/**
 * 获取网络图片
 * @param {string} url
 */
const getImage = async (url) => {
  const request = new Request(url);
  const image = await request.loadImage();
  return image
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
    const fullPath = safePath(filePath);
    if (fm.fileExists(fullPath)) {
      return fm.readImage(fullPath)
    }
    return null
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

const cache = useCache();

const getData = async () => {
  const url = 'http://api.wsgw-rewrite.com/electricity/bill/all';
  const filename = 'data.json';
  const request = new Request(url);
  let data;
  try {
    data = await request.loadJSON();
    cache.writeJSON(filename, data);
  } catch (e) {
    console.error(e);
    console.log('[INFO] An exception occurred during the request; using cached data...');
    data = cache.readJSON(filename);
  }
  return data
};

const getWidgetData = async () => {
  const [i] = (args.widgetParameter || '')
    .split(';')
    .map((item) => item.trim() || undefined);
  const index = Number(i || 0);
  const data = await getData();
  return data[index]
};

const getLogo = async () => {
  const filename = 'logo.png';
  const cached = cache.readImage(filename);
  if (cached) return cached
  const image = await getImage('http://192.168.0.107:3000/sgcc.png');
  cache.writeImage(filename, image);
  return image
};

/**
 * @param {ListWidget} widget
 */
const addBarChart = (widget, data) => {
  const { sevenEleList } = data.dayElecQuantity31;
  /** @type {number[]} */
  const seven = [];
  let i = 0;
  while (seven.length < 7) {
    const { dayElePq } = sevenEleList[i];
    if (dayElePq && !Number.isNaN(Number(dayElePq))) {
      seven.unshift(Number(dayElePq));
    }
    i++;
  }

  const container = widget.addStack();
  container.size = new Size(-1, vw(68 * 100 / 155));
  const vp = vw(10 * 100 / 155);
  container.setPadding(vp, 0, vp, 0);
  container.layoutHorizontally();
  container.bottomAlignContent();
  const gradient = new LinearGradient();
  gradient.locations = [0, 1];
  gradient.colors = [
    new Color('#00706B', 0),
    Color.dynamic(
      new Color('#00706B', 0.05),
      new Color('#04605B', 0.15)
    )
  ];
  gradient.startPoint = new Point(0, 0);
  gradient.endPoint = new Point(0, 1);
  container.backgroundGradient = gradient;
  container.cornerRadius = 6;

  container.addSpacer();
  const max = Math.max(...seven);
  const maxHeight = vw(48 * 100 / 155);
  const w = vw(8 * 100 / 155);
  for (let i = 0; i < 7; i++) {
    const day = container.addStack();
    day.size = new Size(w, seven[i] / max * maxHeight);
    day.cornerRadius = w / 2;
    day.backgroundColor = Color.red();
    const gradient = new LinearGradient();
    gradient.locations = [0, 1];
    gradient.colors = [
      new Color('#81CDC7'),
      new Color('#00706B')
    ];
    gradient.startPoint = new Point(0, 0);
    gradient.endPoint = new Point(0, 1);
    day.backgroundGradient = gradient;
    container.addSpacer();
  }
};

const createWidget = async (data) => {
  const widget = new ListWidget();
  widget.setPadding(12, 12, 12, 12);
  widget.backgroundColor = Color.dynamic(
    new Color('#ffffff'),
    new Color('#171A18')
  );
  const gradient = new LinearGradient();
  gradient.colors = [
    new Color('#00706B', 0),
    Color.dynamic(new Color('#00706B', 0.18), new Color('#00706B', 0))
  ];
  gradient.locations = [0.65, 1];
  gradient.startPoint = new Point(0, 0);
  gradient.endPoint = new Point(1, 1);
  widget.backgroundGradient = gradient;

  addBarChart(widget, data);

  widget.addSpacer();
  const bottom = widget.addStack();
  bottom.layoutVertically();
  const l = bottom.addText('剩余电费');
  l.font = Font.systemFont(vw(12 * 100 / 155));
  l.textColor = Color.dynamic(new Color('#18231C', 0.7), new Color('#ffffff', 0.7));
  const w = bottom.addStack();
  w.centerAlignContent();
  const p = w.addText(`${data.eleBill.sumMoney}`);
  p.font = Font.boldRoundedSystemFont(vw(24 * 100 / 155));
  p.textColor = Color.dynamic(new Color('#18231C'), new Color('#ffffff'));
  w.addSpacer();
  const logo = w.addImage(await getLogo());
  const lw = vw(24 * 100 / 155);
  logo.imageSize = new Size(lw, lw);
  return widget
};

const data = await getWidgetData();
const widget = await createWidget(data);
Script.setWidget(widget);
if (config.runsInApp) {
  widget.presentSmall();
}
