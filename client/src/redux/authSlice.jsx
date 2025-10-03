// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';

// const API_URL = process.env.REACT_APP_API_URL;

// // Load current user from token
// export const loadUser = createAsyncThunk('user/loadUser', async (_, { rejectWithValue }) => {
//   try {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       return rejectWithValue('');
//     }
//     const config = { headers: { Authorization: `Bearer ${token}` } };
//     console.log('Loading user with token:', token);
//     const response = await axios.get(`${API_URL}/me`, config);
//     console.log('Load user response:', response.data);
//     return {
//       token,
//       role: response.data.role,
//       id: response.data._id,
//       username: response.data.username,
//       email: response.data.email,
//     };
//   } catch (error) {
//     console.error('Load user error:', error.response?.data || error.message);
//     if (error.response?.status === 401) {
//       localStorage.removeItem('token');
//     }
//     return rejectWithValue(error.response?.data?.message || 'Failed to load user');
//   }
// });

// // Login user
// export const login = createAsyncThunk('user/login', async (loginData, { rejectWithValue }) => {
//   try {
//     console.log('Sending login request:', loginData);
//     const response = await axios.post(`${API_URL}/login`, loginData);
//     console.log('Login response:', response.data);
//     localStorage.setItem('token', response.data.token);
//     return {
//       token: response.data.token,
//       role: response.data.role,
//       id: response.data.id,
//       username: response.data.username,
//       email: response.data.email,
//     };
//   } catch (error) {
//     console.error('Login error:', error.response?.data || error.message);
//     return rejectWithValue(error.response?.data?.message || 'Login failed');
//   }
// });

// // Logout user
// export const logout = createAsyncThunk('user/logout', async () => {
//   console.log('Logging out, removing token');
//   localStorage.removeItem('token');
//   return null;
// });

// // Fetch users (retained from original code)
// export const fetchUsers = createAsyncThunk('user/fetchUsers', async (id = null, { getState, rejectWithValue }) => {
//   try {
//     const { user: { token } } = getState();
//     const config = { headers: { Authorization: `Bearer ${token}` } };
//     let url = id ? `${API_URL}/users/${id}` : `${API_URL}/users`;
//     console.log('Fetching users from:', url);
//     const response = await axios.get(url, config);
//     console.log('Fetch users response:', response.data);
//     return Array.isArray(response.data) ? response.data : [response.data];
//   } catch (error) {
//     console.error('Fetch users error:', error.response?.data || error.message);
//     return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
//   }
// });

// // Create user (retained from original code)
// export const createUser = createAsyncThunk('user/createUser', async (userData, { getState, rejectWithValue }) => {
//   try {
//     const { user: { token } } = getState();
//     const config = { headers: { Authorization: `Bearer ${token}` } };
//     console.log('Creating user with data:', userData);
//     const response = await axios.post(`${API_URL}/users`, userData, config);
//     console.log('Create user response:', response.data);
//     return response.data.user;
//   } catch (error) {
//     console.error('Create user error:', error.response?.data || error.message);
//     return rejectWithValue(error.response?.data?.message || 'Failed to create user');
//   }
// });

// // Update user (retained from original code)
// export const updateUser = createAsyncThunk('user/updateUser', async ({ id, ...userData }, { getState, rejectWithValue }) => {
//   try {
//     const { user: { token } } = getState();
//     const config = { headers: { Authorization: `Bearer ${token}` } };
//     const payload = { username: userData.username, email: userData.email, role: userData.role };
//     if (userData.password && userData.password.trim()) {
//       payload.password = userData.password;
//     }
//     console.log('Updating user:', id, 'with data:', payload);
//     const response = await axios.put(`${API_URL}/users/${id}`, payload, config);
//     console.log('Update user response:', response.data);
//     return response.data.user;
//   } catch (error) {
//     console.error('Update user error:', error.response?.data || error.message);
//     return rejectWithValue(error.response?.data?.message || 'Failed to update user');
//   }
// });

