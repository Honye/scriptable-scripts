// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: newspaper;
// ================================
// Scriptable Widget：财联社电报
// Author: YT
// RSS Source: Zhihai Liao (https://github.com/hillerliao)
// Version: 1.3.2
// Date: 2025.1.5
// Description: Display newest Cailian Press Telegraphs. 
// ================================

/* ========== 可自定义部分 ========== */

// 脚本名称
const WIDGET_NAME = Script.name() || "财联社电报";

// RSS源地址
const RSS_URL = "https://pyrsshub.vercel.app/cls/telegraph/";

// 预览尺寸设置（仅在非小组件模式下生效）
const PREVIEW_SIZE = "large"; // 可选值："medium" | "large"

// 显示设置
const ROW_SPACING = 3;    // 行间距
const FONT_SIZE = 12;     // 字体大小// 
const WIDGET_WIDTH = 330; // 信息展示宽度，根据手机屏幕大小调整到合适的数值 
const TIME_WIDTH = 44;    // 时间区域宽度，若时间显示不完整，调高此数值

// 根据小组件尺寸的不同，定义不同的配置
const CONFIG = {
  LARGE: {
    MAX_LINES: 17,        // 最大显示行数
    MAX_TITLE_LINES: 3    // 每条新闻标题的最大行数
  },
  MEDIUM: {
    MAX_LINES: 6,
    MAX_TITLE_LINES: 2
  },
  SMALL: {
    MESSAGE: "仅适配中大尺寸" // 小尺寸不支持显示内容时的提示信息
  }
};

// 缓存方式配置
const CACHE_METHOD = "FileManager"; // 可选值："Keychain" | "FileManager"

// 缓存配置
const CACHE_CONFIG = {
  method: CACHE_METHOD,
  status: "unloaded",
  keychain: {
    cacheKey: "CLS_TELEGRAPH_CACHE", // Keychain缓存键名
    version: 1 // Keychain缓存版本
  },
  fileManager: {
    storageType: "local", // 可选值："iCloud" | "local"
    cacheFileName: `${WIDGET_NAME}数据缓存.json`, // FileManager缓存文件名
    version: 1 // FileManager缓存版本
  }
};

// 字符宽度
const CHARS_WIDTH = {   
    chinese: 1,           // 汉字宽度
    englishcap: 0.685,    // 英文字母宽度
    english: 0.536,
    number: 0.613,        // 数字宽度
    others: 0.3,          // 其他字符宽度
};

// Logo 配置
const ICON = {
  // 您可以自行替换为您的Logo图片链接
  url: "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/d8/03/5d/d8035d9a-bd09-dc3a-6aa4-fe29a805568e/AppIcon-0-0-1x_U007epad-0-0-0-sRGB-85-220.png/434x0w.webp", 
  cacheName: `${WIDGET_NAME}图标缓存.webp` // 本地缓存Logo的文件名
};

/* ========== 工具函数部分 ========== */

/**
 * 解析 Atom Feed，提取标题、发布时间、正文
 * @param {string} rssText - RSS源的XML文本内容
 * @returns {Array<{title:string, pubDate:string, content:string}>} - 解析后的新闻条目数组
 */
