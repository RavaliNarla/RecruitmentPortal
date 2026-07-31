import { Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { clearUser, setOrganizationTheme } from "../../../app/providers/userSlice";
import { getOrganizationTheme } from "./organizationThemeService";
import {
  getLoginPath,
  getSavedLoginOrganization,
  saveLoginOrganization,
  normalizeOrganizationKey,
} from "./organizationContextService";

export default function PrivateRoute() {
  const { instance, accounts, inProgress } = useMsal();
  const dispatch = useDispatch();
  const { orgSlug } = useParams();
  const authUser = useSelector((state) => state.user?.authUser);
  const user = useSelector((state) => state.user?.user);

  useEffect(() => {
    // Only save organization from URL when user is not authenticated.
    if (orgSlug && !authUser) {
      const organizationKey = saveLoginOrganization(orgSlug);
      getOrganizationTheme(organizationKey).then((theme) => {
        dispatch(setOrganizationTheme(theme));
      });
    }
  }, [dispatch, orgSlug]);

  // ⛔ Wait until MSAL finishes restoring session
  if (inProgress === "startup" || inProgress === "handleRedirect") {
    return <div>Loading...</div>;
  }

  // ✅ If we have authUser from Redux, user is authenticated - allow through
  if (authUser) {
    if (orgSlug) {
      const urlOrgKey = normalizeOrganizationKey(orgSlug);

      // Authoritative check: does the URL's org match the org this user
      // ACTUALLY belongs to (per their own hr.users.org_id row, resolved by
      // the backend - never anything the client sent)? This is what stops
      // someone authenticated for org A from viewing org B's branding/pages
      // by editing the URL. Backend data is already safe regardless (it
      // never reads org from the client at all) - this is purely about not
      // showing a confusing/wrong org UI to an otherwise-valid session.
      if (user?.orgCode && urlOrgKey !== normalizeOrganizationKey(user.orgCode)) {
        dispatch(clearUser());
        return <Navigate to={getLoginPath(urlOrgKey)} replace />;
      }

      // Secondary/UX-only check: URL doesn't match what was in the URL when
      // this browser tab started logging in (e.g. stale tab, race during
      // redirect). Doesn't run once the authoritative check above already
      // has real org info to compare against.
      if (!user?.orgCode) {
        const savedOrg = getSavedLoginOrganization();
        if (urlOrgKey !== savedOrg) {
          return <Navigate to={getLoginPath(savedOrg)} replace />;
        }
      }
    }

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
