import defaultLogo from "../../../assets/logo.png";
import organizationApiService from "./organizationApiService";

// Replaces the old loginOrganizations.json static config. Used whenever an
// org code isn't found via the real API, and as the source for fields the
// API doesn't provide yet (loginType, allowedPrivileges, and the secondary
// theme colors) — update these once SuperAdminPortal exposes them dynamically.
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
};

export const getOrganizationTheme = async (orgCode) => {
  if (!orgCode) return DEFAULT_ORGANIZATION_THEME;

  try {
    const response = await organizationApiService.getOrganizationByCode(orgCode);
    const details = response?.data?.organizationDetailsJson;
    if (!details) return DEFAULT_ORGANIZATION_THEME;

    // appTitle/loginType/allowedPrivileges/linkColor/focusColor/dashboardbgcolor
    // stay static intentionally — not (yet) part of this API response.
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
    };
  } catch {
    // org code not found via the real API, or API unreachable
    return DEFAULT_ORGANIZATION_THEME;
  }
};
