// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';

// const API_URL = process.env.REACT_APP_API_URL;

// export const login = createAsyncThunk('user/login', async (loginData, { rejectWithValue }) => {
//   try {
//     const response = await axios.post(`${API_URL}/login`, loginData);
//     localStorage.setItem('token', response.data.token);
//     return { token: response.data.token, role: response.data.role, id: response.data.id };
//   } catch (error) {
//     return rejectWithValue(error.response?.data?.message || 'Login failed');
//   }
// });

// export const logout = createAsyncThunk('user/logout', async () => {
//   localStorage.removeItem('token');
//   return null;
// });

// export const fetchUsers = createAsyncThunk('user/fetchUsers', async (id = null, { getState, rejectWithValue }) => {
//   try {
//     const { user: { token } } = getState();
//     const config = { headers: { Authorization: `Bearer ${token}` } };
//     let url = id ? `${API_URL}/users/${id}` : `${API_URL}/users`;
//     const response = await axios.get(url, config);
//     return Array.isArray(response.data) ? response.data : [response.data];
//   } catch (error) {
//     return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
//   }
// });

// export const createUser = createAsyncThunk('user/createUser', async (userData, { getState, rejectWithValue }) => {
//   try {
//     const { user: { token } } = getState();
//     const config = { headers: { Authorization: `Bearer ${token}` } };
//     const response = await axios.post(`${API_URL}/users`, userData, config);
//     return response.data.user;
//   } catch (error) {
//     return rejectWithValue(error.response?.data?.message || 'Failed to create user');
//   }
// });

// export const updateUser = createAsyncThunk('user/updateUser', async ({ id, ...userData }, { getState, rejectWithValue }) => {
//   try {
//     const { user: { token } } = getState();
//     const config = { headers: { Authorization: `Bearer ${token}` } };
//     // Exclude password from payload if it's empty
//     const payload = { username: userData.username, email: userData.email, role: userData.role };
//     if (userData.password && userData.password.trim()) {
//       payload.password = userData.password;
//     }
//     const response = await axios.put(`${API_URL}/users/${id}`, payload, config);
//     return response.data.user;
//   } catch (error) {
//     return rejectWithValue(error.response?.data?.message || 'Failed to update user');
//   }
// });

// export const deleteUser = createAsyncThunk('user/deleteUser', async (id, { getState, rejectWithValue }) => {
//   try {
//     const { user: { token } } = getState();
//     const config = { headers: { Authorization: `Bearer ${token}` } };
//     await axios.delete(`${API_URL}/users/${id}`, config);
//     return id;
//   } catch (error) {
//     return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
//   }
// });

// const userSlice = createSlice({
//   name: 'user',
//   initialState: {
//     users: [],
//     currentUser: null,
//     role: null,
//     token: localStorage.getItem('token') || null,
//     loading: false,
//     error: null,
//   },
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       // Login
//       .addCase(login.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(login.fulfilled, (state, action) => {
//         state.loading = false;
//         state.token = action.payload.token;
//         state.role = action.payload.role;
//         state.currentUser = { id: action.payload.id };
//       })
//       .addCase(login.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // Logout
//       .addCase(logout.fulfilled, (state) => {
//         state.token = null;
//         state.currentUser = null;
//         state.role = null;
//         state.users = [];
//       })
//       // Fetch users
//       .addCase(fetchUsers.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchUsers.fulfilled, (state, action) => {
//         state.loading = false;
//         state.users = action.payload;
//       })
//       .addCase(fetchUsers.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // Create user
//       .addCase(createUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(createUser.fulfilled, (state, action) => {
//         state.loading = false;
//         state.users.push(action.payload);
//       })
//       .addCase(createUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // Update user
//       .addCase(updateUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(updateUser.fulfilled, (state, action) => {
//         state.loading = false;
//         const index = state.users.findIndex((user) => user._id === action.payload._id);
//         if (index !== -1) {
//           state.users[index] = action.payload;
//         }
//         if (state.currentUser?.id === action.payload._id) {
//           state.currentUser = { id: action.payload._id };
//           state.role = action.payload.role;
//         }
//       })
//       .addCase(updateUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // Delete user
//       .addCase(deleteUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(deleteUser.fulfilled, (state, action) => {
//         state.loading = false;
//         state.users = state.users.filter((user) => user._id !== action.payload);
//       })
//       .addCase(deleteUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export default userSlice.reducer;


