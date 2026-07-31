import {
  nodeApi,
  publicNodeApi,
} from "../../../core/service/apiService"; // reuse axios instances + interceptors

const loginApi = {
  recruiterLogin: (email, password) =>
    publicNodeApi.post("/recruiter-auth/recruiter-login", { email, password }),
  // Must run AFTER recruiterLogin (needs the Auth0 access token already set in
  // Redux via setAuthUser) — this endpoint requires an authenticated
  // ADMIN/RECRUITER/etc, so it has to go through nodeApi (attaches
  // Authorization + X-Client: EmailPassword via the apiService interceptor),
  // not publicNodeApi.
  getRecruiterDetails: (email) =>
    nodeApi.post(`/getdetails/users?email=${email}`, {}),
  resendVerification: (user_id) =>
    nodeApi.post("/recruiter-auth/recruiter-resend-verification", { user_id }),
  recruiterLogout: () => nodeApi.post("/recruiter-auth/recruiter-logout"),
  forgotPassword: (email) =>
    nodeApi.post(`/recruiter-auth/recruiter-forgot-password?email=${email}`),

  getAzureUserDetails: (token) =>
    nodeApi.get("/getdetails/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Client": process.env.REACT_APP_AUTH_CLIENT,
      },
    }),
};

export default loginApi;
