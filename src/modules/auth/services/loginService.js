import {
  nodeApi,
  publicNodeApi,
} from "../../../core/service/apiService"; // reuse axios instances + interceptors

const loginApi = {
  recruiterLogin: (email, password) =>
    publicNodeApi.post("/recruiter-auth/recruiter-login", { email, password }),
  getRecruiterDetails: (email) =>
    publicNodeApi.post(`/getdetails/users?email=${email}`, {}),
  resendVerification: (user_id) =>
    nodeApi.post("/recruiter-auth/recruiter-resend-verification", { user_id }),
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
