import { publicSuperAdminApi } from "../../../core/service/apiService";

const organizationApiService = {
  // Combined org (UI/branding) + login (auth method) config in one call.
  // Response shape: { organization: {...}, authentication: {...} | null }
  getOrganizationWithLogin: (code) =>
    publicSuperAdminApi.get(`/organizations/by-code/${code}/with-login`),
};

export default organizationApiService;
