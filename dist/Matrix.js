// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: th; icon-color: blue;
/**
 * @version 0.1.1
 * @author Honye
 */

const iCloudManager = FileManager.iCloud();
const fm = iCloudManager.isFileStoredIniCloud(module.filename) ? iCloudManager : FileManager.local();
const modulesRoot = fm.libraryDirectory();
/**
 * Module 统一存放在 library 目录
 * @param {string} path
 */
const requireModule = (path) => importModule(fm.joinPath(modulesRoot, path));

const { hashCode, i18n, phoneSize, getImage, useCache } = requireModule('utils.module');
const { useGrid } = requireModule('widgets.module');
const { withSettings } = requireModule('withSettings.module');

const STYLES = Object.freeze({
  // 正方形
  SQUARE: '1',
  // 填满组件
  FILL: '2'
});

const preference = {
  column: 2,
  row: 2,
  gap: 6,
  cornerRadius: 12,
  paddingX: 10,
  paddingY: 10,
  style: STYLES.FILL,
  debug: false
};
/**
 * 图片摆放位置（必填）
 *
 * 可通过打开调试查看位置信息，填入位置对应的数字
 */
const indexs = [
  0, 1, 2, 3
];
/**
 * @typedef {object} Shortcut
 * @property {string} icon 图片
 * @property {string} [symbol]
 *  符号（小图标）。可通过我写的 SF Symbols 应用获取
 *
 *  为空时不显示符号和文字，只显示图片
 * @property {string} [title]
 * @property {string} [url] 跳转地址
 */
/**
 * 图片或快捷方式
 *
 * 根据上述 `indexs` 填写的数字逐个排列
 * @type {Shortcut}
 */
const shortcuts = [
  {
    icon: 'https://wallhaven.cc/cdn-cgi/mirage/90b40432b273e1ab7fa9c48e717ba5b74f0b24860773afbd15a808573e0d351c/1280/https://w.wallhaven.cc/full/x6/wallhaven-x68r2l.jpg',
    symbol: 'plus.viewfinder',
    title: 'Wechat Scan',
    url: 'weixin://scanqrcode'
  },
  {
    icon: 'https://wallhaven.cc/cdn-cgi/mirage/90b40432b273e1ab7fa9c48e717ba5b74f0b24860773afbd15a808573e0d351c/1280/https://w.wallhaven.cc/full/vq/wallhaven-vq9j55.jpg',
    symbol: 'qrcode.viewfinder',
    title: 'Alipay Scan',
    url: 'alipays://platformapi/startapp?saId=10000007'
  },
  {
    icon: 'https://wallhaven.cc/cdn-cgi/mirage/90b40432b273e1ab7fa9c48e717ba5b74f0b24860773afbd15a808573e0d351c/1280/https://w.wallhaven.cc/full/zy/wallhaven-zy8w2y.jpg',
    symbol: 'barcode.viewfinder',
    title: 'Alipay Pay',
    url: 'alipay://platformapi/startapp?appId=20000056'
  },
  {
    icon: 'https://wallhaven.cc/cdn-cgi/mirage/90b40432b273e1ab7fa9c48e717ba5b74f0b24860773afbd15a808573e0d351c/1280/https://w.wallhaven.cc/full/2y/wallhaven-2yy69x.jpg',
    symbol: 'location.viewfinder',
    title: 'Health Code',
    url: 'alipays://platformapi/startapp?appId=20000067&url=https%3A%2F%2F68687564.h5app.alipay.com%2Fwww%2Findex.html'
  }
];

const cache = useCache();
const getLogo = async (url) => {
  const hash = hashCode(url);
  try {
    const image = cache.readImage(`${hash}`);
    if (!image) throw new Error('not exist')
    return image
  } catch (e) {
    const image = await getImage(url);
    cache.writeImage(`${hash}`, image);
    return image
  }
};

const createNumBg = (n, size = new Size(120, 120)) => {
  const drawer = new DrawContext();
  drawer.size = size;
  drawer.opaque = false;
  drawer.respectScreenScale = true;
  const fontSize = Math.min(size.width, size.height) * 0.42;
  drawer.setFont(Font.boldRoundedSystemFont(fontSize));
  drawer.setTextColor(Color.dynamic(
    new Color('#ffffff', 0.6),
    new Color('#000000', 0.6)
  ));
  drawer.setTextAlignedCenter();
  drawer.drawTextInRect(`${n}`, new Rect(0,
    (size.height - fontSize) / 2, size.width, fontSize));
  return drawer.getImage()
};

