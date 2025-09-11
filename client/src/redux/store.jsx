import { configureStore } from '@reduxjs/toolkit';
import partyReducer from './partySlice';

export const store = configureStore({
  reducer: {
    party: partyReducer,
  },
});