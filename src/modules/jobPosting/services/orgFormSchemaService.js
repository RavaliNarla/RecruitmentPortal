import { apis } from "../../../core/service/apiService";

// TEMPORARY DEMO DATA — remove once the backend endpoint below is live.
// Mirrors the schema an admin can configure in SuperAdminPortal for the "bob"
// organization (Organizations > [org with slug "bob"] > Dynamic Forms).
// Keyed by the same organization slug used in the URL (/:orgSlug/...) and in
// SuperAdminPortal's organization "slug" field.
const DEMO_SCHEMAS = {
  sagarsoft: {
    requisition: {
      formId: "form-requisition-sagarsoft",
      title: "Requisition Form",
      fields: [
        {
          id: "field-department-code",
          type: "text",
          label: "Department Code",
          required: true,
          placeholder: "Enter department code",
          maxLength: 20,
        },
        {
          id: "field-recruitment-drive",
          type: "dropdown",
          label: "Recruitment Drive",
          required: false,
          options: ["Campus", "Lateral", "Walk-in"],
        },
      ],
    },
    jobPosting: {
      formId: "form-jobposting-bob",
      title: "Job Posting Form",
      fields: [
        {
          id: "field-position-reference-code",
          type: "text",
          label: "Position Reference Code",
          required: false,
          placeholder: "Enter internal position reference code",
          maxLength: 30,
        },
      ],
    },
  },
};

// Backend team: this endpoint doesn't exist yet. Once it's live and returns
// real data (an object with a non-empty `fields` array), that response is used
// and the DEMO_SCHEMAS fallback below never triggers — remove DEMO_SCHEMAS and
// this fallback logic at that point.
//
// Note: the shared axios interceptor treats any <500 response (e.g. a 404 for
// a route that doesn't exist yet) as a resolved call, not a thrown error, so
// the fallback below checks the response shape rather than relying on catch
// alone — otherwise a 404 today would resolve to a non-schema object instead
// of falling back to the demo data.
export async function getOrgFormSchema(organizationKey, formKey) {
  if (!organizationKey || !formKey) return null;

  try {
    const response = await apis.get(
      `/organizations/${organizationKey}/form-schema/${formKey}`
    );
    if (response?.fields?.length) return response;
    return DEMO_SCHEMAS[organizationKey]?.[formKey] || null;
  } catch {
    return DEMO_SCHEMAS[organizationKey]?.[formKey] || null;
  }
}
