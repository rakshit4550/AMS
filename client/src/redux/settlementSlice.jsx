// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';

// const API_URL = process.env.REACT_APP_API_URL;

// // Fetch domains
// export const fetchDomains = createAsyncThunk(
//   'settlement/fetchDomains',
//   async (_, { rejectWithValue, getState }) => {
//     try {
//       const { user } = getState();
//       if (!user.token) {
//         throw new Error('No authentication token found');
//       }
//       const config = {
//         headers: {
//           Authorization: `Bearer ${user.token}`,
//         },
//       };
//       console.log('Fetching domains with token:', user.token); // Debug log
//       const response = await axios.get(`${API_URL}/settlements/domains`, config);
//       console.log('Fetch domains response:', response.data); // Debug log
//       return response.data;
//     } catch (error) {
//       console.error('Fetch domains error:', error.response?.data?.message || error.message);
//       return rejectWithValue(error.response?.data?.message || 'Failed to fetch domains');
//     }
//   }
// );

// // Create settlement
// export const createSettlement = createAsyncThunk(
//   'settlement/create',
//   async (settlementData, { rejectWithValue, getState }) => {
//     try {
//       const { user } = getState();
//       if (!user.token) {
//         throw new Error('No authentication token found');
//       }
//       const config = {
//         headers: {
//           Authorization: `Bearer ${user.token}`,
//         },
//       };
//       console.log('Create settlement payload:', settlementData); // Debug log
//       const response = await axios.post(`${API_URL}/settlements`, settlementData, config);
//       console.log('Create settlement response:', response.data); // Debug log
//       return response.data;
//     } catch (error) {
//       console.error('Create settlement error:', error.response?.data?.message || error.message);
//       return rejectWithValue(error.response?.data?.message || 'Failed to create settlement');
//     }
//   }
// );

// // Get all settlements
// export const getSettlements = createAsyncThunk(
//   'settlement/getAll',
//   async (_, { rejectWithValue, getState }) => {
//     try {
//       const { user } = getState();
//       if (!user.token) {
//         throw new Error('No authentication token found');
//       }
//       const config = {
//         headers: {
//           Authorization: `Bearer ${user.token}`,
//         },
//       };
//       console.log('Fetching settlements with token:', user.token); // Debug log
//       const response = await axios.get(`${API_URL}/settlements`, config);
//       console.log('Get settlements response:', response.data); // Debug log
//       return response.data;
//     } catch (error) {
//       console.error('Get settlements error:', error.response?.data?.message || error.message);
//       return rejectWithValue(error.response?.data?.message || 'Failed to fetch settlements');
//     }
//   }
// );

// // Get settlement by ID
// export const getSettlementById = createAsyncThunk(
//   'settlement/getById',
//   async (id, { rejectWithValue, getState }) => {
//     try {
//       const { user } = getState();
//       if (!user.token) {
//         throw new Error('No authentication token found');
//       }
//       const config = {
//         headers: {
//           Authorization: `Bearer ${user.token}`,
//         },
//       };
//       console.log('Fetching settlement by ID:', id); // Debug log
//       const response = await axios.get(`${API_URL}/settlements/${id}`, config);
//       console.log('Get settlement by ID response:', response.data); // Debug log
//       return response.data;
//     } catch (error) {
//       console.error('Get settlement by ID error:', error.response?.data?.message || error.message);
//       return rejectWithValue(error.response?.data?.message || 'Failed to fetch settlement');
//     }
//   }
// );

// // Update settlement
// export const updateSettlement = createAsyncThunk(
//   'settlement/update',
//   async ({ id, settlementData }, { rejectWithValue, getState }) => {
//     try {
//       const { user } = getState();
//       if (!user.token) {
//         throw new Error('No authentication token found');
//       }
//       const config = {
//         headers: {
//           Authorization: `Bearer ${user.token}`,
//         },
//       };
//       console.log('Update settlement payload:', settlementData); // Debug log
//       const response = await axios.put(`${API_URL}/settlements/${id}`, settlementData, config);
//       console.log('Update settlement response:', response.data); // Debug log
//       return response.data;
//     } catch (error) {
//       console.error('Update settlement error:', error.response?.data?.message || error.message);
//       return rejectWithValue(error.response?.data?.message || 'Failed to update settlement');
//     }
//   }
// );

// // Delete settlement
// export const deleteSettlement = createAsyncThunk(
//   'settlement/delete',
//   async (id, { rejectWithValue, getState }) => {
//     try {
//       const { user } = getState();
//       if (!user.token) {
//         throw new Error('No authentication token found');
//       }
//       const config = {
//         headers: {
//           Authorization: `Bearer ${user.token}`,
//         },
//       };
//       console.log('Deleting settlement ID:', id); // Debug log
//       await axios.delete(`${API_URL}/settlements/${id}`, config);
//       console.log('Delete settlement successful, ID:', id); // Debug log
//       return id;
//     } catch (error) {
//       console.error('Delete settlement error:', error.response?.data?.message || error.message);
//       return rejectWithValue(error.response?.data?.message || 'Failed to delete settlement');
//     }
//   }
// );

