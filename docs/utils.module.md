# Utils Module

工具集

## phoneSize()

获取小组件尺寸和位置信息

类型：

```ts
/** 小组件尺寸信息，单位统一为 px */
interface SizeInfo {
  /** 小号组件宽和高，宽和高相同 */
  small: number
  /** 中号组件宽，中号组件的高和小号组件的高相同 */
  medium: number
  /** 大号组件高，大号组件的宽和中号组件的宽相同 */
  large: number
  /** 组件置于顶部时组件顶部与屏幕边缘的距离 */
  top: number
  /** 组件置于中部时组件顶部与屏幕边缘的距离 */
  middle: number
  /** 组件置于底部时组件顶部与屏幕边缘的距离 */
  bottom: number
  /** 小号组件置于左边时组件左边与屏幕边缘的距离 */
  left: number
  /** 小号组件置于右边时组件左边与屏幕边缘的距离 */
  right: number
}

/**
 * @param height 屏幕高，计量单位为 px
 */
function phoneSize(height: number): SizeInfo
```

示例：

```js
const { phoneSize } = importModule('utils.module')

const screen = Device.screenResolution()
const size = phoneSize(screen.height)
const scale = Device.screenScale()

const createWidget = () => {
  const { widgetFamily } = config

  // 宽高，单位 px
  const widthPX = widgetFamily === 'large' ? size.medium : size[widgetFamily]
  const heightPX = widgetFamily === 'medium' ? size.small : size[widgetFamily]

  // 宽高，单位 pt
  const height = heightPX / scale
  const width = widthPX / scale

  const widget = new ListWidget()
  widget.addText(`${width} x ${height} pt`)

  return widget
}

if (config.runsInWidget) {
  const widget = createWidget()
  Script.setWidget(widget)
} else if (config.runsInApp) {
  config.widgetFamily = 'medium'
  const widget = createWidget()
  widget.presentMedium()
}
```

## widgetSize()

获取小组件尺寸信息。单位 pt

类型：

```ts
interface Size {
  /** 小号组件宽和高，宽和高相同 */
  small: number
  /** 中号组件宽，中号组件的高和小号组件的高相同 */
  medium: number
  /** 大号组件高，大号组件的宽和中号组件的宽相同 */
  large: number
}

function widgetSize(): Size
```

示例：

```js
const { widgetSize } = importModule('utils.module')

const size = widgetSize()

const createWidget = () => {
  const { widgetFamily } = config

  const width = widgetFamily === 'large' ? size.medium : size[widgetFamily]
  const height = widgetFamily === 'medium' ? size.small : size[widgetFamily]

  const widget = new ListWidget()
  widget.addText(`${width} x ${height} pt`)

  return widget
}

if (config.runsInWidget) {
  const widget = createWidget()
  Script.setWidget(widget)
} else if (config.runsInApp) {
  config.widgetFamily = 'medium'
  const widget = createWidget()
  widget.presentMedium()
}
```

## presentSheet

动作面板

类型：

```ts
/** 选择项 */
interface Option {
  /** 选择项显示文字 */
  title: string
  [key: string]: any
}

function presentSheet(config: {
  /** 选择项列表 */
  options: Option[]
  /** 标题（可选） */
  title?: string
  /** 提示信息（可选） */
  message?: string
  /** 是否显示取消（可选），默认为 `true` */
  showCancel?: boolean
  /** 取消按钮文字（可选），默认为 `'Cancel'` */
  cancelText?: string
}): Promise<{
  /**
   * 用户选择的选择项的索引，从 0 开始
   * 
   * `-1` 代表取消选择
   */
  value: number
  /** 用户选择的项 */
  option: Option
}>
```

示例：

```js
const { presentSheet } = importModule('utils.module')

await presentSheet({
  title: '语言',
  message: '请选择你常用的语言',
  options: [
    { title: '中文简体', code: 'simplified' },
    { title: '中文繁体', code: 'traditional' },
    { title: '英文', code: 'english' }
  ],
  cancelText: '取消'
})
// 若用户选择中文简体结果：
// { value:0, option: { title: "中文简体", code: "simplified" } }
```

## getImage

获取网络图

类型：

```ts
function getImage(url: string): Image
```

示例：

```js
const { getImage } = importModule('utils.module')

const url = 'https://scriptable.app/assets/appicon.png'
const image = await getImage(url)
const widget = new ListWidget()
widget.backgroundImage = image
widget.presentSmall()
```

## isSameDay

是否是同一天

类型：

```ts
type DateType = Date | string | number

function isSameDay(date1: DateType, date2: DateType): boolean
```

示例：

```js
const { isSameDay } = importModule('utils.module')

isSameDay('2023/08/24 00:00:00', '2023/08/24 08:24:00')
// true

const date1 = new Date('2023/08/24')
const date2 = new Date('2023/09/03')
isSameDay(date1, date2)
// false

isSamleDay(date1.getTime(), date2.getTime())
// false
```

## isToday

是否是今天

类型：