const createWidget = async () => {
  const {
    column, row,
    gap, paddingY, paddingX,
    style,
    debug
  } = preference;
  const widget = new ListWidget();
  widget.setPadding(paddingY, paddingX, paddingY, paddingX);
  const stack = widget.addStack();
  const widgetRect = phoneSize();
  const family = config.widgetFamily;
  const scale = Device.screenScale();
  const widgetWidth = widgetRect[family === 'large' ? 'medium' : family] / scale;
  const widgetHeight = widgetRect[family === 'medium' ? 'small' : family] / scale;
  const itemHeight = (widgetHeight - paddingY * 2 + gap) / row - gap;
  const itemWidth = (widgetWidth - paddingX * 2 + gap) / column - gap;
  const minWidth = Math.min(itemWidth, itemHeight);
  const { add } = await useGrid(stack, { column, gap });
  const itemSize = new Size(
    style === STYLES.SQUARE ? minWidth : itemWidth,
    style === STYLES.SQUARE ? minWidth : itemHeight
  );
  console.log('[info] 可通过此长宽比裁剪图片');
  console.log(`[info] item size: ${itemSize.width}x${itemSize.height}`);

  const stackList = [];
  for (let i = 0; i < column * row; i++) {
    await add((stack) => {
      const widget = addItem(stack, {
        width: itemSize.width,
        height: itemSize.height
      });
      if (debug) {
        widget.backgroundColor = Color.dynamic(
          new Color('#000000', 0.1),
          new Color('#ffffff', 0.1)
        );
        widget.backgroundImage = createNumBg(i, itemSize);
      }
      stackList.push(widget);
    });
  }

  const _shortcuts = shortcuts.slice();
  for (const i of indexs) {
    const stack = stackList[i];
    if (_shortcuts.length) {
      const { icon, symbol, title, url } = _shortcuts.shift();
      if (symbol) {
        stack.backgroundImage = await getLogo(icon);
        const gradient = new LinearGradient();
        gradient.colors = [new Color('#000000', 0.18)];
        gradient.locations = [0];
        gradient.startPoint = new Point(0, 0);
        gradient.endPoint = new Point(1, 1);
        stack.backgroundGradient = gradient;
        stack.setPadding(6, 6, 6, 6);
        stack.layoutVertically();
        const sfs = SFSymbol.named(symbol);
        sfs.applyFont(Font.mediumRoundedSystemFont(50));
        const iconImg = stack.addImage(sfs.image);
        const iconHeight = Math.min(itemSize.width, itemSize.height) * 0.5;
        iconImg.imageSize = new Size(iconHeight, iconHeight);
        iconImg.tintColor = Color.white();
        stack.addSpacer(4);
        const titleText = stack.addText(title);
        titleText.textColor = Color.white();
        stack.addStack().addSpacer();
      } else {
        const logo = stack.addImage(await getLogo(icon));
        logo.imageSize = itemSize;
        logo.applyFillingContentMode();
      }
      stack.url = url;
    }
  }

  return widget
};

const addItem = (container, {
  width, height,
  bgColor
}) => {
  const { cornerRadius } = preference;
  const stack = container.addStack();
  stack.size = new Size(width, height);
  stack.backgroundColor = bgColor;
  stack.cornerRadius = cornerRadius;
  return stack
};

const widget = await withSettings({
  formItems: [
    {
      label: i18n(['Column count', '列数']),
      name: 'column',
      type: 'number',
      default: preference.column
    },
    {
      label: i18n(['Row count', '行数']),
      name: 'row',
      type: 'number',
      default: preference.row
    },
    {
      label: i18n(['Fill style', '填充模式']),
      name: 'style',
      type: 'select',
      options: [
        { label: i18n(['Square', '正方形']), value: STYLES.SQUARE },
        { label: i18n(['Fill', '填满']), value: STYLES.FILL }
      ],
      default: preference.style
    },
    {
      label: i18n(['Gap', '间隙']),
      name: 'gap',
      type: 'number',
      default: preference.gap
    },
    {
      label: i18n(['Corner radius', '圆角']),
      name: 'cornerRadius',
      type: 'number',
      default: preference.cornerRadius
    },
    {
      label: i18n(['Widget horizontal padding', '水平内边距']),
      name: 'paddingX',
      type: 'number',
      default: preference.paddingX
    },
    {
      label: i18n(['Widget vertical padding', '竖向内边距']),
      name: 'paddingY',
      type: 'number',
      default: preference.paddingY
    },
    {
      label: i18n(['Debug', '调试']),
      name: 'debug',
      type: 'switch',
      default: preference.debug
    }
  ],
  render: async ({ family, settings }) => {
    config.widgetFamily = family ?? config.widgetFamily;
    Object.assign(preference, settings);
    const widget = await createWidget()
      .catch((err) => {
        console.error(err);
        return Promise.reject(err)
      });
    return widget
  }
});

if (config.runsInWidget) {
  Script.setWidget(widget);
}
