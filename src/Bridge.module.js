/**
 * @file Scriptable WebView JSBridge native SDK
 * @version 1.0.0
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
  const sendResult = (code, data) => {
    webView.evaluateJavaScript(
`window.dispatchEvent(
  new CustomEvent(
    \`ScriptableBridge_${code}_Result\`,
    { detail: ${JSON.stringify(data)} }
  )
)`
    )
  }

  const js =
`(() => {
  const queue = window.__scriptable_bridge_queue
  if (queue && queue.length) {
    completion(queue)
  }
  window.__scriptable_bridge_queue = null

  const controller = new AbortController()
  window.addEventListener(
    'ScriptableBridge',
    (e) => {
      completion(e.detail)
      window.__scriptable_bridge_queue = []
      controller.abort()
    },
    { signal: controller.signal }
  )
  if (!window.ScriptableBridge) {
    window.dispatchEvent(
      new CustomEvent('ScriptableBridgeReady')
    )
    window.ScriptableBridge = {
      invoke(name, data, callback) {
        const detail = { code: name, data }
        if (window.__scriptable_bridge_queue) {
          window.__scriptable_bridge_queue.push(detail)
        } else {
          window.dispatchEvent(
            new CustomEvent(
              'ScriptableBridge',
              { detail }
            )
          )
        }
        const controller = new AbortController()
        window.addEventListener(
          ${'`'}ScriptableBridge_${'$'}{name}_Result${'`'},
          (e) => {
            callback && callback(e.detail)
          },
          { signal: controller.signal }
        )
      }
    }
  }
})()`

  const res = await webView.evaluateJavaScript(js, true)
  const methods = options.methods || {}
  if (Array.isArray(res)) {
    for (const { code, data } of res) {
      ;(async () => {
        sendResult(code, await methods[code]?.(data))
      })()
    }
  } else {
    const { code, data } = res
    ;(async () => {
      sendResult(code, await methods[code]?.(data))
    })()
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