function parseRSS(rssText) {
  // 找到所有 <entry> ... </entry> 块
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let items = [];
  let match;

  while ((match = entryRegex.exec(rssText)) !== null) {
    const entryBlock = match[1];

    // 1. 解析标题 <title>...</title>
    const titleMatch = entryBlock.match(
      /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i
    );

    // 2. 解析发布时间 <published>...</published>
    const pubDateMatch = entryBlock.match(
      /<published>([\s\S]*?)<\/published>/i
    );

    // 3. 解析正文 <content>...</content>
    // 注意：有时 content 标签上还会带有 type="html"、src="xxx" 等属性，因此用 <content[^>]*> 来匹配
    const contentMatch = entryBlock.match(
      /<content[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content>/i
    );

    // 如果 title & pubDate & content 存在，则将它们加入结果
    if (titleMatch && pubDateMatch && contentMatch) {
      const title = titleMatch[1].trim();
      const pubDate = pubDateMatch[1].trim();
      const content = contentMatch[1].trim();

      items.push({ title, pubDate, content });
    }
  }

  return items;
}

/**
 * 拉取 RSS 数据
 * @returns {Promise<Array<{title:string, pubDate:string}>>} - 返回新闻条目数组
 */
async function fetchRSSData() {
  const req = new Request(RSS_URL);
  const resp = await req.loadString();
  const items = parseRSS(resp);
  if (!items || items.length === 0) {
    throw new Error("从RSS解析出0条新闻");
  }
  return items;
}

/**
 * 加载缓存数据
 * @returns {Array<{title:string, pubDate:string}>} - 缓存的新闻条目
 */
function loadCache() {
  const CACHE_VALIDITY = 24 * 60 * 60 * 1000; // 缓存有效期：24小时

  if (CACHE_CONFIG.method === "Keychain") {
    // 使用Keychain加载缓存
    if (Keychain.contains(CACHE_CONFIG.keychain.cacheKey)) {
      try {
        const json = Keychain.get(CACHE_CONFIG.keychain.cacheKey);
        const { version, timestamp, data } = JSON.parse(json);
        if (version !== CACHE_CONFIG.keychain.version || (Date.now() - timestamp > CACHE_VALIDITY)) {
          console.warn("缓存已过期或版本不匹配，弃用缓存");
          return [];
        }
        if (Array.isArray(data)) return data;
      } catch (e) {
        console.warn("解析Keychain缓存失败:", e);
      }
    }
    return [];
  } else if (CACHE_CONFIG.method === "FileManager") {
    // 使用FileManager加载缓存
    const fm = getFileManager(CACHE_CONFIG.fileManager.storageType);
    const cachePath = getCachePath();

    if (fm.fileExists(cachePath)) {
      try {
        const json = fm.readString(cachePath);
        const { version, timestamp, data } = JSON.parse(json);
        if (version !== CACHE_CONFIG.fileManager.version || (Date.now() - timestamp > CACHE_VALIDITY)) {
          console.warn("缓存已过期或版本不匹配，弃用缓存");
          return [];
        }
        if (Array.isArray(data)) return data;
      } catch (e) {
        console.warn("解析FileManager缓存失败:", e);
      }
    }
    return [];
  } else {
    console.warn("未选择有效的缓存方式");
    return [];
  }
}

/**
 * 保存缓存数据
 * @param {Array<{title:string, pubDate:string}>} items - 要缓存的新闻条目
 */
function saveCache(items) {
  const payload = {
    version: CACHE_CONFIG.method === "Keychain" ? CACHE_CONFIG.keychain.version : CACHE_CONFIG.fileManager.version,
    timestamp: Date.now(), // 缓存保存时间戳
    data: items
  };

  if (CACHE_CONFIG.method === "Keychain") {
    // 使用Keychain保存缓存
    try {
      Keychain.set(CACHE_CONFIG.keychain.cacheKey, JSON.stringify(payload));
      console.log("缓存已成功保存到Keychain");
    } catch (e) {
      console.warn("保存Keychain缓存失败:", e);
    }
  } else if (CACHE_CONFIG.method === "FileManager") {
    // 使用FileManager保存缓存
    const fm = getFileManager(CACHE_CONFIG.fileManager.storageType);
    const cachePath = getCachePath();
    try {
      fm.writeString(cachePath, JSON.stringify(payload));
      console.log("缓存已成功保存到FileManager: " + cachePath);
    } catch (e) {
      console.warn("保存FileManager缓存失败:", e);
    }
  } else {
    console.warn("未选择有效的缓存方式，无法保存缓存");
  }
}

/**
 * 从图床拉取Logo并缓存
 * @returns {Promise<Image|null>} - 返回Logo Image对象或null
 */
async function fetchLogo() {
  const fm = getFileManager(CACHE_CONFIG.fileManager.storageType);
  const logoCachePath = getLogoCachePath();

  // 如果本地/云端已经存在Logo缓存文件，则尝试读取
  if (fm.fileExists(logoCachePath)) {
    try {
      const cachedImage = fm.readImage(logoCachePath);
      if (cachedImage) {
        console.log("使用缓存的Logo");
        return cachedImage;
      }
    } catch (e) {
      console.warn("读取缓存Logo失败:", e);
    }
  }

  // 如果没有缓存，则从图床拉取
  try {
    const req = new Request(ICON.url);
    const logoData = await req.loadImage();
    fm.writeImage(logoCachePath, logoData);  // 写入缓存
    console.log("已从图床拉取并缓存Logo");
    return logoData;
  } catch (e) {
    console.warn("拉取Logo失败:", e);
    return null;
  }
}

/**
 * 格式化时间字符串，将GMT/UTC时间转换为[HH:MM]格式
 * @param {string} dateStr - GMT/UTC格式的日期字符串
 * @returns {string} - 格式化后的时间字符串，例如"[14:30]"
 */
function formatTimeStr(dateStr) {
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) return "[??:??]";

  const formatter = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false  
  });
  return `[${formatter.format(dateObj)}]`;
}

