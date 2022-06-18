// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: braille; icon-color: deep-gray;
/**
 * @version 1.1.0
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

const getImage = async (url) => {
  const request = new Request(url);
  const image = await request.loadImage();
  return image
};

/**
 * @param {ListWidget | WidgetStack} stack container widget
 * @param {object} options
 * @param {string} options.src image url
 * @param {number} options.size
 */
const addAvatar = async (stack, options) => {
  const { src, size } = options;
  const image = stack.addImage(await getImage(src));
  image.imageSize = new Size(size, size);
  image.cornerRadius = size;
  return image
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

let user = 'Honye';
let columns = 20;
const widgetFamily = config.widgetFamily || 'medium';
let theme = 'system';
const themes = {
  dark: {
    background: new Color('#242426', 1),
    colors: ['#45454a', '#9be9a8', '#40c463', '#30a14e', '#216e39']
  },
  light: {
    background: new Color('#ffffff', 1),
    colors: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']
  }
};
if (config.runsInWidget) {
  [
    user = user,
    theme = theme
  ] = (args.widgetParameter || '')
    .split(',')
    .map(item => item.trim() || undefined);
  columns = widgetFamily === 'small' ? 9 : columns;
}
const gap = { x: 3, y: 2 };

const screen = Device.screenResolution();
const scale = Device.screenScale();
const widgetWidth = phoneSize(screen.height)[widgetFamily === 'large' ? 'medium' : widgetFamily] / scale;
const rectWidth = (widgetWidth - 24 - gap.x * (columns - 1)) / columns;
const url = `https://www.imarkr.com/api/github/${user}`;

const widget = new ListWidget();
widget.url = `https://github.com/${user}`;
widget.backgroundColor = theme === 'system'
  ? Color.dynamic(
    themes.light.background,
    themes.dark.background
  )
  : themes[theme].background;

const req = new Request(url);
const resp = await req.loadJSON();

const avatar = resp.avatar;
const name = resp.name || user;
const countText = `${resp.contributions_count} contributions`;
const colorsData = resp.contributions.slice(-(columns * 7 - 7 + new Date().getDay() + 1)).map((item) => item.level);

const head = widget.addStack();
head.layoutHorizontally();
head.centerAlignContent();

// avatar
await addAvatar(head, { src: avatar, size: 20 });
head.addSpacer(3);

// user name
const textName = head.addText(name.toUpperCase());
textName.font = Font.boldSystemFont(13);
textName.textColor = new Color('#aeaeb7', 1);
head.addSpacer(3);

// contributions count, would not show on small
if (widgetFamily !== 'small') {
  const textCount = head.addText(`(${countText})`.toUpperCase());
  textCount.font = Font.systemFont(12);
  textCount.textColor = new Color('#aeaeb7', 1);
}

widget.addSpacer(10);

const gridStack = widget.addStack();
const { add } = await useGrid(gridStack, {
  direction: 'vertical',
  column: 7,
  gap: [gap.y, gap.x]
});
const addItem = (stack, level) => {
  const rect = stack.addStack();
  rect.size = new Size(rectWidth, rectWidth);
  rect.cornerRadius = 2;
  rect.backgroundColor = theme === 'system'
    ? Color.dynamic(
      new Color(themes.light.colors[level], 1),
      new Color(themes.dark.colors[level], 1)
    )
    : new Color(themes[theme].colors[level], 1);
};
for (const level of colorsData) {
  await add((stack) => addItem(stack, level));
}

Script.setWidget(widget);
widget.presentMedium();
