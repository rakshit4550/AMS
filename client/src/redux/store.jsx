import { configureStore } from '@reduxjs/toolkit';
import partyReducer from './partySlice';
import userReducer from './authSlice';
import accountReducer from './accountSlice';
import settlementReducer from './settlementSlice';
import domainReducer from './domainSlice';

export const store = configureStore({
  reducer: {
    party: partyReducer,
    user: userReducer,
    account: accountReducer,
    settlement: settlementReducer,
    domain: domainReducer,
    
  },
});