/**
 * 获取当前系统本地时间，格式为"HH:MM"
 * @returns {string} - 当前时间字符串，例如"14:30"
 */
function getCurrentHHMM() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  return formatter.format(now);
}

/**
 * 计算字符串的总宽度
 * @param {string} str - 需要计算宽度的字符串
 * @returns {number} - 字符串的总宽度
 */
function getStringWidth(str) {
  let width = 0;
  for (let char of str) {
    width += getCharWidth(char);
  }
  return width;
}

/**
 * 根据字符类型返回对应的宽度
 * 1. 中文字符 / 中文标点  => chinese
 * 2. 英文字母 => english
 * 3. 数字 => number
 * 4. 其他字符 => others
 * @param {string} char - 单个字符
 * @returns {number} - 该字符的宽度
 */
function getCharWidth(char) {
  // 中文字符或中文标点 => chinese
  if (isChineseChar(char) || isChinesePunctuation(char)) {
    return CHARS_WIDTH.chinese;
  }
  // 英文字母 => english(cap)
  else if (isCapitalEnglishLetter(char)) {
    return CHARS_WIDTH.englishcap;
  }
  else if (isEnglishLetter(char)) {
    return CHARS_WIDTH.english;
  }
  // 数字 => number
  else if (isNumber(char)) {
    return CHARS_WIDTH.number;
  }
  // 其他 => others
  else {
    return CHARS_WIDTH.others;
  }
}

/**
 * 判断是否为中文字符（含常见汉字区间）
 * @param {string} char 
 * @returns {boolean}
 */
function isChineseChar(char) {
  // 常规CJK汉字 Unicode区间：\u4E00-\u9FA5
  // 如果需要兼容更多扩展汉字，可再加大范围
  return /[\u4e00-\u9fa5]/.test(char);
}

/**
 * 判断是否为中文标点符号
 * @param {string} char 
 * @returns {boolean}
 */
function isChinesePunctuation(char) {
  // 这里只举例常用的中文标点，可按需求添加
  return /[，。！？；：《》「」『』‘’…%]/.test(char);
}

/**
 * 判断是否为英文大写字符 & 符号 ~ 0.685
 * @param {string} char 
 * @returns {boolean}
 */
function isCapitalEnglishLetter(char) {
  return /[A-Z]/.test(char) || /[【】]/.test(char);
}

/**
 * 判断是否为英文小写字符 & 符号 ~0.536
 * @param {string} char 
 * @returns {boolean}
 */
