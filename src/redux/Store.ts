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
/* istanbul ignore file: Redux stuff.*/

import { configureStore } from '@reduxjs/toolkit';
import logger from 'redux-logger';
import { alias, createWrapStore } from 'webext-redux';

// slices
import activityLog from './ActivityLogSlice';
import cache from './CacheSlice';
import cookieDeletedCounterReducers from './CookieDeletedCounterSlices';
import lists from './ListsSlice';
import settings from './SettingsSlice';
import type { ActivityLog } from '../typings/Cleanup';
import type {
  StoreIdToExpressionList,
  MapToSettingObject,
  CacheMap,
} from '../typings/Global';
import {
  addExpression,
  clearExpressions,
  cookieCleanup,
  removeExpression,
  removeList,
  updateExpression,
} from './BackgroundActions';

const wrapStore = createWrapStore();

const aliases = {
  ADD_EXPRESSION: addExpression,
  CLEAR_EXPRESSIONS: clearExpressions,
  REMOVE_EXPRESSION: removeExpression,
  UPDATE_EXPRESSION: updateExpression,
  REMOVE_LIST: removeList,
  COOKIE_CLEANUP: cookieCleanup,
};

export const configureWrapStore = (state: State) => {
  const store = configureStore({
    preloadedState: state,
    reducer: {
      activityLog,
      cache,
      ...cookieDeletedCounterReducers,
      lists,
      settings,
    },
    middleware: (getDefaultMiddleware) => {
      const middleware = getDefaultMiddleware();

      // Conditionally add another middleware in dev
      if (process.env.NODE_ENV !== 'production') {
        middleware.push(logger);
      }

      return middleware.concat(alias(aliases));
    },
  });
  wrapStore(store);
  return store;
};

export type State = Readonly<{
  lists: StoreIdToExpressionList;
  cookieDeletedCounterTotal: number;
  cookieDeletedCounterSession: number;
  settings: MapToSettingObject;
  activityLog: ReadonlyArray<ActivityLog>;
  cache: CacheMap;
}>;

export type Dispatch = ReturnType<typeof configureWrapStore>['dispatch'];
export type GetState = ReturnType<typeof configureWrapStore>['getState'];
