// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: fire; icon-color: orange;
/**
 * @version 1.0.0
 * @author Honye
 */

/**
 * 获取网络图片
 * @param {string} url
 */
const getImage = async (url) => {
  const request = new Request(url);
  const image = await request.loadImage();
  return image
};

/** 显示数量 */
const n = 5;
/** 字体大小 */
const fontSize = 13;

const api = 'https://app.sports.qq.com/m/oly/medalsRank?competitionID=180000&disciplineCode=ALL&from=h5';
const request = new Request(api);
const res = await request.loadJSON();
/** @type {any[]} */
const list = res.data.list;

const widget = new ListWidget();
widget.setPadding(8, 16, 8, 16);

const addNum = (stack, num) => {
  const w = stack.addStack();
  w.size = new Size(48, 26);
  w.centerAlignContent();
  w.addSpacer();
  const n = w.addText(num);
  n.font = Font.systemFont(13);
  return n
};

const headStack = widget.addStack();
const h1 = headStack.addStack();
const t1 = h1.addText('排名');
t1.textColor = new Color('#4b5367');
t1.font = Font.systemFont(fontSize);
h1.addSpacer();
const t2 = addNum(headStack, '金');
t2.textColor = new Color('#4b5367');
const t3 = addNum(headStack, '银');
t3.textColor = new Color('#4b5367');
const t4 = addNum(headStack, '铜');
t4.textColor = new Color('#4b5367');
const t5 = addNum(headStack, '总');
t5.textColor = new Color('#4b5367');

for (const [i, item] of list.slice(0, n).entries()) {
  const tr = widget.addStack();
  const d1 = tr.addStack();
  d1.size = new Size(-1, -1);
  d1.centerAlignContent();
  const stackIndex = d1.addStack();
  stackIndex.size = new Size(fontSize * 1.2, -1);
  const index = stackIndex.addText(`${i + 1}`);
  index.textColor = new Color('#8d93a6');
  index.font = Font.boldSystemFont(fontSize);
  d1.addSpacer(3);
  const image = await getImage(item.nocLogo);
  const flag = d1.addImage(image);
  flag.imageSize = new Size(100 / 4, 68 / 4);
  d1.addSpacer(4);
  const country = d1.addText(item.nocName);
  country.font = Font.systemFont(fontSize);
  if (item.nocCode === 'CHN') {
    country.textColor = new Color('#ed4646');
    country.font = Font.boldSystemFont(fontSize);
  }
  d1.addSpacer();
  const g = addNum(tr, item.gold);
  g.textColor = new Color('#d9a400');
  g.font = Font.boldSystemFont(fontSize);
  if (item.nocCode === 'CHN') {
    g.textColor = new Color('#ed4646');
  }
  const s = addNum(tr, item.silver);
  s.textColor = new Color('#9297b8');
  s.font = Font.boldSystemFont(fontSize);
  if (item.nocCode === 'CHN') {
    s.textColor = new Color('#ed4646');
  }
  const b = addNum(tr, item.bronze);
  b.textColor = new Color('#bd7e69');
  b.font = Font.boldSystemFont(fontSize);
  if (item.nocCode === 'CHN') {
    b.textColor = new Color('#ed4646');
  }
  const t = addNum(tr, item.total);
  t.font = Font.boldSystemFont(fontSize);
  if (item.nocCode === 'CHN') {
    t.textColor = new Color('#ed4646');
  }
}

widget.presentMedium();
Script.setWidget(widget);
