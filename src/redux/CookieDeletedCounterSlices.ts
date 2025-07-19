import {
  createAction,
  createReducer,
  createSlice,
  isAnyOf
} from '@reduxjs/toolkit';
import { ReduxConstants } from './ReduxConstants';
import { handleStartUp } from './BackgroundActions';
import { resetAll } from './SharedActions';

const initialState: number = 0;
const actions = {
  incrementCookieDeletedCounter: createAction<number | undefined>(
    ReduxConstants.RESET_COOKIE_DELETED_COUNTER,
  ),
  resetCookieDeletedCounter: createAction(
    ReduxConstants.RESET_COOKIE_DELETED_COUNTER,
  ),
};

const cookieDeletedCounterReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(incrementCookieDeletedCounter, (state, action) => {
      return state + (action.payload ?? 1);
    })
    .addMatcher(isAnyOf(resetAll, handleStartUp), () => 0)
    .addDefaultCase((state) => state);
});

const cookieDeletedCounterSessionSlice = createSlice({
  name: 'cookieDeletedCounterSession',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(handleStartUp, () => 0)
      .addDefaultCase(cookieDeletedCounterReducer);
  },
});

const cookieDeletedCounterTotalSlice = createSlice({
  name: 'cookieDeletedCounterTotal',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addDefaultCase(cookieDeletedCounterReducer);
  },
});

export const { incrementCookieDeletedCounter, resetCookieDeletedCounter } =
  actions;

export default {
  cookieDeletedCounterSession: cookieDeletedCounterSessionSlice.reducer,
  cookieDeletedCounterTotal: cookieDeletedCounterTotalSlice.reducer,
};
