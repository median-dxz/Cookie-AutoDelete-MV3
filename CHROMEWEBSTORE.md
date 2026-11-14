# Chrome Web Store — Cookie AutoDelete Next Edition

## Store listing

### Extension name

Cookie AutoDelete Next Edition

### Short description

Control your cookies! Automatically delete unwanted cookies from closed tabs while keeping the ones you want.

### Detailed description

```text
Cookie AutoDelete Next Edition removes unwanted cookies and selected site data after you close a tab or leave a site, while keeping the sites and logins you choose to protect.

Features
• Automatic cleanup — choose a delay before unprotected cookies are removed.
• Whitelist and greylist — keep cookies for trusted sites permanently, or until the browser restarts.
• Protection rules — protect domains, subdomains, selected cookie names, and partitioned cookies.
• Manual cleanup — clean the current site or run a broader cleanup from the extension popup.
• Optional site-data cleanup — remove HTTP cache, LocalStorage, IndexedDB, and service worker registrations. Manual LocalStorage cleanup also clears SessionStorage in the current tab and its frames. CacheStorage is not supported. Automatic site-data cleanup may not clear storage on non-default ports.
• Activity Log — review recent cleanup actions and restore recently deleted cookies. When logging is enabled, complete cookie records are saved locally for restoration.
• Backup and transfer — export or import settings and protection rules as JSON files.

To get started, open the popup and enable automatic cleaning. Add sites whose cookies you want to keep to the whitelist, or to the greylist to keep them until the browser restarts.

Privacy and permissions
Cookies, site domains, settings, rules, and cleanup records are handled locally in your browser. Site access is needed to identify open sites and clean their cookies and selected site data according to your rules. The extension does not send this data to the developer or third parties, contains no advertising or analytics, and does not sync settings between devices.

About this project
This is an independently maintained community fork of Cookie AutoDelete, distributed under the MIT License. It is not affiliated with or endorsed by the original maintainers.

Source code: https://github.com/median-dxz/Cookie-AutoDelete-MV3
Support: https://github.com/median-dxz/Cookie-AutoDelete-MV3/issues
```

### Category

Productivity

### Primary language

English

### Translation — Chinese (Simplified) / 中文（简体）

#### Extension name

Cookie AutoDelete Next Edition

#### Short description (简短说明，不超过 132 字符)

控制你的 Cookie！关闭标签页时自动删除未保护的 Cookie 和选定站点数据，同时保留你信任的登录状态。

#### Detailed description (详细说明)

```text
Cookie AutoDelete Next Edition 会在您关闭标签页或离开网站后，自动清除不需要的 Cookie 和选定的站点数据，同时完整保留您加入白名单信任的网站与登录状态。

主要功能
• 自动清理 — 支持自定义延迟时间，随后自动清除未受保护的 Cookie。
• 白名单与灰名单 — 永久保留受信任站点的 Cookie，或保留至浏览器重启。
• 规则保护 — 支持按域名、子域名、特定 Cookie 名称及分区 Cookie（CHIPS）进行灵活保护。
• 手动清理 — 可随时在扩展弹出窗口中针对当前网站或全局执行即时清理。
• 可选站点数据清理 — 支持清理 HTTP 缓存、LocalStorage、IndexedDB 和 Service Worker 注册信息。在当前标签页执行手动清理时亦可清理 SessionStorage。不支持 CacheStorage。在非默认端口上的站点数据可能无法完全清理。
• 活动日志 — 查看近期的清理记录，并支持一键恢复误删的 Cookie。启用日志记录时，完整的 Cookie 信息将保存在本地以便恢复。
• 备份与迁移 — 支持将全部设置与规则一键导出或导入为 JSON 文件。

使用入门
打开扩展弹出面板并启用“自动清理”。将您希望保留 Cookie 的网站加入白名单（永久保留）或灰名单（保留至浏览器重启）。

隐私与权限说明
所有的 Cookie、网站域名、设置、规则与清理记录均完全在您的本地浏览器中处理。扩展申请的站点访问权限仅用于识别已打开的网页并根据您的规则执行清理。本扩展绝不向开发者或任何第三方服务器传输任何数据，不包含任何广告或统计代码，亦不跨设备同步设置。

关于本项目
本项目是基于 MIT 许可独立维护的 Cookie AutoDelete 社区分支，与原项目维护者无隶属关系。

源码仓库：https://github.com/median-dxz/Cookie-AutoDelete-MV3
反馈入口：https://github.com/median-dxz/Cookie-AutoDelete-MV3/issues
```

