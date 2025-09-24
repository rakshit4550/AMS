import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL

export const login = createAsyncThunk('user/login', async (loginData, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${API_URL}/login`, loginData);
    localStorage.setItem('token', response.data.token);
    return { token: response.data.token, role: response.data.role };
  } catch (error) {
    return rejectWithValue(error.response.data.message);
  }
});

export const logout = createAsyncThunk('user/logout', async () => {
  localStorage.removeItem('token');
  return null;
});

export const fetchUsers = createAsyncThunk('user/fetchUsers', async (id = null, { getState, rejectWithValue }) => {
  try {
    const { user: { token } } = getState();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    let url;
    if (id) {
      url = `${API_URL}/users/${id}`;
    } else {
      url = `${API_URL}/users`;
    }
    const response = await axios.get(url, config);
    return Array.isArray(response.data) ? response.data : [response.data];
  } catch (error) {
    return rejectWithValue(error.response.data.message);
  }
});

export const createUser = createAsyncThunk('user/createUser', async (userData, { getState, rejectWithValue }) => {
  try {
    const { user: { token } } = getState();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.post(`${API_URL}/users`, userData, config);
    return response.data.user;
  } catch (error) {
    return rejectWithValue(error.response.data.message);
  }
});

export const updateUser = createAsyncThunk('user/updateUser', async ({ id, ...userData }, { getState, rejectWithValue }) => {
  try {
    const { user: { token } } = getState();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.put(`${API_URL}/users/${id}`, userData, config);
    return response.data.user;
  } catch (error) {
    return rejectWithValue(error.response.data.message);
  }
});

export const deleteUser = createAsyncThunk('user/deleteUser', async (id, { getState, rejectWithValue }) => {
  try {
    const { user: { token } } = getState();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    await axios.delete(`${API_URL}/users/${id}`, config);
    return id;
  } catch (error) {
    return rejectWithValue(error.response.data.message);
  }
});

const userSlice = createSlice({
  name: 'user',
  initialState: {
    users: [],
    currentUser: null,
    role: null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.currentUser = { id: action.payload.id }; // Fallback if needed, but not from login response
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.token = null;
        state.currentUser = null;
        state.role = null;
        state.users = [];
      })
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create user
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update user
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.users.findIndex((user) => user._id === action.payload._id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.currentUser?.id === action.payload._id) {
          state.currentUser = { id: action.payload._id };
          state.role = action.payload.role;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter((user) => user._id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default userSlice.reducer;