// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: magic;
// ================================
// Scriptable Widget：财联社电报 
// Author：YT
// 2024.12.27
// ================================

// ========== 可自定义部分 ==========

// 小组件标题
const WIDGET_TITLE = "财联社电报";

// 小、中、大组件分别最多显示多少条
const MAX_ITEMS_SMALL  = 3;
const MAX_ITEMS_MEDIUM = 3;
const MAX_ITEMS_LARGE  = 12; // 具有动态调整数量功能，最多12条

// RSS 地址
const RSS_URL = "https://pyrsshub.vercel.app/cls/telegraph/";

// 标题最大长度，超过则截断
const MAX_TITLE_LENGTH = 80; 
// 固定字体大小（不自动缩小）
const FIXED_FONT_SIZE = 12;

// 在脚本内手动预览时想使用的尺寸 ("small" | "medium" | "large")
const PREVIEW_SIZE = "large";

// 固定的行间距 (无需自动计算)
const FIXED_ROW_SPACING = 5;

// File Manager配置
const fm = FileManager.local();
const CACHE_FILE_NAME = "rss_cache.json";
const CACHE_FILE_PATH = fm.joinPath(fm.documentsDirectory(), `${Script.name()}/${CACHE_FILE_NAME}`);

// 动态调整参数
const CHARS_PER_LINE = 20;      // 每行可容纳的字符数
const MAX_LINES_LARGE = 18;     // 小组件可用的总行数
const MAX_TITLE_LINES = 3;      // 每条新闻最多显示 3 行

// ========== Logo ==========

const LOGO_BASE64 = `
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
`.trim();

////////////////////////////////////////////////////////////////////////////////
// ========== 工具函数部分 ==========
////////////////////////////////////////////////////////////////////////////////

// 解析 Atom Feed，提取标题和发布时间。
function parseRSS(rssText) {
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let items = [];
  let match;

  while ((match = entryRegex.exec(rssText)) !== null) {
    let entryBlock = match[1];

    // 提取标题
    let titleMatch = entryBlock.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    let pubDateMatch = entryBlock.match(/<published>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/published>/i);

    if (titleMatch && pubDateMatch) {
      let title = titleMatch[1].trim().replace(/\s+/g, " "); // 清理标题多余空格
      let pubDate = pubDateMatch[1].trim(); // 发布时间
      items.push({ title, pubDate });
    }
  }

  return items;
}

/** 拉取 RSS 数据 */
async function fetchRSSData() {
  let req = new Request(RSS_URL);
  let resp = await req.loadString();
  let items = parseRSS(resp);
  if (!items || items.length === 0) {
    throw new Error("Parsed 0 items from RSS");
  }
  return items;
}

/** 加载缓存 */
function loadCache() {
  if (!fm.fileExists(CACHE_FILE_PATH)) {
    console.warn("缓存文件不存在");
    return [];
  }
  try {
    const json = fm.readString(CACHE_FILE_PATH);
    const data = JSON.parse(json);
    if (Array.isArray(data)) {
      return data;
    }
    console.warn("缓存文件格式错误");
  } catch (e) {
    console.warn("读取缓存失败:", e);
  }
  return [];
}

/** 保存缓存 */
function saveCache(items) {
  const directory = CACHE_FILE_PATH.substring(0, CACHE_FILE_PATH.lastIndexOf("/"));
  if (!fm.fileExists(directory)) {
    fm.createDirectory(directory, true);
  }
  try {
    const json = JSON.stringify(items);
    fm.writeString(CACHE_FILE_PATH, json);
    console.log("缓存已保存");
  } catch (e) {
    console.warn("保存缓存失败:");
    console.warn(e);
  }
}

/** 截断字符串 */
function truncate(str, maxLen) {
  if (!str) return "";
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
}

/** 格式化时间：GMT/UTC => [HH:MM] */
function formatTimeStr(dateStr) {
  let dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) {
    return "[??:??]";
  }
  let timeFormatter = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false  
  });
  let timeStr = timeFormatter.format(dateObj);
  return `[${timeStr}]`;
}

/** 获取当前系统本地时间 "HH:MM" */
function getCurrentHHMM() {
  let now = new Date();
  let fmt = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  return fmt.format(now);
}

/** 从脚本内置 Base64 里获取 Logo */
async function fetchLogo() {
  // 去掉前后空白并转换
  let cleanBase64 = LOGO_BASE64.replace(/\s+/g, "");
  let data = Data.fromBase64String(cleanBase64);
  return Image.fromData(data);
}

/** 动态调整大尺寸Widget item数量 */
function calculateDynamicItemCountByLines(items, maxLines, charsPerLine, maxItems) {
  const MAX_TITLE_LENGTH = MAX_TITLE_LINES * charsPerLine;

  let totalLines = 0;
  let itemCount = 0;

  for (let i = 0; i < items.length; i++) {
    const title = items[i].title;

    // 限制标题长度
    const truncatedTitle = title.length > MAX_TITLE_LENGTH ? title.slice(0, MAX_TITLE_LENGTH) : title;

    // 计算行数
    const linesNeeded = Math.ceil(truncatedTitle.length / charsPerLine);

    // 如果总行数超过限制或条目数超出最大值，停止
    if (totalLines + linesNeeded > maxLines || itemCount >= maxItems) {
      break;
    }

    totalLines += linesNeeded; // 累加行数
    itemCount++;               // 增加条目数
  }

  return itemCount;
}
////////////////////////////////////////////////////////////////////////////////
// ========== 创建小组件 ==========
////////////////////////////////////////////////////////////////////////////////

