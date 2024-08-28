// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: object-group;
/**
 * @version 1.0.0
 * @author Honye
 */

/**
 * @file Scriptable WebView JSBridge native SDK
 * @version 1.0.3
 * @author Honye
 */

/**
 * @typedef Options
 * @property {Record<string, () => void>} methods
 */

const sendResult = (() => {
  let sending = false;
  /** @type {{ code: string; data: any }[]} */
  const list = [];

  /**
   * @param {WebView} webView
   * @param {string} code
   * @param {any} data
   */
  return async (webView, code, data) => {
    if (sending) return

    sending = true;
    list.push({ code, data });
    const arr = list.splice(0, list.length);
    for (const { code, data } of arr) {
      const eventName = `ScriptableBridge_${code}_Result`;
      const res = data instanceof Error ? { err: data.message } : data;
      await webView.evaluateJavaScript(
        `window.dispatchEvent(
          new CustomEvent(
            '${eventName}',
            { detail: ${JSON.stringify(res)} }
          )
        )`
      );
    }
    if (list.length) {
      const { code, data } = list.shift();
      sendResult(webView, code, data);
    } else {
      sending = false;
    }
  }
})();

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
})()`;

  const res = await webView.evaluateJavaScript(js, true);
  if (!res) return inject(webView, options)

  const methods = options.methods || {};
  const events = Array.isArray(res) ? res : [res];
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
      .catch((e) => {
        console.error(e);
        sendResult(webView, code, e instanceof Error ? e : new Error(e));
      })
  });
  await Promise.all(sendTasks);
  inject(webView, options);
};

/**
 * @param {WebView} webView
 * @param {object} args
 * @param {string} args.html
 * @param {string} [args.baseURL]
 * @param {Options} options
 */
const loadHTML = async (webView, args, options = {}) => {
  const { html, baseURL } = args;
  await webView.loadHTML(html, baseURL);
  inject(webView, options).catch((err) => console.error(err));
};

if (config.runsInWidget) {
  const widget = new ListWidget();
  widget.backgroundColor = new Color('#fff');
  Script.setWidget(widget);
  Script.complete();
}

const style =
`.flex {
  display: flex;
}
body {
  font-size: 14px;
  color: #232323;
}
ol {
  padding-inline-start: 2em;
  line-height: 1.6;
}
li + li {
  margin-top: 1em;
}
.mockup img,
.mockup svg {
  width: 120px;
  height: auto;
}
@media (prefers-color-scheme: dark) {
  :root {
    --divider-color: rgba(84,84,88,0.65);
    --card-background: #1c1c1e;
    --list-header-color: rgba(235,235,245,0.6);
  }
  body {
    background: #000;
    color: #fff;
  }
}`;

const html =
`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>小组件尺寸计算</title>
    <style>${style}</style>
  </head>
  <body>
    <main>
      <div class="flex">
        <div class="mockup">
          <img src="https://scriptore.imarkr.com/imgs/screen.png" />
        </div>
        <div>
          <ol>
            <li>桌面壁纸使用不含白色的背景，可以是纯色背景</li>
            <li>长按桌面添加一屏</li>
            <li>按顺序添加此组件的中号组件和大号组件</li>
            <li>截图刚刚新建的一屏后选择截图</li>
          </ol>
        </div>
      </div>
      <input type="file" accept="image/*" placeholder="选择屏幕截图" />
      <pre></pre>
    </main>
    <script module>
      const input = document.querySelector("input");
      const pre = document.querySelector('pre');

      const appendItem = (text) => {
        const div = document.createElement('div')
        div.innerText = text
        pre.appendChild(div)
        return div
      }

      appendItem(\`屏幕分辨率：\${screen.width * devicePixelRatio}x\${screen.height * devicePixelRatio}px\`)

      input.addEventListener("input", (e) => {
        const file = e.target.files[0];
        const image = new Image();
        image.onload = () => {
          const width = image.width;
          const height = image.height;
          console.log(\`屏幕像素：\${width}x\${height} px\`);
          console.log(
            \`设备尺寸：\${width / devicePixelRatio}x\${
              height / devicePixelRatio
            } pt\`
          );

          const ctx = new OffscreenCanvas(width, height).getContext("2d");
          ctx.drawImage(image, 0, 0);
          const imageData = ctx.getImageData(0, 0, width, height);
          const pixels = imageData.data;

          /**
           * @param {number} index
           */
          const isWhite = (index) => {
            const r = pixels[index];
            const g = pixels[index + 1];
            const b = pixels[index + 2];
            const a = pixels[index + 3];
            return r === 255 && g === 255 && b === 255 && a === 255;
          };

          let minX = 0;
          let maxX = width;
          const arr = [];
          const visited = new Array(width * height).fill(false);
          const dfs = (x, y) => {
            const stack = [[x, y]];
            let minX = x,
              maxX = x,
              minY = y,
              maxY = y;
            while (stack.length) {
              const [cx, cy] = stack.pop();
              const index = (cy * width + cx) * 4;

              if (visited[cy * width + cx] || !isWhite(index)) {
                continue;
              }

              visited[cy * width + cx] = true;

              if (cx < minX) minX = cx;
              if (cx > maxX) maxX = cx;
              if (cy < minY) minY = cy;
              if (cy > maxY) maxY = cy;

              const neighbors = [
                [cx + 1, cy],
                [cx - 1, cy],
                [cx, cy + 1],
                [cx, cy - 1],
              ];
              for (const [nx, ny] of neighbors) {
                if (nx > 0 && nx < width && ny > 0 && ny < height) {
                  stack.push([nx, ny]);
                }
              }
            }
            return { minX, minY, maxX, maxY };
          };

          const boxies = [];
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const last = boxies.slice(-1)[0];
              if (last && y <= last.maxY) continue;

              const index = (y * width + x) * 4;
              if (
                isWhite(index) &&
                x > 4 &&
                x < width - 4 &&
                !visited[y * width + x]
              ) {
                const box = dfs(x, y);
                if ((box.maxX - box.minX + 1 > 64) && (box.maxY - box.minY + 1) > 64) {
                  // if: 排除文字和图标
                  boxies.push(box);
                }
                if (boxies.length > 1) break;
              }
            }
            if (boxies.length > 1) break;
          }
          for (const boundingBox of boxies) {
            const boxWidth = boundingBox.maxX - boundingBox.minX + 1;
            const boxHeight = boundingBox.maxY - boundingBox.minY + 1;
            console.log(
              \`最小矩形：[\${boundingBox.minX}, \${boundingBox.minY}] \${boxWidth}x\${boxHeight} px\`
            );
          }
          const [mediumBox, largeBox] = boxies;
          const small = mediumBox.maxY - mediumBox.minY + 1;
          const medium = mediumBox.maxX - mediumBox.minX + 1;
          const large = largeBox.maxY - largeBox.minY + 1;
          const left = mediumBox.minX;
          const right = width - left - small;
          const top = mediumBox.minY;
          const middle = largeBox.minY;
          const bottom = top + (largeBox.minY - mediumBox.minY) * 2;
          console.log({
            small,
            medium,
            large,
            left,
            right,
            top,
            middle,
            bottom,
          });

          appendItem(\`小号尺寸：\${small}x\${small}px \${small / devicePixelRatio}x\${small / devicePixelRatio}pt\`)
          appendItem(\`中号尺寸：\${medium}x\${small}px \${medium / devicePixelRatio}x\${small / devicePixelRatio}pt\`)
          appendItem(\`大号尺寸：\${medium}x\${large}px \${medium / devicePixelRatio}x\${large / devicePixelRatio}pt\`)

          const code = document.createElement('code')
          code.innerText = JSON.stringify(
            { small, medium, large, left, right, top, middle, bottom },
            null,
            4
          ).replace(/"/g, '')
          pre.appendChild(code)
        };
        const reader = new FileReader();
        reader.onload = (e) => {
          image.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    </script>
  </body>
</html>
`;

if (config.runsInApp) {
  const webView = new WebView();
  await loadHTML(webView, { html });
  webView.present(false);
}
