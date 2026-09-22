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
import {
  scheduleTabActionUpdate,
  checkIfProtected,
} from '../../src/services/BrowserActionService';
import * as Lib from '../../src/services/Libs';
import StoreUser from '../../src/services/StoreUser';
import { addCache } from '../../src/redux/CacheSlice';
import { SettingID } from '../../src/typings/Enums';
import { resetSettings, updateSetting } from '../../src/redux/SettingsSlice';

import { initialState } from '../__mock__/initialState';

const spyLib = global.generateSpies(Lib);

jest.useFakeTimers();

const store: Store<State> = configureWrapStore(initialState);
StoreUser.init(store);

const sampleTab: browser.Tabs.Tab = {
  id: 1,
  status: 'complete',
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

describe('tab action updates', () => {
  afterEach(() => {
    store.dispatch(addCache({ key: 'platformOs', value: 'linux' }));
    store.dispatch(resetSettings());
    jest.clearAllTimers();
  });
  beforeAll(() => {
    global.browser.runtime.getManifest.mockReturnValue({
      name: 'CAD',
      version: '4.0.0',
    });
    jest.mocked(global.browser.action.getTitle).mockResolvedValue('');
    spyLib.getAllCookiesForDomain.mockResolvedValue([]);
  });

  const testCookie: browser.Cookies.Cookie = {
    domain: 'domain.com',
    hostOnly: true,
    httpOnly: true,
    name: 'blah',
    path: '/',
    sameSite: 'no_restriction',
    secure: true,
    session: true,
    storeId: 'firefox-default',
    value: 'test value',
    firstPartyDomain: '',
  };

  it.each([
    ['regular cookies', 'linux', [testCookie], '(1)', true],
    [
      'internal marker',
      'linux',
      [{ ...testCookie, name: Lib.CADCOOKIENAME }],
      '(0)',
      true,
    ],
    ['Android', 'android', [testCookie], '(1)', false],
  ] as const)('renders %s', async (_name, platform, cookies, count, badge) => {
    store.dispatch(addCache({ key: 'platformOs', value: platform }));
    store.dispatch(
      updateSetting({ name: SettingID.NUM_COOKIES_ICON, value: true }),
    );
    spyLib.getAllCookiesForDomain.mockResolvedValueOnce([...cookies]);
    jest
      .mocked(global.browser.tabs.get)
      .mockResolvedValueOnce({ ...sampleTab, url: 'https://render.test' });
    const update = scheduleTabActionUpdate(1, store.getState);
    await jest.advanceTimersByTimeAsync(750);
    await update;
    expect(global.browser.action.setTitle).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining(count) }),
    );
    expect(global.browser.action.setBadgeText).toHaveBeenCalledTimes(
      badge ? 1 : 0,
    );
  });

  it('should process two tabs independently inside the same 750 ms window', async () => {
    const firstTab = {
      ...sampleTab,
      id: 1,
      url: 'https://first.test',
    };
    const secondTab = {
      ...sampleTab,
      id: 2,
      url: 'https://second.test',
    };
    when(global.browser.tabs.get).calledWith(1).mockResolvedValue(firstTab);
    when(global.browser.tabs.get).calledWith(2).mockResolvedValue(secondTab);

    const first = scheduleTabActionUpdate(1, store.getState);
    const second = scheduleTabActionUpdate(2, store.getState);
    await jest.advanceTimersByTimeAsync(750);
    await Promise.all([first, second]);

    expect(global.browser.action.setTitle).toHaveBeenCalledTimes(2);
  });

  it('should coalesce repeated updates for one tab', async () => {
    const currentTab = { ...sampleTab, id: 3 };
    when(global.browser.tabs.get).calledWith(3).mockResolvedValue(currentTab);

    const first = scheduleTabActionUpdate(3, store.getState);
    const second = scheduleTabActionUpdate(3, store.getState);
    await jest.advanceTimersByTimeAsync(750);
    await Promise.all([first, second]);

    expect(global.browser.tabs.get).toHaveBeenCalledTimes(1);
    expect(global.browser.action.setTitle).toHaveBeenCalledTimes(1);
  });

  it('should skip a tab that is still loading', async () => {
    when(global.browser.tabs.get)
      .calledWith(5)
      .mockResolvedValue({ ...sampleTab, id: 5, status: 'loading' });
    const update = scheduleTabActionUpdate(5, store.getState);
    await jest.advanceTimersByTimeAsync(750);
    await update;

    expect(global.browser.action.setTitle).not.toHaveBeenCalled();
  });

  it('should skip a tab that was removed during the wait', async () => {
    when(global.browser.tabs.get)
      .calledWith(6)
      .mockRejectedValue(new Error('Invalid tab ID'));
    const update = scheduleTabActionUpdate(6, store.getState);
    await jest.advanceTimersByTimeAsync(750);
    await update;

    expect(global.browser.action.setTitle).not.toHaveBeenCalled();
  });

  it('should rerun with the latest tab when an event arrives during UI work', async () => {
    let finishFirstAction!: () => void;
    const firstAction = new Promise<void>((resolve) => {
      finishFirstAction = resolve;
    });
    jest
      .mocked(global.browser.action.setTitle)
      .mockReturnValueOnce(firstAction);
    const currentTab = { ...sampleTab, id: 7 };
    spyLib.getAllCookiesForDomain
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([testCookie]);
    when(global.browser.tabs.get).calledWith(7).mockResolvedValue(currentTab);

    const first = scheduleTabActionUpdate(7, store.getState);
    await jest.advanceTimersByTimeAsync(750);
    expect(global.browser.action.setTitle).toHaveBeenCalledTimes(1);
    jest.mocked(global.browser.tabs.get).mockResolvedValueOnce({
      ...currentTab,
      url: 'https://domain.com',
    });
    const second = scheduleTabActionUpdate(7, store.getState);
    finishFirstAction();
    await Promise.all([first, second]);

    expect(global.browser.tabs.get).toHaveBeenCalledTimes(2);
    expect(global.browser.action.setTitle).toHaveBeenLastCalledWith(
      expect.objectContaining({
        tabId: 7,
        title: expect.stringContaining('(1)'),
      }),
    );
  });

  it('should release the tab queue after an action error', async () => {
    const currentTab = { ...sampleTab, id: 8 };
    when(global.browser.tabs.get).calledWith(8).mockResolvedValue(currentTab);
    jest
      .mocked(global.browser.action.setTitle)
      .mockRejectedValueOnce(new Error('action failed'));

    const failed = scheduleTabActionUpdate(8, store.getState);
    await jest.advanceTimersByTimeAsync(750);
    await expect(failed).rejects.toThrow('action failed');

    const retry = scheduleTabActionUpdate(8, store.getState);
    await jest.advanceTimersByTimeAsync(750);
    await retry;
    expect(global.browser.action.setTitle).toHaveBeenCalledTimes(2);
  });
});