function createWidget(items, logoImage) {
  let w = new ListWidget();

  // 获取小组件尺寸 (若非小组件模式，就用 PREVIEW_SIZE)
  let widgetFamily = config.widgetFamily || PREVIEW_SIZE;
  let isLarge = (widgetFamily === "large");

  // 顶部区域（Logo+标题+刷新时间）
  let headerStack = w.addStack();
  headerStack.layoutHorizontally();
  headerStack.centerAlignContent();

  let leftStack = headerStack.addStack();
  leftStack.layoutHorizontally();
  leftStack.centerAlignContent();

  if (logoImage) {
    let logoImg = leftStack.addImage(logoImage);
    logoImg.imageSize = new Size(18, 18);
    logoImg.leftAlignImage();
  }
  leftStack.addSpacer(6);

  let titleTxt = leftStack.addText(WIDGET_TITLE);
  titleTxt.font = Font.mediumSystemFont(14);
  titleTxt.textColor = Color.white();

  headerStack.addSpacer();

  let refreshTime = "更新于 " + getCurrentHHMM();
  let refreshTxt = headerStack.addText(refreshTime);
  refreshTxt.font = Font.regularMonospacedSystemFont(10);
  refreshTxt.textColor = new Color("#cccccc");

   w.addSpacer();
  
  // 中间区域（新闻部分）
  // 条目数
  let itemCount;
  if (widgetFamily === "large") {
    itemCount = calculateDynamicItemCountByLines(
    items,
    MAX_LINES_LARGE,  // 小组件总可用行数
    CHARS_PER_LINE,   // 每行可容纳字符数
    MAX_ITEMS_LARGE   // 最大条目数
  );
  } else {
    itemCount = widgetFamily === "small" ? MAX_ITEMS_SMALL : MAX_ITEMS_MEDIUM;
  }
  let showList = items.slice(0, itemCount);

  // 父级垂直 stack
  let listStack = w.addStack();
  listStack.layoutVertically();

  // 固定行间距
  let rowSpacing = FIXED_ROW_SPACING;

  for (let i = 0; i < showList.length; i++) {
    let news = showList[i];
    let shortTitle = truncate(news.title, MAX_TITLE_LENGTH);

    let rowStack = listStack.addStack();
    rowStack.topAlignContent();
    rowStack.layoutHorizontally();

    // 时间区域
    let timeStack = rowStack.addStack();
    timeStack.layoutHorizontally();
    timeStack.size = new Size(44, 0);

    let timeTxt = timeStack.addText(formatTimeStr(news.pubDate));
    timeTxt.font = Font.regularMonospacedSystemFont(12);
    timeTxt.textColor = new Color("#cccccc");
    timeTxt.lineLimit = 1;

    rowStack.addSpacer(4);
    
    // 信息区域
    let titleTxt = rowStack.addText(shortTitle);
    titleTxt.font = Font.systemFont(FIXED_FONT_SIZE);
    titleTxt.textColor = new Color("#cccccc");
    // Large size widget最多显示3行，Medium size widget最多显示2行
    titleTxt.lineLimit = isLarge ? 3 : 2;

    // 行与行之间的固定间隔
    if (i < showList.length - 1) {
      listStack.addSpacer(rowSpacing);
    }
  }
    // 调整大尺寸小组件底部空隙
    if (isLarge) {
      w.addSpacer();
    }
    
  return w;
}

////////////////////////////////////////////////////////////////////////////////
// ========== 主函数 ==========
////////////////////////////////////////////////////////////////////////////////

async function run() {
  // 从缓存中拿数据
  let cachedItems = loadCache();
  let finalItems = cachedItems;

  // 拉取 RSS
  try {
    let fetched = await fetchRSSData();
    finalItems = fetched;
    saveCache(fetched);
  } catch (err) {
    console.warn("拉取RSS失败:", err);
    if (cachedItems.length > 0) {
      console.warn("使用缓存数据");
    } else {
      console.warn("无缓存可用，将显示空");
    }
  }

  // 从脚本内置 Base64 获取 Logo
  let logoImage = null;
  try {
    logoImage = await fetchLogo();
  } catch (e) {
    console.warn("获取 Logo 失败:", e);
  }

  let widget = createWidget(finalItems, logoImage);

  // 在脚本内可选择预览尺寸
  if (!config.runsInWidget) {
    switch (PREVIEW_SIZE) {
      case "small":
        await widget.presentSmall();
        break;
      case "medium":
        await widget.presentMedium();
        break;
      case "large":
        await widget.presentLarge();
        break;
      default:
        await widget.presentMedium();
        break;
    }
  } else {
    Script.setWidget(widget);
    Script.complete();
  }
}

await run();
// ========== End ==========