// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: layer-group; icon-color: blue;
/**
 * 掘金文章订阅
 *
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

  if (config.runsInWidget) {
    const phone = phones[height];
    if (phone) {
      return phone
    }

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
const paddingVertical = 10;
const themes = {
  dark: {
    background: new Color('#242426', 1)
  },
  light: {
    background: new Color('#ffffff', 1)
  }
};
themes.system = Color.dynamic(themes.light.background, themes.dark.background);

const categories = {
  be: { id: '6809637769959178254', title: '后端' },
  fe: { id: '6809637767543259144', title: '前端' },
  android: { id: '6809635626879549454', title: 'Android' },
  ios: { id: '6809635626661445640', title: 'iOS' },
  ai: { id: '6809637773935378440', title: '人工智能' },
  tools: { id: '6809637771511070734', title: '开发工具' },
  coding: { id: '6809637776263217160', title: '代码人生' },
  reading: { id: '6809637772874219534', title: '阅读' }
};

/**
 * @param {string} cateID
 */
const getArticles = async (cateID) => {
  const screen = Device.screenResolution();
  const scale = Device.screenScale();
  const phone = phoneSize(screen.height);
  const widgetFamily = config.widgetFamily || 'medium';
  const height = (widgetFamily === 'medium' ? phone.small : phone[widgetFamily]) / scale;
  const limit = Math.floor((height - paddingVertical * 2 + gap) / (fontSize + gap));

  const url = 'https://api.juejin.cn/recommend_api/v1/article/recommend_cate_feed';
  const req = new Request(url);
  req.method = 'POST';
  req.headers = {
    'Content-Type': 'application/json; encoding=utf-8'
  };
  req.body = JSON.stringify({
    id_type: 2,
    cate_id: cateID,
    sort_type: 200,
    cursor: '0',
    limit
  });
  const res = await req.loadJSON();
  return res
};

const createWidget = (data) => {
  const { data: articles } = data;
  const widget = new ListWidget();
  widget.backgroundColor = themes.system;
  const paddingY = paddingVertical - (gap / 2);
  widget.setPadding(paddingY, 12, paddingY, 12);
  for (const [, article] of articles.entries()) {
    const { article_info: info, tags } = article;
    const stackArticle = widget.addStack();
    stackArticle.url = `https://juejin.cn/post/${info.article_id}`;
    stackArticle.size = new Size(-1, fontSize + gap);
    stackArticle.centerAlignContent();
    const textTitle = stackArticle.addText(info.title);
    textTitle.font = Font.systemFont(fontSize);
    // Tags 最多显示2个标签
    stackArticle.addSpacer(6);
    const stackTags = stackArticle.addStack();
    stackTags.centerAlignContent();
    stackTags.spacing = 3;
    for (const tag of tags.slice(0, 2)) {
      addTag(stackTags, tag);
    }
  }
  return widget
};

const addTag = (widget, tag) => {
  const stack = widget.addStack();
  stack.backgroundColor = new Color(tag.color);
  stack.centerAlignContent();
  stack.setPadding(0, 4, 0, 4);
  stack.size = new Size(-1, fontSize);
  stack.cornerRadius = 7;
  const textTag = stack.addText(tag.tag_name);
  textTag.centerAlignText();
  textTag.textColor = Color.white();
  textTag.font = Font.lightSystemFont(fontSize * 0.7);
};

const main = async () => {
  let cateID = categories.fe.id;
  if (config.runsInWidget) {
    const [cate] = (args.widgetParameter || '').split(',').map(text => text.trim());
    if (cate) {
      cateID = categories[cate] ? categories[cate].id : cate;
    }
  }
  const data = await getArticles(cateID);
  const widget = createWidget(data);
  if (config.runsInApp) {
    widget.presentMedium();
  }
  Script.setWidget(widget);
  Script.complete();
};

await main();
