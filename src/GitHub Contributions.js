import { phoneSize } from './utils/utils';

let user = 'Honye';
let columns = 20;
const widgetFamily = config.widgetFamily || 'medium';
let theme = 'system';
const themes = {
  dark: {
    background: new Color('#242426', 1),
    colors: ["#45454a","#9be9a8","#40c463","#30a14e","#216e39"]
  },
  light: {
    background: new Color('#ffffff', 1),
    colors: ["#ebedf0","#9be9a8","#40c463","#30a14e","#216e39"]
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
req.headers = {
  'cookie': '_octo=GH1.1.1539639820.1577368057; _ga=GA1.2.2040897722.1577368108; tz=Asia%2FShanghai; _device_id=7eef997fa1bfbba0d352348e6c677334; ignored_unsupported_browser_notice=false; tz=Asia%2FShanghai; user_session=he6iH5ZsE-PG5s1GeHJwydUNTgTkP3foK1i-1gLLEgrASXcb; __Host-user_session_same_site=he6iH5ZsE-PG5s1GeHJwydUNTgTkP3foK1i-1gLLEgrASXcb; logged_in=yes; dotcom_user=Honye; color_mode=%7B%22color_mode%22%3A%22light%22%2C%22light_theme%22%3A%7B%22name%22%3A%22light%22%2C%22color_mode%22%3A%22light%22%7D%2C%22dark_theme%22%3A%7B%22name%22%3A%22dark%22%2C%22color_mode%22%3A%22dark%22%7D%7D; has_recent_activity=1; _gh_sess=zNp4F9ia6hAFRiEE6exEsm4FZYz6VDu0S9l8jLnEVyDApj9y1SNlVxG8mlVHpBETxUWaz%2FPAXJYW3Pr4GltoXR6%2FfAcj84Y2lkFb1TKaIdmXFTN6K%2F9tCwjx60PsD3DG86RdKSApKT%2B26e1wXl%2FHFHEs2G9S1zXHTKdRhCwBzR0cQpl3ZPZgljHdGDgFL9mVWW8jOzbtXfDGAHrJjh9q3cAuuIOoOl%2B%2Bpbj678ve4X2FPpCtjtN20TgWHFNSW7qFyKqCLLld0%2FpEofC8C6Yh3QRrOf7NcUO0hsazrfwwXhalN09lXHM65lYrVHBrxzsIcmldMCq6R7FtNd7nxsMEI3lVV%2FSH%2BUKNQ78xqtnGojF71ptd8Pzr2VY6aWdtCEQZ4PvfpMnJB8jxWCD7lr4XIv0nDP7bv3YLDwZCgEqIHKuVJMPYCPhyj%2F59et6kXZUh--teNA69tt8cQfyR5s--NgLNgyFA1Wfd9k8354EM8A%3D%3D',
  'cache-control': 'max-age=0',
  'if-none-match': 'W/"cff70e46ae5c8359d3d6d2f8e8256fae"'
};
const resp = await req.loadString();

const avatar = resp.match(/og:image" content="([^"]+)/)[1];
const name = resp.match(/<title>.+\((.+)\).*<\/title>/)?.[1] || user;
const countText = resp.match(/\d{1,},*\d*\s+contributions/)[0].replace(/\s+/, ' ');
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
textName.textColor = new Color('#aeaeb7', 1);
head.addSpacer(3);

// contributions count, would not show on small
if (widgetFamily !== 'small') {
  const textCount = head.addText(`(${countText})`.toUpperCase());
  textCount.font = Font.systemFont(12);
  textCount.textColor = new Color('#aeaeb7', 1);
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
  const rect = row.addStack();
  rect.size = new Size(rectWidth, rectWidth);
  rect.cornerRadius = 2;
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
