# Lunar Module

农历查询工具

**仅支持查询1949～2100年**

类型：

```ts
/** 农历日期 */
interface LunarDate {
  lunarYear: string
  lunarMonth: string
  lunarDay: string
}

/**
 * @param year 公历年
 * @param month 公历月
 * @param day 公历日
 */
function sloarToLunar(year: number, month: number, day: number): LunarDate
```

示例：

```js
const { sloarToLunar } = importModule('lunar.module')

// 现在是公历 2023年8月26日
const date = new Date()
sloarToLunar(date.getFullYear(), date.getMonth() + 1, date.getDate())
// { lunarYear: "癸卯", lunarMonth: "七", lunarDay: "十一" }
```
