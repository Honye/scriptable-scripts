# Scriptable Scripts

English | [中文](./README.zh.md)

Some scripts used in the iOS app [Scriptable](https://scriptable.app/). 

[iOS Scriptable](https://scriptable.app/) | [macOS Scriptable](https://scriptable.app/mac-beta/)

## Installer Shortcut

Quick install Scriptable script via the share menu, clipboard or scan QRCode.

Quick install the [Installer](#Installer) script.

[Link](https://www.icloud.com/shortcuts/947cf9b80e4540a286f3c5beb19b791f)

## Installer

Quick install Scriptable script via the share menu.

Features:

1. When accessing the JS file online, it can be installed directly through the share menu.
2. Support to install JS files through URL Scheme. `scriptable:///run/installer?url=<encoded url>` or `https://open.scriptable.app/run/installer?url=<encoded url>`

[Source Code](https://raw.githubusercontent.com/Honye/scriptable-scripts/master/dist/Installer.js)

## 10010

- Show the balance, remaining flow, signin state, etc.
- Support dark mode
- Support update

|                       Light                       |                      Dark                       |
| :-----------------------------------------------: | :---------------------------------------------: |
| ![Light mode](./docs/assets/10010_small_light.jpg) | ![Dark mode](./docs/assets/10010_small_dark.jpg) |

[Source code](https://raw.githubusercontent.com/Honye/scriptable-scripts/master/10010/10010.js)

[Quick install](https://open.scriptable.app/run/installer?url=https%3A%2F%2Fraw.githubusercontent.com%2FHonye%2Fscriptable-scripts%2Fmaster%2F10010%2F10010.js) (must have [Installer](#Installer) installed)

## Douban

Daily movie

|                     Small                      |                     Medium                      |    Large    |
| :--------------------------------------------: | :---------------------------------------------: | :---------: |
| ![Small widget](./docs/assets/douban_small.jpg) | ![Small widget](./docs/assets/douban_medium.jpg) | Not support |

[Source code](https://raw.githubusercontent.com/Honye/scriptable-scripts/master/dist/Douban.js)

[Quick install](https://open.scriptable.app/run/installer?url=https%3A%2F%2Fraw.githubusercontent.com%2FHonye%2Fscriptable-scripts%2Fmaster%2Fdist%2FDouban.js) (must have [Installer](#Installer) installed)

## Weibo

Weibo hotsearch without ads

- Customizable appearance. Support `system`, `light` and `dark`
- Customizable using client. Suport [Weibo intl.](https://apps.apple.com/cn/app/weibo-intl/id1215210046?l=en) and [H5](https://m.weibo.cn/)
- Displays the result of the last successful request when a network exception occurs

Fill your prefer `client` and `theme` in the widget Parameter, separated by commas. Like `2,dark`

| Parameter | Description                   |
| --------- | ----------------------------- |
| client    | `1` (H5) or `2` (Weibo intl.) |
| theme     | `system`, `light` or `dark`   |

| Medium & Light                                     | Medium & Dark                                    |
| :------------------------------------------------- | ------------------------------------------------ |
| ![light mode](./docs/assets/weibo_medium_light.jpg) | ![dark mode](./docs/assets/weibo_medium_dark.jpg) |

[Source code](https://raw.githubusercontent.com/Honye/scriptable-scripts/master/dist/Weibo.js)

[Quick install](https://open.scriptable.app/run/installer?url=https%3A%2F%2Fraw.githubusercontent.com%2FHonye%2Fscriptable-scripts%2Fmaster%2Fdist%2FWeibo.js) (must have [Installer](#Installer) installed)

## GitHub Contributions

Fill your username and theme in the widget Parameter, separated by commas. 

- Theme support `system` (default), `light` and `dark`
- Tap the widget open the user GitHub page

| Small & Light                                                | Medium & Dark                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![small widget](./docs/assets/github_small_light.jpg) | ![medium widget](./docs/assets/github_medium_dark.jpg) |

[Source code](https://raw.githubusercontent.com/Honye/scriptable-scripts/master/dist/GitHub%20Contributions.js)

[Quick install](https://open.scriptable.app/run/Installer?url=https%3A%2F%2Fraw.githubusercontent.com%2FHonye%2Fscriptable-scripts%2Fmaster%2Fdist%2FGitHub%2520Contributions.js) (must have [Installer](#Installer) installed)

## Photos

Randomly display the pictures in the album.

| Parameter | Description           |
| --------- | --------------------- |
| album     | The name of the album |

| Albums (In APP)                                              | Photos (In APP)                                              | Widget                                                       |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| <img src="./docs/assets/IMG_1568.PNG" alt="Albums" style="zoom:30%;" /> | <img src="./docs/assets/IMG_1569.PNG" alt="Photos" style="zoom:30%;" /> | <img src="./docs/assets/IMG_1570.PNG" alt="Widget" style="zoom:30%;" /> |

[Source code](https://raw.githubusercontent.com/Honye/scriptable-scripts/master/dist/Photos.js)

[Quick install](https://open.scriptable.app/run/Installer?url=https%3A%2F%2Fraw.githubusercontent.com%2FHonye%2Fscriptable-scripts%2Fmaster%2Fdist%2FPhotos.js) (must have [Installer](#Installer) installed)

## Juejin

### Parameters

| Parameter | Description |
| --------- | ----------- |
| cateID    | Category ID |

#### cateID

| cateID    | Description   |
| --------- | ------------- |
| `be`      | Back-End      |
| `fe`      | Front-End     |
| `android` | Android       |
| `ios`     | iOS           |
| `ai`      | AI            |
| `tools`   | Develop Tools |
| `coding`  | Code life     |
| `reading` | Reading       |

| Light Mode                                                   | Dark Mode                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| <img src="./docs/assets/IMG_1712.JPG" alt="light mode" zoom="30%" /> | <img src="./docs/assets/IMG_1713.JPG" alt="light mode" zoom="30%" /> |

[Source code](https://raw.githubusercontent.com/Honye/scriptable-scripts/master/dist/Juejin.js)

[Quick install](https://open.scriptable.app/run/Installer?url=https%3A%2F%2Fraw.githubusercontent.com%2FHonye%2Fscriptable-scripts%2Fmaster%2Fdist%2FJuejin.js) (must have [Installer](#Installer) installed)