function isEnglishLetter(char) {
  return /[a-z]/.test(char) || /[@#$^&*()•·\-_""“”]/.test(char);
}

/**
 * 判断是否为数字 & 符号 ~ 0.613
 * @param {string} char 
 * @returns {boolean}
 */
function isNumber(char) {
  return /\d/.test(char) || /[（）]/.test(char);
}

/**
 * 计算动态可显示条目数和行数，并记录每条新闻的“额外行数”扩容情况
 * 
 * @param {Array<{ title:string }>} items - 新闻数组，每个对象起码要有 title
 * @param {number} maxLines - 小组件总行数限制（中尺寸可能是6、大尺寸17等）
 * @param {number} maxTitleLines - 默认给每条新闻的行数限制（中尺寸2行、大尺寸3行等）
 * @param {number} charsPerLine - 单行可容纳多少“字符宽度”（用于估算标题需要几行）
 * @returns {{
 *   finalItemCount: number,
 *   finalLineCount: number,
 *   expansions: number[],
 * }}
 * 
 * 说明：
 *   - finalItemCount：最终展示的新闻条数
 *   - finalLineCount：实际使用的总行数
 *   - expansions：与 items 等长的数组，expansions[i] 表示第 i 条新闻最大显示行数调整参数
 */
function dynamicItemCount(items, maxLines, maxTitleLines, charsPerLine) {
  let totalLines = 0
  let itemCount = 0

  // 1. 先预计算每条新闻需要多少行（needed），只算一次
  //    neededLines[i] = ceil(字符串宽度 / charsPerLine)
  const neededLines = items.map(item => {
    const needed = Math.ceil(getStringWidth(item.title) / charsPerLine)
    return needed
  })

  // 用于记录“额外行数”，默认都为 0
  // expansions[i] + maxTitleLines => 实际给第 i 条新闻的行数
  const expansions = new Array(items.length).fill(0)

  // 2. 第一步：按默认 lineLimit，计算能放多少条
  for (let i = 0; i < items.length; i++) {
    // 该条新闻按默认 lineLimit 需要行数
    const linesNeeded = Math.min(neededLines[i], maxTitleLines)

    if (totalLines + linesNeeded > maxLines) {
      break
    }
    totalLines += linesNeeded
    itemCount++
  }

  // 3. 第二步：若 totalLines < maxLines，尝试给已有条目扩容
  //    (一次只给一个条目多+1行，再检查是否还有余量)
  let canExpand = true
  while (canExpand && totalLines < maxLines) {
    canExpand = false

    // 遍历当前已加入的前 itemCount 条
    for (let i = 0; i < itemCount; i++) {
      // 该条新闻需要多少行
      const needed = neededLines[i]
      // 当前给了多少行
      const currentLimit = maxTitleLines + expansions[i]

      // 如果它的需要行数大于当前给的行数 => 说明被截断了，可多加1行
      if (needed > currentLimit) {
        // 判断是否还剩余1行空间
        if (totalLines + 1 <= maxLines) {
          expansions[i] += 1
          totalLines += 1
          canExpand = true
          break
        }
      }
    }
  }

  // 4. 第三步：若还有剩余行数 && 还有新闻没展示 => 再多展示 1 条新闻
  if (totalLines < maxLines - 1 && itemCount < items.length) {
    const index = itemCount
    const leftover = maxLines - totalLines

    expansions[index] = leftover - maxTitleLines
    totalLines = maxLines
    itemCount += 1
    
  }
  
  let expLable = "No"
  if (expansions.some(x => x!== 0)) {
    expLable = expansions.some(x => x > 0) ? "E" : "+"
  }
  console.log({itemCount, totalLines, expLable})
  return {
    finalItemCount: itemCount,
    finalLineCount: totalLines,
    expansions
  }
}

/* ========== 创建小组件 ========== */

/**
 * 创建小组件
 * @param {Array<{title:string, pubDate:string}>} items - 新闻条目数组
 * @param {Image|null} logoImage - Logo图像对象
 * @returns {ListWidget} - 构建好的小组件
 */
function createWidget(items, logoImage) {
  const widget = new ListWidget();
  const widgetFamily = config.widgetFamily || PREVIEW_SIZE;

  // 根据系统外观设置背景色。若为自动切换用户，注释掉 if (!Device...){}，仅保留widget.backgroundColor...
  if (!Device.isUsingDarkAppearance()) {
    // 系统处于亮模式，设置背景为深色
    widget.backgroundColor = new Color("#1C1C1E");
  }

  // 如果是小尺寸，显示适配提示信息
  if (widgetFamily === "small") {
    widget.addSpacer();
    const tipTxt = widget.addText(CONFIG.SMALL.MESSAGE);
    tipTxt.font = Font.mediumSystemFont(14);
    tipTxt.textColor = Color.white();
    tipTxt.centerAlignText();
    widget.addSpacer();
    return widget;
  }
  
  // ===== 参数设置及数据处理 =====
  // 根据小组件尺寸选择相应的配置
  const isLarge = (widgetFamily === "large");
  const widgetConfig = isLarge ? CONFIG.LARGE : CONFIG.MEDIUM;
  const widgetWidth = WIDGET_WIDTH;
  const timeWidth = TIME_WIDTH;
  const newsWidth = widgetWidth - timeWidth - 10;
  
  // 计算每行字数
  const charsPerLine = (newsWidth - 8) / FONT_SIZE;

  // 计算可展示的新闻条目数及总行数
  const {
    finalItemCount,
    finalLineCount,
    expansions
  } = dynamicItemCount(
    items,
    widgetConfig.MAX_LINES,
    widgetConfig.MAX_TITLE_LINES,
    charsPerLine);
  
  // 提取最终展示新闻数据
  const showList = items.slice(0, finalItemCount);

  // ======== 展示设置 ========
  // 创建顶部区域（标题栏）
  const headerStack = widget.addStack();
  headerStack.layoutHorizontally();
  headerStack.centerAlignContent();
  headerStack.size = new Size(widgetWidth, 0);
  
  headerStack.addSpacer(6);

  // 左侧区域：Logo + 标题
  const leftStack = headerStack.addStack();
  leftStack.layoutHorizontally();
  leftStack.centerAlignContent();
  leftStack.url = "https://m.cls.cn";  // 点击跳转的链接
  
  // Logo
  if (logoImage) {
    const logoImg = leftStack.addImage(logoImage);
    logoImg.imageSize = new Size(18, 18); // Logo尺寸
    logoImg.cornerRadius = 4;
    logoImg.leftAlignImage();
  } else {
    const defaultLogo = SFSymbol.named("photo"); // 默认图标
    const logoImg = leftStack.addImage(defaultLogo.image);
    logoImg.imageSize = new Size(18, 18);
    logoImg.leftAlignImage();
  }

  leftStack.addSpacer(6);
  
  // 标题
  const titleTxt = leftStack.addText(WIDGET_NAME);
  titleTxt.font = Font.mediumSystemFont(16);
  titleTxt.textColor = Color.white();

  headerStack.addSpacer();

  // 右侧区域：更新时间
  const refreshTime = headerStack.addText("更新于 " + getCurrentHHMM());
  refreshTime.font = Font.regularMonospacedSystemFont(10);
  refreshTime.textColor = new Color("#cccccc");
  refreshTime.url = `scriptable:///run/${encodeURIComponent(WIDGET_NAME)}`; // 点击运行小组件
  
  // 右侧区域：当使用缓存数据时显示标识“C”
  if (CACHE_CONFIG.status === "loaded") {
    
    headerStack.addSpacer(4);
    
    const loadCacheLable = headerStack.addText("C");
    loadCacheLable.font = Font.boldSystemFont(10);
    loadCacheLable.textColor = new Color("#cccccc");
  }
  
  // 右侧区域：动态调整显示标识"E"/"+"
  if (expansions.some(x => x !== 0)) {
    
    headerStack.addSpacer(4);
    
    const lable = expansions.some(x => x > 0) ? "E" : "+";
    
    const expLable = headerStack.addText(lable);
    expLable.font =Font.boldSystemFont(10);
    expLable.textColor = new Color("#cccccc");
  }

  headerStack.addSpacer(8);

  widget.addSpacer();

  // 新闻展示区域
  const listStack = widget.addStack();
  listStack.layoutVertically();
  
  // 遍历并添加新闻条目
  for (let i = 0; i < showList.length; i++) {
    const { title, pubDate } = showList[i];

    // 创建单条新闻的水平堆栈
    const rowStack = listStack.addStack();
    rowStack.layoutHorizontally();
    rowStack.size = new Size(widgetWidth, 0);

    // 让每条新闻可点击 -> 跳转到脚本并发送通知
    // 传递参数 type = notify & index = i
    rowStack.url = `scriptable:///run/${encodeURIComponent(WIDGET_NAME)}?type=notify&index=${i}`;

    rowStack.addSpacer(4);

    // 时间区域
    const timeStack = rowStack.addStack();
    timeStack.size = new Size(timeWidth, 0);
    const timeTxt = timeStack.addText(formatTimeStr(pubDate));
    timeTxt.font = Font.regularMonospacedSystemFont(FONT_SIZE);
    timeTxt.textColor = new Color("#cccccc");
    timeTxt.lineLimit = 1;

    rowStack.addSpacer(6);

    // 新闻标题
    const newsTitle = rowStack.addText(title);
    newsTitle.font = Font.systemFont(12);
    newsTitletextColor = new Color("#cccccc");
    newsTitle.lineLimit = widgetConfig.MAX_TITLE_LINES + expansions[i];   // 第 i 条新闻的显示行数
    
    rowStack.addSpacer();

    // 条目间距
    if (i < showList.length - 1) {
      listStack.addSpacer(ROW_SPACING);
    }
  }

  // 调整底部间距
  if (finalLineCount < widgetConfig.MAX_LINES || isLarge) {
    widget.addSpacer();
  }
  
  return widget;
}

/* ========== 主函数 ========== */

/**
 * 主运行函数
 */
async function run() {
  // 从缓存读取数据
  let finalItems = loadCache();
  
  // 检查是否为「通知模式」：点击某条新闻后跳转到脚本，带 query 参数 type = notify & index = i
  if (args.queryParameters.type === "notify") {
    // 获取要通知的索引
    const idx = parseInt(args.queryParameters.index || "0", 10);
    
    // 如果缓存中对应索引的数据存在，则发送通知
    if (finalItems.length > idx) {
      const item = finalItems[idx];
      let n = new Notification();
      n.title = `${WIDGET_NAME}`
      n.body = `${formatTimeStr(item.pubDate)} ${item.content}`;
      await n.schedule();
      App.close()
    } else {
      // 缓存中无数据或索引无效，可考虑给出提示
      console.warn("缓存无可用数据，无法发送通知");
    }
    // 结束脚本，不再渲染小组件
    return;
  }

  // 如果不是「通知模式」，执行正常的小组件逻辑
  try {
    // fetch最新数据
    const fetched = await fetchRSSData();
    finalItems = fetched;
    saveCache(finalItems); // 刷新缓存
  } catch (err) {
    console.warn("拉取RSS失败:", err);
    if (finalItems.length === 0) {
      console.warn("无可用缓存，将显示空白小组件");
    } else {
      // 标记从缓存加载
      CACHE_CONFIG.status = "loaded";
      console.warn("使用缓存数据");
    }
  }

  // 拉取并缓存Logo
  const logoImage = await fetchLogo();
  // 创建小组件
  const widget = createWidget(finalItems, logoImage);

  if (!config.runsInWidget) {
    // 预览
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
        await widget.presentLarge();
        break;
    }
  } else {
    Script.setWidget(widget);
    Script.complete();
  }
}

