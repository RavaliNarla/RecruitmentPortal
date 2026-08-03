import organizationApiService from "../../auth/services/organizationApiService";
import orgInclusionsApiService from "./orgInclusionsApiService";

// The "Applicable Inclusions" checklist (Job Posting, recruiter-facing) needs
// the org's Inclusions list, which lives on the SuperAdminPortal backend and
// is keyed by SuperAdminPortal's internal organizationId — an id this app
// never receives directly (it only knows the org by :orgSlug/its code).
// Resolve that id the same way organizationThemeService.js does for login
// theming (organizationApiService.getOrganizationWithLogin), then call
// orgInclusionsApiService with the id from that response.
export async function getOrgInclusions(orgCode) {
  if (!orgCode) return { inclusions: [], error: null };

  let organizationId;
  try {
    const orgResponse = await organizationApiService.getOrganizationWithLogin(orgCode);
    organizationId = orgResponse?.data?.organization?.id;
  } catch (err) {
    return { inclusions: [], error: `Could not resolve organization "${orgCode}": ${err?.message || err}` };
  }

  if (!organizationId) {
    return { inclusions: [], error: `No organization found for code "${orgCode}".` };
  }

  try {
    const response = await orgInclusionsApiService.getInclusions(organizationId);
    const inclusions = response?.data;
    return {
      inclusions: (Array.isArray(inclusions) ? inclusions : []).filter(
        (item) => item.status === "Active"
      ),
      error: null,
    };
  } catch (err) {
    return { inclusions: [], error: `Could not load inclusions: ${err?.message || err}` };
  }
}
