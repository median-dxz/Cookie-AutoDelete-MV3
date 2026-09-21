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

import shortid from 'shortid';
import browser from 'webextension-polyfill';
import { SettingID } from '../typings/Enums';
import { selectSettingValues } from '../redux/SettingsSlice';
import StoreUser from './StoreUser';
import {
  CADCOOKIENAME,
  cadLog,
  createPartialTabInfo,
  extractMainDomain,
  getAllCookiesForDomain,
  getHostname,
  isAWebpage,
  isFirefox,
  isFirstPartyIsolate,
  returnOptionalCookieAPIAttributes,
  waitUntil,
} from './Libs';

// Only tracks running registrations; completed markers live in the cookie store.
const pendingRegistrations = new Map<string, Promise<void>>();

export default class CleanupMarker extends StoreUser {
  public static async register(tab: browser.Tabs.Tab): Promise<void> {
    if (!tab.url || !isAWebpage(tab.url) || tab.url.startsWith('file:')) {
      return;
    }
    const tabUrl = tab.url;

    const settings = selectSettingValues(
      StoreUser.store.getState().settings,
      SettingID.DEBUG_MODE,
      SettingID.CLEANUP_CACHE,
      SettingID.CLEANUP_INDEXEDDB,
      SettingID.CLEANUP_LOCALSTORAGE,
      SettingID.CLEANUP_PLUGINDATA,
      SettingID.CLEANUP_SERVICEWORKERS,
    );
    if (
      !settings.cacheCleanup &&
      !settings.indexedDBCleanup &&
      !settings.localStorageCleanup &&
      !settings.pluginDataCleanup &&
      !settings.serviceWorkersCleanup
    ) {
      return;
    }

    const doRegister = async () => {
      const firstPartyDomain = (await isFirstPartyIsolate())
        ? extractMainDomain(getHostname(tabUrl))
        : '';
      const scopeKey = JSON.stringify([
        getHostname(tabUrl),
        tab.cookieStoreId || 'default',
        firstPartyDomain,
      ]);

      const pending = pendingRegistrations.get(scopeKey);
      if (pending) {
        await pending;
        return;
      }

      const update = (async () => {
        const partialTabInfo = createPartialTabInfo(tab);
        const cookies = await getAllCookiesForDomain(
          StoreUser.store.getState(),
          tab,
        );
        if (
          !cookies ||
          cookies.some((cookie) => cookie.name === CADCOOKIENAME)
        ) {
          return;
        }

        const cookiesAttributes = returnOptionalCookieAPIAttributes(
          isFirefox(StoreUser.store.getState().cache),
          {
            expirationDate: Math.floor(Date.now() / 1000 + 31557600),
            firstPartyDomain,
            name: CADCOOKIENAME,
            // A random non-root path keeps this marker off ordinary requests
            // without exposing a stable extension-specific path.
            path: `/${shortid.generate()}`,
            storeId: tab.cookieStoreId,
            url: tabUrl,
            value: CADCOOKIENAME,
          },
        );
        await browser.cookies.set({ ...cookiesAttributes, url: tabUrl });
        cadLog(
          {
            msg: 'CleanupMarker.register: Site registered for future browsing data cleanup.',
            x: { partialTabInfo, cadLSCookie: cookiesAttributes },
          },
          settings.debugMode as boolean,
        );
      })();

      pendingRegistrations.set(scopeKey, update);
      try {
        await update;
      } finally {
        pendingRegistrations.delete(scopeKey);
      }
    };

    return waitUntil(doRegister());
  }
}
