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
| Visibility | Unlisted |
| Regions | All regions |
| Pricing | Free |
