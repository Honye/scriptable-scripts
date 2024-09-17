// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-glyph: gas-pump; icon-color: deep-brown;
/**
 * @version 0.0.1
 * @author Honye
 */

/**
 * @version 0.0.1
 * @author github/Honye
 */

/**
 * @param {object} options
 * @param {number[]} options.data
 * @param {Size} options.size
 * @param {Color} options.lineColor
 * @param {Color} options.shadowColor
 */
const lineChart = (options) => {
  const { data, size, lineWidth, lineColor, radius, shadowColor } = {
    radius: 0.5,
    lineWidth: 0.5,
    ...options
  };
  const min = Math.min(...data);
  const max = Math.max(...data);
  const maxOffset = max - min;
  const length = data.length;
  const yUnit = (size.height - radius * 2) / maxOffset;
  const xUnit = (size.width - radius * 2) / (length - 1);

  const context = new DrawContext();
  context.size = size;
  context.respectScreenScale = true;
  context.opaque = false;
  context.setLineWidth(lineWidth);
  // const dotsPath = new Path()
  const linePath = new Path();
  const areaPath = new Path();
  const points = [];
  for (const [i, num] of data.entries()) {
    // dotsPath.addEllipse(new Rect(
    //   i * xUnit,
    //   size.height - (num - min) * yUnit - radius * 2,
    //   radius * 2,
    //   radius * 2
    // ))

    const point = new Point(i * xUnit + radius, size.height - (num - min) * yUnit - radius * 2 + radius);
    points.push(point);
    if (i === 0) {
      linePath.move(point);
      areaPath.move(point);
    } else {
      linePath.addLine(point);
      areaPath.addLine(point);
    }
  }
  // context.addPath(dotsPath)
  // context.setFillColor(lineColor)
  // context.fillPath()

  context.addPath(linePath);
  context.setStrokeColor(lineColor);
  context.strokePath();

  areaPath.addLine(new Point(points[points.length - 1].x, size.height - radius));
  areaPath.addLine(new Point(radius, size.height - radius));
  context.addPath(areaPath);
  context.setFillColor(shadowColor);
  context.fillPath();

  const image = context.getImage();
  return image
};

const preference = {
  province: '上海',
  max: 4
};

const base = 'https://cx.sinopecsales.com/yjkqiantai';
const provinces = new Map([
  ['北京', '11'],
  ['天津', '12'],
  ['河北', '13'],
  ['山西', '14'],
  ['河南', '41'],
  ['山东', '37'],
  ['上海', '31'],
  ['江苏', '32'],
  ['浙江', '33'],
  ['安徽', '34'],
  ['福建', '35'],
  ['江西', '36'],
  ['湖北', '42'],
  ['湖南', '43'],
  ['广东', '44'],
  ['广西', '45'],
  ['云南', '53'],
  ['贵州', '52'],
  ['海南', '46'],
  ['重庆', '50'],
  ['四川', '51'],
  ['新疆', '65'],
  ['内蒙古', '15'],
  ['辽宁', '21'],
  ['吉林', '22'],
  ['宁夏', '64'],
  ['陕西', '61'],
  ['黑龙江', '23'],
  ['西藏', '54'],
  ['青海', '63'],
  ['甘肃', '62']
]);
const names = new Map([
  ['GAS_92', '92#'],
  ['GAS_95', '95#'],
  ['GAS_98', '98#'],
  ['E92', 'E92#'],
  ['E95', 'E95#'],
  ['AIPAO95', '爱跑95#'],
  ['AIPAO98', '爱跑98#'],
  ['AIPAOE92', '爱跑E92#'],
  ['AIPAOE95', '爱跑E95#'],
  ['AIPAOE98', '爱跑E98#'],
  ['CHAI_0', '0#'],
  ['CHAI_10', '-10#'],
  ['CHAI_20', '-20#'],
  ['CHAI_35', '-35#']
]);
let _cookies;

const initMainData = async () => {
  const url = `${base}/data/initMainData`;
  const request = new Request(url);
  const json = await request.loadJSON();
  const { customized } = json;
  const { cookies } = request.response;
  if (customized) {
    _cookies = cookies;
    return [
      await switchProvince({ provinceId: provinces.get(preference.province) }),
      await initOilPrice()
    ]
  } else {
    return [
      json,
      await initOilPrice()
    ]
  }
};

const switchProvince = async (params) => {
  const url = `${base}/data/switchProvince`;
  const request = new Request(url);
  request.method = 'POST';
  request.headers = {
    'Content-Type': 'application/json;charset=UTF-8',
    Cookie: _cookies.map(({ name, value }) => `${name}=${value}`).join(';\n')
  };
  request.body = JSON.stringify(params);
  const json = await request.loadJSON();
  return json
};

const initOilPrice = async () => {
  const url = `${base}/data/initOilPrice`;
  const request = new Request(url);
  const json = await request.loadJSON();
  return json
};

/**
 * @param {WidgetStack} container
 * @param {number[]} history
 */
const addLineChart = async (container, history, color) => {
  const image = container.addImage(
    lineChart({
      data: history,
      size: new Size(100, 28),
      lineWidth: 1.5,
      lineColor: color,
      shadowColor: new Color(color.hex, 0.06)
    })
  );
  image.imageSize = new Size(100, 28);
};

/**
 * @param {WidgetStack} container
 */
const addItem = async (container, data) => {
  const stack = container.addStack();
  stack.centerAlignContent();
  const color = data.offset > 0 ? Color.red() : Color.green();
  const symbol = stack.addText(data.offset > 0 ? '▲' : '▼');
  symbol.font = Font.systemFont(14);
  symbol.textColor = color;
  stack.addSpacer(2);
  const name = stack.addText(data.name);
  name.font = Font.semiboldSystemFont(18);
  stack.addSpacer();
  await addLineChart(stack, data.history, color);

  stack.addSpacer(30);
  const priceStack = stack.addStack();
  priceStack.size = new Size(60, -1);
  priceStack.layoutVertically();
  const pStack = priceStack.addStack();
  pStack.addSpacer();
  const price = pStack.addText(`¥ ${data.price}`);
  price.font = Font.semiboldSystemFont(15);
  const oStack = priceStack.addStack();
  oStack.addSpacer();
  const offset = oStack.addText(`${data.offset > 0 ? '+' : ''}${data.offset}`);
  offset.font = Font.mediumSystemFont(12);
  offset.textColor = color;
};

const createWidget = async ({ data }, { data: history }) => {
  const { provinceCheck, provinceData } = data;
  const widget = new ListWidget();
  widget.backgroundColor = Color.dynamic(new Color('#fff'), new Color('#242426'));
  const promises = [];
  for (const [k, name] of names.entries()) {
    if (provinceCheck[k] === 'Y') {
      const key = ['CHAI_0', 'CHAI_10'].includes(k) ? `CHE${k}` : k;
      promises.push(
        (async () => {
          widget.addSpacer();
          await addItem(widget, {
            name,
            price: provinceData[key],
            offset: provinceData[`${key}_STATUS`],
            history: history.provinceData.slice(0, 7).map((item) => item[key])
          });
        })()
      );
    }
    if (promises.length >= preference.max) break
  }
  await Promise.all(promises);
  widget.addSpacer();
  return widget
};

const showWeb = async () => {
  const wv = new WebView();
  await wv.loadURL(base);
  wv.present();
};

const main = async () => {
  const [data, history] = await initMainData();
  const widget = await createWidget(data, history);
  Script.setWidget(widget);
  if (config.runsInApp) {
    showWeb();
  }
};

await main();
