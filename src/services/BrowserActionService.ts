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

import type { State } from '../redux/Store';
import { ListType, SettingID } from '../typings/Enums';
import {
  getHostname,
  returnMatchedExpressionObject,
  CADCOOKIENAME,
  cadLog,
  createPartialTabInfo,
  getAllCookiesForDomain,
  getSetting,
  isAWebpage,
  sleep,
  waitUntil,
} from './Libs';

import browser from 'webextension-polyfill';

// Show the # of cookies in icon
export const showNumberOfCookiesInIcon = async (
  tab: browser.Tabs.Tab,
  cookieLength: number,
) => {
  await browser.action?.setBadgeText({
    tabId: tab.id,
    text: `${cookieLength === 0 ? '' : cookieLength.toString()}`,
  });

  await browser.action?.setBadgeTextColor({
    color: 'white',
    tabId: tab.id,
  });
};

// Set BrowserAction Title with number of cookies in square brackets.
export const showNumberOfCookiesInTitle = async (
  tab: browser.Tabs.Tab,
  otherInfo: {
    cookieLength?: number;
    listType?: string;
    platformOS?: string;
  },
) => {
  const mf = browser.runtime.getManifest();
  // Use Shortened Extension name for mobile.
  const tabTitle = `${otherInfo.platformOS === 'android' ? 'CAD' : mf.name} ${
    mf.version
  }`;

  const curData = /\[(.*)] \((\d*)\)/.exec(
    await browser.action.getTitle({
      tabId: tab.id,
    }),
  );
  const newData = {
    cookies: otherInfo.cookieLength ?? curData?.[2] ?? 0,
    list: otherInfo.listType || (curData && curData[1]) || 'NO LIST',
  };

  await browser.action.setTitle({
    tabId: tab.id,
    title: `${tabTitle} [${newData.list}] (${newData.cookies})`,
  });
};

// Set Badge Color accordingly (to matching list)
const setBadgeColor = async (tab: browser.Tabs.Tab, color = 'default') => {
  const badgeBackgroundColor: { [key: string]: string } = {
    default: 'blue',
    red: 'red',
    yellow: '#e6a32e',
  };

  await browser.action?.setBadgeBackgroundColor({
    color: badgeBackgroundColor[color],
    tabId: tab.id,
  });
};

// Set Background icon color and badgeBackgroundColor accordingly.
const setIconColor = async (
  tab: browser.Tabs.Tab,
  keepDefault = false,
  color = 'default',
) => {
  await browser.action?.setIcon({
    path: {
      48: `icons/icon_48${
        keepDefault || color === 'default' ? '' : `_${color}`
      }.png`,
    },
    tabId: tab.id,
  });

  await setBadgeColor(tab, color);
};

// Set background icon for browser.
export const setGlobalIcon = async (enabled: boolean) => {
  // This sets global icon
  if (browser.action.setIcon) {
    // Set Global Icon
    await browser.action.setIcon({
      path: {
        48: `icons/icon_48${enabled ? '' : '_greyscale'}.png`,
      },
    });

    const tabAwait = await browser.tabs.query({
      windowType: 'normal',
    });
    for (const tab of tabAwait) {
      if (tab.id !== browser.tabs.TAB_ID_NONE) {
        await browser.action.setIcon({
          path: {
            48: `icons/icon_48${enabled ? '' : '_greyscale'}.png`,
          },
          tabId: tab.id,
        });
      }
    }
  }
};

