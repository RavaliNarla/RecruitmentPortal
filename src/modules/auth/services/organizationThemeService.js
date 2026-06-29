import loginOrganizations from "../config/loginOrganizations.json";
import { getOrganizationConfig } from "./organizationContextService";

export const getOrganizationTheme = async (orgSlug) => {
  // Temporary static data. Later replace this with:
  // return apiService.get(`/organizations/${orgSlug}/login-theme`);
  return getOrganizationConfig(orgSlug) || loginOrganizations.default;
};
