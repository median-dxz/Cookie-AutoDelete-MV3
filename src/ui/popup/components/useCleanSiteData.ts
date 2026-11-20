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
import { useCallback } from 'react';
import type browser from 'webextension-polyfill';
import {
  clearCookiesForThisDomain,
  clearLocalStorageForThisDomain,
  clearSiteDataForThisDomain,
} from '../../../services/CleanupService';
import type { SiteDataType } from '../../../typings/Enums';
import { useUIDispatch } from '../../hooks';

/**
 * Returns a function that cleans the given site data type (or 'All') for a
 * hostname. Resolves to true if anything was cleaned.
 */
export const useCleanSiteData = () => {
  const dispatch = useUIDispatch();

  return useCallback(
    async (
      siteData: SiteDataType | 'All',
      hostname: string,
      tab?: browser.Tabs.Tab,
    ): Promise<boolean> => {
      if (!hostname) return false;

      let result = await dispatch(
        clearSiteDataForThisDomain({ siteData, hostname }),
      ).unwrap();

      if (siteData === 'All') {
        if (!tab) return false;

        const cookieSuccess = await dispatch(
          clearCookiesForThisDomain(tab),
        ).unwrap();

        const localStorageSuccess = await dispatch(
          clearLocalStorageForThisDomain(tab),
        ).unwrap();

        result = result || cookieSuccess || localStorageSuccess;
      }

      return result;
    },
    [dispatch],
  );
};