// // Download settlements
// export const downloadSettlements = createAsyncThunk(
//   'settlement/download',
//   async (domainId, { rejectWithValue, getState }) => {
//     try {
//       const { user } = getState();
//       if (!user.token) {
//         throw new Error('No authentication token found');
//       }
//       const config = {
//         headers: {
//           Authorization: `Bearer ${user.token}`,
//         },
//       };
//       const url = domainId ? `${API_URL}/settlements/download?domain=${encodeURIComponent(domainId)}` : `${API_URL}/settlements/download`;
//       console.log('Downloading settlements for domain:', domainId); // Debug log
//       const response = await axios.get(url, config);
//       console.log('Download settlements response:', response.data); // Debug log
//       return response.data;
//     } catch (error) {
//       console.error('Download settlements error:', error.response?.data?.message || error.message);
//       return rejectWithValue(error.response?.data?.message || 'Failed to download settlements');
//     }
//   }
// );

// const settlementSlice = createSlice({
//   name: 'settlement',
//   initialState: {
//     settlements: [],
//     domainNames: [],
//     domains: [],
//     currentSettlement: null,
//     groupedSettlements: null,
//     loading: false,
//     error: null,
//     success: false,
//   },
//   reducers: {
//     reset: (state) => {
//       state.loading = false;
//       state.error = null;
//       state.success = false;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // Fetch domains
//       .addCase(fetchDomains.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchDomains.fulfilled, (state, action) => {
//         state.loading = false;
//         state.domains = action.payload;
//         state.domainNames = action.payload.map(domain => domain.domainname);
//         console.log('Domains updated in state:', state.domains); // Debug log
//       })
//       .addCase(fetchDomains.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         console.log('Fetch domains failed:', action.payload); // Debug log
//       })
//       // Create settlement
//       .addCase(createSettlement.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(createSettlement.fulfilled, (state, action) => {
//         state.loading = false;
//         state.success = true;
//         state.settlements.push(action.payload.data);
//         const domainName = action.payload.data.domain?.domainname;
//         if (domainName && !state.domainNames.includes(domainName)) {
//           state.domainNames.push(domainName);
//         }
//       })
//       .addCase(createSettlement.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // Get all settlements
//       .addCase(getSettlements.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(getSettlements.fulfilled, (state, action) => {
//         state.loading = false;
//         state.settlements = action.payload;
//         state.domainNames = [...new Set(action.payload.map(sett => sett.domain?.domainname).filter(Boolean))];
//       })
//       .addCase(getSettlements.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // Get settlement by ID
//       .addCase(getSettlementById.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(getSettlementById.fulfilled, (state, action) => {
//         state.loading = false;
//         state.currentSettlement = action.payload;
//       })
//       .addCase(getSettlementById.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // Update settlement
//       .addCase(updateSettlement.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(updateSettlement.fulfilled, (state, action) => {
//         state.loading = false;
//         state.success = true;
//         state.settlements = state.settlements.map((settlement) =>
//           settlement._id === action.payload.data._id ? action.payload.data : settlement
//         );
//         const domainName = action.payload.data.domain?.domainname;
//         if (domainName && !state.domainNames.includes(domainName)) {
//           state.domainNames.push(domainName);
//         }
//       })
//       .addCase(updateSettlement.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // Delete settlement
//       .addCase(deleteSettlement.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(deleteSettlement.fulfilled, (state, action) => {
//         state.loading = false;
//         state.success = true;
//         state.settlements = state.settlements.filter((settlement) => settlement._id !== action.payload);
//         state.domainNames = [...new Set(state.settlements.map(sett => sett.domain?.domainname).filter(Boolean))];
//       })
//       .addCase(deleteSettlement.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       // Download settlements
//       .addCase(downloadSettlements.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(downloadSettlements.fulfilled, (state, action) => {
//         state.loading = false;
//         state.groupedSettlements = action.payload;
//       })
//       .addCase(downloadSettlements.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export const { reset } = settlementSlice.actions;
// export default settlementSlice.reducer;


import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Fetch domains
export const fetchDomains = createAsyncThunk(
  'settlement/fetchDomains',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { user } = getState();
      if (!user.token) {
        throw new Error('No authentication token found');
      }
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      console.log('Fetching domains with token:', user.token); // Debug log
      const response = await axios.get(`${API_URL}/settlements/domains`, config);
      console.log('Fetch domains response:', response.data); // Debug log
      return response.data;
    } catch (error) {
      console.error('Fetch domains error:', error.response?.data?.message || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch domains');
    }
  }
);

