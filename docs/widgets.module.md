# Widgets Module

UI 控件及辅助工具

## addAvatar

圆形头像控件

类型：

```ts
/** 添加圆形头像 */
function addAvatar(
  container: ListWidget | WidgetStack,
  options: {
    /** 图片地址，`src` 和 `image` 参数任选其一 */
    src?: string
    /** 图片，`src` 和 `image` 参数任选其一 */
    image?: Image
    /** 头像大小 */
    size: number
  }
): Promise<WidgetImage>
```

示例：

```js
const { addAvatar } = importModule('widgets.module')

const widget = new ListWidget()
/** 使用网络图作为头像 */
await addAvatar(widget, {
  src: 'https://scriptable.app/assets/appicon.png',
  size: 50
})

/** 直接使用 Image 作为头像 */
const avatar = await addAvatar(widget, {
  image: SFSymbol.named('figure.run.circle.fill').image,
  size: 50
})

widget.presentMedium()
```

## useGrid

网格布局

类型：

```ts
/**
 * 使用网格布局
 * 
 * @returns 返回的对象包含一个 `add` 函数，具体看下面说明
 */
function useGrid(
  /**
   * 网格容器
   * 
   * 只能是 WidgetStack，ListWidget 不支持改变排列方向
   */
  container: WidgetStack,
  options: {
    /** 网格列数量 */
    column: number
    /**
     * 间隙
     *
     * - 传递单个数值时，行间隙和列间隙相同
     * - 传递包含两个数值的数组时，第一个数值是列间隙，第二个数值是行间隙
     */
    gap: number | [number, number]
    /**
     * 网格排列方向（顺序）
     * - `row`：横向排列，先从左往右，后从上往下
     * - `column`：竖向排列，先从上往下，后从左往右
     */
    direction: 'row' | 'column'
  }
): Promise<{
  /**
   * `add` 用于添加自定义内容
   * 
   * 参数是一个回调函数，回调函数接收一个 WidgetStack 类型的参数
   * 
   * 回调函数需操作 `stack` 添加自定义内容，`stack` 代表是整行或整列，并非单格
   */
  add(fn: (stack: WidgetStack) => void): Promise<void>
}>
```

示例：

```js
const { useGrid } = importModule('widgets.module')

const widget = new ListWidget()
const container = widget.addStack()
const { add } = await useGrid(container, {
  column: 4,
  gap: [8, 4]
})

let i = 0
while (i < 10) {
  await add((stack) => {
    const item = stack.addStack()
    // 为每一项设置相同的大小
    item.size = new Size(30, 30)
    item.backgroundColor = Color.gray()
    const text = item.addText(`${i}`)
    text.textColor = Color.white()
  })
  i++
}
widget.presentMedium()
```

完整案例可看 [GitHub Contributions.js](../src/GitHub%20Contributions.js) 和 [Matrix](../src/Matrix.js)

## useArc

圆环进度条

类型：

```ts
function useArc(
  /** 这个参数没有实际意义，未来也许会使用这个参数，可以传递任意值 */
  _: any,
  options: {
    /** 圆环内圈半径长度 */
    radius: number
    /** 圆环宽度 */
    width: number
    /** 圆环背景色 */
    bgColor: Color
    /** 圆环前景色 */
    fgColor: Color
    /** 圆环角度，0-360 */
    angle: number
  }
): Promise<{ image: Image }>
```

示例：

```js
const { useArc } = importModule('widgets.module')

const widget = new ListWidget()
/** 进度为 1/4 的圆环 */
const { image } = await useArc(null, {
  radius: 300,
  width: 40,
  bgColor: Color.gray(),
  fgColor: Color.green(),
  angle: 90
})
widget.backgroundImage = image
widget.presentSmall()
```
