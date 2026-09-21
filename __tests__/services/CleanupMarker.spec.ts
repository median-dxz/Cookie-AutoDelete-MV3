/**
 * Copyright (c) 2020-2022 Kenneth Tran and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
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

import { when } from 'jest-when';
import type { Store } from 'redux';
import type * as browser from 'webextension-polyfill';

import { configureWrapStore, State } from '../../src/redux/Store';
import * as Lib from '../../src/services/Libs';
import StoreUser from '../../src/services/StoreUser';
import CleanupMarker from '../../src/services/CleanupMarker';
import { addCache } from '../../src/redux/CacheSlice';
import { BrowserName, SettingID } from '../../src/typings/Enums';
import { resetSettings, updateSetting } from '../../src/redux/SettingsSlice';

import { initialState } from '../__mock__/initialState';

const spyLib = global.generateSpies(Lib);

jest.useFakeTimers();

const store: Store<State> = configureWrapStore(initialState);
StoreUser.init(store);

const sampleTab: browser.Tabs.Tab = {
  active: true,
  cookieStoreId: 'firefox-default',
  discarded: false,
  hidden: false,
  highlighted: false,
  incognito: false,
  index: 0,
  isArticle: false,
  isInReaderMode: false,
  lastAccessed: 12345678,
  pinned: false,
  url: 'https://www.example.com',
  windowId: 1,
};

describe('CleanupMarker', () => {
  afterEach(() => {
    store.dispatch(resetSettings());
    jest.clearAllTimers();
  });
  beforeEach(() => {
    when(global.browser.cookies.getAll).defaultResolvedValue([]);
  });

  it.each([
    undefined,
    '',
    'about:home',
    'chrome:newtab',
    'bad',
    'file:///tmp/page.html',
  ])('ignores unsupported URL %s', async (url) => {
    store.dispatch(
      updateSetting({ name: SettingID.CLEANUP_CACHE, value: true }),
    );
    await CleanupMarker.register({ ...sampleTab, url });
    expect(global.browser.cookies.getAll).not.toHaveBeenCalled();
  });

  it('does not register when site-data cleanup is disabled', async () => {
    await CleanupMarker.register(sampleTab);
    expect(global.browser.cookies.set).not.toHaveBeenCalled();
  });

  it('preserves an existing marker', async () => {
    store.dispatch(
      updateSetting({ name: SettingID.CLEANUP_CACHE, value: true }),
    );
    spyLib.getAllCookiesForDomain.mockResolvedValueOnce([
      { name: Lib.CADCOOKIENAME } as browser.Cookies.Cookie,
    ]);
    await CleanupMarker.register(sampleTab);
    expect(global.browser.cookies.set).not.toHaveBeenCalled();
  });

  it.each([
    SettingID.CLEANUP_CACHE,
    SettingID.CLEANUP_INDEXEDDB,
    SettingID.CLEANUP_LOCALSTORAGE,
    SettingID.CLEANUP_PLUGINDATA,
    SettingID.CLEANUP_SERVICEWORKERS,
  ])('should create a cleanup cookie when %s is enabled', async (setting) => {
    when(global.browser.cookies.getAll)
      .calledWith({ domain: 'cookie.net', storeId: 'firefox-default' })
      .mockResolvedValue([] as never);
    store.dispatch(updateSetting({ name: setting, value: true }));
    await CleanupMarker.register({
      ...sampleTab,
      url: 'http://cookie.net',
    });
    expect(global.browser.cookies.set).toHaveBeenCalledTimes(1);
    const path = global.browser.cookies.set.mock.calls[0][0].path;
    expect(path).toMatch(/^\/.+/);
    expect(path).not.toBe('/');
  });

  it('registers concurrent sites with their first-party domains', async () => {
    store.dispatch(
      updateSetting({ name: SettingID.CLEANUP_CACHE, value: true }),
    );
    store.dispatch(
      addCache({ key: 'browserDetect', value: BrowserName.Firefox }),
    );
    spyLib.isFirstPartyIsolate
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);
    spyLib.getAllCookiesForDomain
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    await Promise.all(
      ['one.com', 'two.com'].map((domain) =>
        CleanupMarker.register({ ...sampleTab, url: 'https://' + domain }),
      ),
    );
    expect(
      global.browser.cookies.set.mock.calls.map(
        ([details]) => details.firstPartyDomain,
      ),
    ).toEqual(['one.com', 'two.com']);
  });

  it('should share one cleanup cookie creation for the same scope', async () => {
    let resolveCookies!: (cookies: browser.Cookies.Cookie[]) => void;
    const cookies = new Promise<browser.Cookies.Cookie[]>((resolve) => {
      resolveCookies = resolve;
    });
    spyLib.getAllCookiesForDomain.mockReturnValueOnce(cookies);
    store.dispatch(
      updateSetting({ name: SettingID.CLEANUP_CACHE, value: true }),
    );
    const tab = { ...sampleTab, url: 'http://single-flight.test' };

    const first = CleanupMarker.register(tab);
    const second = CleanupMarker.register(tab);
    await jest.advanceTimersByTimeAsync(0);
    resolveCookies([]);
    await Promise.all([first, second]);

    expect(spyLib.getAllCookiesForDomain).toHaveBeenCalledTimes(1);
    expect(global.browser.cookies.set).toHaveBeenCalledTimes(1);
  });

  it('should isolate cleanup cookie creation by cookie store', async () => {
    when(global.browser.cookies.getAll)
      .calledWith({ domain: 'scope.test', storeId: 'store-a' })
      .mockResolvedValue([] as never);
    when(global.browser.cookies.getAll)
      .calledWith({ domain: 'scope.test', storeId: 'store-b' })
      .mockResolvedValue([] as never);
    store.dispatch(
      updateSetting({ name: SettingID.CLEANUP_CACHE, value: true }),
    );

    await Promise.all([
      CleanupMarker.register({
        ...sampleTab,
        cookieStoreId: 'store-a',
        url: 'http://scope.test',
      }),
      CleanupMarker.register({
        ...sampleTab,
        cookieStoreId: 'store-b',
        url: 'http://scope.test',
      }),
    ]);

    expect(global.browser.cookies.set).toHaveBeenCalledTimes(2);
  });

  it('should release cleanup scope after an error', async () => {
    spyLib.getAllCookiesForDomain
      .mockRejectedValueOnce(new Error('cookie query failed'))
      .mockResolvedValueOnce([]);
    store.dispatch(
      updateSetting({ name: SettingID.CLEANUP_CACHE, value: true }),
    );
    const tab = { ...sampleTab, url: 'http://retry.test' };

    await expect(CleanupMarker.register(tab)).rejects.toThrow(
      'cookie query failed',
    );
    await CleanupMarker.register(tab);

    expect(global.browser.cookies.set).toHaveBeenCalledTimes(1);
  });
});
