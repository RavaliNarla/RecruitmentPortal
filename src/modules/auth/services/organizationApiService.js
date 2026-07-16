import { publicSuperAdminApi } from "../../../core/service/apiService";

const organizationApiService = {
  getOrganizationByCode: (code) =>
    publicSuperAdminApi.get(`/organizations/by-code/${code}`),
};

export default organizationApiService;
