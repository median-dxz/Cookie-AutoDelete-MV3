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
import AlarmEvents from '../../src/services/AlarmEvents';

import * as Lib from '../../src/services/Libs';
import StoreUser from '../../src/services/StoreUser';
import TabEvents from '../../src/services/TabEvents';

import { addCache } from '../../src/redux/CacheSlice';
import { SettingID } from '../../src/typings/Enums';
import { resetSettings, updateSetting } from '../../src/redux/SettingsSlice';

import { initialState } from '../__mock__/initialState';

const spyAlarmEvents = global.generateSpies(AlarmEvents);

const spyLib = global.generateSpies(Lib);
const spyTabEvents = global.generateSpies(TabEvents);

jest.useFakeTimers();

const store: Store<State> = configureWrapStore(initialState);
StoreUser.init(store);

class TestStore extends StoreUser {
  public static addCache(payload: any) {
    StoreUser.store.dispatch(addCache(payload));
  }

  public static changeSetting(
    name: SettingID,
    value: string | boolean | number,
  ) {
    StoreUser.store.dispatch(updateSetting({ name, value }));
  }

  public static resetSetting() {
    StoreUser.store.dispatch(resetSettings());
  }
}

class TestTabEvents extends TabEvents {
  public static getTabToDomain() {
    return TabEvents.tabToDomain;
  }
  public static setTabToDomain(tabToDomain: Record<number, string>) {
    TabEvents.tabToDomain = tabToDomain;
  }
}

const sampleChangeInfo: browser.Tabs.OnUpdatedChangeInfoType = {
  discarded: false,
  favIconUrl: 'sample',
  status: 'loading|complete',
  title: 'newTitle',
  url: 'sampleURL',
};

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

