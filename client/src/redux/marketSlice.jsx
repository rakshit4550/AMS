import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL + '/events';

const authConfig = (token, params) => ({
  headers: { Authorization: `Bearer ${token}` },
  ...(params ? { params } : {}),
});

export const fetchMarkets = createAsyncThunk(
  'market/fetchMarkets',
  async ({ eventId, ...params }, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      const response = await axios.get(
        `${API_URL}/${eventId}/markets`,
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

export const createMarket = createAsyncThunk(
  'market/createMarket',
  async ({ eventId, ...marketData }, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      const response = await axios.post(
        `${API_URL}/${eventId}/markets`,
        marketData,
        authConfig(token)
      );
      return response.data.market;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateMarket = createAsyncThunk(
  'market/updateMarket',
  async ({ eventId, id, ...marketData }, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      const response = await axios.put(
        `${API_URL}/${eventId}/markets/${id}`,
        marketData,
        authConfig(token)
      );
      return response.data.market;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const marketSlice = createSlice({
  name: 'market',
  initialState: {
    eventId: null,
    markets: [],
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearMarketError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarkets.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        if (state.eventId !== action.meta.arg.eventId) {
          state.markets = [];
          state.pagination = null;
        }
        state.eventId = action.meta.arg.eventId;
      })
      .addCase(fetchMarkets.fulfilled, (state, action) => {
        if (state.eventId !== action.meta.arg.eventId) return;
        state.loading = false;
        state.markets = action.payload?.markets ?? [];
        state.pagination = action.payload?.pagination ?? null;
      })
      .addCase(fetchMarkets.rejected, (state, action) => {
        if (state.eventId !== action.meta.arg?.eventId) return;
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createMarket.pending, (state) => {
        state.error = null;
      })
      .addCase(createMarket.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateMarket.pending, (state) => {
        state.error = null;
      })
      .addCase(updateMarket.fulfilled, (state, action) => {
        const index = state.markets.findIndex((market) => market._id === action.payload._id);
        if (index !== -1) state.markets[index] = action.payload;
      })
      .addCase(updateMarket.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearMarketError } = marketSlice.actions;
export default marketSlice.reducer;
