// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: fire;
/**
 * Top trending searches on Weibo
 *
 * @version 1.1.0
 * @author Honye
 */

// Utils module

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

const fontSize = 14;
const gap = 8;
const logoSize = 30;
const paddingVertical = 10;
const themes = {
  light: {
    background: new Color('#ffffff'),
    color: Color.black()
  },
  dark: {
    background: new Color('#242426', 1),
    color: Color.white()
  }
};

/** Scoped Keychain */
const KeyStorage = {
  set: (key, value) => {
    return Keychain.set(`$${Script.name()}.${key}`, JSON.stringify(value))
  },
  get: (key) => {
    const _key = `$${Script.name()}.${key}`;
    if (Keychain.contains(_key)) {
      return JSON.parse(Keychain.get(_key))
    }
  }
};

/** 微博国际版页面 */
const InternationalScheme = {
  hotSearch: () => 'weibointernational://hotsearch',
  search: (keyword) => `weibointernational://search?keyword=${encodeURIComponent(keyword)}`
};

/** 微博 H5 应用页面 */
const H5Page = {
  hotSearch: () => `https://m.weibo.cn/p/index?containerid=${encodeURIComponent('106003&filter_type=realtimehot')}`,
  search: (keyword) => `https://m.weibo.cn/search?containerid=${encodeURIComponent('100103type=1&t=10&q=' + keyword)}`
};

const conf = {
  client: 'h5',
  theme: 'system'
};
const screen = Device.screenResolution();
const scale = Device.screenScale();
const phone = phoneSize(screen.height);
let widgetFamily = 'medium';
if (config.runsInWidget) {
  widgetFamily = config.widgetFamily;
  const [client, theme] = (args.widgetParameter || '').split(',').map(text => text.trim());
  conf.client = client === '2' ? 'international' : conf.client;
  conf.theme = theme || conf.theme;
}
const height = (widgetFamily === 'medium' ? phone.small : phone[widgetFamily]) / scale;
conf.count = Math.floor((height - paddingVertical * 2 + gap) / (fontSize + gap));
const storedClient = KeyStorage.get('client');
if (storedClient) {
  conf.client = storedClient;
}

const Pages = (() => {
  switch (conf.client) {
    case 'international':
      return InternationalScheme
    case 'h5':
      return H5Page
  }
})();

const fetchData = async () => {
  const url = 'https://weibointl.api.weibo.cn/portal.php?ct=feed&a=search_topic';
  const request = new Request(url);
  try {
    const res = await request.loadJSON();
    const df = new DateFormatter();
    df.dateFormat = 'HH:mm';
    const timeString = df.string(new Date());
    const data = {
      data: res,
      updatedAt: timeString
    };
    KeyStorage.set('cache', data);
    return data
  } catch (e) {
    const data = KeyStorage.get('cache');
    return data
  }
};

let stackBottom;
let widgetBottom;
const createWidget = async ({ data, updatedAt }) => {
  const widget = new ListWidget();
  widget.backgroundColor = conf.theme === 'system'
    ? Color.dynamic(themes.light.background, themes.dark.background)
    : themes[conf.theme].background;
  widget.url = Pages.hotSearch();
  const paddingY = paddingVertical - (gap / 2);
  widget.setPadding(paddingY, 12, paddingY, 14);
  const max = conf.count;
  const logoLines = Math.ceil((logoSize + gap) / (fontSize + gap));
  for (let i = 0; i < max; ++i) {
    const item = data.data[i];
    if (i === 0) {
      const stack = widget.addStack();
      await addItem(stack, item);
      stack.addSpacer();
      const textTime = stack.addText(`更新于 ${updatedAt}`);
      textTime.font = Font.systemFont(10);
      textTime.textColor = new Color('#666666');
    } else if (i < max - logoLines) {
      await addItem(widget, item);
    } else {
      if (!widgetBottom) {
        stackBottom = widget.addStack();
        stackBottom.bottomAlignContent();
        widgetBottom = stackBottom.addStack();
        widgetBottom.layoutVertically();
        addItem(widgetBottom, item);
      } else {
        await addItem(widgetBottom, item);
      }
      widgetBottom.length = (widgetBottom.length || 0) + 1;
      if (widgetBottom.length === logoLines) {
        stackBottom.addSpacer();
        const imageLogo = stackBottom.addImage(await getImage('https://www.sinaimg.cn/blog/developer/wiki/LOGO_64x64.png'));
        imageLogo.imageSize = new Size(logoSize, logoSize);
      }
    }
  }
  return widget
};

