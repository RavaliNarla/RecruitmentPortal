import defaultLogo from "../../../assets/logo.png";
import organizationApiService from "./organizationApiService";

// Replaces the old loginOrganizations.json static config. Used whenever an
// org code isn't found via the real API, and as the source for fields the
// API doesn't provide yet (appTitle, secondary theme colors) — update these
// once SuperAdminPortal exposes them dynamically.
export const DEFAULT_ORGANIZATION_THEME = {
  organizationName: "Recruitment Portal",
  appTitle: "Recruitment Tracking System",
  logo: defaultLogo,
  headerlogo: defaultLogo,
  logoAlt: "Logo",
  loginType: "entra",
  primaryColor: "#ff6a00",
  secondaryColor: "#162b75",
  linkColor: "#ff6a00",
  focusColor: "rgba(255, 106, 0, 0.12)",
  dashboardbgcolor: "#e7ebec",
  allowedPrivileges: { JobPostings: true },
  // Raw config, kept around so later pages (e.g. Add User) don't need to
  // guess field names — see recruitmentLogin.defaultLoginMethod below.
  recruitmentLogin: null,
};

const EMAIL_PASSWORD = "EMAIL_PASSWORD";

// data.login.authenticationJson.recruitmentLogin.defaultLoginMethod is
// "ENTRA_ID" or "EMAIL_PASSWORD" — see super-admin-portal's
// OrganizationController#getByCodeWithLogin / OrganizationWithLoginResponse
// (field is named "login", not "authentication").
const resolveLoginType = (recruitmentLogin) =>
  recruitmentLogin?.defaultLoginMethod === EMAIL_PASSWORD ? "password" : "entra";

export const getOrganizationTheme = async (orgCode) => {
  if (!orgCode) return DEFAULT_ORGANIZATION_THEME;

  try {
    const response = await organizationApiService.getOrganizationWithLogin(orgCode);
    const organization = response?.data?.organization;
    const details = organization?.organizationDetailsJson;
    const recruitmentLogin =
      response?.data?.login?.authenticationJson?.recruitmentLogin || null;

    if (!details) {
      return { ...DEFAULT_ORGANIZATION_THEME, recruitmentLogin };
    }

    // appTitle/allowedPrivileges/linkColor/focusColor/dashboardbgcolor stay
    // static intentionally — not (yet) part of this API response.
    return {
      ...DEFAULT_ORGANIZATION_THEME,
      organizationName: details.name || DEFAULT_ORGANIZATION_THEME.organizationName,
      logo: details.logoUrl || DEFAULT_ORGANIZATION_THEME.logo,
      headerlogo: details.logoUrl || DEFAULT_ORGANIZATION_THEME.headerlogo,
      logoAlt: details.name || DEFAULT_ORGANIZATION_THEME.logoAlt,
      primaryColor:
        details.theme?.primaryColor ||
        details.primaryColor ||
        DEFAULT_ORGANIZATION_THEME.primaryColor,
      secondaryColor:
        details.theme?.secondaryColor ||
        details.secondaryColor ||
        DEFAULT_ORGANIZATION_THEME.secondaryColor,
      loginType: resolveLoginType(recruitmentLogin),
      recruitmentLogin,
    };
  } catch {
    // org code not found via the real API, or API unreachable
    return DEFAULT_ORGANIZATION_THEME;
  }
};

// Safety-net helper for pages other than Login (e.g. Add User) that need the
// org's defaultLoginMethod but might run after organizationTheme was cleared
// from the store (logout, manual storage clear, etc). Login already always
// re-fetches fresh on mount, so it doesn't need this.
export const getDefaultLoginMethod = async (orgCode, organizationThemeFromStore) => {
  const fromStore = organizationThemeFromStore?.recruitmentLogin?.defaultLoginMethod;
  if (fromStore) return fromStore;

  const theme = await getOrganizationTheme(orgCode);
  return theme.recruitmentLogin?.defaultLoginMethod || null;
};
