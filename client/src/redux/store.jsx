import { configureStore } from '@reduxjs/toolkit';
import partyReducer from './partySlice';
import userReducer from './authSlice';
import accountReducer from './accountSlice';
import utrReducer from './utrSlice';
import settlementReducer from './settlementSlice';
import eventReducer from './eventSlice';
import marketReducer from './marketSlice';
import entryReducer from './entrySlice';
import interestReducer from './interestSlice';

export const store = configureStore({
  reducer: {
    party: partyReducer,
    user: userReducer,
    account: accountReducer,
    utr: utrReducer,
    settlement: settlementReducer,
    event: eventReducer,
    market: marketReducer,
    entry: entryReducer,
    interest: interestReducer,
  },
});