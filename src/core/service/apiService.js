// src/services/apiClients.js
import axios from "axios";
import { store } from "../../store";
import { clearUser } from "../../app/providers/userSlice";
import { loginRequest } from "../../modules/auth/services/msalConfig";
import {
  getLoginPath,
  getSavedLoginOrganization,
} from "../../modules/auth/services/organizationContextService";
import { msalInstance } from "../..";

const REFRESH_PATH = "/recruiter-auth/recruiter-refresh-token";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const API_BASE_URLS = process.env.REACT_APP_API_BASE_URLS;
const NODE_API_URL = process.env.REACT_APP_NODE_API_URL;
const CANDIDATE_API_URL = process.env.REACT_APP_CANDIDATE_API_URL;
const MASTER_DROPDOWN_URL = process.env.REACT_APP_MASTER_DROPDOWN_URL;
const SUPER_ADMIN_API_URL = process.env.REACT_APP_SUPER_ADMIN_API_URL;

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = () => {
  refreshSubscribers.forEach((cb) => cb());
  refreshSubscribers = [];
};
async function callRefreshEndpoint() {
  const url = `${NODE_API_URL}${REFRESH_PATH}`;
  return axios.post(url, null, { withCredentials: true });
}

async function getToken() {
  try {
    let account = msalInstance.getActiveAccount();

    if (!account) {
      const accounts = msalInstance.getAllAccounts();
      account = accounts[0];

      if (account) {
        msalInstance.setActiveAccount(account);
      }
    }

    if (!account) {
      throw new Error("No account available");
    }

    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account,
    });

    return response.accessToken;
  } catch (error) {
    console.error("Token acquisition failed", error);

    // 🔥 fallback to interactive login
    msalInstance.loginRedirect(loginRequest);

    return null;
  }
}
const addAuthHeader = async (config) => {
  const token = await getToken();

  if (!token) {
    // 🚨 No token → force login
    redirectToLogin();
    return Promise.reject("No token available");
  }

  config.headers.Authorization = `Bearer ${token}`;
  config.headers["X-Client"] = "AzureAD";

  return config;
};

const redirectToLogin = () => {
  store.dispatch(clearUser());
  msalInstance.logoutRedirect({
    postLogoutRedirectUri: `${window.location.origin}${getLoginPath(
      getSavedLoginOrganization()
    )}`,
  });
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    //"ngrok-skip-browser-warning": "true"
  },
});

const formDataApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "multipart/form-data" },
});

const apis = axios.create({
  baseURL: API_BASE_URLS,
  headers: { "Content-Type": "application/json" },
});

const candidateApi = axios.create({
  baseURL: CANDIDATE_API_URL,
  headers: { "Content-Type": "application/json" },
});

const nodeApi = axios.create({
  baseURL: NODE_API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

const publicNodeApi = axios.create({
  baseURL: NODE_API_URL,
  headers: { "Content-Type": "application/json" },
});

// Called from the login page, before the user is authenticated — no auth
// header/refresh interceptor, same reasoning as publicNodeApi above.
const publicSuperAdminApi = axios.create({
  baseURL: SUPER_ADMIN_API_URL,
  headers: { "Content-Type": "application/json" },
});
publicSuperAdminApi.interceptors.response.use((response) => response.data);

const masterDropdownApi = axios.create({
  baseURL: MASTER_DROPDOWN_URL,
  headers: { "Content-Type": "application/json" },
});

/* ---------------------------
  Shared Interceptor Logic
--------------------------- */
const attachInterceptors = (instance) => {
  instance.interceptors.request.use(async (config) => {
    return await addAuthHeader(config);
  });

  instance.interceptors.response.use(
    (response) => {
      if (response.config?.responseType === "blob") return response;
      return response.data;
    },
    async (error) => {
      const originalRequest = error.config || {};
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !originalRequest.url?.includes(REFRESH_PATH)
      ) {
        originalRequest._retry = true;

        if (!isRefreshing) {
          isRefreshing = true;
          try {
            await callRefreshEndpoint();
            isRefreshing = false;
            onRefreshed();
          } catch (err) {
            isRefreshing = false;
            redirectToLogin();
            throw err;
          }
        }

        return new Promise((resolve) => {
          subscribeTokenRefresh(() => {
            resolve(instance(originalRequest));
          });
        });
      }

      if (error.response && error.response.status < 500) {
        // return Promise.resolve(error.response.data);
        return error.response.data;
      }

      throw error;
    }
  );
};
attachInterceptors(api);
attachInterceptors(formDataApi);
attachInterceptors(apis);
attachInterceptors(candidateApi);
attachInterceptors(nodeApi);

masterDropdownApi.interceptors.request.use(addAuthHeader);
masterDropdownApi.interceptors.response.use(
  (res) => res.data,
  (err) => {
    throw err;
  }
);
export {
  api,
  formDataApi,
  apis,
  candidateApi,
  nodeApi,
  publicNodeApi,
  masterDropdownApi,
  publicSuperAdminApi,
};
