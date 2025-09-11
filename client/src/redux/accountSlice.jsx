import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:4050/api';

export const fetchAccounts = createAsyncThunk('account/fetchAccounts', async () => {
  const response = await axios.get(`${API_URL}/accounts`);
  return response.data;
});

export const createAccount = createAsyncThunk('account/createAccount', async (accountData) => {
  const response = await axios.post(`${API_URL}/accounts`, accountData);
  return response.data.account;
});

export const updateAccount = createAsyncThunk('account/updateAccount', async ({ id, ...accountData }) => {
  const response = await axios.put(`${API_URL}/accounts/${id}`, accountData);
  return response.data.account;
});

export const deleteAccount = createAsyncThunk('account/deleteAccount', async (id) => {
  await axios.delete(`${API_URL}/accounts/${id}`);
  return id;
});

export const fetchParties = createAsyncThunk('account/fetchParties', async () => {
  const response = await axios.get(`${API_URL}/parties`);
  return response.data;
});

const accountSlice = createSlice({
  name: 'account',
  initialState: {
    accounts: [],
    parties: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch accounts
      .addCase(fetchAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts = action.payload;
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Create account
      .addCase(createAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts.push(action.payload);
      })
      .addCase(createAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Update account
      .addCase(updateAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAccount.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.accounts.findIndex((account) => account._id === action.payload._id);
        if (index !== -1) {
          state.accounts[index] = action.payload;
        }
      })
      .addCase(updateAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Delete account
      .addCase(deleteAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts = state.accounts.filter((account) => account._id !== action.payload);
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Fetch parties
      .addCase(fetchParties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParties.fulfilled, (state, action) => {
        state.loading = false;
        state.parties = action.payload;
      })
      .addCase(fetchParties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default accountSlice.reducer;