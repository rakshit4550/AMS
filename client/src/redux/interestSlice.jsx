import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL + "/interests";
const PARTY_URL = process.env.REACT_APP_API_URL + "/parties";

const authConfig = (token, params) => ({
  headers: { Authorization: `Bearer ${token}` },
  ...(params ? { params } : {}),
});

const errorMessage = (error) => error.response?.data?.message || error.message;

export const fetchPartyOptions = createAsyncThunk(
  "interest/fetchPartyOptions",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      const parties = [];
      let page = 1;
      let totalPages = 1;
      do {
        const response = await axios.get(
          PARTY_URL,
          authConfig(token, { page, limit: 100, sortBy: "partyname", sortOrder: "asc" }),
        );
        parties.push(...(response.data?.parties || []));
        totalPages = response.data?.pagination?.totalPages || 1;
        page += 1;
      } while (page <= totalPages && page <= 30);
      return parties;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const fetchInterests = createAsyncThunk(
  "interest/fetchInterests",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      const response = await axios.get(API_URL, authConfig(token, params));
      return response.data;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const createInterest = createAsyncThunk(
  "interest/createInterest",
  async (body, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      const response = await axios.post(API_URL, body, authConfig(token));
      return response.data.interest;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const updateInterest = createAsyncThunk(
  "interest/updateInterest",
  async ({ id, ...body }, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      const response = await axios.put(`${API_URL}/${id}`, body, authConfig(token));
      return response.data.interest;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

const interestSlice = createSlice({
  name: "interest",
  initialState: {
    interests: [],
    pagination: null,
    partyOptions: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInterests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInterests.fulfilled, (state, action) => {
        state.loading = false;
        state.interests = action.payload?.interests || [];
        state.pagination = action.payload?.pagination || null;
      })
      .addCase(fetchInterests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchPartyOptions.fulfilled, (state, action) => {
        state.partyOptions = action.payload || [];
      });
  },
});

export default interestSlice.reducer;
