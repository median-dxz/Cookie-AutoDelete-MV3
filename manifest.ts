import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  background: {
    service_worker: 'src/background.ts',
  },
  description: '__MSG_extensionDescription__',
  homepage_url: 'https://github.com/Cookie-AutoDelete/Cookie-AutoDelete',
  author: {
    email: 'cad-developers@googlegroups.com',
  },
  default_locale: 'en',
  action: {
    default_icon: {
      '48': 'icons/icon_48.png',
    },
    default_title: 'Cookie AutoDelete',
    default_popup: 'src/ui/popup/popup.html',
  },
  icons: {
    '48': 'icons/icon_48.png',
    '128': 'icons/icon_128.png',
  },
  minimum_chrome_version: '74',
  options_page: 'src/ui/settings/settings.html',
  host_permissions: ['<all_urls>'],
  permissions: [
    'activeTab',
    'alarms',
    'browsingData',
    'contextMenus',
    'cookies',
    'notifications',
    'storage',
    'tabs',
  ],
  manifest_version: 3,
  name: '__MSG_extensionName__',
  version: '3.999.999',
});