import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export const login = createAsyncThunk('user/login', async (loginData, { rejectWithValue }) => {
  try {
    console.log('Sending login request:', loginData);
    const response = await axios.post(`${API_URL}/login`, loginData);
    console.log('Login response:', response.data);
    localStorage.setItem('token', response.data.token);
    return { token: response.data.token, role: response.data.role, id: response.data.id };
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

export const logout = createAsyncThunk('user/logout', async () => {
  console.log('Logging out, removing token');
  localStorage.removeItem('token');
  return null;
});

export const fetchUsers = createAsyncThunk('user/fetchUsers', async (id = null, { getState, rejectWithValue }) => {
  try {
    const { user: { token } } = getState();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    let url = id ? `${API_URL}/users/${id}` : `${API_URL}/users`;
    console.log('Fetching users from:', url);
    const response = await axios.get(url, config);
    console.log('Fetch users response:', response.data);
    return Array.isArray(response.data) ? response.data : [response.data];
  } catch (error) {
    console.error('Fetch users error:', error.response?.data || error.message);
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
  }
});

export const createUser = createAsyncThunk('user/createUser', async (userData, { getState, rejectWithValue }) => {
  try {
    const { user: { token } } = getState();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    console.log('Creating user with data:', userData);
    const response = await axios.post(`${API_URL}/users`, userData, config);
    console.log('Create user response:', response.data);
    return response.data.user;
  } catch (error) {
    console.error('Create user error:', error.response?.data || error.message);
    return rejectWithValue(error.response?.data?.message || 'Failed to create user');
  }
});

export const updateUser = createAsyncThunk('user/updateUser', async ({ id, ...userData }, { getState, rejectWithValue }) => {
  try {
    const { user: { token } } = getState();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const payload = { username: userData.username, email: userData.email, role: userData.role };
    if (userData.password && userData.password.trim()) {
      payload.password = userData.password;
    }
    console.log('Updating user:', id, 'with data:', payload);
    const response = await axios.put(`${API_URL}/users/${id}`, payload, config);
    console.log('Update user response:', response.data);
    return response.data.user;
  } catch (error) {
    console.error('Update user error:', error.response?.data || error.message);
    return rejectWithValue(error.response?.data?.message || 'Failed to update user');
  }
});

export const deleteUser = createAsyncThunk('user/deleteUser', async (id, { getState, rejectWithValue }) => {
  try {
    const { user: { token } } = getState();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    console.log('Deleting user:', id);
    await axios.delete(`${API_URL}/users/${id}`, config);
    console.log('User deleted:', id);
    return id;
  } catch (error) {
    console.error('Delete user error:', error.response?.data || error.message);
    return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
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
        console.log('Login pending');
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.currentUser = { id: action.payload.id };
        console.log('Login fulfilled, state updated:', { token: action.payload.token, role: action.payload.role, id: action.payload.id });
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.log('Login rejected:', action.payload);
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.token = null;
        state.currentUser = null;
        state.role = null;
        state.users = [];
        console.log('Logout fulfilled, state cleared');
      })
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log('Fetch users pending');
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
        console.log('Fetch users fulfilled, users:', action.payload);
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.log('Fetch users rejected:', action.payload);
      })
      // Create user
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log('Create user pending');
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.push(action.payload);
        console.log('Create user fulfilled, user added:', action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.log('Create user rejected:', action.payload);
      })
      // Update user
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log('Update user pending');
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
        console.log('Update user fulfilled, state updated:', action.payload);
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.log('Update user rejected:', action.payload);
      })
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log('Delete user pending');
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter((user) => user._id !== action.payload);
        console.log('Delete user fulfilled, user removed:', action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.log('Delete user rejected:', action.payload);
      });
  },
});

export default userSlice.reducer;