// // Delete user (retained from original code)
// export const deleteUser = createAsyncThunk('user/deleteUser', async (id, { getState, rejectWithValue }) => {
//   try {
//     const { user: { token } } = getState();
//     const config = { headers: { Authorization: `Bearer ${token}` } };
//     console.log('Deleting user:', id);
//     await axios.delete(`${API_URL}/users/${id}`, config);
//     console.log('User deleted:', id);
//     return id;
//   } catch (error) {
//     console.error('Delete user error:', error.response?.data || error.message);
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
//   reducers: {
//     clearError: (state) => {
//       state.error = null;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // Load User
//       .addCase(loadUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//         console.log('Load user pending');
//       })
//       .addCase(loadUser.fulfilled, (state, action) => {
//         state.loading = false;
//         state.token = action.payload.token;
//         state.role = action.payload.role;
//         state.currentUser = {
//           id: action.payload.id,
//           username: action.payload.username,
//           email: action.payload.email,
//         };
//         console.log('Load user fulfilled, state updated:', {
//           token: action.payload.token,
//           role: action.payload.role,
//           id: action.payload.id,
//           username: action.payload.username,
//           email: action.payload.email,
//         });
//       })
//       .addCase(loadUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         if (action.payload === action.payload.includes('Invalid token')) {
//           state.token = null;
//           state.currentUser = null;
//           state.role = null;
//           state.users = [];
//         }
//       })
//       // Login
//       .addCase(login.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//         console.log('Login pending');
//       })
//       .addCase(login.fulfilled, (state, action) => {
//         state.loading = false;
//         state.token = action.payload.token;
//         state.role = action.payload.role;
//         state.currentUser = {
//           id: action.payload.id,
//           username: action.payload.username,
//           email: action.payload.email,
//         };
//         console.log('Login fulfilled, state updated:', {
//           token: action.payload.token,
//           role: action.payload.role,
//           id: action.payload.id,
//           username: action.payload.username,
//           email: action.payload.email,
//         });
//       })
//       .addCase(login.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         console.log('Login rejected:', action.payload);
//       })
//       // Logout
//       .addCase(logout.fulfilled, (state) => {
//         state.token = null;
//         state.currentUser = null;
//         state.role = null;
//         state.users = [];
//         state.error = null;
//         console.log('Logout fulfilled, state cleared');
//       })
//       // Fetch users
//       .addCase(fetchUsers.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//         console.log('Fetch users pending');
//       })
//       .addCase(fetchUsers.fulfilled, (state, action) => {
//         state.loading = false;
//         state.users = action.payload;
//         console.log('Fetch users fulfilled, users:', action.payload);
//       })
//       .addCase(fetchUsers.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         console.log('Fetch users rejected:', action.payload);
//       })
//       // Create user
//       .addCase(createUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//         console.log('Create user pending');
//       })
//       .addCase(createUser.fulfilled, (state, action) => {
//         state.loading = false;
//         state.users = [...state.users, action.payload];
//         console.log('Create user fulfilled, user added:', action.payload);
//       })
//       .addCase(createUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         console.log('Create user rejected:', action.payload);
//       })
//       // Update user
//       .addCase(updateUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//         console.log('Update user pending');
//       })
//       .addCase(updateUser.fulfilled, (state, action) => {
//         state.loading = false;
//         state.users = state.users.map((user) =>
//           user._id === action.payload._id ? action.payload : user
//         );
//         if (state.currentUser?.id === action.payload._id) {
//           state.currentUser = {
//             id: action.payload._id,
//             username: action.payload.username,
//             email: action.payload.email,
//           };
//           if (state.role !== action.payload.role) {
//             state.role = action.payload.role;
//           }
//         }
//         console.log('Update user fulfilled, state updated:', action.payload);
//       })
//       .addCase(updateUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         console.log('Update user rejected:', action.payload);
//       })
//       // Delete user
//       .addCase(deleteUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//         console.log('Delete user pending');
//       })
//       .addCase(deleteUser.fulfilled, (state, action) => {
//         state.loading = false;
//         state.users = state.users.filter((user) => user._id !== action.payload);
//         console.log('Delete user fulfilled, user removed:', action.payload);
//       })
//       .addCase(deleteUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         console.log('Delete user rejected:', action.payload);
//       });
//   },
// });

// export const { clearError } = userSlice.actions;
// export default userSlice.reducer;


