# Proxy Module

使 Scriptable API 支持链式调用

原使用赋值的方式的 API 可用 set 函数。将属性名首字母大写后前面加上 `set`

如修改 ListWidget 的 backgroundColor 属性：

```js
new ListWidget().setBackgroundColor(Color.blue())
```

为 ListWidget 增加 `next` 函数属性

类型：

```ts
function next(callback: (widget: ListWidget) => void ): ListWidget
```

示例：

```js
const { proxy } = importModule('Proxy.module')

// 放在文件开头
proxy.call(this)

// 使用链式调用 API
const addWord = (widget) => {
  widget.addText('Hello world!')
    .centerAlignText()
    .setFont(Font.boldSystemFont(28))
    .setTextColor(Color.red())
}

new ListWidget()
  .setBackgroundColor(Color.blue())
  .setPadding(0, 0, 0, 0)
  .next(addWord)
  .presentMedium()
```
