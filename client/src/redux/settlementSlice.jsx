import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL + '/settlement-parties';

const authConfig = (token, params) => ({
  headers: { Authorization: `Bearer ${token}` },
  ...(params ? { params } : {}),
});

export const fetchSettlementParties = createAsyncThunk(
  'settlement/fetchParties',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      const response = await axios.get(
        API_URL,
        authConfig(token, {
          page: 1,
          limit: 20,
          sortBy: 'partyname',
          sortOrder: 'asc',
          ...params,
        }),
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const createSettlementParty = createAsyncThunk(
  'settlement/createParty',
  async (partyData, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      const response = await axios.post(API_URL, partyData, authConfig(token));
      return response.data.party;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const updateSettlementParty = createAsyncThunk(
  'settlement/updateParty',
  async ({ id, ...partyData }, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      const response = await axios.put(`${API_URL}/${id}`, partyData, authConfig(token));
      return response.data.party;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const createSettlementUsername = createAsyncThunk(
  'settlement/createUsername',
  async ({ partyId, ...body }, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      const response = await axios.post(
        `${API_URL}/${partyId}/usernames`,
        body,
        authConfig(token),
      );
      return response.data.username;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchSettlementEntries = createAsyncThunk(
  'settlement/fetchEntries',
  async ({ partyId, usernameId, page = 1, limit = 20 }, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      const response = await axios.get(
        `${API_URL}/${partyId}/usernames/${usernameId}/entries`,
        authConfig(token, { page, limit }),
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const createSettlementEntry = createAsyncThunk(
  'settlement/createEntry',
  async ({ partyId, usernameId, amount, transactionType }, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      const response = await axios.post(
        `${API_URL}/${partyId}/usernames/${usernameId}/entries`,
        { amount, transactionType },
        authConfig(token),
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const updateSettlementUsername = createAsyncThunk(
  'settlement/updateUsername',
  async ({ partyId, usernameId, ...body }, { getState, rejectWithValue }) => {
    try {
      const { user: { token } } = getState();
      const response = await axios.put(
        `${API_URL}/${partyId}/usernames/${usernameId}`,
        body,
        authConfig(token),
      );
      return response.data.username;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

const idOf = (value) => {
  if (!value) return '';
  if (typeof value === 'object') return String(value._id || value);
  return String(value);
};

const upsertUsername = (parties, entry) => {
  const partyId = idOf(entry.settlementParty);
  const party = parties.find((item) => idOf(item._id) === partyId);
  if (!party) return;
  const list = party.usernames ? [...party.usernames] : [];
  const index = list.findIndex((item) => idOf(item._id) === idOf(entry._id));
  if (index === -1) list.push(entry);
  else list[index] = { ...list[index], ...entry };
  list.sort((a, b) => String(a.username).localeCompare(String(b.username)));
  party.usernames = list;
};

const settlementSlice = createSlice({
  name: 'settlement',
  initialState: {
    parties: [],
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearSettlementError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettlementParties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettlementParties.fulfilled, (state, action) => {
        state.loading = false;
        state.parties = action.payload?.parties ?? [];
        state.pagination = action.payload?.pagination ?? null;
      })
      .addCase(fetchSettlementParties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createSettlementParty.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateSettlementParty.fulfilled, (state, action) => {
        const index = state.parties.findIndex((party) => party._id === action.payload._id);
        if (index !== -1) state.parties[index] = action.payload;
      })
      .addCase(updateSettlementParty.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(createSettlementUsername.fulfilled, (state, action) => {
        upsertUsername(state.parties, action.payload);
      })
      .addCase(createSettlementUsername.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateSettlementUsername.fulfilled, (state, action) => {
        upsertUsername(state.parties, action.payload);
      })
      .addCase(updateSettlementUsername.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearSettlementError } = settlementSlice.actions;
export default settlementSlice.reducer;