import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Load current user from token
export const loadUser = createAsyncThunk('user/loadUser', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return rejectWithValue('');
    }
    const config = { headers: { Authorization: `Bearer ${token}` } };
    console.log('Loading user with token:', token);
    const response = await axios.get(`${API_URL}/me`, config);
    console.log('Load user response:', response.data);
    return {
      token,
      role: response.data.role,
      id: response.data._id,
      username: response.data.username,
      email: response.data.email,
    };
  } catch (error) {
    console.error('Load user error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return rejectWithValue(error.response?.data?.message || 'Failed to load user');
  }
});

// Login user
export const login = createAsyncThunk('user/login', async (loginData, { rejectWithValue }) => {
  try {
    console.log('Sending login request:', loginData);
    const response = await axios.post(`${API_URL}/login`, loginData);
    console.log('Login response:', response.data);
    localStorage.setItem('token', response.data.token);
    return {
      token: response.data.token,
      role: response.data.role,
      id: response.data.id,
      username: response.data.username,
      email: response.data.email,
    };
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

// Logout user
export const logout = createAsyncThunk('user/logout', async () => {
  console.log('Logging out, removing token');
  localStorage.removeItem('token');
  return null;
});

// Forgot Password - Send OTP
export const forgotPassword = createAsyncThunk('user/forgotPassword', async (email, { rejectWithValue }) => {
  try {
    console.log('Sending forgot password request for:', email);
    const response = await axios.post(`${API_URL}/forgot-password`, { email });
    console.log('Forgot password response:', response.data);
    return response.data.message;
  } catch (error) {
    console.error('Forgot password error:', error.response?.data || error.message);
    return rejectWithValue(error.response?.data?.message || 'Failed to send OTP');
  }
});

// Verify OTP
export const verifyOTP = createAsyncThunk('user/verifyOTP', async ({ email, otp }, { rejectWithValue }) => {
  try {
    console.log('Verifying OTP for email:', email);
    const response = await axios.post(`${API_URL}/verify-otp`, { email, otp });
    console.log('Verify OTP response:', response.data);
    return { email, message: response.data.message };
  } catch (error) {
    console.error('Verify OTP error:', error.response?.data || error.message);
    return rejectWithValue(error.response?.data?.message || 'Failed to verify OTP');
  }
});

// Reset Password
export const resetPassword = createAsyncThunk('user/resetPassword', async ({ email, otp, newPassword }, { rejectWithValue }) => {
  try {
    console.log('Resetting password for email:', email);
    const response = await axios.post(`${API_URL}/reset-password`, { email, otp, newPassword });
    console.log('Reset password response:', response.data);
    return response.data.message;
  } catch (error) {
    console.error('Reset password error:', error.response?.data || error.message);
    return rejectWithValue(error.response?.data?.message || 'Failed to reset password');
  }
});

// Fetch users (retained from original code)
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

// Create user (retained from original code)
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

// Update user (retained from original code)
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

// Delete user (retained from original code)
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
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load User
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log('Load user pending');
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.currentUser = {
          id: action.payload.id,
          username: action.payload.username,
          email: action.payload.email,
        };
        console.log('Load user fulfilled, state updated:', {
          token: action.payload.token,
          role: action.payload.role,
          id: action.payload.id,
          username: action.payload.username,
          email: action.payload.email,
        });
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        if (action.payload && action.payload.includes('Invalid token')) {
          state.token = null;
          state.currentUser = null;
          state.role = null;
          state.users = [];
        }
      })
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
        state.currentUser = {
          id: action.payload.id,
          username: action.payload.username,
          email: action.payload.email,
        };
        console.log('Login fulfilled, state updated:', {
          token: action.payload.token,
          role: action.payload.role,
          id: action.payload.id,
          username: action.payload.username,
          email: action.payload.email,
        });
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
        state.error = null;
        console.log('Logout fulfilled, state cleared');
      })
      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Verify OTP
      .addCase(verifyOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
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
        state.users = [...state.users, action.payload];
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
        state.users = state.users.map((user) =>
          user._id === action.payload._id ? action.payload : user
        );
        if (state.currentUser?.id === action.payload._id) {
          state.currentUser = {
            id: action.payload._id,
            username: action.payload.username,
            email: action.payload.email,
          };
          if (state.role !== action.payload.role) {
            state.role = action.payload.role;
          }
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

export const { clearError } = userSlice.actions;
export default userSlice.reducer;