```ts
function isToday(date: Date | string | number): boolean
```

示例：

```js
const { isToday } = importModule('utils.module')

// 今天是 2023 年 8 月 26 日
const today = new Date()
isToday('2023/08/24')
// false

isToday(today)
// true
```

## tintedImage

图标换色。仅支持纯色

类型：

```ts
function tintedImage(image: Image, color: Color): Image
```

示例：

```js
const { tintedImage } = importModule('utils.module')

const sfs = SFSymbol.named('star.fill')
sfs.applyFont(Font.systemFont(18))
const image = sfs.image
const widget = new ListWidget()
// 图标改为红色
const bg = await tintedImage(image, Color.red())
widget.backgroundImage = bg
widget.presentSmall()
```

## useFileManager

规范使用 FileManager。每个脚本使用独立文件夹，既利于脚本环境隔离，又便于用户管理

使用脚本名作为目录名，脚本名用户可随意修改

注意：

- 在桌面组件中无法写入 cacheDirectory 和 temporaryDirectory
- 用户修改脚本名后原保存的文件不会自动重命名（迁移）。如果有需要，可在脚本向用户提供改名入口，建议用户使用脚本提供的改名入口而不使用 Scriptable 的改名，在脚本内做重命名（迁移）

类型：

```ts
interface IFileManger {
  /** 独立文件夹路径 */
  cacheDirectory: string
  /** 写入字符，当文件不存在时会自动创建 */
  writeString(filePath: string, content: string): void
  /**
   * 写入 JSON 数据
   * @param jsonData 可 JSON 格式化的数据类型
   */
  writeJSON(filePath: string, jsonData: any): void
  /** 保存图片，当文件不存在时会自动创建 */
  writeImage(filePath: string, image: Image): void
  /**
   * 读取字符
   * @returns 当文件不存在时返回 `null`
   */
  readString(filePath: string): string | null
  /**
   * 读取 JSON 数据并自动解析
   * @returns 当文件不存在时返回 `null`
   */
  readJSON(filePath: string): any
  /**
   * 读取图片
   * @returns 当文件不存在时会出错
   */
  readImage(filePath: string): Image
}

function useFileManger(options: {
  /** 是否使用 iCloud 同步，默认 `false` */
  useICloud?: boolean
  /** 自定义基础路径 */
  basePath?: string
}): IFileManger
```

示例：

```js
const { useFileManager } = importModule('utils.module')

const fm = useFileManager()
const settings = {
  fontSize: 14
}
const filePath = 'settings.json'
// 保存设置
fm.writeJSON(filePath, settings)

// 读取设置
fm.readJSON(filePath)
// { fontSize: 14 }
```

## useCache

规范使用文件缓存，每个脚本使用独立文件夹

基于 `useFileManager` 的二次封装

为什么二次封装？`useCache` 用于操作缓存文件，用户可随意删除且不影响脚本正常使用的文件

```js
const useCache = () => useFileManager({ basePath: 'cache' })
```

## isRunSelf

用于判断脚本运行入口是否当前脚本

当前脚本被通过 `importModule` 导入运行就不是

类型：

```ts
/**
 * @param filename 当前脚本文件路径
 * @returns
 * - 若运行入口为当前脚本返回 `true`
 * - 若当前脚本作为模块被引用返回 `false`
 */
function isRunSelf(filename): boolean
```

```js
const { isRunSelf } = importModule('utils.module')

isRunSelf(module.filename)
```

## hashCode

字符转 Hash。相同字符对应的 Hash 值是唯一的（相同的）

类型：

```ts
function hashCode(data: string): number
```

示例：

```js
const { hashCode } = importModule('utils.module')

const url = 'https://scriptable.app/assets/appicon.png'
hashCode(url)
// 1847000305
```

## timeOffset

得到距离当前时间的时差的可读性文案。据 Scriptable 应用设置语言支持中英双语

类型：

```ts
/**
 * @param date 想要查询的时间
 */
function timeOffset(date: Date): string
```

示例：

```js
const { timeOffset } = importModule('utils.module')

timeOffset(new Date('2023/08/26 23:00:00'))
// 25 分钟前
```

## vw

小组件尺寸的百分比宽度

类型：

```ts
/**
 * @param {number} percent 0-100 的整数
 */
function vw(percent: number): number
```

示例：

```js
const { vw } = importModule('utils.module')

// 30% 宽
vw(30)
```

## vh

小组件尺寸的百分比高度

类型：

```ts
/**
 * @param {number} percent 0-100 的整数
 */
function vh(percent: number): number
```

示例：

```js
const { vh } = importModule('utils.module')

// 30% 高
vh(30)
```

## vmin

小组件尺寸的最小百分比尺寸。当宽比高小时，`vmin(30)` 代表 30% 的宽，当高比宽小时，`vmin(30)` 代表 30% 的高

类型：

```ts
/**
 * @param {number} percent 0-100 的整数
 */
function vmin(percent: number): number
```

示例：

```js
const { vmin } = importModule('utils.module')

vmin(30)
```