const addItem = async (widget, item) => {
  const stack = widget.addStack();
  const [, queryString] = item.scheme.split('?');
  const query = {};
  queryString.split('&').forEach((item) => {
    const [key, value] = item.split('=');
    query[key] = value;
  });
  stack.url = Pages.search(query.keyword);
  stack.centerAlignContent();
  stack.size = new Size(-1, fontSize + gap);
  const stackIndex = stack.addStack();
  stackIndex.size = new Size(fontSize * 1.4, -1);
  const textIndex = stackIndex.addText(String(item.pic_id));
  textIndex.rightAlignText();
  textIndex.textColor = item.pic_id > 3 ? new Color('#f5c94c', 1) : new Color('#fe4f67', 1);
  textIndex.font = Font.boldSystemFont(fontSize);
  stack.addSpacer(4);
  const textTitle = stack.addText(item.title);
  textTitle.font = Font.systemFont(fontSize);
  textTitle.textColor = conf.theme === 'system'
    ? Color.dynamic(themes.light.color, themes.dark.color)
    : themes[conf.theme].color;
  textTitle.lineLimit = 1;
  textTitle.shadowColor = new Color('#000000', 0.2);
  textTitle.shadowOffset = new Point(1, 1);
  textTitle.shadowRadius = 0.5;
  if (item.icon) {
    stack.addSpacer(4);
    const imageIcon = stack.addImage(await getImage(item.icon));
    imageIcon.imageSize = new Size(12, 12);
  }
  stack.addSpacer();
};

const getImage = async (url) => {
  const request = new Request(url);
  const image = await request.loadImage();
  return image
};

/** 更新脚本 */
const update = async () => {
  let fm = FileManager.local();
  if (fm.isFileStoredIniCloud(module.filename)) {
    fm = FileManager.iCloud();
  }
  const url = 'https://raw.githubusercontent.com/Honye/scriptable-scripts/master/weibo/Weibo.js';
  const request = new Request(url);
  try {
    const code = await request.loadString();
    fm.writeString(module.filename, code);
    const alert = new Alert();
    alert.message = 'The code has been updated. If the script is open, close it for the change to take effect.';
    alert.addAction('OK');
    alert.presentAlert();
  } catch (e) {
    console.error(e);
  }
};

/** Settings */
const settings = async () => {
  const res = await presentSheet({
    title: 'Settings',
    message: 'Which client to use to view details?',
    options: [
      { title: 'Weibo intl. (微博国际版)', value: 'international' },
      { title: 'Browser (H5)', value: 'h5' }
    ]
  });
  const client = res.option?.value || conf.client;
  KeyStorage.set('client', client);
  conf.client = client;
};

const main = async () => {
  const data = await fetchData();
  const widget = await createWidget(data);
  if (config.runsInApp) {
    const res = await presentSheet({
      message: 'Preview the widget or update the script. Update will override the whole script.',
      options: [
        { title: 'Preview', value: 'Preview' },
        { title: 'Settings', value: 'Settings' },
        { title: 'Update', value: 'Update' }
      ]
    });
    const value = res.option?.value;
    switch (value) {
      case 'Preview':
        widget.presentMedium();
        break
      case 'Settings':
        await settings();
        break
      case 'Update':
        update();
        break
    }
  }

  Script.setWidget(widget);
  Script.complete();
};

main();
