import { configureStore } from '@reduxjs/toolkit';
import partyReducer from './partySlice';
import userReducer from './authSlice';
import accountReducer from './accountSlice';
import settlementReducer from './settlementSlice';

export const store = configureStore({
  reducer: {
    party: partyReducer,
    user: userReducer,
    account: accountReducer,
    settlement: settlementReducer,
    
  },
});