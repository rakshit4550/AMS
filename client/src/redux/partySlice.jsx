import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL

// Async thunks for API calls
export const fetchParties = createAsyncThunk('party/fetchParties', async () => {
  const response = await axios.get(API_URL);
  return response.data;
});

export const createParty = createAsyncThunk('party/createParty', async (partyData) => {
  const response = await axios.post(API_URL, partyData);
  return response.data.party;
});

export const updateParty = createAsyncThunk('party/updateParty', async ({ id, partyname }) => {
  const response = await axios.put(`${API_URL}/${id}`, { partyname });
  return response.data.party;
});

export const deleteParty = createAsyncThunk('party/deleteParty', async (id) => {
  await axios.delete(`${API_URL}/${id}`);
  return id;
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
      // Fetch parties
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
        state.error = action.error.message;
      })
      // Create party
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
        state.error = action.error.message;
      })
      // Update party
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
        state.error = action.error.message;
      })
      // Delete party
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
        state.error = action.error.message;
      });
  },
});

export default partySlice.reducer;