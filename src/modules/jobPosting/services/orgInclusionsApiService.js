import { publicSuperAdminApi } from "../../../core/service/apiService";

const orgInclusionsApiService = {
  getInclusions: (organizationId) =>
    publicSuperAdminApi.get(
      `/eligibilityConfiguration/inclusions/${organizationId}`,
      { headers: { "X-Client": "Candidate" } }
    ),
};

export default orgInclusionsApiService;
