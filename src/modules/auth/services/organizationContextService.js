const STORAGE_KEY = "loginOrganization";
const DEFAULT_ORG = "default";

// No longer validated against a fixed static list — any org code is valid;
// whether it actually exists is determined by the real API lookup in
// organizationThemeService.js, not here.
export const normalizeOrganizationKey = (orgSlug) => {
  const organizationKey = orgSlug?.toLowerCase().trim();
  return organizationKey || DEFAULT_ORG;
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
  return `/${organizationKey}/login`;
};

export const getOrganizationPath = (path = "/", orgSlug) => {
  const organizationKey = normalizeOrganizationKey(orgSlug);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (normalizedPath === "/unauthorized") {
    return normalizedPath;
  }

  return `/${organizationKey}${normalizedPath}`;
};
