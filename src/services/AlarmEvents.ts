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

import { cookieCleanup } from '../redux/BackgroundActions';
import { SettingID } from '../typings/Enums';
import { getSetting, sleep, waitUntil } from './Libs';
import StoreUser from './StoreUser';
import browser from 'webextension-polyfill';

export default class AlarmEvents extends StoreUser {
  public static ALARMS_ALARM = 'alarms-alarm';

  public static handleAlarmEvent = async () => {
    if (getSetting(StoreUser.store.getState(), SettingID.ACTIVE_MODE)) {
      StoreUser.store.dispatch(
        cookieCleanup({
          greyCleanup: false,
          ignoreOpenTabs: false,
        }),
      );
    }
    AlarmEvents.alarmFlag = false;
  };

  public static createActiveModeAlarm = () => {
    const seconds = parseInt(
      getSetting(StoreUser.store.getState(), SettingID.CLEAN_DELAY) as string,
      10,
    );
    const milliseconds = (seconds > 0 ? seconds : 0.5) * 1000;
    if (AlarmEvents.alarmFlag) {
      return;
    }
    AlarmEvents.alarmFlag = true;

    if (milliseconds < 60_000) {
      void waitUntil(sleep(milliseconds).then(AlarmEvents.handleAlarmEvent));
    } else {
      browser.alarms.create(AlarmEvents.ALARMS_ALARM, {
        delayInMinutes: milliseconds / 60_000,
      });
    }
  };
  // Create an alarm delay or use setTimeout before cookie cleanup
  private static alarmFlag = false;
}
