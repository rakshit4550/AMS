import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Create settlement
export const createSettlement = createAsyncThunk(
  'settlement/create',
  async (settlementData, { rejectWithValue, getState }) => {
    try {
      const { user } = getState().auth;
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const response = await axios.post(`${API_URL}/settlements`, settlementData, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Get all settlements
export const getSettlements = createAsyncThunk(
  'settlement/getAll',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { user } = getState().auth;
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const response = await axios.get(`${API_URL}/settlements`, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Get settlement by ID
export const getSettlementById = createAsyncThunk(
  'settlement/getById',
  async (id, { rejectWithValue, getState }) => {
    try {
      const { user } = getState().auth;
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const response = await axios.get(`${API_URL}/settlements/${id}`, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Update settlement
export const updateSettlement = createAsyncThunk(
  'settlement/update',
  async ({ id, settlementData }, { rejectWithValue, getState }) => {
    try {
      const { user } = getState().auth;
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const response = await axios.put(`${API_URL}/settlements/${id}`, settlementData, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Delete settlement
export const deleteSettlement = createAsyncThunk(
  'settlement/delete',
  async (id, { rejectWithValue, getState }) => {
    try {
      const { user } = getState().auth;
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      await axios.delete(`${API_URL}/settlements/${id}`, config);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Download settlements
export const downloadSettlements = createAsyncThunk(
  'settlement/download',
  async (domainId, { rejectWithValue, getState }) => {
    try {
      const { user } = getState().auth;
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const url = domainId ? `${API_URL}/download?domain=${domainId}` : `${API_URL}/settlements/download`;
      const response = await axios.get(url, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
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
      })
      .addCase(createSettlement.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.settlements.push(action.payload.data);
      })
      .addCase(createSettlement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get all settlements
      .addCase(getSettlements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSettlements.fulfilled, (state, action) => {
        state.loading = false;
        state.settlements = action.payload;
      })
      .addCase(getSettlements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get settlement by ID
      .addCase(getSettlementById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSettlementById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSettlement = action.payload;
      })
      .addCase(getSettlementById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update settlement
      .addCase(updateSettlement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSettlement.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.settlements = state.settlements.map((settlement) =>
          settlement._id === action.payload.data._id ? action.payload.data : settlement
        );
      })
      .addCase(updateSettlement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete settlement
      .addCase(deleteSettlement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSettlement.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.settlements = state.settlements.filter((settlement) => settlement._id !== action.payload);
      })
      .addCase(deleteSettlement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Download settlements
      .addCase(downloadSettlements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(downloadSettlements.fulfilled, (state, action) => {
        state.loading = false;
        state.groupedSettlements = action.payload;
      })
      .addCase(downloadSettlements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { reset } = settlementSlice.actions;
export default settlementSlice.reducer;