import axios from "axios";

/**
 * Fetches every page from a paginated list API and returns a flat array.
 * Supports legacy endpoints that still return a bare array.
 */
export async function fetchAllPages(url, config, listKey, extraParams = {}) {
  const all = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await axios.get(url, {
      ...config,
      params: { page, limit: 100, ...extraParams },
    });
    const data = response.data;

    if (Array.isArray(data)) {
      return data;
    }

    const items = data?.[listKey];
    if (Array.isArray(items)) {
      all.push(...items);
    }

    hasNextPage = data?.pagination?.hasNextPage === true;
    page += 1;
  }

  return all;
}
