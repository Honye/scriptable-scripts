/**
 * @file Scriptable WebView JSBridge native SDK
 * @version 1.0.1
 * @author Honye
 */

/**
 * @param {WebView} webView
 * @param {*} options
 */
const inject = async (webView, options) => {
  /**
   * @param {string} code
   * @param {*} data
   */
  const sendResult = async (code, data) => {
    const eventName = `ScriptableBridge_${code}_Result`
    try {
      await webView.evaluateJavaScript(
        `window.dispatchEvent(
          new CustomEvent(
            '${eventName}',
            { detail: ${JSON.stringify(data)} }
          )
        )`
      )
    } catch (e) {
      console.error('[native] sendResult error:')
      console.error(e)
    }
  }

  const js =
`(() => {
  const queue = window.__scriptable_bridge_queue
  if (queue && queue.length) {
    completion(queue)
  }
  window.__scriptable_bridge_queue = null

  if (!window.ScriptableBridge) {
    window.ScriptableBridge = {
      invoke(name, data, callback) {
        const detail = { code: name, data }

        const eventName = \`ScriptableBridge_\${name}_Result\`
        const controller = new AbortController()
        window.addEventListener(
          eventName,
          (e) => {
            callback && callback(e.detail)
            controller.abort()
          },
          { signal: controller.signal }
        )

        if (window.__scriptable_bridge_queue) {
          window.__scriptable_bridge_queue.push(detail)
          completion()
        } else {
          completion(detail)
          window.__scriptable_bridge_queue = []
        }
      }
    }
    window.dispatchEvent(
      new CustomEvent('ScriptableBridgeReady')
    )
  }
})()`

  const res = await webView.evaluateJavaScript(js, true)
  if (!res) return inject(webView, options)

  const methods = options.methods || {}
  const events = Array.isArray(res) ? res : [res]
  for (const { code, data } of events) {
    // TODO 同时执行多次 webView.evaluateJavaScript 存在问题
    // ;(async () => {
    //   sendResult(code, await methods[code]?.(data))
    // })()
    await sendResult(code, await methods[code]?.(data))
  }
  inject(webView, options)
}

/**
 * @param {WebView} webView
 * @param {string} url
 * @param {*} options
 */
const loadURL = async (webView, url, options = {}) => {
  await webView.loadURL(url)
  inject(webView, options).catch((err) => console.error(err))
}

/**
 * @param {WebView} webView
 * @param {object} args
 * @param {string} args.html
 * @param {string} [args.baseURL]
 * @param {*} options
 */
const loadHTML = async (webView, args, options = {}) => {
  const { html, baseURL } = args
  await webView.loadHTML(html, baseURL)
  inject(webView, options).catch((err) => console.error(err))
}

module.exports = {
  loadURL,
  loadHTML
}
