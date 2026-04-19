import axios from "axios";

import { BASE_API_URL } from "../constants/common";
import { getLocalStorage } from "../lib/local-storage";
import { LOCAL_STORAGE_VARIABLES } from "../lib/local-storage/constants/local-storage";

const apiInstance = axios.create({
  baseURL: BASE_API_URL,
  // withCredentials: true,
});

apiInstance.interceptors.request.use(
  (config) => {
    const token = getLocalStorage(LOCAL_STORAGE_VARIABLES.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;
//     if (error.response.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;
//       try {
//         const response = await axios.post(`${BASE_API_URL}/auth/refresh`);
//         const { accessToken } = response.data;

//         localStorage.setItem(ACCESS_TOKEN, accessToken);

//         api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
//         return api(originalRequest);
//       } catch (refreshError) {
//         console.error("Token refresh failed:", refreshError);
//         localStorage.removeItem(ACCESS_TOKEN);
//         window.location.href = "/login";
//         return Promise.reject(refreshError);
//       }
//     }
//     return Promise.reject(error);
//   },
// );
export default apiInstance;
