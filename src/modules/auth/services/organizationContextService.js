import loginOrganizations from "../config/loginOrganizations.json";

const STORAGE_KEY = "loginOrganization";
const DEFAULT_ORG = "bob";

export const normalizeOrganizationKey = (orgSlug) => {
  const organizationKey = orgSlug?.toLowerCase();

  if (organizationKey && loginOrganizations[organizationKey]) {
    return organizationKey;
  }

  return DEFAULT_ORG;
};

export const getOrganizationConfig = (orgSlug) => {
  const organizationKey = normalizeOrganizationKey(orgSlug);
  return loginOrganizations[organizationKey] || loginOrganizations.default;
};

export const saveLoginOrganization = (orgSlug) => {
  const organizationKey = normalizeOrganizationKey(orgSlug);
  sessionStorage.setItem(STORAGE_KEY, organizationKey);
  return organizationKey;
};

export const getSavedLoginOrganization = () =>
  sessionStorage.getItem(STORAGE_KEY) || DEFAULT_ORG;

export const getLoginPath = (orgSlug) => {
  const organizationKey = normalizeOrganizationKey(orgSlug);
  return `/login/${organizationKey}`;
};

export const getOrganizationPath = (path = "/", orgSlug) => {
  const organizationKey = normalizeOrganizationKey(orgSlug);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (normalizedPath === "/unauthorized") {
    return normalizedPath;
  }

  return `/${organizationKey}${normalizedPath}`;
};
