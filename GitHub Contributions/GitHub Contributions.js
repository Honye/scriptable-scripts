// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: braille;
/**
 * GitHub Contributions
 * 
 * - Only support small and medium
 * - Tap widget to open the user profile web page
 * 
 * @author Honye
 */
let user = 'Honye';
let columns = 20;
const widgetFamily = config.widgetFamily || 'medium';
let theme = 'system';
const colors = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
const themes = {
  dark: {
    background: new Color('#2C2C2E', 1),
    colors: ["#3e3e41", "#9be9a8", "#40c463", "#30a14e", "#216e39"]
  },
  light: {
    background: new Color('#FFFFFF', 1),
    colors: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"]
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

const getImage = async (url) => {
  const request = new Request(url);
  const image = await request.loadImage();
  return image;
}

/**
 * @param {number} [height] The screen height measured in pixels
 */
const phoneSize = (height) => {
  let phones = {

    // 12 Pro Max
    "2778": {
      small: 510,
      medium: 1092,
      large: 1146
    },

    // 12 and 12 Pro
    "2532": {
      small: 474,
      medium: 1014,
      large: 1062
    },

    // 11 Pro Max, XS Max
    "2688": {
      small: 507,
      medium: 1080,
      large: 1137
    },

    // 11, XR
    "1792": {
      small: 338,
      medium: 720,
      large: 758
    },


    // 11 Pro, XS, X, 12 mini
    "2436": {
      small: 465,
      medium: 987,
      large: 1035
    },

    // Plus phones
    "2208": {
      small: 471,
      medium: 1044,
      large: 1071
    },

    // SE2 and 6/6S/7/8
    "1334": {
      small: 296,
      medium: 642,
      large: 648
    },


    // SE1
    "1136": {
      small: 282,
      medium: 584,
      large: 622
    },

    // 11 and XR in Display Zoom mode
    "1624": {
      small: 310,
      medium: 658,
      large: 690
    },

    // Plus in Display Zoom mode
    "2001": {
      small: 444,
      medium: 963,
      large: 972
    }
  }
  height = height || Device.screenResolution().height
  const scale = Device.screenScale()

  if (config.runsInWidget) {
    const phone = phones[height]
    if (phone) {
      return phone
    }

    const pc = {
      small: 164 * scale,
      medium: 344 * scale,
      large: 354 * scale
    }
    return pc
  }

  // in app screen fixed 375x812 pt
  return {
    small: 155 * scale,
    medium: 329 * scale,
    large: 345 * scale
  }
}

const screen = Device.screenResolution();
const scale = Device.screenScale();
const widgetWidth = phoneSize(screen.height)[widgetFamily] / scale;
const rectWidth = (widgetWidth - 24 - gap.x * (columns - 1)) / columns;
const url = `https://github.com/${user}`;

const widget = new ListWidget();
widget.url = url;
widget.backgroundColor = theme === 'system'
  ? Color.dynamic(
    themes.light.background,
    themes.dark.background
  )
  : themes[theme].background;

const req = new Request(url);
const resp = await req.loadString();

const avatar = resp.match(/og:image" content="([^"]+)/)[1];
const name = resp.match(/<title>.+\((.+)\).*<\/title>/)?.[1] || user;
const countText = resp.match(/\d{1,},*\d* contributions/)[0];
let contributions = resp.match(/<g transform="translate(.|\n)+?<\/g>/g);
contributions = contributions.slice(-columns).join('\n');
let colorsData = contributions.match(/data-level="\d+/g).join("\n");
colorsData = colorsData.replace(/data-level="/g, "").split("\n");

const head = widget.addStack();
head.layoutHorizontally();
head.centerAlignContent();

// avatar
const imageAvatar = head.addImage(await getImage(avatar));
imageAvatar.imageSize = new Size(20, 20);
imageAvatar.cornerRadius = 10;
head.addSpacer(3);

// user name
const textName = head.addText(name.toUpperCase());
textName.lineLimit = 1;
textName.minimumScaleFactor = 0.5;
textName.font = Font.boldSystemFont(13);
textName.textColor = new Color('#9a9aa1', 1);
head.addSpacer(3);

// contributions count, would not show on small
if (widgetFamily !== 'small') {
  const textCount = head.addText(`(${countText})`.toUpperCase());
  textCount.font = Font.systemFont(10);
  textCount.textColor = new Color('#9a9aa1', 1);
}

widget.addSpacer(10);

const ls = [];
for (let i = 0; i < 7; ++i) {
  ls.push(widget.addStack());
  if (i < 6) {
    widget.addSpacer(2);
  }
}

for (let [index, level] of colorsData.entries()) {
  const row = ls[index % 7];
  const hex = colors[level];
  const color = new Color(hex, 1);

  const rect = row.addStack();
  rect.size = new Size(rectWidth, rectWidth);
  rect.cornerRadius = 2;
  rect.backgroundColor = colorsData[index] === '0'
    ? Color.dynamic(color, new Color('#3E3E41', 1))
    : color;
  rect.backgroundColor = theme === 'system'
    ? Color.dynamic(
      new Color(themes.light.colors[level], 1),
      new Color(themes.dark.colors[level], 1)
    )
    : new Color(themes[theme].colors[level], 1);

  if (index < 7 * (columns - 1)) {
    row.addSpacer(3);
  }
}

Script.setWidget(widget);
widget.presentMedium();