describe('BrowserActionService', () => {
  beforeAll(() => jest.useRealTimers());
  it.each(['setTitle', 'setIcon', 'setBadgeBackgroundColor'] as const)(
    'waits for %s before completing',
    async (operation) => {
      const store = configureWrapStore(initialState);
      store.dispatch(
        updateSetting({ name: SettingID.ACTIVE_MODE, value: true }),
      );
      global.browser.runtime.getManifest.mockReturnValue({
        name: 'CAD',
        version: '4.0.0',
      });
      jest.mocked(global.browser.action.getTitle).mockResolvedValue('');
      let started!: () => void;
      const operationStarted = new Promise<void>((resolve) => {
        started = resolve;
      });
      let release!: () => void;
      const blocked = new Promise<void>((resolve) => {
        release = resolve;
      });
      jest
        .mocked(global.browser.action[operation])
        .mockImplementationOnce(() => {
          started();
          return blocked;
        });
      let finished = false;
      const update = checkIfProtected(
        store.getState(),
        { ...sampleTab, id: 1 },
        1,
      ).then(() => {
        finished = true;
      });
      await operationStarted;
      // Cross an event-loop turn so an incorrectly detached operation can finish its caller.
      await new Promise<void>((resolve) => setImmediate(resolve));
      expect(finished).toBe(false);
      release();
      await update;
      expect(finished).toBe(true);
    },
  );

  it('updates the remaining active tabs before reporting a tab action failure', async () => {
    const store = configureWrapStore(initialState);
    const tabs = [
      { ...sampleTab, id: 1, url: 'https://first.test' },
      { ...sampleTab, id: 2, url: 'https://second.test' },
    ];
    jest.mocked(global.browser.tabs.query).mockResolvedValueOnce(tabs);
    jest
      .mocked(global.browser.action.setTitle)
      .mockRejectedValueOnce(new Error('Tab 1 was closed'));

    await expect(checkIfProtected(store.getState())).rejects.toThrow(
      'Tab 1 was closed',
    );

    expect(global.browser.action.setTitle).toHaveBeenCalledTimes(2);
    expect(global.browser.action.setTitle).toHaveBeenCalledWith(
      expect.objectContaining({ tabId: 2 }),
    );
  });
});
