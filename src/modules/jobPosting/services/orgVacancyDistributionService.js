import organizationApiService from "../../auth/services/organizationApiService";
import { publicSuperAdminApi } from "../../../core/service/apiService";

// SuperAdminPortal > Eligibility Configuration > Vacancy Breakdown lets an
// org toggle whether category-wise / state-wise vacancy distribution even
// applies to it. This lives on the SuperAdminPortal backend, keyed by its
// internal organizationId — an id this app never receives directly (it only
// knows the org by :orgSlug/its code) — so resolve that id the same way
// orgInclusionsService.js does (organizationApiService.getOrganizationByCode)
// before calling the eligibilityConfiguration endpoint.
// Defaults to both true (today's behavior, matches SuperAdminPortal's own
// `?? true` default in VacancyBreakdown.js) when unconfigured or unreachable.
const DEFAULT_CONFIG = { categoryDistribution: true, stateDistribution: true };

export async function getOrgVacancyDistributionConfig(orgCode) {
  if (!orgCode) return DEFAULT_CONFIG;

  let organizationId;
  try {
    const orgResponse = await organizationApiService.getOrganizationByCode(orgCode);
    organizationId = orgResponse?.data?.id;
  } catch {
    return DEFAULT_CONFIG;
  }

  if (!organizationId) return DEFAULT_CONFIG;

  try {
    const body = await publicSuperAdminApi.get(
      `/eligibilityConfiguration/vacancy_and_marks_reservation/${organizationId}`
    );
    const data = body?.data;
    if (!data) return DEFAULT_CONFIG;

    return {
      categoryDistribution: data.categoryDistribution ?? true,
      stateDistribution: data.stateDistribution ?? true,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}
