import { configureStore } from '@reduxjs/toolkit';
import partyReducer from './partySlice';
import userReducer from './authSlice';
import accountReducer from './accountSlice';

export const store = configureStore({
  reducer: {
    party: partyReducer,
    user: userReducer,
    account: accountReducer,
    
  },
});