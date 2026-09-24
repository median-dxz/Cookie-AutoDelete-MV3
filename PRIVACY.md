# Privacy Policy for Cookie AutoDelete Next Edition

Last updated: September 24, 2026

Cookie AutoDelete Next Edition is a browser extension that deletes cookies and user-selected site data according to rules configured by the user. This policy explains what information the extension handles, why it is needed, where it is stored, and how users can remove it.

## Data handled by the extension

The extension handles the following information locally in the browser:

- **Cookies and related site identifiers.** The extension reads cookie names, values, domains, paths, expiration and security attributes, cookie-store identifiers, and partition information when present. It uses this information to decide which cookies to keep or delete and to restore a cookie when the user selects Restore in the Activity Log. Cookie values can include authentication or session identifiers.
- **Browsing domains and tab state.** The extension reads tab URLs and derives site hostnames or domains to determine when a site is no longer open and eligible for cleanup. It keeps a temporary tab-to-domain mapping for the current browser session.
- **Site data and cleanup scope.** When enabled by the user, the extension asks the browser to remove selected categories of site data, such as HTTP cache, LocalStorage, IndexedDB, and service worker registrations. Manual LocalStorage cleanup also clears SessionStorage in the selected tab and its frames. The extension does not read or retain page text, form contents, keystrokes, or mouse activity.
- **User configuration.** Protection rules, optional cookie-name rules, cleanup settings, counters, and interface preferences are stored so the extension can operate as configured.
- **Activity Log.** When enabled, the extension records affected domains, timestamps, cleanup reasons, site-data categories, and complete records for deleted cookies so those cookies can be restored. Private/incognito cookie-store records are excluded from the persisted Activity Log. Restoring cookies may restore a login session; only restore entries you recognize.
- **Imported files.** Settings and expression files selected by the user are read locally for import. Their contents are not uploaded by the extension.

## How the data is used

The extension uses the data described above only to provide its cookie and site-data cleanup features:

- determine whether a site is still open;
- apply whitelist, greylist, expression, cookie-name, and partitioned-cookie rules;
- delete unprotected cookies and user-selected site data;
- display cookie counts, cleanup notifications, counters, and the Activity Log;
- restore a deleted cookie when the user explicitly requests it; and
- preserve the user's configuration across browser and extension restarts.

The extension's use of user data complies with the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/limited-use), including the Limited Use requirements.

## Storage and deletion

Settings, protection rules, counters, cleanup state, and the optional Activity Log are saved in local extension storage. The extension does not use browser sync storage.

The temporary tab-to-domain mapping is stored in session-scoped extension storage and is cleared by the browser when the browser session ends.

The Activity Log keeps up to 10 cleanup records, replacing older entries as new ones are added. You can delete individual entries or clear the log. Settings and protection rules remain until you change, delete, or reset them. You can also reset the extension's settings, rules, counters, and Activity Log. Uninstalling the extension removes its local extension storage.

When optional site-data cleanup is enabled, the extension also creates a cookie named `CookieAutoDeleteBrowsingDataCleanup` on visited sites to remember them for later cleanup. It is stored in the browser's cookie store with an expiry of one year from creation and may be removed earlier by the extension's cleanup or the browser's cookie settings.

Exporting settings or rules creates a JSON file only after a user action. The downloaded file is then controlled by the user and is not automatically deleted by the extension.

## Transmission, sharing, and sale

The extension does not upload or sell the user data it handles, or share it with the developer or third parties. It has no developer-operated backend, advertising, analytics, or telemetry.

The settings and About pages contain links to project documentation, source code, support pages, and browser-store pages. Opening one of those links is a user-initiated navigation and is subject to the privacy practices of the destination website. The extension does not attach cookies, logs, settings, or other extension data to those links.

## Browser permissions

The extension requests permissions that are necessary for its cookie-cleanup purpose:

- **Cookies and access to websites:** inspect, remove, and restore cookies, including partitioned cookies, and create the site-cleanup cookie described above.
- **Browsing data:** remove the site-data categories selected by the user.
- **Tabs:** detect tab navigation and closure, derive open site domains, and avoid cleaning sites that remain open when that protection is enabled.
- **Alarms:** run cleanup after the delay chosen by the user.
- **Storage:** retain settings, rules, counters, cleanup history, and required internal state locally.
- **Scripting:** clear LocalStorage and SessionStorage in the current site's frames when the user invokes that manual action.
- **Notifications:** report cleanup results and important errors according to the user's notification settings.
- **Context menus:** provide context menu items for cleanup and rule management.

## Security and support reports

Support requests contain only what users choose to submit. Remove cookie values, session identifiers, passwords, access tokens, personal domains, and other sensitive information from exported files, logs, or screenshots before sharing them. Report security vulnerabilities privately as described in [SECURITY.md](./SECURITY.md).

## Changes to this policy

This policy may be updated when the extension's data practices, permissions, or features change. Updates will be committed to the public source repository and the date at the top of this document will be revised. Material changes will also be reflected in the Chrome Web Store disclosure before the affected version is published.

## Contact

Privacy and security questions may be sent to [support.cad@median-dxz.xyz](mailto:support.cad@median-dxz.xyz).

Project repository: <https://github.com/median-dxz/Cookie-AutoDelete-MV3>