// Create settlement
export const createSettlement = createAsyncThunk(
  'settlement/create',
  async (settlementData, { rejectWithValue, getState }) => {
    try {
      const { user } = getState();
      if (!user.token) {
        throw new Error('No authentication token found');
      }
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      console.log('Create settlement payload:', settlementData); // Debug log
      const response = await axios.post(`${API_URL}/settlements`, settlementData, config);
      console.log('Create settlement response:', response.data); // Debug log
      return response.data;
    } catch (error) {
      console.error('Create settlement error:', error.response?.data?.message || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to create settlement');
    }
  }
);

// Get all settlements
export const getSettlements = createAsyncThunk(
  'settlement/getAll',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { user } = getState();
      if (!user.token) {
        throw new Error('No authentication token found');
      }
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      console.log('Fetching settlements with token:', user.token); // Debug log
      const response = await axios.get(`${API_URL}/settlements`, config);
      console.log('Get settlements response:', response.data); // Debug log
      return response.data;
    } catch (error) {
      console.error('Get settlements error:', error.response?.data?.message || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch settlements');
    }
  }
);

// Get settlement by ID
export const getSettlementById = createAsyncThunk(
  'settlement/getById',
  async (id, { rejectWithValue, getState }) => {
    try {
      const { user } = getState();
      if (!user.token) {
        throw new Error('No authentication token found');
      }
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      console.log('Fetching settlement by ID:', id); // Debug log
      const response = await axios.get(`${API_URL}/settlements/${id}`, config);
      console.log('Get settlement by ID response:', response.data); // Debug log
      return response.data;
    } catch (error) {
      console.error('Get settlement by ID error:', error.response?.data?.message || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch settlement');
    }
  }
);

// Update settlement
export const updateSettlement = createAsyncThunk(
  'settlement/update',
  async ({ id, settlementData }, { rejectWithValue, getState }) => {
    try {
      const { user } = getState();
      if (!user.token) {
        throw new Error('No authentication token found');
      }
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      console.log('Update settlement payload:', settlementData); // Debug log
      const response = await axios.put(`${API_URL}/settlements/${id}`, settlementData, config);
      console.log('Update settlement response:', response.data); // Debug log
      return response.data;
    } catch (error) {
      console.error('Update settlement error:', error.response?.data?.message || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to update settlement');
    }
  }
);

// Delete settlement
export const deleteSettlement = createAsyncThunk(
  'settlement/delete',
  async (id, { rejectWithValue, getState }) => {
    try {
      const { user } = getState();
      if (!user.token) {
        throw new Error('No authentication token found');
      }
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      console.log('Deleting settlement ID:', id); // Debug log
      const response = await axios.delete(`${API_URL}/settlements/${id}`, config);
      console.log('Delete settlement successful, ID:', id); // Debug log
      return { id, message: response.data.message }; // Return both id and message
    } catch (error) {
      console.error('Delete settlement error:', error.response?.data?.message || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to delete settlement');
    }
  }
);

// Download settlements
export const downloadSettlements = createAsyncThunk(
  'settlement/download',
  async (domainId, { rejectWithValue, getState }) => {
    try {
      const { user } = getState();
      if (!user.token) {
        throw new Error('No authentication token found');
      }
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const url = domainId ? `${API_URL}/settlements/download?domain=${encodeURIComponent(domainId)}` : `${API_URL}/settlements/download`;
      console.log('Downloading settlements for domain:', domainId); // Debug log
      const response = await axios.get(url, config);
      console.log('Download settlements response:', response.data); // Debug log
      return response.data;
    } catch (error) {
      console.error('Download settlements error:', error.response?.data?.message || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to download settlements');
    }
  }
);

const settlementSlice = createSlice({
  name: 'settlement',
  initialState: {
    settlements: [],
    domainNames: [],
    domains: [],
    currentSettlement: null,
    groupedSettlements: null,
    loading: false,
    error: null,
    success: false,
    message: null, // Add message to state
  },
  reducers: {
    reset: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.message = null; // Reset message
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch domains
      .addCase(fetchDomains.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDomains.fulfilled, (state, action) => {
        state.loading = false;
        state.domains = action.payload;
        state.domainNames = action.payload.map(domain => domain.domainname);
        console.log('Domains updated in state:', state.domains); // Debug log
      })
      .addCase(fetchDomains.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.log('Fetch domains failed:', action.payload); // Debug log
      })
      // Create settlement
      .addCase(createSettlement.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(createSettlement.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message; // Store backend message
        state.settlements.push(action.payload.data);
        const domainName = action.payload.data.domain?.domainname;
        if (domainName && !state.domainNames.includes(domainName)) {
          state.domainNames.push(domainName);
        }
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
        state.domainNames = [...new Set(action.payload.map(sett => sett.domain?.domainname).filter(Boolean))];
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
        state.message = null;
      })
      .addCase(updateSettlement.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message; // Store backend message
        state.settlements = state.settlements.map((settlement) =>
          settlement._id === action.payload.data._id ? action.payload.data : settlement
        );
        const domainName = action.payload.data.domain?.domainname;
        if (domainName && !state.domainNames.includes(domainName)) {
          state.domainNames.push(domainName);
        }
      })
      .addCase(updateSettlement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete settlement
      .addCase(deleteSettlement.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(deleteSettlement.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message; // Store backend message
        state.settlements = state.settlements.filter((settlement) => settlement._id !== action.payload.id);
        state.domainNames = [...new Set(state.settlements.map(sett => sett.domain?.domainname).filter(Boolean))];
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