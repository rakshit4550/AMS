import { configureStore } from '@reduxjs/toolkit';
import partyReducer from './partySlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    party: partyReducer,
    auth: authReducer,
  },
});