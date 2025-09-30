import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL + '/domains';

// Async thunks for API calls
export const fetchDomains = createAsyncThunk('domain/fetchDomains', async (_, { getState, rejectWithValue }) => {
  try {
    const { user: { token } } = getState();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.get(API_URL, config);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data.message);
  }
});

export const createDomain = createAsyncThunk('domain/createDomain', async (domainData, { getState, rejectWithValue }) => {
  try {
    const { user: { token } } = getState();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.post(API_URL, domainData, config);
    return response.data.domain;
  } catch (error) {
    return rejectWithValue(error.response.data.message);
  }
});

export const updateDomain = createAsyncThunk('domain/updateDomain', async ({ id, domainname }, { getState, rejectWithValue }) => {
  try {
    const { user: { token } } = getState();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.put(`${API_URL}/${id}`, { domainname }, config);
    return response.data.domain;
  } catch (error) {
    return rejectWithValue(error.response.data.message);
  }
});

export const deleteDomain = createAsyncThunk('domain/deleteDomain', async (id, { getState, rejectWithValue }) => {
  try {
    const { user: { token } } = getState();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    await axios.delete(`${API_URL}/${id}`, config);
    return id;
  } catch (error) {
    return rejectWithValue(error.response.data.message);
  }
});

const domainSlice = createSlice({
  name: 'domain',
  initialState: {
    domains: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDomains.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDomains.fulfilled, (state, action) => {
        state.loading = false;
        state.domains = action.payload;
      })
      .addCase(fetchDomains.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createDomain.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDomain.fulfilled, (state, action) => {
        state.loading = false;
        state.domains.push(action.payload);
      })
      .addCase(createDomain.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateDomain.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDomain.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.domains.findIndex((domain) => domain._id === action.payload._id);
        if (index !== -1) {
          state.domains[index] = action.payload;
        }
      })
      .addCase(updateDomain.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteDomain.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDomain.fulfilled, (state, action) => {
        state.loading = false;
        state.domains = state.domains.filter((domain) => domain._id !== action.payload);
      })
      .addCase(deleteDomain.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default domainSlice.reducer;