// Check if the site is protected and adjust the icon and titles appropriately
export const checkIfProtected = async (
  state: State,
  tab: browser.Tabs.Tab | undefined = undefined,
  cookieLength?: number,
) => {
  const active = state.settings[SettingID.ACTIVE_MODE].value as boolean;
  let activeTabs: browser.Tabs.Tab[] = [];

  if (tab) {
    activeTabs.push(tab);
  } else {
    // No tab provided - query all active tabs instead.
    activeTabs = await browser.tabs.query({
      active: true,
      windowType: 'normal',
    });
  }

  const results = await Promise.allSettled(
    activeTabs.map(async (aTab) => {
      const matchedExpression = returnMatchedExpressionObject(
        state,
        aTab.cookieStoreId || 'default',
        getHostname(aTab.url || ''),
      );

      if (matchedExpression) {
        await showNumberOfCookiesInTitle(aTab, {
          platformOS: state.cache.platformOs as string,
          listType: matchedExpression.listType,
          cookieLength,
        });
      } else {
        await showNumberOfCookiesInTitle(aTab, {
          platformOS: state.cache.platformOs as string,
          listType: 'NO LIST',
          cookieLength,
        });
      }

      // Can't set icons on Android.
      if (state.cache.platformOs && state.cache.platformOs === 'android') {
        return;
      }

      if (matchedExpression) {
        switch (matchedExpression.listType) {
          case ListType.WHITE:
            if (active) {
              await setIconColor(aTab);
            } else {
              await setBadgeColor(aTab);
            }
            break;
          case ListType.GREY:
            if (active) {
              await setIconColor(
                aTab,
                state.settings[SettingID.KEEP_DEFAULT_ICON].value as boolean,
                'yellow',
              );
            } else {
              await setBadgeColor(aTab, 'yellow');
            }
            break;
          default:
            if (active) {
              await setIconColor(
                aTab,
                state.settings[SettingID.KEEP_DEFAULT_ICON].value as boolean,
                'red',
              );
            } else {
              await setBadgeColor(aTab, 'red');
            }
            break;
        }
      } else if (cookieLength !== undefined && cookieLength === 0) {
        if (active) {
          await setIconColor(aTab);
        } else {
          await setBadgeColor(aTab);
        }
      } else if (active) {
        await setIconColor(
          aTab,
          state.settings[SettingID.KEEP_DEFAULT_ICON].value as boolean,
          'red',
        );
      } else {
        await setBadgeColor(aTab, 'red');
      }
    }),
  );

  const failures = results.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );

  if (failures.length === 1) {
    throw failures[0].reason;
  } else if (failures.length > 0) {
    throw new AggregateError(
      failures.map((failure) => failure.reason),
      'Failed to update one or more tab actions.',
    );
  }
};

const tabActionUpdates = new Map<
  number,
  { version: number; promise: Promise<void> }
>();

export function scheduleTabActionUpdate(
  tabId: number,
  getState: () => State,
): Promise<void> {
  const pending = tabActionUpdates.get(tabId);
  if (pending) {
    pending.version += 1;
    return pending.promise;
  }

  const state = {
    version: 0,
    promise: Promise.resolve(),
  };
  const update = async () => {
    await sleep(750);
    while (true) {
      const version = state.version;
      let currentTab: browser.Tabs.Tab;
      try {
        currentTab = await browser.tabs.get(tabId);
      } catch {
        cadLog(
          {
            msg: 'BrowserActionService.scheduleTabActionUpdate: Tab is no longer valid. Skipping actions.',
            x: { tabId },
          },
          getSetting(getState(), SettingID.DEBUG_MODE) as boolean,
        );
        return;
      }

      if (currentTab.status === 'complete') {
        await updateTabAction(getState(), currentTab);
      }
      if (version === state.version) return;
    }
  };
  state.promise = waitUntil(update()).finally(() => {
    tabActionUpdates.delete(tabId);
  });
  tabActionUpdates.set(tabId, state);
  return state.promise;
}

const updateTabAction = async (
  state: State,
  tab: browser.Tabs.Tab,
): Promise<void> => {
  if (!tab.url || !isAWebpage(tab.url)) return;

  const debug = getSetting(state, SettingID.DEBUG_MODE) as boolean;
  const showNumOfCookiesInIcon = getSetting(
    state,
    SettingID.NUM_COOKIES_ICON,
  ) as boolean;

  const partialTabInfo = createPartialTabInfo(tab);
  const cookies = await getAllCookiesForDomain(state, tab);

  if (!cookies) {
    cadLog(
      {
        msg: 'BrowserActionService.updateTabAction: Libs.getAllCookiesForDomain returned undefined. Skipping tab actions.',
        x: { partialTabInfo },
      },
      debug,
    );
    return;
  }

  const internalCookies = cookies.filter((c) => {
    return c.name === CADCOOKIENAME;
  });
  // Filter out cookie(s) that were set by this extension.
  const cookieLength = cookies.length - internalCookies.length;
  if (cookies.length !== cookieLength) {
    cadLog(
      {
        msg: 'BrowserActionService.updateTabAction: New Cookie Count after filtering out cookie set by extension',
        x: { preFilterCount: cookies.length, newCookieCount: cookieLength },
      },
      debug,
    );
  }
  cadLog(
    {
      msg: 'BrowserActionService.updateTabAction: executing checkIfProtected to update Icons and Title.',
    },
    debug,
  );
  await checkIfProtected(state, tab, cookieLength);

  // Exclude Firefox Android for browser icons and badge texts
  if (showNumOfCookiesInIcon && (state.cache.platformOs || '') !== 'android') {
    cadLog(
      {
        msg: 'BrowserActionService.updateTabAction: executing showNumberOfCookiesInIcon.',
      },
      debug,
    );
    await showNumberOfCookiesInIcon(tab, cookieLength);
  }
};
