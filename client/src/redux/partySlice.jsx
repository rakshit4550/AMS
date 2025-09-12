import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL + '/parties';

// Async thunks for API calls
export const fetchParties = createAsyncThunk('party/fetchParties', async (_, { getState, rejectWithValue }) => {
  try {
    const { user: { token } } = getState();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.get(API_URL, config);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data.message);
  }
});

export const createParty = createAsyncThunk('party/createParty', async (partyData, { getState, rejectWithValue }) => {
  try {
    const { user: { token } } = getState();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.post(API_URL, partyData, config);
    return response.data.party;
  } catch (error) {
    return rejectWithValue(error.response.data.message);
  }
});

export const updateParty = createAsyncThunk('party/updateParty', async ({ id, partyname }, { getState, rejectWithValue }) => {
  try {
    const { user: { token } } = getState();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.put(`${API_URL}/${id}`, { partyname }, config);
    return response.data.party;
  } catch (error) {
    return rejectWithValue(error.response.data.message);
  }
});

export const deleteParty = createAsyncThunk('party/deleteParty', async (id, { getState, rejectWithValue }) => {
  try {
    const { user: { token } } = getState();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    await axios.delete(`${API_URL}/${id}`, config);
    return id;
  } catch (error) {
    return rejectWithValue(error.response.data.message);
  }
});

const partySlice = createSlice({
  name: 'party',
  initialState: {
    parties: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
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
      })
      .addCase(createParty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createParty.fulfilled, (state, action) => {
        state.loading = false;
        state.parties.push(action.payload);
      })
      .addCase(createParty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateParty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateParty.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.parties.findIndex((party) => party._id === action.payload._id);
        if (index !== -1) {
          state.parties[index] = action.payload;
        }
      })
      .addCase(updateParty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteParty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteParty.fulfilled, (state, action) => {
        state.loading = false;
        state.parties = state.parties.filter((party) => party._id !== action.payload);
      })
      .addCase(deleteParty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default partySlice.reducer;