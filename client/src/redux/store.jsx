import { configureStore } from '@reduxjs/toolkit';
import partyReducer from './partySlice';
import userReducer from './authSlice';
import accountReducer from './accountSlice';
import utrReducer from './utrSlice';

export const store = configureStore({
  reducer: {
    party: partyReducer,
    user: userReducer,
    account: accountReducer,
    utr: utrReducer,
  },
});