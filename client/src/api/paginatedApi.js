import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function fetchPartyOptions(search = "", page = 1, limit = 20) {
  const response = await axios.get(`${API_URL}/parties`, {
    headers: authHeaders(),
    params: {
      search: search.trim(),
      page,
      limit,
      sortBy: "partyname",
      sortOrder: "asc",
    },
  });
  const data = response.data;
  const parties = Array.isArray(data) ? data : data.parties || [];
  return parties.map((p) => ({ value: p._id, label: p.partyname }));
}

export async function fetchPartyOptionById(partyId) {
  if (!partyId) return null;
  try {
    const response = await axios.get(`${API_URL}/parties/${partyId}`, {
      headers: authHeaders(),
    });
    const party = response.data.party || response.data;
    if (!party?._id) return null;
    return { value: party._id, label: party.partyname };
  } catch {
    return null;
  }
}

export function createLoadPartyOptions(excludePartyId) {
  return async (inputValue) => {
    const options = await fetchPartyOptions(inputValue || "");
    if (!excludePartyId) return options;
    return options.filter((o) => o.value !== excludePartyId);
  };
}

export async function fetchAccountsPage(params = {}) {
  const response = await axios.get(`${API_URL}/accounts`, {
    headers: authHeaders(),
    params: {
      sortBy: "createdAt",
      sortOrder: "desc",
      ...params,
    },
  });
  return response.data;
}

export async function fetchPartiesPage(params = {}) {
  const response = await axios.get(`${API_URL}/parties`, {
    headers: authHeaders(),
    params: {
      sortBy: "partyname",
      sortOrder: "asc",
      ...params,
    },
  });
  return response.data;
}

export async function fetchUtrsPage(params = {}) {
  const response = await axios.get(`${API_URL}/utrs`, {
    headers: authHeaders(),
    params: {
      sortBy: "createdAt",
      sortOrder: "desc",
      ...params,
    },
  });
  return response.data;
}

export async function fetchDashboardSummary(fromDate = "", toDate = "") {
  const response = await axios.get(`${API_URL}/dashboard/summary`, {
    headers: authHeaders(),
    params: {
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
    },
  });
  return response.data;
}

/** For PDF/export — fetches all pages when full dataset is required. */
export { fetchAllPages } from "../utils/fetchAllPages";
