import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL + '/events';

export const fetchEvents = createAsyncThunk(
  'event/fetchEvents',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      const config = {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, limit: 20, sortBy: 'date', sortOrder: 'desc', ...params },
      };
      const response = await axios.get(API_URL, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createEvent = createAsyncThunk(
  'event/createEvent',
  async (eventData, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(API_URL, eventData, config);
      return response.data.event;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateEvent = createAsyncThunk(
  'event/updateEvent',
  async ({ id, ...eventData }, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.put(`${API_URL}/${id}`, eventData, config);
      return response.data.event;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const eventSlice = createSlice({
  name: 'event',
  initialState: {
    events: [],
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearEventError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload?.events ?? [];
        state.pagination = action.payload?.pagination ?? null;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createEvent.pending, (state) => {
        state.error = null;
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateEvent.pending, (state) => {
        state.error = null;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        const index = state.events.findIndex((event) => event._id === action.payload._id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearEventError } = eventSlice.actions;
export default eventSlice.reducer;
