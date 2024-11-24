
/**
 * 话费、流量和语音余额小组件小号 UI
 *
 * 原创 UI，修改套用请注明来源
 *
 * GitHub: https://github.com/honye
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

const cacheImage = async (url, filename) => {
  const cached = cache.readImage(filename);
  if (cached) return cached
  const image = await getImage(url);
  cache.writeImage(filename, image);
  return image
};

const createBg = async () => {
  const filename = 'unicom_bg.png';
  const cached = cache.readImage(filename);
  if (cached) return cached
  const ctx = new DrawContext();
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  ctx.size = new Size(155, 155);
  ctx.drawImageInRect(
    await getImage('https://cdn.jsdelivr.net/gh/Honye/scriptable-scripts@master/static/unicom_bg.png'),
    new Rect(77, -22, 100, 100)
  );
  const image = ctx.getImage();
  cache.writeImage(filename, image);
  return image
};

/**
 * @param {Color} startColor
 * @param {Color} endColor
 * @param {number} factor 0.0 ~ 1.0
 */
const interpolateColor = (startColor, endColor, factor) => {
  const interpolate = (start, end) => {
    return start + (end - start) * factor
  };
  const r = interpolate(startColor.red, endColor.red);
  const g = interpolate(startColor.green, endColor.green);
  const b = interpolate(startColor.blue, endColor.blue);
  const a = interpolate(startColor.alpha, endColor.alpha);
  const hex = [r, g, b].map((n) => Math.round(n * 255).toString(16).padStart(2, '0')).join('');
  return new Color(hex, a)
};

/** @param {number} deg */
const deg2arc = (deg) => {
  return deg * Math.PI / 180
};

/**
 * @param {object} params
 * @param {Point} params.center
 * @param {number} params.radius
 * @param {number} params.deg
 */
const pointAtDeg = ({ center, radius, deg }) => {
  return new Point(
    center.x + radius * Math.cos(deg2arc(deg)),
    center.y + radius * Math.sin(deg2arc(deg))
  )
};

/**
 * @param {object} params
 * @param {Point} params.center
 * @param {number} params.radius
 * @param {number} params.startDeg
 * @param {number} params.drawDeg
 */
const arcPath = ({ center, radius, startDeg, drawDeg }) => {
  const startArc = deg2arc(startDeg);
  const path = new Path();
  path.move(pointAtDeg({ center, radius, deg: startDeg }));
  const l = Math.PI * radius * 2 * drawDeg / 360;
  for (let i = 0; i <= l; i++) {
    path.addLine(
      new Point(
        center.x + radius * Math.cos(startArc + i / radius),
        center.y + radius * Math.sin(startArc + i / radius)
      )
    );
  }
  return path
};

/**
 * @param {DrawContext} ctx
 * @param {object} options
 * @param {Color} options.startColor
 * @param {Color} options.endColor
 * @param {number} options.lineWidth
 */
const drawGradientArc = (ctx, {
  center,
  radius,
  startDeg,
  drawDeg,
  startColor,
  endColor,
  lineWidth
}) => {
  const startArc = deg2arc(startDeg);
  let lastPoint = pointAtDeg({ center, radius, deg: startDeg });
  const l = Math.PI * radius * 2 * drawDeg / 360;
  for (let i = 0; i <= l; i++) {
    const path = new Path();
    path.move(lastPoint);
    const nextPoint = new Point(
      center.x + radius * Math.cos(startArc + i / radius),
      center.y + radius * Math.sin(startArc + i / radius)
    );
    path.addLine(nextPoint);
    ctx.addPath(path);
    ctx.setLineWidth(lineWidth);
    ctx.setStrokeColor(interpolateColor(startColor, endColor, i / l));
    ctx.strokePath();
    lastPoint = nextPoint;
  }
};

/**
 * @param {DrawContext} ctx
 * @param {object} options
 * @param {Color} options.startColor
 * @param {Color} options.endColor
 */
const drawArc = (ctx, { startColor, endColor, percent }) => {
  const { width } = ctx.size;
  const lineWidth = 4;
  const radius = (width - lineWidth) / 2;
  const center = new Point(width / 2, width / 2);

  if (startColor === endColor) {
    ctx.addPath(arcPath({ center, radius, startDeg: 135, drawDeg: 270 * percent }));
    ctx.setStrokeColor(startColor);
    ctx.setLineWidth(lineWidth);
    ctx.strokePath();
  } else {
    drawGradientArc(ctx, {
      center,
      radius,
      startDeg: 135,
      drawDeg: 270 * percent,
      startColor,
      endColor,
      lineWidth
    });
  }

  //   ctx.addPath(
  //     arcPath({
  //       center: pointAtDeg({ center, radius, deg: 135 }),
  //       radius: lineWidth / 2,
  //       startDeg: -45,
  //       drawDeg: 180
  //     })
  //   )
  //   ctx.setFillColor(color)
  //   ctx.fillPath()

//   ctx.addPath(
//     arcPath({
//       center: pointAtDeg({ center, radius, deg: 45 }),
//       radius: lineWidth / 2,
//       startDeg: 45,
//       drawDeg: 180
//     })
//   )
//   ctx.setFillColor(color)
//   ctx.fillPath()
};

