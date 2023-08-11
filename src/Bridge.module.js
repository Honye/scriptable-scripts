/**
 * @file Scriptable WebView JSBridge native SDK
 * @version 1.0.2
 * @author Honye
 */

/**
 * @typedef Options
 * @property {Record<string, () => void>} methods
 */

const sendResult = (() => {
  let sending = false
  /** @type {{ code: string; data: any }[]} */
  const list = []

  /**
   * @param {WebView} webView
   * @param {string} code
   * @param {any} data
   */
  return async (webView, code, data) => {
    if (sending) return

    sending = true
    list.push({ code, data })
    const arr = list.splice(0, list.length)
    for (const { code, data } of arr) {
      const eventName = `ScriptableBridge_${code}_Result`
      const res = data instanceof Error ? { err: data.message } : data
      await webView.evaluateJavaScript(
        `window.dispatchEvent(
          new CustomEvent(
            '${eventName}',
            { detail: ${JSON.stringify(res)} }
          )
        )`
      )
    }
    if (list.length) {
      const { code, data } = list.shift()
      sendResult(webView, code, data)
    } else {
      sending = false
    }
  }
})()

/**
 * @param {WebView} webView
 * @param {Options} options
 */
const inject = async (webView, options) => {
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
  // 同时执行多次 webView.evaluateJavaScript Scriptable 存在问题
  // 可能是因为 JavaScript 是单线程导致的
  const sendTasks = events.map(({ code, data }) => {
    return (() => {
      try {
        return Promise.resolve(methods[code](data))
      } catch (e) {
        return Promise.reject(e)
      }
    })()
      .then((res) => sendResult(webView, code, res))
      .catch((e) => sendResult(webView, code, e instanceof Error ? e : new Error(e)))
  })
  await Promise.all(sendTasks)
  inject(webView, options)
}

/**
 * @param {WebView} webView
 * @param {string} url
 * @param {Options} options
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
 * @param {Options} options
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
