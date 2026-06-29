import { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  setUser,
  setAuthUser,
  setPrivileges,
  setOrganizationTheme,
} from "../../../app/providers/userSlice";
import { getDefaultRoute } from "../../../shared/utils/user-validations";
import loginApi from "../services/loginService";
import {
  getLoginPath,
  getOrganizationPath,
  getOrganizationConfig,
  getSavedLoginOrganization,
} from "../services/organizationContextService";

export default function AuthCallback() {
  const { instance, accounts, inProgress } = useMsal();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const organizationKey = getSavedLoginOrganization();
      const loginPath = getLoginPath(organizationKey);

      try {
        dispatch(setOrganizationTheme(getOrganizationConfig(organizationKey)));

        // Get active account directly from instance (may be loaded before accounts array)
        let account = instance.getActiveAccount();

        // If no active account, try to use first available
        if (!account && accounts.length > 0) {
          account = accounts[0];
          instance.setActiveAccount(account);
        }

        // If still no account, wait a moment for MSAL to finish loading
        if (!account && inProgress !== "none") {
          await new Promise((resolve) => setTimeout(resolve, 500));
          account = instance.getActiveAccount();
        }

        // If still no account after redirect, user needs to login again
        if (!account) {
          // Check if there's auth code in URL (meaning we're coming from Azure login)
          const params = new URLSearchParams(window.location.search);
          const hasAuthCode = params.has("code");

          if (!hasAuthCode) {
            navigate(loginPath, { replace: true });
            return;
          }

          // If we have auth code but no account, wait longer

          await new Promise((resolve) => setTimeout(resolve, 2000));

          account = instance.getActiveAccount() || accounts[0];
          if (!account) {
            throw new Error("Account not available after redirect");
          }
        }

        // Get access token
        let tokenResponse;
        try {
          tokenResponse = await instance.acquireTokenSilent({
            scopes: [process.env.REACT_APP_MSAL_SCOPE],
            account,
          });
        } catch (tokenError) {
          tokenResponse = await instance.acquireTokenPopup({
            scopes: [process.env.REACT_APP_MSAL_SCOPE],
            account,
          });
        }

        const accessToken = tokenResponse.accessToken;

        // Store auth in Redux
        dispatch(
          setAuthUser({
            token: accessToken,
            email: account.username,
          })
        );

        const data = await loginApi.getAzureUserDetails(accessToken);

        // Store user info
        dispatch(
          setUser({
            userId: data.userId,
            name: data.name,
            email: data.email,
            role: data.role,
          })
        );

        // Store privileges
        const privileges = data.privileges || data.preveileges || {};
        dispatch(setPrivileges(privileges));

        // Navigate to appropriate page
        const defaultRoute = getDefaultRoute(privileges);

        navigate(getOrganizationPath(defaultRoute, organizationKey), {
          replace: true,
        });
      } catch (error) {
        // console.error("❌ Authentication error:", error.message);
        if (error.message.includes("Backend")) {
          navigate("/unauthorized", { replace: true });
        } else {
          navigate(loginPath, { replace: true });
        }
      }
    };

    initAuth();
  }, [instance, accounts, dispatch, navigate]);

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ height: "100vh" }}
    >
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Processing login...</span>
      </div>
    </div>
  );
}
