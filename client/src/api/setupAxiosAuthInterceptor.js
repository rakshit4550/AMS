import axios from "axios";
import { toast } from "react-toastify";
import { logout } from "../redux/authSlice";

let handlingSession401 = false;

/**
 * Clears Redux + localStorage on 401 from authenticated requests (expired / revoked JWT).
 * Skips login/forgot-password etc. (no Bearer header).
 */
export function setupAxiosAuthInterceptor(store) {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      const hadBearer = Boolean(error.config?.headers?.Authorization);

      if (status === 401 && hadBearer && store) {
        if (!handlingSession401) {
          handlingSession401 = true;
          store.dispatch(logout());
          toast.error("Session expired. Please log in again.");
          window.setTimeout(() => {
            handlingSession401 = false;
          }, 1500);
        }
      }

      return Promise.reject(error);
    },
  );
}
