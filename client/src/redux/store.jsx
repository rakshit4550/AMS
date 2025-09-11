import { configureStore } from '@reduxjs/toolkit';
import partyReducer from './partySlice';
import authReducer from './authSlice';
import accountReducer from './accountSlice';

export const store = configureStore({
  reducer: {
    party: partyReducer,
    auth: authReducer,
    account: accountReducer,
  },
});