// utils/mapEduRulesToModalData.js
export function mapEduRulesToModalData(
  eduRulesJson,
  educationTypes,
  qualifications,
  specializations,
  certifications
) {
  if (!eduRulesJson) {
    return { groups: [], certGroups: [] };
  }

  // Helper to create groups from educations array
  const createGroupsFromEducations = (groups) => {
    if (!groups || groups.length === 0) {
      return [
        {
          educations: [
            {
              educationTypeId: "",
              educationQualificationsId: "",
              specializationId: "",
              duration: "",

              percentage: "",
            },
          ],
        },
      ];
    }

    // Each group represents an OR condition, so pass groups directly
    return groups.map((group) => ({
      educations: (group.conditions || []).map((condition) => ({
        educationTypeId: condition.educationType || "",
        educationQualificationsId: condition.qualification || "",
        specializationId: condition.specialization || "",
        duration: condition.duration || "",
 group: condition.group || "", 
        percentage: condition.percentage || "",
      })),
    }));
  };

  // Helper to create cert groups from certification IDs
  const createCertGroupsFromIds = (groups) => {
    if (!groups || groups.length === 0) {
      return [{ certifications: [{ certificationId: "" }] }];
    }

    // Map each group to a certification group (preserve AND/OR structure)
    return groups.map((group) => ({
      certifications: (group.conditions || []).map((certId) => ({
        certificationId: certId,
      })),
    }));
  };

  // Mandatory
  if (
    eduRulesJson.mandatoryEducations &&
    eduRulesJson.mandatoryEducations.groups
  ) {
    const result = {
      groups: createGroupsFromEducations(
        eduRulesJson.mandatoryEducations.groups
      ),
      certGroups: createCertGroupsFromIds(
        eduRulesJson.mandatoryCertifications?.groups || []
      ),
    };

    return result;
  }

  // Preferred
  if (
    eduRulesJson.preferredEducations &&
    eduRulesJson.preferredEducations.groups
  ) {
    const result = {
      groups: createGroupsFromEducations(
        eduRulesJson.preferredEducations.groups
      ),
      certGroups: createCertGroupsFromIds(
        eduRulesJson.preferredCertificationIds?.groups || []
      ),
    };

    return result;
  }

  const result = { groups: [], certGroups: [] };
  return result;
}
