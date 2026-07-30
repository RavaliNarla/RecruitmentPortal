import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import "../../../style/css/Login.css";
import pana from "../../../assets/pana.png";

import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../services/msalConfig";
import { getOrganizationTheme } from "../services/organizationThemeService";
import {
  getOrganizationPath,
  normalizeOrganizationKey,
  saveLoginOrganization,
} from "../services/organizationContextService";
import loginApi from "../services/loginService";
import {
  setAuthUser,
  setOrganizationTheme,
  setPrivileges,
  setUser,
} from "../../../app/providers/userSlice";
import { mapAuthApiToState } from "../mappers/auth.mapper";
import { mapUserApiToState } from "../mappers/user.mapper";
import { toast } from "react-toastify";

const Login = () => {
  const { instance } = useMsal();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orgSlug } = useParams();
  const organizationKey = normalizeOrganizationKey(orgSlug);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  // Starts null (not DEFAULT_ORGANIZATION_THEME) so the page never paints
  // with the generic orange fallback theme before the real org theme has
  // loaded — that briefly-visible orange flash was the bug. Nothing themed
  // renders until getOrganizationTheme() resolves (falling back to
  // DEFAULT_ORGANIZATION_THEME itself only if that call actually fails).
  const [organizationConfig, setOrganizationConfig] = useState(null);
  const loginThemeStyles = organizationConfig && {
    "--login-primary-color": organizationConfig.primaryColor,
    "--login-secondary-color": organizationConfig.secondaryColor,
    "--login-link-color": organizationConfig.linkColor,
    "--login-focus-color": organizationConfig.focusColor,
  };

  useEffect(() => {
    let isActive = true;

    getOrganizationTheme(organizationKey).then((theme) => {
      if (isActive) {
        setOrganizationConfig(theme);
        dispatch(setOrganizationTheme(theme));
      }
    });

    return () => {
      isActive = false;
    };
  }, [dispatch, organizationKey]);

  const handleEntraLogin = () => {
    saveLoginOrganization(organizationKey);
    instance.loginRedirect({
      ...loginRequest,
      prompt: "select_account",
    });
  };

  const handlePasswordLogin = async (event) => {
    event.preventDefault();
    setIsLoggingIn(true);

    try {
      const authApiRes = await loginApi.recruiterLogin(email, password);
      dispatch(setAuthUser(mapAuthApiToState(authApiRes)));

      try {
        const userApiRes = await loginApi.getRecruiterDetails(email);
        dispatch(setUser(mapUserApiToState(userApiRes)));
      } catch {
        dispatch(
          setUser({
            email,
            name: email.split("@")[0],
            role: organizationConfig.organizationName,
          })
        );
      }

      dispatch(
        setPrivileges(
          organizationConfig.allowedPrivileges || {
            JobPostings: true,
          }
        )
      );
      dispatch(setOrganizationTheme(organizationConfig));
      navigate(getOrganizationPath("/job-posting", organizationKey), {
        replace: true,
      });
    } catch (error) {
      const errorData = error.response?.data;
      toast.error(errorData?.error_description || "Login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!organizationConfig) {
    // Neutral placeholder while the real org theme loads. Login.css's
    // --login-primary-color falls back to --app-primary-color, whose own
    // App.css :root default is the orange (#ff6a00) DEFAULT_ORGANIZATION_THEME
    // color — so without this explicit override, even a theme-less div here
    // would still paint orange via plain CSS cascade, not just via JS state.
    return (
      <div
        className="login-container"
        style={{
          "--login-primary-color": "transparent",
          "--login-secondary-color": "transparent",
          "--login-link-color": "transparent",
          "--login-focus-color": "transparent",
        }}
      />
    );
  }

  const isPasswordLogin = organizationConfig.loginType === "password";

  return (
    <div className="login-container" style={loginThemeStyles}>
      <div className="left-panel">
        <img src={pana} alt="Illustration" />
      </div>

      <div className="right-panel">
        {/* <div className="logo">
          <img src={organizationConfig.logo} alt={organizationConfig.logoAlt} />
        </div> */}

     
        <div className="logo">
           <img src={organizationConfig.logo} alt={organizationConfig.logoAlt} />
           <h4>Recruitment Management System</h4>
         
        </div>

        {isPasswordLogin ? (
          <form className="login-form" onSubmit={handlePasswordLogin}>
            <label htmlFor="login-email">Email Id:</label>
            <input
              id="login-email"
              type="email"
              value={email}
              required
              placeholder="Enter email"
              onChange={(event) => setEmail(event.target.value)}
            />

            <label htmlFor="login-password">Password:</label>
            <input
              id="login-password"
              type="password"
              value={password}
              required
              placeholder="Enter password"
              onChange={(event) => setPassword(event.target.value)}
            />

            <button className="login-button" type="submit" disabled={isLoggingIn}>
              {isLoggingIn ? "Logging in..." : "LOGIN"}
            </button>
          </form>
        ) : (
          <button className="login-button" onClick={handleEntraLogin}>
            Login with Microsoft
          </button>
        )}
      </div>
    </div>
  );
};

export default Login;
