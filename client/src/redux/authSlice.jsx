import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const mapAuthUser = (data, token) => ({
  token,
  role: data.role,
  id: data.id || data._id,
  username: data.username,
  email: data.email,
  twoFactorEnabled: Boolean(data.twoFactorEnabled),
  subscriptionExpiresAt: data.subscriptionExpiresAt || null,
  subscriptionStatus: data.subscriptionStatus || null,
  subscriptionRemainingDays: data.subscriptionRemainingDays ?? null,
});

// Load current user from token
export const loadUser = createAsyncThunk(
  "user/loadUser",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return rejectWithValue("");
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_URL}/me`, config);

      return {
        ...mapAuthUser(response.data, token),
      };
    } catch (error) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem("token");
        return rejectWithValue({
          sessionInvalid: true,
          message:
            error.response?.data?.message ||
            (status === 403
              ? "Please recharge your account"
              : "Session expired. Please log in again."),
        });
      }
      return rejectWithValue(
        error.response?.data?.message || "Failed to load user",
      );
    }
  },
);

// Login user
export const login = createAsyncThunk(
  "user/login",
  async (loginData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/login`, loginData);

      if (response.data.requires2FA) {
        return {
          requires2FA: true,
          tempToken: response.data.tempToken,
          message: response.data.message,
        };
      }

      localStorage.setItem("token", response.data.token);

      return {
        requires2FA: false,
        ...mapAuthUser(response.data, response.data.token),
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  },
);

// Verify 2FA code (login step 2)
export const verify2FA = createAsyncThunk(
  "user/verify2FA",
  async ({ tempToken, code }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/verify-2fa`, {
        tempToken,
        code: String(code).trim(),
      });

      localStorage.setItem("token", response.data.token);

      return {
        requires2FA: false,
        ...mapAuthUser(response.data, response.data.token),
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Invalid authenticator code",
      );
    }
  },
);

// Setup 2FA — get QR code
export const setup2FA = createAsyncThunk(
  "user/setup2FA",
  async (_, { getState, rejectWithValue }) => {
    try {
      const {
        user: { token },
      } = getState();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`${API_URL}/2fa/setup`, {}, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to setup 2FA",
      );
    }
  },
);

// Enable 2FA after scanning QR
export const enable2FA = createAsyncThunk(
  "user/enable2FA",
  async (code, { getState, rejectWithValue }) => {
    try {
      const {
        user: { token },
      } = getState();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(
        `${API_URL}/2fa/enable`,
        { code: String(code).trim() },
        config,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to enable 2FA",
      );
    }
  },
);

// Disable 2FA
export const disable2FA = createAsyncThunk(
  "user/disable2FA",
  async ({ password, code }, { getState, rejectWithValue }) => {
    try {
      const {
        user: { token },
      } = getState();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(
        `${API_URL}/2fa/disable`,
        { password, code: String(code).trim() },
        config,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to disable 2FA",
      );
    }
  },
);

// Forgot Authenticator — email QR only; returns resetToken for confirm page
export const forgot2FA = createAsyncThunk(
  "user/forgot2FA",
  async (username, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/forgot-2fa`, {
        username: String(username).trim(),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send reset email",
      );
    }
  },
);

// Open reset link — get new QR code
export const fetchReset2FASetup = createAsyncThunk(
  "user/fetchReset2FASetup",
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/reset-2fa`, {
        params: { token },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Invalid or expired reset link",
      );
    }
  },
);

// Confirm new Authenticator after reset link
export const confirmReset2FA = createAsyncThunk(
  "user/confirmReset2FA",
  async ({ token, code }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/reset-2fa/confirm`, {
        token,
        code: String(code).trim(),
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reset authenticator",
      );
    }
  },
);

// Logout user
export const logout = createAsyncThunk("user/logout", async () => {
  localStorage.removeItem("token");
  return null;
});

// Forgot Password - Send OTP
export const forgotPassword = createAsyncThunk(
  "user/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/forgot-password`, {
        email,
      });
      return response.data.message;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send OTP",
      );
    }
  },
);

// Verify OTP
export const verifyOTP = createAsyncThunk(
  "user/verifyOTP",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/verify-otp`, {
        email,
        otp,
      });
      return { email, message: response.data.message };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to verify OTP",
      );
    }
  },
);

// Reset Password
export const resetPassword = createAsyncThunk(
  "user/resetPassword",
  async ({ email, otp, newPassword }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/reset-password`, {
        email,
        otp,
        newPassword,
      });
      return response.data.message;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reset password",
      );
    }
  },
);

// Verify current password (step 1 of change password)
export const verifyOldPassword = createAsyncThunk(
  "user/verifyOldPassword",
  async (oldPassword, { getState, rejectWithValue }) => {
    try {
      const {
        user: { token },
      } = getState();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(
        `${API_URL}/verify-old-password`,
        { oldPassword },
        config,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to verify current password",
      );
    }
  },
);

// Change password (step 2 — requires passwordChangeToken from verifyOldPassword)
export const changePassword = createAsyncThunk(
  "user/changePassword",
  async (
    { password, confirmPassword, passwordChangeToken },
    { getState, rejectWithValue },
  ) => {
    try {
      const {
        user: { token },
      } = getState();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.put(
        `${API_URL}/change-password`,
        { password, confirmPassword, passwordChangeToken },
        config,
      );

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to change password",
      );
    }
  },
);

