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

import browser from 'webextension-polyfill';

import { SettingID } from '../typings/Enums';
import { getSetting } from './Libs';
import StoreUser from './StoreUser';
import { addCache } from '../redux/CacheSlice';
import { removeList } from '../redux/ListsSlice';

export default class ContextualIdentitiesEvents extends StoreUser {
  public static init(): void {
    const events = browser.contextualIdentities;
    if (!events || ContextualIdentitiesEvents.isInitialized) return;

    events.onCreated.addListener(ContextualIdentitiesEvents.onContainerCreated);
    events.onRemoved.addListener(ContextualIdentitiesEvents.onContainerRemoved);
    events.onUpdated.addListener(ContextualIdentitiesEvents.onContainerUpdated);
    ContextualIdentitiesEvents.isInitialized = true;
  }

  public static async deInit(): Promise<void> {
    if (!ContextualIdentitiesEvents.isInitialized) return;

    const events = browser.contextualIdentities;
    events.onCreated.removeListener(
      ContextualIdentitiesEvents.onContainerCreated,
    );
    events.onRemoved.removeListener(
      ContextualIdentitiesEvents.onContainerRemoved,
    );
    events.onUpdated.removeListener(
      ContextualIdentitiesEvents.onContainerUpdated,
    );
    ContextualIdentitiesEvents.isInitialized = false;

    const existingContainers = await events.query({});
    // The user may have re-enabled container mode while the query was pending.
    if (ContextualIdentitiesEvents.isInitialized) return;
    for (const ci of existingContainers) {
      StoreUser.store.dispatch(
        addCache({ key: ci.cookieStoreId, value: undefined }),
      );
    }
  }

  private static withContainerMode<T>(handle: (changeInfo: T) => void) {
    return StoreUser.withStoreReady<
      [T],
      Promise<void>,
      (store: typeof StoreUser.store) => (changeInfo: T) => Promise<void>
    >((store) => async (changeInfo) => {
      if (!getSetting(store.getState(), SettingID.CONTEXTUAL_IDENTITIES)) {
        await ContextualIdentitiesEvents.deInit();
        return;
      }
      handle(changeInfo);
    });
  }

  /**
   * This will add the new container mapping to the cache.
   * @param changeInfo The ContextualIdentity object that was created.
   */
  public static readonly onContainerCreated =
    ContextualIdentitiesEvents.withContainerMode(
      (
        changeInfo: browser.ContextualIdentities.OnCreatedChangeInfoType,
      ): void => {
        StoreUser.store.dispatch(
          addCache({
            key: changeInfo.contextualIdentity.cookieStoreId,
            value: changeInfo.contextualIdentity.name,
          }),
        );
      },
    );

  /**
   * This should remove the related cookieStoreId/container when removed in Firefox.
   * @param changeInfo The ContextualIdentity Object that was removed.
   */
  public static readonly onContainerRemoved =
    ContextualIdentitiesEvents.withContainerMode(
      (
        changeInfo: browser.ContextualIdentities.OnRemovedChangeInfoType,
      ): void => {
        // Only remove expression list id if setting is enabled.
        if (
          getSetting(
            StoreUser.store.getState(),
            SettingID.CONTEXTUAL_IDENTITIES_AUTOREMOVE,
          )
        ) {
          StoreUser.store.dispatch(
            removeList(changeInfo.contextualIdentity.cookieStoreId),
          );
        }

        StoreUser.store.dispatch(
          addCache({
            key: changeInfo.contextualIdentity.cookieStoreId,
            value: undefined,
          }),
        );
      },
    );

  /**
   * This should update the cache if a container was updated in Firefox.
   * @param changeInfo The ContextualIdentity Object that was updated.
   */
  public static readonly onContainerUpdated =
    ContextualIdentitiesEvents.withContainerMode(
      (
        changeInfo: browser.ContextualIdentities.OnUpdatedChangeInfoType,
      ): void => {
        const cache = StoreUser.store.getState().cache;
        if (
          cache[changeInfo.contextualIdentity.cookieStoreId] &&
          cache[changeInfo.contextualIdentity.cookieStoreId] !==
            changeInfo.contextualIdentity.name
        ) {
          StoreUser.store.dispatch(
            addCache({
              key: changeInfo.contextualIdentity.cookieStoreId,
              value: changeInfo.contextualIdentity.name,
            }),
          );
        }
      },
    );

  // Map the cookieStoreId to their actual names and store in cache
  public static async cacheCookieStoreIdNames(): Promise<void> {
    const contextualIdentitiesObjects =
      await browser.contextualIdentities.query({});
    StoreUser.store.dispatch(
      addCache({
        key: 'default',
        value: 'Default',
      }),
    );
    StoreUser.store.dispatch(
      addCache({
        key: 'firefox-default',
        value: 'Default',
      }),
    );
    StoreUser.store.dispatch(
      addCache({
        key: 'firefox-private',
        value: 'Private',
      }),
    );
    contextualIdentitiesObjects.forEach((object) =>
      StoreUser.store.dispatch(
        addCache({
          key: object.cookieStoreId,
          value: object.name,
        }),
      ),
    );
  }

  protected static isInitialized = false;
}
