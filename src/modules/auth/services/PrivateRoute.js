import { Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { setOrganizationTheme } from "../../../app/providers/userSlice";
import {
  getOrganizationConfig,
  getLoginPath,
  getSavedLoginOrganization,
  saveLoginOrganization,
} from "./organizationContextService";

export default function PrivateRoute() {
  const { instance, accounts, inProgress } = useMsal();
  const dispatch = useDispatch();
  const { orgSlug } = useParams();
  const authUser = useSelector((state) => state.user?.authUser);

  useEffect(() => {
    if (orgSlug) {
      const organizationKey = saveLoginOrganization(orgSlug);
      dispatch(setOrganizationTheme(getOrganizationConfig(organizationKey)));
    }
  }, [dispatch, orgSlug]);

  // ⛔ Wait until MSAL finishes restoring session
  if (inProgress === "startup" || inProgress === "handleRedirect") {
    return <div>Loading...</div>;
  }

  // ✅ If we have authUser from Redux, user is authenticated - allow through
  if (authUser) {
    return <Outlet />;
  }

  let account = instance.getActiveAccount();

  if (!account && accounts.length > 0) {
    account = accounts[0];
    instance.setActiveAccount(account);
  }

  // ❌ No account and no authUser - redirect to login
  if (!account) {
    return <Navigate to={getLoginPath(getSavedLoginOrganization())} replace />;
  }

  return <Outlet />;
}
