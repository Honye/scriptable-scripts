# withSetting Module

快速实现小组件可视化配置

类型：

```ts
/**
 * @returns 仅在小组件中运行时返回 ListWidget
 */
export function withSettings(options: Options): Promise<ListWidget | undefined>

/** 参数 */
interface Options {
  /** 主页 URL 地址，用于右上角分享 */
  homePage?: string
  /** 在页面顶部插入 HTML */
  head?: string
  /** 表单配置，看下文 */
  formItems: FormItem[]
  /** 
   * 创建小组件
   * @returns 必须返回创建的 ListWidget，支持异步（Promise）
   */
  render(config: {
    /** 用户填写的配置，看下文 */
    settings: Settings,
    /** 组件大小 */
    family?: "small" | "medium" | "large" | "extraLarge" | "accessoryRectangular" | "accessoryInline" | "accessoryCircular"
  }): ListWidget | Promise<ListWidget>
  /**
   * 单项点击事件回调
   * @param item 单项表单配置
   */
  onItemClick?: (item: FormItem) => void
}

/** 表单支持多种类型 */
type FormItem = NormalFormItem | GroupFormItem | PageFormItem

/** 一般表单类型 */
interface NormalFormItem {
  /** 表单名（字段名），唯一 */
  name: string
  /** 标签文本 */
  label: string
  /**
   * 表单类型
   * - `text`: 文本输入框
   * - `number`: 数字输入框
   * - `color`: 颜色选择器
   * - `date`: 日期选择器
   * - `select`: 选择器
   * - `cell`: 可点击项
   */
  type: 'text' | 'number' | 'color' | 'date' | 'select' | 'cell'
  /** 默认值 */
  default?: unknown
  /**
   * 选择器的选项列表，仅当 type 配置为 `select` 时需传递此参数
   */
  options?: {
    /** 选项显示文本 */
    label: string
    /** 选项值 */
    value: unknown
  }[]
}

/** 将表单分组显示 */
interface GroupFormItem {
  /** 固定 type */
  type: 'group'
  /** 表单名（字段名），唯一 */
  name: string
  /** 标签文本，组名 */
  label: string
  items: FormItem[]
}

/** 单独一页的配置 */
interface PageFormItem {
  /** 固定 type */
  type: 'page'
  /** 唯一 */
  name: string
  /** 标签文本 */
  label: string
  /** 表单配置 */
  formItems: FormItem[]
  /**
   * 单项点击事件回调
   * @param item 单项表单配置
   */
  onItemClick?: (item: FormItem) => void
}

/** 用户配置 */
interface Settings {
  /** 是否使用 iCloud 同步配置 */
  useICloud: boolean
  /**
   * 背景图路径
   *
   * 仅当用户配置了背景图才有值
   */
  backgroundImage?: string
  /** 浅色背景颜色，十六进制 */
  backgroundColorLight?: string
  /** 深色背景颜色，十六进制 */
  backgroundColorDark?: string
  [key: string]: unknown
}
```

示例：

示例1：基本示例。无自定义配置

```js
const { withSettings } = importModule('withSettings.module')

const createWidget = (text) => {
  const widget = new ListWidget()
  widget.addText(text)
  return widget
}
const createSmallWidget = () => createWidget('这是小号组件')
const createMediumWidget = () => createWidget('这是中号组件')

await withSettings({
  formItems: [],
  render ({ family }) {
    if (family === 'small') {
      return createSmallWidget()
    }
    if (family === 'medium') {
      return createMediumWidget()
    }
  }
})
```

示例2：一般配置

```js
const { withSettings } = importModule('withSettings.module')

const createWidget = (settings) => {
  const { name, age, color } = settings
  const widget = new ListWidget()
  widget.addText(`姓名：${name}`)
  widget.addText(`年龄：${age}`)
  widget.addText(`喜欢的颜色：${color}`)
  return widget
}

await withSettings({
  formItems: [
    {
      label: '姓名',
      name: 'name',
      type: 'text'
    },
    {
      label: '年龄',
      name: 'age',
      type: 'number'
    },
    {
      label: '喜欢的颜色',
      name: 'color',
      type: 'color'
    }
  ],
  render ({ settings }) {
    return createWidget(settings)
  }
})
```

示例3：分组配置

```js
const { withSettings } = importModule('withSettings.module')

const createWidget = (settings) => {
  const { userName, familyName } = settings
  const widget = new ListWidget()
  widget.addText(`你的姓名：${userName}`)
  widget.addText(`你家人的姓名：${familyName}`)
  return widget
}

await withSettings({
  formItems: [
    {
      label: '个人',
      name: 'user',
      type: 'group',
      items: [
        {
          label: '姓名',
          name: 'userName',
          type: 'text'
        },
        {
          label: '年龄',
          name: 'userAge',
          type: 'number'
        }
      ]
    },
    {
      label: '家人',
      name: 'family',
      type: 'group',
      items: [
        {
          label: '姓名',
          name: 'familyName',
          type: 'text'
        },
        {
          label: '年龄',
          name: 'familyAge',
          type: 'number'
        }
      ]
    }
  ],
  render ({ settings }) {
    return createWidget(settings)
  }
})
```

示例4：单独一页的配置

```js
const { withSettings } = importModule('withSettings.module')

const createWidget = (settings) => {
  const { userName, familyName } = settings
  const widget = new ListWidget()
  widget.addText(`你的姓名：${userName}`)
  widget.addText(`你家人的姓名：${familyName}`)
  return widget
}

await withSettings({
  formItems: [
    {
      label: '个人',
      name: 'user',
      type: 'group',
      items: [
        {
          label: '姓名',
          name: 'userName',
          type: 'text'
        },
        {
          label: '年龄',
          name: 'userAge',
          type: 'number'
        }
      ]
    },
    {
      label: '家人',
      name: 'family',
      type: 'page',
      formItems: [
        {
          label: '姓名',
          name: 'familyName',
          type: 'text'
        },
        {
          label: '年龄',
          name: 'familyAge',
          type: 'number'
        }
      ]
    }
  ],
  render ({ settings }) {
    return createWidget(settings)
  }
})
```

示例5：自定义顶部 HTML

```js
const { withSettings } = importModule('withSettings.module')

const createWidget = (settings) => {
  const { userName, familyName } = settings
  const widget = new ListWidget()
  widget.addText(`你的姓名：${userName}`)
  widget.addText(`你家人的姓名：${familyName}`)
  return widget
}

await withSettings({
  head: `<section>
    <h1>可视化配置</h1>
    <style>
      h1 {
        padding: 0 20px;
      }
    </style>
  </section>`,
  formItems: [
    {
      label: '个人',
      name: 'user',
      type: 'group',
      items: [
        {
          label: '姓名',
          name: 'userName',
          type: 'text'
        },
        {
          label: '年龄',
          name: 'userAge',
          type: 'number'
        }
      ]
    }
  ],
  render ({ settings }) {
    return createWidget(settings)
  }
})
```
