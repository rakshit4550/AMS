import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export const fetchAccounts = createAsyncThunk(
  'account/fetchAccounts',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      if (!token) {
        return rejectWithValue('No token available');
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_URL}/accounts`, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createAccount = createAsyncThunk(
  'account/createAccount',
  async (accountData, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      if (!token) {
        return rejectWithValue('No token available');
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`${API_URL}/accounts`, accountData, config);
      return response.data.account;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateAccount = createAsyncThunk(
  'account/updateAccount',
  async ({ id, ...accountData }, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      if (!token) {
        return rejectWithValue('No token available');
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.put(`${API_URL}/accounts/${id}`, accountData, config);
      return response.data.account;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteAccount = createAsyncThunk(
  'account/deleteAccount',
  async (id, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      if (!token) {
        return rejectWithValue('No token available');
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_URL}/accounts/${id}`, config);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const verifyAccount = createAsyncThunk(
  'account/verifyAccount',
  async (id, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      if (!token) {
        return rejectWithValue('No token available');
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.put(`${API_URL}/accounts/${id}/verify`, {}, config);
      return response.data.account;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchParties = createAsyncThunk(
  'account/fetchParties',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      if (!token) {
        return rejectWithValue('No token available');
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_URL}/parties`, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

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
        state.error = action.payload;
      })
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
        state.error = action.payload;
      })
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
        state.error = action.payload;
      })
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
        state.error = action.payload;
      })
      .addCase(verifyAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyAccount.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.accounts.findIndex((account) => account._id === action.payload._id);
        if (index !== -1) {
          state.accounts[index] = action.payload;
        }
      })
      .addCase(verifyAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
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
        state.error = action.payload;
      });
  },
});

export default accountSlice.reducer;