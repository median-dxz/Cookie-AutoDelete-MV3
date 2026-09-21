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

import { configureWrapStore } from '../../src/redux/Store';
import { resetSettings, updateSetting } from '../../src/redux/SettingsSlice';
import AlarmEvents from '../../src/services/AlarmEvents';
import * as Lib from '../../src/services/Libs';
import StoreUser from '../../src/services/StoreUser';
import { SettingID } from '../../src/typings/Enums';
import { initialState } from '../__mock__/initialState';

const store = configureWrapStore(initialState);
StoreUser.init(store);

jest.useFakeTimers();

describe('AlarmEvents', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllTimers();
    store.dispatch(resetSettings());
  });

  it('keeps short cleanup single-flight until cookie cleanup completes', async () => {
    store.dispatch(updateSetting({ name: SettingID.ACTIVE_MODE, value: true }));
    store.dispatch(updateSetting({ name: SettingID.CLEAN_DELAY, value: 1 }));

    let releaseCleanup!: () => void;
    const cleanup = new Promise<void>((resolve) => {
      releaseCleanup = resolve;
    });
    const dispatch = jest
      .spyOn(store, 'dispatch')
      .mockReturnValue(cleanup as never);
    const waitUntil = jest.spyOn(Lib, 'waitUntil');

    void AlarmEvents.scheduleActiveModeCleanup();
    const firstCleanupLifecycle = waitUntil.mock.results[0]
      .value as Promise<void>;
    await jest.advanceTimersByTimeAsync(1000);

    expect(dispatch).toHaveBeenCalledTimes(1);

    void AlarmEvents.scheduleActiveModeCleanup();
    await jest.advanceTimersByTimeAsync(1000);

    expect(dispatch).toHaveBeenCalledTimes(1);

    releaseCleanup();
    await firstCleanupLifecycle;

    void AlarmEvents.scheduleActiveModeCleanup();
    const secondCleanupLifecycle = waitUntil.mock.results[1]
      .value as Promise<void>;
    await jest.advanceTimersByTimeAsync(1000);
    await secondCleanupLifecycle;

    expect(dispatch).toHaveBeenCalledTimes(2);
  });
});
