/**
 * Copyright (c) 2017-2022 Kenny Do and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
 * Licensed under MIT (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/blob/3.X.X-Branch/LICENSE)
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import browser from 'webextension-polyfill';
import { SettingID } from '../typings/Enums';
import AlarmEvents from './AlarmEvents';
import { scheduleTabActionUpdate } from './BrowserActionService';
import CleanupMarker from './CleanupMarker';
import type { CookieChangeInfo } from './CookieEvents';
import {
  cadLog,
  createPartialTabInfo,
  extractMainDomain,
  getHostname,
  getSetting,
} from './Libs';
import StoreUser from './StoreUser';

export default class TabEvents extends StoreUser {
  private static readonly TAB_TO_DOMAIN_STORAGE_KEY = 'tabToDomain';

  public static restoreTabToDomain = async (): Promise<void> => {
    const stored = await browser.storage.session.get(
      TabEvents.TAB_TO_DOMAIN_STORAGE_KEY,
    );
    const tabToDomain = stored[TabEvents.TAB_TO_DOMAIN_STORAGE_KEY];

    if (tabToDomain && typeof tabToDomain === 'object') {
      TabEvents.tabToDomain = tabToDomain as Record<number, string>;
      return;
    }

    const tabs = await browser.tabs.query({ windowType: 'normal' });
    TabEvents.tabToDomain = {};
    for (const tab of tabs) {
      if (tab.id !== undefined) {
        TabEvents.tabToDomain[tab.id] = extractMainDomain(getHostname(tab.url));
      }
    }
    await TabEvents.saveTabToDomain();
  };

  private static saveTabToDomain = (): Promise<void> =>
    browser.storage.session.set({
      [TabEvents.TAB_TO_DOMAIN_STORAGE_KEY]: TabEvents.tabToDomain,
    });

  public static onTabDiscarded(
    tabId: number,
    changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
    tab: browser.Tabs.Tab,
  ): void {
    if (getSetting(StoreUser.store.getState(), SettingID.CLEAN_DISCARDED)) {
      const debug = getSetting(
        StoreUser.store.getState(),
        SettingID.DEBUG_MODE,
      ) as boolean;
      const partialTabInfo = createPartialTabInfo(tab);
      // Truncate ChangeInfo.favIconUrl as we have no use for it in debug.
      if (changeInfo.favIconUrl && debug) {
        changeInfo.favIconUrl = '***';
      }
      if (changeInfo.discarded || tab.discarded) {
        cadLog(
          {
            msg: 'TabEvents.onTabDiscarded: Tab was discarded.  Executing cleanFromTabEvents',
            x: { tabId, changeInfo, partialTabInfo },
          },
          debug,
        );
        TabEvents.cleanFromTabEvents();
      } else {
        cadLog(
          {
            msg: 'TabEvents.onTabDiscarded:  Tab was not discarded.',
            x: { tabId, changeInfo, partialTabInfo },
          },
          debug,
        );
      }
    }
  }
  public static async onTabUpdate(
    tabId: number,
    changeInfo: browser.Tabs.OnUpdatedChangeInfoType & {
      cookieChanged?: CookieChangeInfo;
    },
    tab: browser.Tabs.Tab,
  ): Promise<void> {
    if (changeInfo.status !== 'complete' && !changeInfo.cookieChanged) return;

    const debug = getSetting(
      StoreUser.store.getState(),
      SettingID.DEBUG_MODE,
    ) as boolean;
    const partialTabInfo = createPartialTabInfo(tab);
    // Truncate ChangeInfo.favIconUrl as we have no use for it in debug.
    if (changeInfo.favIconUrl && debug) {
      changeInfo.favIconUrl = '***';
    }
    cadLog(
      {
        msg: 'TabEvents.onTabUpdate: cleanup marker check started and tab action update queued.',
        x: { tabId, changeInfo, partialTabInfo },
      },
      debug,
    );

    await Promise.all([
      CleanupMarker.register(tab),
      scheduleTabActionUpdate(tabId, StoreUser.store.getState),
    ]);
  }

  public static async onDomainChange(
    tabId: number,
    changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
    tab: browser.Tabs.Tab,
  ): Promise<void> {
    const debug = getSetting(
      StoreUser.store.getState(),
      SettingID.DEBUG_MODE,
    ) as boolean;
    if (tab.status === 'complete') {
      const partialTabInfo = createPartialTabInfo(tab);
      const mainDomain = extractMainDomain(getHostname(tab.url));
      // Truncate ChangeInfo.favIconUrl as we have no use for it in debug.
      if (changeInfo.favIconUrl && debug) {
        changeInfo.favIconUrl = '***';
      }
      if (TabEvents.tabToDomain[tabId] === undefined && mainDomain !== '') {
        cadLog(
          {
            msg: 'TabEvents.onDomainChange: First mainDomain set.',
            x: { tabId, changeInfo, mainDomain, partialTabInfo },
          },
          debug,
        );
        TabEvents.tabToDomain[tabId] = mainDomain;
        await TabEvents.saveTabToDomain();
      } else if (
        TabEvents.tabToDomain[tabId] !== mainDomain &&
        (mainDomain !== '' ||
          tab.url === 'about:blank' ||
          tab.url === 'about:home' ||
          tab.url === 'about:newtab' ||
          tab.url === 'chrome://newtab/')
      ) {
        const oldMainDomain = TabEvents.tabToDomain[tabId];
        TabEvents.tabToDomain[tabId] = mainDomain;
        await TabEvents.saveTabToDomain();
        if (
          getSetting(StoreUser.store.getState(), SettingID.CLEAN_DOMAIN_CHANGE)
        ) {
          if (oldMainDomain === '') {
            cadLog(
              {
                msg: 'TabEvents.onDomainChange: mainDomain has changed, but previous domain may have been a blank or new tab.  Not executing domainChangeCleanup',
                x: { tabId, changeInfo, partialTabInfo },
              },
              debug,
            );
            return;
          }
          cadLog(
            {
              msg: 'TabEvents.onDomainChange: mainDomain has changed.  Executing domainChangeCleanup',
              x: {
                tabId,
                changeInfo,
                oldMainDomain,
                mainDomain,
                partialTabInfo,
              },
            },
            debug,
          );
          TabEvents.cleanFromTabEvents();
        } else {
          cadLog(
            {
              msg: 'TabEvents.onDomainChange: mainDomain has changed, but cleanOnDomainChange is not enabled.  Not cleaning.',
              x: {
                tabId,
                changeInfo,
                oldMainDomain,
                mainDomain,
                partialTabInfo,
              },
            },
            debug,
          );
        }
      } else {
        cadLog(
          {
            msg: 'TabEvents.onDomainChange: mainDomain has not changed yet.',
            x: { tabId, changeInfo, mainDomain, partialTabInfo },
          },
          debug,
        );
      }
    }
  }

  public static async onDomainChangeRemove(
    tabId: number,
    removeInfo: {
      windowId: number;
      isWindowClosing: boolean;
    },
  ): Promise<void> {
    cadLog(
      {
        msg: 'TabEvents.onDomainChangeRemove: Tab was closed.  Removing old tabToDomain info.',
        x: { tabId, mainDomain: TabEvents.tabToDomain[tabId], removeInfo },
      },
      getSetting(StoreUser.store.getState(), SettingID.DEBUG_MODE) as boolean,
    );
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete TabEvents.tabToDomain[tabId];
    await TabEvents.saveTabToDomain();
  }

  public static async onDomainChangeReplaced(
    addedTabId: number,
    removedTabId: number,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete TabEvents.tabToDomain[removedTabId];

    const tab = await browser.tabs.get(addedTabId);
    TabEvents.tabToDomain[addedTabId] = extractMainDomain(getHostname(tab.url));
    await TabEvents.saveTabToDomain();
  }

  public static cleanFromTabEvents = async () => {
    if (!getSetting(StoreUser.store.getState(), SettingID.ACTIVE_MODE)) {
      return;
    }

    await AlarmEvents.scheduleActiveModeCleanup();
  };

  protected static tabToDomain: { [key: number]: string } = {};
}
