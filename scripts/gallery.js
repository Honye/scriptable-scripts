let { body } = $response
if (typeof body === 'string') {
  body = JSON.parse(body)
}
if (body && Array.isArray(body.sections)) {
  /** @type {import('./gallery.types').Link[]} */
  const links = [
    {
      title: 'GitHub',
      url: 'https://github.com/Honye/scriptable-scripts',
      icon: { type: 'fontAwesomeBrand', unicode: 'f09b' }
    },
    {
      title: 'Personal Website',
      url: 'https://imarkr.com',
      icon: { type: 'sfSymbol', name: 'globe' }
    }
  ]
  /** @type {import('./gallery.types').List} */
  const scripts = {
    type: 'scripts',
    title: 'Jackie\'s Widgets',
    items: [
      {
        title: 'Weibo',
        subtitle: 'Weibo search Hot Trending',
        downloadURL: 'https://cdn.jsdelivr.net/gh/Honye/scriptable-scripts/dist/Weibo.scriptable',
        description: '微博热搜小组件',
        shareURL: 'https://scriptable.app/gallery/weibo-trending',
        icon: { glyph: 'fire', color: 'pink' },
        links,
        images: [
          {
            url: 'https:\/\/cdn.jsdelivr.net\/gh\/Honye\/scriptable-scripts@master\/docs\/assets\/Weibo_1.jpg',
            size: { width: 750, height: 1334 }
          }
        ]
      },
      {
        title: 'Photos',
        subtitle: '支持多相册的桌面组件',
        downloadURL: 'https://cdn.jsdelivr.net/gh/Honye/scriptable-scripts/dist/Photos.scriptable',
        description: '新建相册后在桌面编辑组件时输入创建的相册名；设置透明背景后可实现 PNG 透明效果',
        shareURL: 'https://scriptable.app/gallery/im-photos',
        icon: { glyph: 'images', color: 'cyan' },
        links,
        images: [
          {
            url: 'https:\/\/cdn.jsdelivr.net\/gh\/Honye\/scriptable-scripts@master\/docs\/assets\/IMG_1568.PNG',
            size: { width: 828, height: 1792 }
          },
          {
            url: 'https:\/\/cdn.jsdelivr.net\/gh\/Honye\/scriptable-scripts@master\/docs\/assets\/IMG_1569.PNG',
            size: { width: 828, height: 1792 }
          },
          {
            url: 'https:\/\/cdn.jsdelivr.net\/gh\/Honye\/scriptable-scripts@master\/docs\/assets\/IMG_1570.PNG',
            size: { width: 828, height: 1792 }
          },
          {
            url: 'https:\/\/cdn.jsdelivr.net\/gh\/Honye\/scriptable-scripts@master\/docs\/assets\/Photos_1.png',
            size: { width: 750, height: 1334 }
          }
        ]
      },
      {
        title: 'GitHub Contributions',
        subtitle: 'GitHub 贡献网格图',
        downloadURL: 'https://cdn.jsdelivr.net/gh/Honye/scriptable-scripts/dist/GitHub%20Contributions.scriptable',
        description: 'GitHub 贡献网格图',
        shareURL: 'https://scriptable.app/gallery/github-contributions',
        icon: { glyph: 'braille', color: 'deep-gray' },
        links,
        images: [
          {
            url: 'https:\/\/cdn.jsdelivr.net\/gh\/Honye\/scriptable-scripts@master\/docs\/assets\/GitHub_1.png',
            size: { width: 750, height: 1334 }
          },
          {
            url: 'https:\/\/cdn.jsdelivr.net\/gh\/Honye\/scriptable-scripts@master\/docs\/assets\/GitHub_2.png',
            size: { width: 750, height: 1334 }
          }
        ]
      },
      {
        title: 'CoinGecko',
        subtitle: '数字货币实时价格',
        downloadURL: 'https://cdn.jsdelivr.net/gh/Honye/scriptable-scripts/dist/CoinGecko.scriptable',
        description: '数字货币实时价格',
        shareURL: 'https://scriptable.app/gallery/CoinGecko',
        icon: { glyph: 'frog', color: 'green' },
        links,
        images: [
          {
            url: 'https:\/\/cdn.jsdelivr.net\/gh\/Honye\/scriptable-scripts@master\/docs\/assets\/CoinGecko_1.png',
            size: { width: 750, height: 1334 }
          },
          {
            url: 'https:\/\/cdn.jsdelivr.net\/gh\/Honye\/scriptable-scripts@master\/docs\/assets\/CoinGecko_2.png',
            size: { width: 750, height: 1334 }
          }
        ]
      },
      {
        title: 'Calendar',
        subtitle: '和 Apple 日历一样美观的日历，农历显示，可作为打卡日历',
        downloadURL: 'https://cdn.jsdelivr.net/gh/Honye/scriptable-scripts/dist/Calendar.scriptable',
        description: '美观的日历组件\n\n- 支持中英双语\n- 可自定义背景和色彩\n- 编辑组件时可输入系统日历名\n\n- 中号组件可显示事件和自定义是否显示提醒事项\n\n',
        shareURL: 'https://scriptable.app/gallery/im-calendar',
        icon: { glyph: 'calendar-alt', color: 'orange' },
        links,
        images: [
          {
            url: 'https:\/\/cdn.jsdelivr.net\/gh\/Honye\/scriptable-scripts@master\/docs\/assets\/calendar.jpeg',
            size: { width: 828, height: 1792 }
          },
          {
            url: 'https:\/\/cdn.jsdelivr.net\/gh\/Honye\/scriptable-scripts@4161187f9f842532d716aeb6958e026a0e6a13a8\/docs\/assets\/calendar_preview_1.jpg',
            size: { width: 750, height: 1334 }
          }
        ]
      },
      {
        title: 'Countdown',
        subtitle: '倒数日/纪念日',
        downloadURL: 'https://cdn.jsdelivr.net/gh/Honye/scriptable-scripts/dist/Countdown.scriptable',
        description: '纪念日/倒数日\n\n- 支持中英双语\n- 可高度自定义\n\n',
        shareURL: 'https://scriptable.app/gallery/im-countdown',
        icon: { glyph: 'user-clock', color: 'teal' },
        links,
        images: [
          {
            url: 'https:\/\/cdn.jsdelivr.net\/gh\/Honye\/scriptable-scripts@master\/docs\/assets\/countdown_1.jpg',
            size: { width: 750, height: 1334 }
          }
        ]
      },
      {
        title: 'Douban',
        subtitle: '豆瓣每日电影',
        downloadURL: 'https://cdn.jsdelivr.net/gh/Honye/scriptable-scripts/dist/Douban.scriptable',
        description: '豆瓣每日电影',
        shareURL: 'https://scriptable.app/gallery/im-douban',
        icon: { glyph: 'film', color: 'deep-green' },
        links,
        images: [
          {
            url: 'https:\/\/cdn.jsdelivr.net\/gh\/Honye\/scriptable-scripts@master\/docs\/assets\/Douban_1.png',
            size: { width: 750, height: 1334 }
          }
        ]
      },
      {
        title: 'Matrix',
        subtitle: '任意网格排列图片或快捷方式',
        downloadURL: 'https://cdn.jsdelivr.net/gh/Honye/scriptable-scripts/dist/Matrix.scriptable',
        description: '配置说明：\n图片和快捷方式配置暂未提供可视化配置，如需修改默认配置可进入代码编辑模式参照注释修改',
        shareURL: 'https://scriptable.app/gallery/Matrix',
        icon: { glyph: 'th', color: 'blue' },
        links,
        images: []
      },
      {
        title: 'Wallhaven',
        subtitle: 'Wallhaven 壁纸',
        downloadURL: 'https://cdn.jsdelivr.net/gh/Honye/scriptable-scripts/dist/Wallhaven.scriptable',
        description: 'wallhaven.cc 壁纸。精美高清动漫壁纸，也有其他高质量的图片\n\n- 支持中英双语可视化配置\n- 支持 4 种排列方式\n- 自定义过滤搜索规则\n- 点击可查看和收藏\n\n限制级内容需填写个人账号 API Key\n\n',
        shareURL: 'https://scriptable.app/gallery/im-wallhaven',
        icon: { glyph: 'image', color: 'teal' },
        links,
        images: [
          {
            url: 'https:\/\/cdn.jsdelivr.net\/gh\/Honye\/scriptable-scripts@master\/docs\/assets\/Wallhaven_1.png',
            size: { width: 750, height: 1334 }
          },
          {
            url: 'https:\/\/cdn.jsdelivr.net\/gh\/Honye\/scriptable-scripts@master\/docs\/assets\/Wallhaven_2.png',
            size: { width: 750, height: 1334 }
          },
          {
            url: 'https:\/\/cdn.jsdelivr.net\/gh\/Honye\/scriptable-scripts@master\/docs\/assets\/Wallhaven_3.png',
            size: { width: 750, height: 1334 }
          }
        ]
      }
    ],
    layout: { type: 'triple' }
  }

  body.sections.splice(1, 0, scripts)
}

$done({
  body: JSON.stringify(body)
})