describe('TabEvents', () => {
  beforeAll(() => {
    jest.mocked(global.browser.action.getTitle).mockResolvedValue('');
    when(global.browser.runtime.getManifest)
      .calledWith()
      .mockReturnValue({ version: '0.12.34' } as never);
    // Use default value rather then asymmetric matchers.
    // Otherwise, the matcher added later will overwrite it.
    when(global.browser.cookies.getAll).defaultResolvedValue([]);
    // Required so the actual cleaning functions being awaited won't run.
    when(spyAlarmEvents.scheduleActiveModeCleanup)
      .calledWith()
      .mockReturnValue(undefined as never);
  });

  afterEach(() => {
    jest.clearAllTimers();
    TestStore.resetSetting();
  });

  describe('onTabDiscarded', () => {
    it('should do nothing if clean discarded tabs setting is not enabled', () => {
      TestStore.changeSetting(SettingID.CLEAN_DISCARDED, false);
      TabEvents.onTabDiscarded(0, sampleChangeInfo, sampleTab);
      expect(spyLib.createPartialTabInfo).not.toHaveBeenCalled();
      expect(spyTabEvents.cleanFromTabEvents).not.toHaveBeenCalled();
    });

    it('should do nothing if the tab that was updated is not discarded, even if discardedCleanup was true', () => {
      TestStore.changeSetting(SettingID.CLEAN_DISCARDED, true);
      TabEvents.onTabDiscarded(0, sampleChangeInfo, sampleTab);
      expect(spyTabEvents.cleanFromTabEvents).not.toHaveBeenCalled();
    });

    it('should trigger cleaning if clean discarded tabs is enabled and changeInfo was discarded', () => {
      TestStore.changeSetting(SettingID.CLEAN_DISCARDED, true);
      TabEvents.onTabDiscarded(
        0,
        { ...sampleChangeInfo, discarded: true },
        sampleTab,
      );
      expect(spyTabEvents.cleanFromTabEvents).toHaveBeenCalledTimes(1);
    });

    it('should sanitize favIconUrl if debug was enabled', () => {
      TestStore.changeSetting(SettingID.CLEAN_DISCARDED, true);
      TestStore.changeSetting(SettingID.DEBUG_MODE, true);
      TabEvents.onTabDiscarded(0, { ...sampleChangeInfo }, sampleTab);
      expect(spyLib.cadLog.mock.calls[0][0].x.changeInfo.favIconUrl).toBe(
        '***',
      );
    });
  });

  describe('onTabUpdate', () => {
    const completeChange = {
      ...sampleChangeInfo,
      status: 'complete' as const,
    };

    it('should ignore updates that are neither complete nor cookie changes', async () => {
      await TabEvents.onTabUpdate(0, { title: 'changed' }, sampleTab);
      expect(global.browser.tabs.get).not.toHaveBeenCalled();
      expect(spyLib.getAllCookiesForDomain).not.toHaveBeenCalled();
    });

    it('should preserve the old site marker but update the current navigation', async () => {
      TestStore.changeSetting(SettingID.CLEANUP_CACHE, true);
      const oldTab = {
        ...sampleTab,
        id: 4,
        status: 'complete' as const,
        url: 'https://old.test',
      };
      const currentTab = {
        ...sampleTab,
        id: 4,
        status: 'complete' as const,
        url: 'https://current.test',
      };
      when(global.browser.cookies.getAll)
        .calledWith({ domain: 'old.test', storeId: 'firefox-default' })
        .mockResolvedValue([] as never);
      when(global.browser.cookies.getAll)
        .calledWith({ domain: 'current.test', storeId: 'firefox-default' })
        .mockResolvedValue([] as never);
      when(global.browser.tabs.get).calledWith(4).mockResolvedValue(currentTab);

      const oldUpdate = TabEvents.onTabUpdate(4, completeChange, oldTab);
      const currentUpdate = TabEvents.onTabUpdate(
        4,
        completeChange,
        currentTab,
      );
      await jest.advanceTimersByTimeAsync(750);
      await Promise.all([oldUpdate, currentUpdate]);

      expect(global.browser.cookies.set).toHaveBeenCalledTimes(2);
      expect(
        global.browser.cookies.set.mock.calls.map(([details]) => details.url),
      ).toEqual(
        expect.arrayContaining(['https://old.test', 'https://current.test']),
      );
      expect(global.browser.action.setTitle).toHaveBeenCalledTimes(1);
      expect(global.browser.cookies.getAll).toHaveBeenCalledWith({
        domain: 'current.test',
        storeId: 'firefox-default',
      });
      expect(global.browser.action.setTitle).toHaveBeenCalledWith(
        expect.objectContaining({ tabId: 4 }),
      );
    });

    it('should sanitize favIconUrl when a complete update is logged', async () => {
      TestStore.changeSetting(SettingID.DEBUG_MODE, true);
      const currentTab = {
        ...sampleTab,
        id: 9,
        status: 'complete' as const,
      };
      const changeInfo = { ...completeChange };
      when(global.browser.tabs.get).calledWith(9).mockResolvedValue(currentTab);

      const update = TabEvents.onTabUpdate(9, changeInfo, currentTab);
      expect(changeInfo.favIconUrl).toBe('***');
      await jest.advanceTimersByTimeAsync(750);
      await update;
    });
  });

  describe('onDomainChange', () => {
    // Do not change any of the test order as each test relies on the previous actions.

    it('should restore the previous domain after a worker restart', async () => {
      when(global.browser.storage.session.get)
        .calledWith('tabToDomain')
        .mockResolvedValue({ tabToDomain: { 0: 'example.com' } });
      TestStore.changeSetting(SettingID.CLEAN_DOMAIN_CHANGE, true);

      await TabEvents.restoreTabToDomain();
      await TabEvents.onDomainChange(0, sampleChangeInfo, {
        ...sampleTab,
        status: 'complete',
        url: 'https://domain.cad',
      });

      expect(spyTabEvents.cleanFromTabEvents).toHaveBeenCalledTimes(1);
      expect(TestTabEvents.getTabToDomain()[0]).toBe('domain.cad');
      TestTabEvents.setTabToDomain({});
    });

    it('should do nothing if tab.status is not complete', async () => {
      await TabEvents.onDomainChange(0, sampleChangeInfo, {
        ...sampleTab,
        status: 'loading',
      });
      expect(spyTabEvents.cleanFromTabEvents).not.toHaveBeenCalled();
    });

    it('should set mainDomain on first encounter', async () => {
      expect(Object.keys(TestTabEvents.getTabToDomain()).length).toBe(0);
      await TabEvents.onDomainChange(0, sampleChangeInfo, {
        ...sampleTab,
        status: 'complete',
      });
      expect(TestTabEvents.getTabToDomain()[0]).toBe('example.com');
      expect(spyTabEvents.cleanFromTabEvents).not.toHaveBeenCalled();
    });

    it('should truncate favIconUrl if debug=true', async () => {
      TestStore.changeSetting(SettingID.DEBUG_MODE, true);
      expect(Object.keys(TestTabEvents.getTabToDomain()).length).toBe(1);
      await TabEvents.onDomainChange(0, sampleChangeInfo, {
        ...sampleTab,
        status: 'complete',
      });
      expect(spyLib.cadLog.mock.calls[0][0].x.changeInfo.favIconUrl).toBe(
        '***',
      );
    });

    it('should not do anything if mainDomain has not changed yet', async () => {
      await TabEvents.onDomainChange(0, sampleChangeInfo, {
        ...sampleTab,
        status: 'complete',
      });
      expect(TestTabEvents.getTabToDomain()[0]).toBe('example.com');
      expect(spyTabEvents.cleanFromTabEvents).not.toHaveBeenCalled();
    });

    it('should not trigger clean if cleanOnDomainChange was not enabled', async () => {
      expect(TestTabEvents.getTabToDomain()[0]).toBe('example.com');
      await TabEvents.onDomainChange(0, sampleChangeInfo, {
        ...sampleTab,
        status: 'complete',
        url: 'http://domain.cad',
      });
      expect(TestTabEvents.getTabToDomain()[0]).toBe('domain.cad');
      expect(spyTabEvents.cleanFromTabEvents).not.toHaveBeenCalled();
    });

    it('should trigger clean if mainDomain was changed and domainChangeCleanup is enabled', async () => {
      TestStore.changeSetting(SettingID.CLEAN_DOMAIN_CHANGE, true);
      // reuse previous tabId to change domain
      expect(TestTabEvents.getTabToDomain()[0]).toBe('domain.cad');
      await TabEvents.onDomainChange(0, sampleChangeInfo, {
        ...sampleTab,
        status: 'complete',
      });
      expect(TestTabEvents.getTabToDomain()[0]).toBe('example.com');
      expect(spyTabEvents.cleanFromTabEvents).toHaveBeenCalledTimes(1);
    });

    it('should trigger clean if mainDomain was changed to a home/blank/new tab and domainChangeCleanup is enabled', async () => {
      TestStore.changeSetting(SettingID.CLEAN_DOMAIN_CHANGE, true);
      // reuse previous tabId to change domain to blank
      expect(TestTabEvents.getTabToDomain()[0]).toBe('example.com');
      await TabEvents.onDomainChange(0, sampleChangeInfo, {
        ...sampleTab,
        status: 'complete',
        url: 'about:blank',
      });
      expect(TestTabEvents.getTabToDomain()[0]).toBe('');
      expect(spyTabEvents.cleanFromTabEvents).toHaveBeenCalledTimes(1);
    });

    it('should not trigger cleaning if previous domain was a new/blank/home tab with domainChangeCleanup enabled', async () => {
      TestStore.changeSetting(SettingID.CLEAN_DOMAIN_CHANGE, true);
      // reuse previous tabId of blank tab to new domain.
      expect(TestTabEvents.getTabToDomain()[0]).toBe('');
      await TabEvents.onDomainChange(0, sampleChangeInfo, {
        ...sampleTab,
        status: 'complete',
      });
      expect(TestTabEvents.getTabToDomain()[0]).toBe('example.com');
      expect(spyTabEvents.cleanFromTabEvents).not.toHaveBeenCalled();
    });

    it('should not trigger if next domain is an empty string (highly unlikely scenario)', async () => {
      TestStore.changeSetting(SettingID.CLEAN_DOMAIN_CHANGE, true);
      // reuse previous tabId to go from domain to empty string...which usually doesn't happen
      expect(TestTabEvents.getTabToDomain()[0]).toBe('example.com');
      await TabEvents.onDomainChange(0, sampleChangeInfo, {
        ...sampleTab,
        status: 'complete',
        url: '',
      });
      // Treat as mainDomain unchanged per current logic.
      expect(TestTabEvents.getTabToDomain()[0]).toBe('example.com');
      expect(spyTabEvents.cleanFromTabEvents).not.toHaveBeenCalled();
    });
  });

  describe('onDomainChangeRemove', () => {
    // This function doesn't throw any errors when tabId does not exist, so one test covers all.
    it('should remove old mainDomain from closed tabId', async () => {
      expect(TestTabEvents.getTabToDomain()[0]).toBe('example.com');
      await TabEvents.onDomainChangeRemove(0, {
        windowId: 1,
        isWindowClosing: false,
      });
      expect(TestTabEvents.getTabToDomain()[0]).toBe(undefined);
    });

    it('should replace the old tab mapping', async () => {
      TestTabEvents.setTabToDomain({ 0: 'example.com' });
      when(global.browser.tabs.get)
        .calledWith(1)
        .mockResolvedValue({
          ...sampleTab,
          id: 1,
          url: 'https://domain.cad',
        } as never);

      await TabEvents.onDomainChangeReplaced(1, 0);

      expect(TestTabEvents.getTabToDomain()[0]).toBe(undefined);
      expect(TestTabEvents.getTabToDomain()[1]).toBe('domain.cad');
    });
  });

  describe('cleanFromTabEvents', () => {
    afterAll(() => {
      global.browser.alarms.get.mockRestore();
    });

    it('should do nothing if activeMode is disabled', async () => {
      await TabEvents.cleanFromTabEvents();
      expect(spyAlarmEvents.scheduleActiveModeCleanup).not.toHaveBeenCalled();
    });

    it('should create an "alarm" for cleaning when activeMode is enabled', async () => {
      when(global.browser.alarms.get)
        .calledWith('activeModeAlarm')
        .mockResolvedValue(undefined as never);
      TestStore.changeSetting(SettingID.ACTIVE_MODE, true);
      TestStore.changeSetting(SettingID.CLEAN_DELAY, 1);
      await TabEvents.cleanFromTabEvents();
      expect(spyAlarmEvents.scheduleActiveModeCleanup).toHaveBeenCalledTimes(1);
    });
  });
});
