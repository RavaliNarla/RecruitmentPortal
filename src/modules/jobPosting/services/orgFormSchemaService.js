import { publicSuperAdminApi } from "../../../core/service/apiService";

// TEMPORARY DEMO DATA — local fallback only, used when the real call fails
// (e.g. no screen configured yet, network issue). Mirrors the schema an
// admin can configure in SuperAdminPortal for the "sagarsoft" organization
// (Organizations > Dynamic Forms > Recruitment Portal).
const DEMO_SCHEMAS = {
  sagarsoft: {
    recruitment: {
      requisition: {
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
  },
};

// Real contract (verified against SuperAdminPortal's Swagger + Network tab,
// see SuperAdminPortal/ARCHITECTURE.md §7):
//   GET /organizations/{organizationCode}/form-schemas?screen={screenId}
// on the super-admin backend (publicSuperAdminApi) — NOT master-portal, and
// NOT the old guessed /{portal}/form-schema/{formKey} path. screenId is a
// uuid resolved from GET /portalScreens by matching {portal, screenKey}, not
// formKey itself.
async function resolveScreenId(portal, formKey) {
  const body = await publicSuperAdminApi.get("/portalScreens");
  const screen = (body?.data || []).find(
    (item) => item.portal === portal && item.screenKey === formKey && item.isActive
  );
  return screen?.id || null;
}

export async function getOrgFormSchema(organizationCode, formKey) {
  if (!organizationCode || !formKey) return null;

  try {
    const screenId = await resolveScreenId("recruitment", formKey);
    if (!screenId) {
      return DEMO_SCHEMAS[organizationCode]?.recruitment?.[formKey] || null;
    }

    const body = await publicSuperAdminApi.get(
      `/organizations/${encodeURIComponent(organizationCode)}/form-schemas`,
      { params: { screen: screenId } }
    );

    const rawFields = body?.data?.fields;
    const fields = Array.isArray(rawFields)
      ? rawFields
      : typeof rawFields === "string" && rawFields
        ? JSON.parse(rawFields)
        : null;

    if (fields?.length) return { fields };
    return DEMO_SCHEMAS[organizationCode]?.recruitment?.[formKey] || null;
  } catch {
    return DEMO_SCHEMAS[organizationCode]?.recruitment?.[formKey] || null;
  }
}
