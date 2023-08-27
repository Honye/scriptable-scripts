# Bridge Module

Scriptable JS 与 WebView HTML 通信的工具

**注意：无论是发送还是接收的数据都只能是可以 JSON 序列化的数据**

类型：

```ts
interface Options {
  /**
   * Scriptable 原生 JS 函数。用于在 WebView 中调用
   *
   * 可以接收单个参数，参数必须是可 JSON 序列化的数据
   *
   * 返回结果会传递给 WebView
   */
  methods?: Record<string, (data?: any) => void>
}

/**
 * 加载在线网页
 * @param url 网页地址
 */
export function loadURL(webView: WebView, url: string, options: Options): Promise<void>

/** 加载静态 HTML */
export function loadHTML(
  webView: WebView,
  args: {
    html: string
    /** 页面右上角分享的地址 */
    baseURL?: string
  },
  options: Options
): Promise<void>
```

使用 `loadURL` 或 `loadHTML` 会向网页注入全局变量 `ScriptableBridge`，类型如下：

```ts
interface ScriptableBridge {
  /**
   * 调用 Scriptable 原生函数
   * @param name 前面 options.methods 中定义的函数名
   * @param data 函数需要的参数，仅支持可 JSON 序列化的数据
   * @param callback 回调函数，接收 Scriptable 函数返回的结果
   */
  invoke(name: string, data: any, callback: (...args: any[]) => void)
}
```

示例：

```js
const { loadHTML } = importModule('Bridge.module')

const html =
`<html>
  <head>
    <meta name="viewport" content="width=device-width">
    <title>Scriptable Bridge</title>
  </head>
  <body>
    <button id="btn1">Scriptable Alert</button>
    <button id="btn2">获取屏幕分辨率</button>
    <p id="result"></p>
    <script type="module">
      const btn1 = document.getElementById('btn1')
      const btn2 = document.getElementById('btn2')

      btn1.addEventListener('click', () => {
        ScriptableBridge.invoke('alert', 'Hello!')
      })
      btn2.addEventListener('click', () => {
        ScriptableBridge.invoke(
          'getCcreenResolution',
          null,
          (size) => {
            const { width, height } = size
            document.getElementById('result').innerText = width + ' x ' + height
          }
        )
      })
    </script>
  </body>
</html>`

const webView = new WebView()
const methods = {
  alert(msg) {
    const _alert = new Alert()
    _alert.message = msg
    _alert.present()
  },
  getCcreenResolution() {
    return Device.screenResolution()
  }
}
await loadHTML(webView, { html }, { methods })
webView.present(true)
```
