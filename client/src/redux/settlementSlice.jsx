import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Create settlement
export const createSettlement = createAsyncThunk(
  'settlement/create',
  async (settlementData, { rejectWithValue, getState }) => {
    try {
      const { user } = getState();
      console.log('Creating settlement with token:', user.token, 'Data:', settlementData);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const response = await axios.post(`${API_URL}/settlements`, settlementData, config);
      console.log('Create settlement response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Create settlement error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to create settlement');
    }
  }
);

// Get all settlements
export const getSettlements = createAsyncThunk(
  'settlement/getAll',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { user } = getState();
      console.log('Fetching settlements with token:', user.token);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const response = await axios.get(`${API_URL}/settlements`, config);
      console.log('Get settlements response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get settlements error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch settlements');
    }
  }
);

// Get settlement by ID
export const getSettlementById = createAsyncThunk(
  'settlement/getById',
  async (id, { rejectWithValue, getState }) => {
    try {
      const { user } = getState();
      console.log('Fetching settlement by ID:', id, 'with token:', user.token);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const response = await axios.get(`${API_URL}/settlements/${id}`, config);
      console.log('Get settlement by ID response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get settlement by ID error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch settlement');
    }
  }
);

// Update settlement
export const updateSettlement = createAsyncThunk(
  'settlement/update',
  async ({ id, settlementData }, { rejectWithValue, getState }) => {
    try {
      const { user } = getState();
      console.log('Updating settlement with ID:', id, 'Data:', settlementData, 'Token:', user.token);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const response = await axios.put(`${API_URL}/settlements/${id}`, settlementData, config);
      console.log('Update settlement response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Update settlement error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to update settlement');
    }
  }
);

// Delete settlement
export const deleteSettlement = createAsyncThunk(
  'settlement/delete',
  async (id, { rejectWithValue, getState }) => {
    try {
      const { user } = getState();
      console.log('Deleting settlement with ID:', id, 'Token:', user.token);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      await axios.delete(`${API_URL}/settlements/${id}`, config);
      console.log('Settlement deleted:', id);
      return id;
    } catch (error) {
      console.error('Delete settlement error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to delete settlement');
    }
  }
);

// Download settlements
export const downloadSettlements = createAsyncThunk(
  'settlement/download',
  async (domainId, { rejectWithValue, getState }) => {
    try {
      const { user } = getState();
      console.log('Downloading settlements, domainId:', domainId, 'Token:', user.token);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const url = domainId ? `${API_URL}/settlements/download?domain=${domainId}` : `${API_URL}/settlements/download`;
      const response = await axios.get(url, config);
      console.log('Download settlements response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Download settlements error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to download settlements');
    }
  }
);

const settlementSlice = createSlice({
  name: 'settlement',
  initialState: {
    settlements: [],
    currentSettlement: null,
    groupedSettlements: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    reset: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create settlement
      .addCase(createSettlement.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log('Create settlement pending');
      })
      .addCase(createSettlement.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.settlements.push(action.payload.data);
        console.log('Create settlement fulfilled, added:', action.payload.data);
      })
      .addCase(createSettlement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.log('Create settlement rejected:', action.payload);
      })
      // Get all settlements
      .addCase(getSettlements.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log('Get settlements pending');
      })
      .addCase(getSettlements.fulfilled, (state, action) => {
        state.loading = false;
        state.settlements = action.payload;
        console.log('Get settlements fulfilled:', action.payload);
      })
      .addCase(getSettlements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.log('Get settlements rejected:', action.payload);
      })
      // Get settlement by ID
      .addCase(getSettlementById.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log('Get settlement by ID pending');
      })
      .addCase(getSettlementById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSettlement = action.payload;
        console.log('Get settlement by ID fulfilled:', action.payload);
      })
      .addCase(getSettlementById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.log('Get settlement by ID rejected:', action.payload);
      })
      // Update settlement
      .addCase(updateSettlement.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log('Update settlement pending');
      })
      .addCase(updateSettlement.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.settlements = state.settlements.map((settlement) =>
          settlement._id === action.payload.data._id ? action.payload.data : settlement
        );
        console.log('Update settlement fulfilled:', action.payload.data);
      })
      .addCase(updateSettlement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.log('Update settlement rejected:', action.payload);
      })
      // Delete settlement
      .addCase(deleteSettlement.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log('Delete settlement pending');
      })
      .addCase(deleteSettlement.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.settlements = state.settlements.filter((settlement) => settlement._id !== action.payload);
        console.log('Delete settlement fulfilled, ID:', action.payload);
      })
      .addCase(deleteSettlement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.log('Delete settlement rejected:', action.payload);
      })
      // Download settlements
      .addCase(downloadSettlements.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log('Download settlements pending');
      })
      .addCase(downloadSettlements.fulfilled, (state, action) => {
        state.loading = false;
        state.groupedSettlements = action.payload;
        console.log('Download settlements fulfilled:', action.payload);
      })
      .addCase(downloadSettlements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.log('Download settlements rejected:', action.payload);
      });
  },
});

export const { reset } = settlementSlice.actions;
export default settlementSlice.reducer;