// 执行主函数
await run();

/* ================ 辅助函数部分 =================== */

/**
 * 获取 FileManager 实例
 * @param {string} storageType - 存储类型："iCloud" | "local"
 * @returns {FileManager} - 对应的FileManager实例
 */
function getFileManager(storageType) {
  // 根据storageType返回对应的FileManager
  return storageType === "iCloud" ? FileManager.iCloud() : FileManager.local();
}

/**
 * 获取数据缓存文件路径
 * 当storageType为"local"时，将缓存数据存储到「Documents/脚本名」文件夹；若无则创建
 * @returns {string} - 缓存文件的完整路径
 */
function getCachePath() {
  const fm = getFileManager(CACHE_CONFIG.fileManager.storageType);

  if (CACHE_CONFIG.fileManager.storageType === "local") {
    // 本地 Documents 目录
    const baseDir = fm.documentsDirectory();
    // 构造子文件夹（脚本名）
    const subFolderPath = fm.joinPath(baseDir, Script.name());

    // 如果该子文件夹不存在，则新建
    if (!fm.fileExists(subFolderPath)) {
      fm.createDirectory(subFolderPath, true);
      console.log(`已创建文件夹: ${subFolderPath}`);
    }

    // 拼接最终缓存文件路径
    return fm.joinPath(subFolderPath, CACHE_CONFIG.fileManager.cacheFileName);

  } else {
    // iCloud 或其他情况，放在Documents根目录
    return fm.joinPath(fm.documentsDirectory(), CACHE_CONFIG.fileManager.cacheFileName);
  }
}

/**
 * 获取Logo缓存文件路径
 * 当storageType为"local"时，将Logo缓存存储到「Documents/脚本名」文件夹；若无则创建
 * @returns {string} - Logo缓存文件的完整路径
 */
function getLogoCachePath() {
  const fm = getFileManager(CACHE_CONFIG.fileManager.storageType);

  if (CACHE_CONFIG.fileManager.storageType === "local") {
    // 本地 Documents 目录
    const baseDir = fm.documentsDirectory();
    // 构造子文件夹（脚本名）
    const subFolderPath = fm.joinPath(baseDir, Script.name());

    // 如果该子文件夹不存在，则新建
    if (!fm.fileExists(subFolderPath)) {
      fm.createDirectory(subFolderPath, true);
      console.log(`已创建文件夹: ${subFolderPath}`);
    }

    // 拼接最终Logo缓存文件路径
    return fm.joinPath(subFolderPath, ICON.cacheName);

  } else {
    // iCloud 或其他情况，放在Documents根目录
    return fm.joinPath(fm.documentsDirectory(), ICON.cacheName);
  }
}