/**
 * @param {object} params
 * @param {Color} params.color
 */
const getArc = ({ color, percent }) => {
  const ctx = new DrawContext();
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  const width = 62;
  ctx.size = new Size(width, width);
  const aColor = new Color(color.hex, 0.1);
  drawArc(ctx, {
    startColor: aColor,
    endColor: aColor,
    percent: 1
  });
  drawArc(ctx, {
    startColor: color,
    endColor: new Color(color.hex, 0.4),
    percent
  });

  return ctx.getImage()
};

/**
 * @param {WidgetStack} container
 * @param {(s: WidgetStack) => void} fn
 */
const centerH = (container, fn) => {
  const stack = container.addStack();
  stack.size = new Size(vw(50 * 100 / 155), -1);
  stack.centerAlignContent();
  fn(stack);
};

/**
 * @param {WidgetStack} stack
 * @param {object} options
 * @param {Color} options.color
 */
const addItem = async (stack, { title, balance, total, icon, color }) => {
  const container = stack.addStack();
  container.centerAlignContent();
  const cs = vw(62 * 100 / 155);
  container.size = new Size(cs, cs);
  container.setPadding(0, 0, 0, 0);
  // container.borderWidth = vw(8 * 100 / 155)
  container.backgroundImage = getArc({
    color,
    percent: balance / total
  });

  const contentStack = container.addStack();
  const cts = vw(50 * 100 / 155);
  contentStack.size = new Size(cts, cts);
  contentStack.cornerRadius = cts / 2;
  contentStack.layoutVertically();
  contentStack.setPadding(vw(8 * 100 / 155), 0, 0, 0);
  const gradient = new LinearGradient();
  gradient.colors = [new Color(color.hex, 0.2), new Color(color.hex, 0)];
  gradient.locations = [0, 1];
  gradient.startPoint = new Point(0, 0);
  gradient.endPoint = new Point(0, 1);
  contentStack.backgroundGradient = gradient;

  centerH(contentStack, (s) => {
    const label = s.addText(title);
    label.font = Font.systemFont(vw(8 * 100 / 155));
    label.textColor = Color.dynamic(new Color('#221f1f', 0.7), new Color('#ffffff', 0.7));
  });

  centerH(contentStack, (s) => {
    const value = s.addText(`${balance}`);
    value.lineLimit = 1;
    value.minimumScaleFactor = 0.5;
    value.font = Font.boldRoundedSystemFont(vw(14 * 100 / 155));
  });

  centerH(contentStack, (s) => {
    const stack = s.addStack();
    const size = vw(16 * 100 / 155);
    stack.size = new Size(size, size);
    stack.cornerRadius = size / 2;
    stack.backgroundColor = color;
    stack.centerAlignContent();
    const ic = stack.addImage(SFSymbol.named(icon).image);
    const is = vw(12 * 100 / 155);
    ic.imageSize = new Size(is, is);
    ic.tintColor = Color.white();
  });
};

/**
 * @param {object} data
 * @param {number} data.hf
 * @param {number} data.ll
 * @param {number} data.totalLl
 * @param {number} data.yy
 * @param {number} data.totalYy
 */
const createWidget = async ({ hf, ll, totalLl, yy, totalYy }) => {
  const widget = new ListWidget();
  widget.backgroundImage = await createBg();
  widget.setPadding(0, 0, 0, 0);

  const container = widget.addStack();
  container.layoutVertically();
  const p = vw(14 * 100 / 155);
  container.setPadding(p, p, p, p);

  const top = container.addStack();
  top.layoutHorizontally();
  const hfStack = top.addStack();
  hfStack.layoutVertically();
  const hflabel = hfStack.addText('剩余话费');
  hflabel.font = Font.systemFont(vw(12 * 100 / 155));
  hflabel.textColor = Color.dynamic(new Color('#221f1f', 0.7), new Color('#ffffff', 0.7));
  const hfBalance = hfStack.addText(`${hf}`);
  hfBalance.minimumScaleFactor = 0.5;
  hfBalance.font = Font.boldRoundedSystemFont(vw(24 * 100 / 155));
  hfBalance.textColor = Color.dynamic(new Color('#221f1f'), new Color('#ffffff'));
  top.addSpacer();
  // logo
  const logo = top.addImage(
    await cacheImage('https://cdn.jsdelivr.net/gh/Honye/scriptable-scripts@master/static/unicom.png', 'chinaunicom.png')
  );
  logo.imageSize = new Size(vw(24 * 100 / 155), vw(24 * 100 / 155));
  container.addSpacer(vw(18 * 100 / 155));
  const bottom = container.addStack();
  await addItem(bottom, {
    title: '剩余流量',
    balance: ll,
    total: totalLl,
    icon: 'antenna.radiowaves.left.and.right',
    color: new Color('#3bc9ec')
  });
  bottom.addSpacer();
  await addItem(bottom, {
    title: '剩余语音',
    balance: yy,
    total: totalYy,
    icon: 'phone',
    color: new Color('#a2cf39')
  });
  return widget
};

module.exports = { createWidget };
