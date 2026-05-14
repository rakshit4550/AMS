import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

export const fetchUtrs = createAsyncThunk(
  "utr/fetchUtrs",
  async (_, { getState, rejectWithValue }) => {
    try {
      const {
        user: { token },
      } = getState();

      if (!token) {
        return rejectWithValue("No token available");
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_URL}/utrs`, config);

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const createUtr = createAsyncThunk(
  "utr/createUtr",
  async (utrData, { getState, rejectWithValue }) => {
    try {
      const {
        user: { token },
      } = getState();

      if (!token) {
        return rejectWithValue("No token available");
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`${API_URL}/utrs`, utrData, config);

      return response.data.utr;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const deleteUtr = createAsyncThunk(
  "utr/deleteUtr",
  async (id, { getState, rejectWithValue }) => {
    try {
      const {
        user: { token },
      } = getState();

      if (!token) {
        return rejectWithValue("No token available");
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_URL}/utrs/${id}`, config);

      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

const utrSlice = createSlice({
  name: "utr",
  initialState: {
    utrs: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearUtrError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUtrs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUtrs.fulfilled, (state, action) => {
        state.loading = false;
        state.utrs = action.payload;
      })
      .addCase(fetchUtrs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createUtr.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUtr.fulfilled, (state, action) => {
        state.loading = false;
        state.utrs = [action.payload, ...state.utrs];
      })
      .addCase(createUtr.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteUtr.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUtr.fulfilled, (state, action) => {
        state.loading = false;
        state.utrs = state.utrs.filter((utr) => utr._id !== action.payload);
      })
      .addCase(deleteUtr.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearUtrError } = utrSlice.actions;
export default utrSlice.reducer;
