# 规范

- 使用 2 个空格进行缩进
- 字符串统一使用单引号
- 函数声明时括号与函数名间加空格

  ```javascript
  function hello (arg) {...}
  call(function () {...})
  ```

- 函数调用时标识符与括号间不留间隔

  ```javascript
  hello('world')
  ```

- `module.exports.name`

  因打包脚本缺陷问题，当脚本中存在 `module.exports.name` 时会生成量 `name`（`const name`），编写脚本时不允许重复声明变量 `name`

  ```javascript
  // ❌
  const name = 'Jackie'

  module.exports.name = name
  ```

  ```javascript
  // ✅
  const _name = 'Jackie'

  module.exports.name = _name
  ```

- `module.exports =`

  因打包脚本缺陷问题，不允许使用 `module.exports = { name }` 的形式，此形式不能很好的压缩代码

  ```javascript
  // ❌
  const name = 'Jackie'
  const age = 18

  module.exports = { name, age };
  ```

  ```javascript
  // ✅
  module.exports.name = 'Jackie'
  module.exports.age = 18
  ```

- 工具模块统一使用 `.module.js` 为后缀，打包工具会忽略 `.module.js` 后缀的文件