## Privacy and permissions

### Single purpose

Deletes cookies and user-selected site data automatically or on request, according to the user's protection rules and cleanup settings.

### Permission justifications

| Permission | Justification |
| --- | --- |
| `cookies` | Used to inspect and delete cookies according to the user's protection rules, including partitioned cookies, update cookie counts, and restore deleted cookies from the local Activity Log at the user's request. When optional site-data cleanup is enabled, it also creates a cookie to remember which sites to include in later cleanup. |
| `browsingData` | Used to remove the site-data categories enabled or manually selected by the user: HTTP cache, LocalStorage, IndexedDB, and service worker registrations. Cleanup follows the user's settings and protection rules. |
| `tabs` | Used to read tab URLs and observe tab state changes to determine which sites remain open and when cleanup should run. This prevents cleaning open sites when the user has enabled that protection. |
| `alarms` | Used to run automatic cleanup after the delay chosen by the user. |
| `storage` | Used to save settings, protection rules, counters, recent cleanup records, and cleanup state locally. It also keeps track of open sites during the current browser session. Browser sync storage is not used. |
| `notifications` | Used to display cleanup results, rule-operation confirmations, and errors according to the user's notification settings. |
| `scripting` | Used to clear LocalStorage and SessionStorage in the current tab and its frames when the user requests manual page-storage cleanup. |
| `contextMenus` | Used to provide right-click commands for cleanup, protection rules, automatic-cleaning controls, and settings. |
| `<all_urls>` (host access) | Used to manage cookies on sites the user visits and perform user-requested page-storage cleanup. Access cannot be limited to a fixed set of websites because users choose which sites to visit, protect, and clean. |

### Remote code

No. All executable code is included in the extension package. Documentation and support links open external pages; they do not load code into the extension.

### Data categories

| Category | Draft answer |
| --- | --- |
| Personally identifiable information | No |
| Health information | No |
| Financial and payment information | No |
| Authentication information | Yes — cookie records, including login or session identifiers, are processed locally and may be saved in the Activity Log for restoration. |
| Personal communications | No |
| Location | No |
| Web history | Yes — tab URLs identify open sites; cleanup records may include site domains. |
| User activity | No — no network monitoring or recording of clicks, mouse position, scrolling, or keystrokes. The Activity Log records cleanup results. |
| Website content | No — no collection of page text, images, audio, video, or hyperlinks. Site storage is cleared without reading its contents; authentication cookies are disclosed above. |

### Limited-use certification

| Statement | Answer |
| --- | --- |
| User data is used only for the disclosed cookie and site-data cleanup purpose. | Yes |
| User data is not sold or transferred to third parties. | Yes |
| User data is not used for personalized advertising. | Yes |
| User data is not used for creditworthiness or lending. | Yes |
| Project maintainers do not receive or read extension data, except information users choose to send in support requests. | Yes |

## Links and contact information

| Field | Value |
| --- | --- |
| Publisher | median-dxz |
| Contact email | support.cad@median-dxz.xyz |
| Privacy policy URL | https://github.com/median-dxz/Cookie-AutoDelete-MV3/blob/main/PRIVACY.md |
| Homepage | https://github.com/median-dxz/Cookie-AutoDelete-MV3 |
| Support URL | https://github.com/median-dxz/Cookie-AutoDelete-MV3/issues |

## Distribution

| Field | Value |
| --- | --- |
| Extension ID | `ohcmnioddbjkcobbpdeomphnimindmgh` |
| Store URL (Standard) | https://chromewebstore.google.com/detail/cookie-autodelete-next-ed/ohcmnioddbjkcobbpdeomphnimindmgh |
| Store URL (Canonical) | https://chromewebstore.google.com/detail/cookie-autodelete-next-edition/ohcmnioddbjkcobbpdeomphnimindmgh or https://chromewebstore.google.com/detail/ohcmnioddbjkcobbpdeomphnimindmgh |
| Status | Published (Unlisted) |
| Visibility | Unlisted |
| Regions | All regions |
| Pricing | Free |
