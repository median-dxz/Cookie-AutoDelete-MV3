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

import { addCache } from '../../src/redux/CacheSlice';
import { configureWrapStore, State } from '../../src/redux/Store';
import ContextualIdentitiesEvents from '../../src/services/ContextualIdentitiesEvents';
import StoreUser from '../../src/services/StoreUser';
import { ListType, SettingID } from '../../src/typings/Enums';
import type { Expression } from '../../src/typings/Global';

import type * as browser from 'webextension-polyfill';
import { initialState } from '../__mock__/initialState';

// Actions
import { resetSettings, updateSetting } from '../../src/redux/SettingsSlice';

import { ReduxConstants } from '../../src/redux/ReduxConstants';

const store: Store<State> = configureWrapStore(initialState);
StoreUser.init(store);

class TestStore extends StoreUser {
  public static addCache(payload: any) {
    StoreUser.store.dispatch(addCache(payload));
  }
  public static dispatch(payload: unknown, type: ReduxConstants) {
    StoreUser.store.dispatch({
      payload,
      type,
    });
  }

  public static getCacheValue(key: string) {
    return StoreUser.store.getState().cache[key];
  }

  public static getLists() {
    return StoreUser.store.getState().lists;
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

const wildCardWhiteListGoogle = {
  expression: '*.google.com',
  id: '1',
  listType: ListType.GREY,
  storeId: 'remove-container-1',
} as const satisfies Expression;

const defaultContextualIdentity: browser.ContextualIdentities.ContextualIdentity =
  {
    cookieStoreId: 'firefox-container-0',
    color: 'blue',
    icon: 'fingerprint',
    name: 'Testing Container',
    iconUrl: 'https://example.com/icon.png',
    colorCode: '#000000',
  };

describe('ContextualIdentitiesEvents', () => {
  beforeAll(() => {
    when(global.browser.runtime.getManifest)
      .calledWith()
      .mockReturnValue({ version: '0.12.34' } as never);
    when(global.browser.contextualIdentities.query)
      .calledWith({})
      .mockResolvedValue([
        defaultContextualIdentity,
        { ...defaultContextualIdentity, cookieStoreId: 'firefox-container-1' },
        { ...defaultContextualIdentity, cookieStoreId: 'firefox-container-99' },
      ] as never);
  });
  beforeEach(() => {
    TestStore.changeSetting(SettingID.CONTEXTUAL_IDENTITIES, true);
  });
  afterEach(() => {
    TestStore.resetSetting();
  });

  it('registers before the store is ready; a queued removal while disabled preserves rules and detaches the registered listeners', async () => {
    const { onCreated, onRemoved, onUpdated } =
      global.browser.contextualIdentities;
    const cookieStoreId = wildCardWhiteListGoogle.storeId;
    TestStore.changeSetting(SettingID.CONTEXTUAL_IDENTITIES, false);
    TestStore.changeSetting(SettingID.CONTEXTUAL_IDENTITIES_AUTOREMOVE, true);
    TestStore.dispatch(wildCardWhiteListGoogle, ReduxConstants.ADD_EXPRESSION);
    TestStore.addCache({
      key: 'firefox-container-99',
      value: 'Cached container',
    });
    jest.useFakeTimers();
    try {
      Reflect.set(StoreUser, 'store', undefined);
      ContextualIdentitiesEvents.init();
      expect(onCreated.addListener).toHaveBeenCalledWith(
        ContextualIdentitiesEvents.onContainerCreated,
      );
      expect(onUpdated.addListener).toHaveBeenCalledWith(
        ContextualIdentitiesEvents.onContainerUpdated,
      );
      expect(onRemoved.addListener).toHaveBeenCalledWith(
        ContextualIdentitiesEvents.onContainerRemoved,
      );

      const listener = jest.mocked(onRemoved.addListener).mock.calls[0][0];
      const pending = listener({
        contextualIdentity: { ...defaultContextualIdentity, cookieStoreId },
      });
      expect(onRemoved.removeListener).not.toHaveBeenCalled();
      StoreUser.init(store);
      await jest.advanceTimersByTimeAsync(250);
      void pending;
      expect(TestStore.getLists()).toHaveProperty(cookieStoreId);
      expect(TestStore.getCacheValue('firefox-container-99')).toBeUndefined();
      expect(onCreated.removeListener).toHaveBeenCalledWith(
        ContextualIdentitiesEvents.onContainerCreated,
      );
      expect(onUpdated.removeListener).toHaveBeenCalledWith(
        ContextualIdentitiesEvents.onContainerUpdated,
      );
      expect(onRemoved.removeListener).toHaveBeenCalledWith(listener);
    } finally {
      StoreUser.init(store);
      jest.useRealTimers();
    }
  });

  describe('onContainerCreated()', () => {
    it('should add the new container map into the cache', async () => {
      await ContextualIdentitiesEvents.onContainerCreated({
        contextualIdentity: {
          ...defaultContextualIdentity,
          cookieStoreId: 'new-container-1',
        },
      });
      expect(TestStore.getCacheValue('new-container-1')).toEqual(
        'Testing Container',
      );
    });
  });

  describe('onContainerRemoved()', () => {
    it('should set undefined that cookieStoreId from cache', async () => {
      TestStore.addCache({
        key: 'remove-container-1',
        value: 'AShortLivedContainer',
      });
      await ContextualIdentitiesEvents.onContainerRemoved({
        contextualIdentity: {
          ...defaultContextualIdentity,
          cookieStoreId: 'remove-container-1',
        },
      });
      expect(TestStore.getCacheValue('remove-container-1')).toBeUndefined();
    });
    it('should not remove expression list if related setting is disabled', async () => {
      TestStore.changeSetting(
        SettingID.CONTEXTUAL_IDENTITIES_AUTOREMOVE,
        false,
      );
      TestStore.dispatch(
        wildCardWhiteListGoogle,
        ReduxConstants.ADD_EXPRESSION,
      );
      await ContextualIdentitiesEvents.onContainerRemoved({
        contextualIdentity: {
          ...defaultContextualIdentity,
          cookieStoreId: 'remove-container-1',
        },
      });
      expect(TestStore.getLists()).toHaveProperty('remove-container-1');
    });
    it('should remove expression list if related setting is enabled', async () => {
      TestStore.changeSetting(SettingID.CONTEXTUAL_IDENTITIES_AUTOREMOVE, true);
      TestStore.dispatch(
        wildCardWhiteListGoogle,
        ReduxConstants.ADD_EXPRESSION,
      );
      await ContextualIdentitiesEvents.onContainerRemoved({
        contextualIdentity: {
          ...defaultContextualIdentity,
          cookieStoreId: 'remove-container-1',
        },
      });
      expect(TestStore.getLists()).not.toHaveProperty('remove-container-1');
    });
  });

  describe('onContainerUpdated()', () => {
    it('should do nothing if for some reason the container updated was not in the cache', async () => {
      await ContextualIdentitiesEvents.onContainerUpdated({
        contextualIdentity: {
          ...defaultContextualIdentity,
          cookieStoreId: 'non-existent-0',
        },
      });
      expect(TestStore.getCacheValue('non-existent-0')).toBeUndefined();
    });

    it('should update the container name accordingly', async () => {
      TestStore.addCache({ key: 'container-01', value: 'oldValue' });
      await ContextualIdentitiesEvents.onContainerUpdated({
        contextualIdentity: {
          ...defaultContextualIdentity,
          cookieStoreId: 'container-01',
          name: 'newValue',
        },
      });
      expect(TestStore.getCacheValue('container-01')).toEqual('newValue');
    });
  });
});
