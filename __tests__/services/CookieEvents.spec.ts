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

import CookieEvents from '../../src/services/CookieEvents';
import * as Lib from '../../src/services/Libs';
import TabEvents from '../../src/services/TabEvents';
import type * as browser from 'webextension-polyfill';

const spyLib = global.generateSpies(Lib);

const defaultCookie: browser.Cookies.Cookie = {
  domain: 'domain.com',
  hostOnly: false,
  httpOnly: false,
  name: 'CookieName',
  path: '/',
  sameSite: 'no_restriction',
  secure: false,
  session: true,
  storeId: 'firefox-default',
  value: 'CookieValue',
  firstPartyDomain: '',
};

const defaultTab: browser.Tabs.Tab = {
  active: true,
  cookieStoreId: 'firefox-container-00',
  hidden: false,
  highlighted: false,
  incognito: false,
  id: 1,
  index: 0,
  isArticle: false,
  isInReaderMode: false,
  lastAccessed: 12345678,
  pinned: false,
  url: 'https://domain.com',
  windowId: 1,
};

describe('CookieEvents', () => {
  when(global.browser.tabs.query)
    .calledWith({ active: true, windowType: 'normal' })
    .mockResolvedValue([
      defaultTab,
      { ...defaultTab, url: 'https://example.com' },
    ] as never);

  describe('onCookieChanged()', () => {
    const spyTabUpdate = jest.spyOn(TabEvents, 'onTabUpdate');

    beforeAll(() => {
      spyTabUpdate.mockResolvedValue(undefined);
    });

    afterAll(() => {
      spyTabUpdate.mockRestore();
    });

    it('should do nothing if cookie is not part of any active tabs', async () => {
      await CookieEvents.onCookieChanged({
        removed: false,
        cookie: { ...defaultCookie, domain: '1.1.1.1' },
        cause: 'overwrite',
      });
      expect(spyTabUpdate).not.toHaveBeenCalled();
    });

    it('should force update that active tab if the domain matches', async () => {
      await CookieEvents.onCookieChanged({
        removed: false,
        cookie: defaultCookie,
        cause: 'overwrite',
      });
      expect(spyTabUpdate).toHaveBeenCalledTimes(1);
      expect(spyTabUpdate.mock.calls[0][1].cookieChanged).toHaveProperty(
        'cookie.value',
        '***',
      );
    });

    it('waits for every matching tab update', async () => {
      global.browser.tabs.query.mockResolvedValueOnce([
        { ...defaultTab, id: 1 },
        { ...defaultTab, id: 2 },
      ]);

      const releases: Array<() => void> = [];
      let allStarted!: () => void;

      const started = new Promise<void>((resolve) => {
        allStarted = resolve;
      });

      spyTabUpdate.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            releases.push(resolve);
            if (releases.length === 2) allStarted();
          }),
      );

      let finished = false;
      const update = CookieEvents.onCookieChanged({
        removed: false,
        cookie: defaultCookie,
        cause: 'overwrite',
      }).then(() => {
        finished = true;
      });

      await started;
      releases[0]();
      await new Promise<void>((resolve) => setImmediate(resolve));
      expect(finished).toBe(false);
      
      releases[1]();
      await update;
      expect(finished).toBe(true);
      spyTabUpdate.mockResolvedValue(undefined);
    });

    it('should not force tab update if tab url is undefined', async () => {
      when(global.browser.tabs.query)
        .calledWith({ active: true, windowType: 'normal' })
        .mockResolvedValue([{ ...defaultTab, url: undefined }] as never);
      await CookieEvents.onCookieChanged({
        removed: false,
        cookie: defaultCookie,
        cause: 'overwrite',
      });
      expect(spyLib.getHostname).not.toHaveBeenCalled();
    });

    it('should not force tab update if tab id is undefined', async () => {
      when(global.browser.tabs.query)
        .calledWith({ active: true, windowType: 'normal' })
        .mockResolvedValue([{ ...defaultTab, id: undefined }] as never);
      await CookieEvents.onCookieChanged({
        removed: false,
        cookie: defaultCookie,
        cause: 'overwrite',
      });
      expect(spyLib.getHostname).not.toHaveBeenCalled();
    });
  });
});
