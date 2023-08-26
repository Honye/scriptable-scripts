# Color Module

颜色处理工具

## 十六进制转 RGBA

类型：

```ts
interface RGBA {
  /** 红色数值，0-255 */
  red: number
  /** 绿色数值，0-255 */
  green: number
  /** 蓝色数值，0-255 */
  blue: number
  /** 透明度，0-1，精确度 0.001 */
  alpha: number
}

/**
 * @param hex 十六进制颜色
 */
function hexToRGBA(hex: string): RGBA
```

示例：

```js
const { hexToRGBA } = importModule('color.module')

hexToRGBA('#ff0000')
// { red: 255, green: 0, blue: 0, alpha: 1 }

// 可省略 #
hexToRGBA('00ff00')
// { red: 0, green: 255, blue: 0, alpha: 1 }

// 支持透明度
hexToRGBA('#0000ff88')
// { red: 0, green: 255, blue: 136, alpha: 0.533 }
```

## RGB 转十六进制

类型：

```ts
/**
 * @returns 十六进制颜色，含 #
 */
function RGBToHex(red: number, green: number, blue: number): string
```

示例：

```js
const { RGBToHex } = importModule('color.module')

RGBToHex(255, 0, 0)
// #ff0000
```

## RGB 转 HSL

类型：

```ts
interface HSL {
  /** 色相 */
  h: number
  /** 饱和度 */
  s: number
  /** 明亮度 */
  l: number
}

function RGBToHSL(red: number, green: number, blue: number): HSL
```

示例：

```js
const { RGBToHSL } = importModule('color.module')

RGBToHSL(255, 0, 0)
// { h: 0, s: 100, l: 50 }
```

## HSL 转 RGB

类型：

```ts
interface RGB {
  /** 红色数值 */
  r: number
  /** 绿色数值 */
  g: nummber
  /** 蓝色数值 */
  b: number
}

function HSLToRGB(h: number, s: number, l: number): RGB
```

示例：

```js
const { HSLToRGB } = importModule('color.module')

HSLToRGB(0, 100, 50)
// { r: 255, g: 0, b: 0 }
```

## 修改明亮度

类型：

```ts
/**
 * @param amount 正负整数
 */
function lightenDarkenColor(hsl: HSL, amount: number): string
```

示例：

```js
const { lightenDarkenColor } = importModule('color.module')

// 提高明亮度
lightenDarkenColor({ h: 0, s: 100, l: 50 }, 10)
// #ff3333

// 降低明亮度
lightenDarkenColor({ h: 0, s: 100, l: 50 }, -10)
// #cc0000
```