// Fetch users
export const fetchUsers = createAsyncThunk(
  "user/fetchUsers",
  async (id = null, { getState, rejectWithValue }) => {
    try {
      const {
        user: { token },
      } = getState();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const url = id ? `${API_URL}/users/${id}` : `${API_URL}/users`;

      const response = await axios.get(url, config);

      return Array.isArray(response.data) ? response.data : [response.data];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch users",
      );
    }
  },
);

// Create user
export const createUser = createAsyncThunk(
  "user/createUser",
  async (userData, { getState, rejectWithValue }) => {
    try {
      const {
        user: { token },
      } = getState();
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.post(`${API_URL}/users`, userData, config);

      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create user",
      );
    }
  },
);

// Update user
export const updateUser = createAsyncThunk(
  "user/updateUser",
  async ({ id, ...userData }, { getState, rejectWithValue }) => {
    try {
      const {
        user: { token },
      } = getState();
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const payload = {
        username: userData.username,
        email: userData.email,
        role: userData.role,
      };

      if (userData.subscriptionExpiresAt !== undefined) {
        payload.subscriptionExpiresAt = userData.subscriptionExpiresAt;
      }

      if (userData.password && userData.password.trim()) {
        payload.password = userData.password;
      }

      const response = await axios.put(
        `${API_URL}/users/${id}`,
        payload,
        config,
      );

      return {
        ...response.data.user,
        token: response.data.token || null,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update user",
      );
    }
  },
);

// Delete user
export const deleteUser = createAsyncThunk(
  "user/deleteUser",
  async (id, { getState, rejectWithValue }) => {
    try {
      const {
        user: { token },
      } = getState();
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.delete(`${API_URL}/users/${id}`, config);

      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete user",
      );
    }
  },
);

const userSlice = createSlice({
  name: "user",
  initialState: {
    users: [],
    currentUser: null,
    role: null,
    token: localStorage.getItem("token") || null,
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
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.currentUser = {
          id: action.payload.id,
          username: action.payload.username,
          email: action.payload.email,
          twoFactorEnabled: action.payload.twoFactorEnabled,
          subscriptionExpiresAt: action.payload.subscriptionExpiresAt || null,
          subscriptionStatus: action.payload.subscriptionStatus || null,
          subscriptionRemainingDays: action.payload.subscriptionRemainingDays ?? null,
        };
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.loading = false;
        const p = action.payload;
        const message =
          typeof p === "object" && p !== null && "message" in p
            ? p.message
            : typeof p === "string"
              ? p
              : "Failed to load user";
        state.error = message;
        const sessionInvalid =
          (typeof p === "object" &&
            p !== null &&
            p.sessionInvalid === true) ||
          (typeof message === "string" &&
            /invalid token|unauthoriz|expired|jwt|session/i.test(message));
        if (sessionInvalid) {
          state.token = null;
          state.currentUser = null;
          state.role = null;
          state.users = [];
        }
      })

      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.requires2FA) return;

        state.token = action.payload.token;
        state.role = action.payload.role;
        state.currentUser = {
          id: action.payload.id,
          username: action.payload.username,
          email: action.payload.email,
          twoFactorEnabled: action.payload.twoFactorEnabled,
          subscriptionExpiresAt: action.payload.subscriptionExpiresAt || null,
          subscriptionStatus: action.payload.subscriptionStatus || null,
          subscriptionRemainingDays: action.payload.subscriptionRemainingDays ?? null,
        };
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(verify2FA.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verify2FA.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.currentUser = {
          id: action.payload.id,
          username: action.payload.username,
          email: action.payload.email,
          twoFactorEnabled: action.payload.twoFactorEnabled,
          subscriptionExpiresAt: action.payload.subscriptionExpiresAt || null,
          subscriptionStatus: action.payload.subscriptionStatus || null,
          subscriptionRemainingDays: action.payload.subscriptionRemainingDays ?? null,
        };
      })
      .addCase(verify2FA.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(enable2FA.fulfilled, (state) => {
        if (state.currentUser) {
          state.currentUser.twoFactorEnabled = true;
        }
      })

      .addCase(disable2FA.fulfilled, (state) => {
        if (state.currentUser) {
          state.currentUser.twoFactorEnabled = false;
        }
      })

      .addCase(logout.pending, (state) => {
        state.token = null;
        state.currentUser = null;
        state.role = null;
        state.users = [];
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.token = null;
        state.currentUser = null;
        state.role = null;
        state.users = [];
        state.error = null;
      })

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

      .addCase(forgot2FA.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgot2FA.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(forgot2FA.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(verifyOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

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

      .addCase(changePassword.fulfilled, (state, action) => {
        if (action.payload.token) {
          state.token = action.payload.token;
        }
      })

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

      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = [...state.users, action.payload];
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;

        state.users = state.users.map((user) =>
          user._id === action.payload._id ? action.payload : user,
        );

        if (state.currentUser?.id === action.payload._id) {
          state.currentUser = {
            id: action.payload._id,
            username: action.payload.username,
            email: action.payload.email,
            subscriptionExpiresAt: action.payload.subscriptionExpiresAt || null,
            subscriptionStatus: action.payload.subscriptionStatus || null,
            subscriptionRemainingDays: action.payload.subscriptionRemainingDays ?? null,
          };

          state.role = action.payload.role;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

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

export const { clearError } = userSlice.actions;
export default userSlice.reducer;