import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL + '/events';

const authConfig = (token, params) => ({
  headers: { Authorization: `Bearer ${token}` },
  ...(params ? { params } : {}),
});

const entriesUrl = (eventId, marketId) =>
  `${API_URL}/${eventId}/markets/${marketId}/entries`;

export const fetchEntries = createAsyncThunk(
  'entry/fetchEntries',
  async ({ eventId, marketId, ...params }, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      const response = await axios.get(
        entriesUrl(eventId, marketId),
        authConfig(token, {
          page: 1,
          limit: 20,
          sortBy: 'createdAt',
          sortOrder: 'desc',
          ...params,
        })
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createEntry = createAsyncThunk(
  'entry/createEntry',
  async ({ eventId, marketId, ...entryData }, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      const response = await axios.post(entriesUrl(eventId, marketId), entryData, authConfig(token));
      return response.data.entry;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateEntry = createAsyncThunk(
  'entry/updateEntry',
  async ({ eventId, marketId, id, ...entryData }, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      const response = await axios.put(
        `${entriesUrl(eventId, marketId)}/${id}`,
        entryData,
        authConfig(token)
      );
      return response.data.entry;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const entrySlice = createSlice({
  name: 'entry',
  initialState: {
    marketId: null,
    entries: [],
    position: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEntries.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        if (state.marketId !== action.meta.arg.marketId) {
          state.entries = [];
          state.position = null;
        }
        state.marketId = action.meta.arg.marketId;
      })
      .addCase(fetchEntries.fulfilled, (state, action) => {
        if (state.marketId !== action.meta.arg.marketId) return;
        state.loading = false;
        state.entries = action.payload?.entries ?? [];
        state.position = action.payload?.position ?? null;
      })
      .addCase(fetchEntries.rejected, (state, action) => {
        if (state.marketId !== action.meta.arg?.marketId) return;
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createEntry.pending, (state) => {
        state.error = null;
      })
      .addCase(createEntry.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateEntry.pending, (state) => {
        state.error = null;
      })
      .addCase(updateEntry.fulfilled, (state, action) => {
        const index = state.entries.findIndex((entry) => entry._id === action.payload._id);
        if (index !== -1) state.entries[index] = action.payload;
      })
      .addCase(updateEntry.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default entrySlice.reducer;
