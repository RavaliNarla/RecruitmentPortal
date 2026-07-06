const buildCategoryDistributionsForUpdate = (
  sd,
  reservationCategories,
  disabilityCategories
) => {
  const result = [];

  // 1️ Existing backend categories → UPDATE
  sd.categoryDistributions?.forEach((existing) => {
    let newCount = 0;

    if (!existing.isDisability) {
      const cat = reservationCategories.find(
        (c) => c.id === existing.reservationCategoryId
      );
      newCount = Number(sd.categories?.[cat?.code] || 0);
    } else {
      const dis = disabilityCategories.find(
        (d) => d.id === existing.disabilityCategoryId
      );
      newCount = Number(sd.disabilities?.[dis?.disabilityCode] || 0);
    }

    if (newCount > 0) {
      result.push({
        positionCategoryDistributionId: existing.positionCategoryDistributionId, // 🔑 KEEP ID
        reservationCategoryId: existing.reservationCategoryId,
        disabilityCategoryId: existing.disabilityCategoryId,
        vacancyCount: newCount,
        isDisability: existing.isDisability,
      });
    }
    // newCount === 0 → removed → don't send
  });

  // 2️ Newly added categories → CREATE
  reservationCategories.forEach((cat) => {
    const alreadyExists = sd.categoryDistributions?.some(
      (x) => x.reservationCategoryId === cat.id && !x.isDisability
    );
    if (!alreadyExists) {
      const count = Number(sd.categories?.[cat.code] || 0);
      if (count > 0) {
        result.push({
          positionCategoryDistributionId: null,
          reservationCategoryId: cat.id,
          vacancyCount: count,
          isDisability: false,
        });
      }
    }
  });

  disabilityCategories.forEach((dis) => {
    const alreadyExists = sd.categoryDistributions?.some(
      (x) => x.disabilityCategoryId === dis.id && x.isDisability
    );
    if (!alreadyExists) {
      const count = Number(sd.disabilities?.[dis.disabilityCode] || 0);
      if (count > 0) {
        result.push({
          positionCategoryDistributionId: null,
          disabilityCategoryId: dis.id,
          vacancyCount: count,
          isDisability: true,
        });
      }
    }
  });

  return result;
};

const buildEduRulesJson = (edu, mode) => {
  if (!edu) {
    return mode === "mandatory"
      ? {
          mandatoryEducations: { operator: "OR", groups: [] },
          mandatoryCertifications: { operator: "OR", groups: [] },
        }
      : {
          preferredEducations: { operator: "OR", groups: [] },
          preferredCertifications: { operator: "OR", groups: [] },
        };
  }

  // Process education groups with OR/AND operators
  const educationGroups = [];
  if (edu.groups && Array.isArray(edu.groups)) {
    edu.groups.forEach((group) => {
      const conditions = [];

      if (group.educations && Array.isArray(group.educations)) {
        group.educations.forEach((edu) => {
          if (edu.educationTypeId && edu.educationQualificationsId) {
            conditions.push({
              educationType: edu.educationTypeId,
              qualification: edu.educationQualificationsId,
              specialization: edu.specializationId || "",
              duration: edu.duration || "",
              percentage: edu.percentage || "",
            });
          }
        });
      }

      if (conditions.length > 0) {
        educationGroups.push({
          operator: "AND",
          conditions: conditions,
        });
      }
    });
  }

  // Process certification groups with OR/AND operators
  const certificationGroups = [];
  if (edu.certGroups && Array.isArray(edu.certGroups)) {
    edu.certGroups.forEach((certGroup) => {
      const conditions = [];

      if (certGroup.certifications && Array.isArray(certGroup.certifications)) {
        certGroup.certifications.forEach((cert) => {
          if (cert.certificationId) {
            conditions.push(cert.certificationId);
          }
        });
      }

      if (conditions.length > 0) {
        certificationGroups.push({
          operator: "AND",
          conditions: conditions,
        });
      }
    });
  }

  return mode === "mandatory"
    ? {
        mandatoryEducations: {
          operator: "OR",
          groups: educationGroups,
        },
        mandatoryCertifications: {
          operator: "OR",
          groups: certificationGroups,
        },
      }
    : {
        preferredEducations: {
          operator: "OR",
          groups: educationGroups,
        },
        preferredCertifications: {
          operator: "OR",
          groups: certificationGroups,
        },
      };
};

export const mapAddPositionToUpdateDto = ({
  positionId,
  requisitionId,
  formData,
  educationData,
  stateDistributions,
  nationalCategories,
  nationalDisabilities,
  reservationCategories,
  disabilityCategories,
  qualifications,
  certifications,
  approvedBy,
  approvedOn,
  indentOthers,
  isProficientInLocalLanguage,
  existingPosition,
  // ✅ ADD THESE
  isAgeRelRiotVictimFamily,
  isAgeRelWdsWomen,
  dynamicFields,
  jobPositionExclusion = [],
}) => {
  const dto = {
    // positionId,
    ...(positionId ? { positionId } : {}),
    requisitionId,
    deptId: formData.department,
    masterPositionId: formData.position,
    totalVacancies: Number(formData.vacancies),
    eligibilityAgeMin: Number(formData.minAge),
    eligibilityAgeMax: Number(formData.maxAge),
    employmentType: formData.employmentType,
    contractYears: Number(formData.contractualPeriod),
    gradeId: formData.grade,
    indentName: formData.indentName,
    isLocationPreferenceEnabled: formData.enableLocation,
    isLocationWise: formData.enableStateDistribution,
    rolesResponsibilities: formData.responsibilities,
    isMedicalRequired: formData.medicalRequired === "yes",

    mandatoryEducation: educationData.mandatory.text,
    preferredEducation: educationData.preferred.text,

    mandatoryExperienceMonths: formData.useMandatoryEducationLevelExperience
      ? null
      : Number(formData.mandatoryExperience.years) * 12 +
        Number(formData.mandatoryExperience.months),

    preferredExperienceMonths: formData.usePreferredEducationLevelExperience
      ? null
      : Number(formData.preferredExperience.years) * 12 +
        Number(formData.preferredExperience.months),

    mandatoryExperience: formData.mandatoryExperience.description,
    preferredExperience: formData.preferredExperience.description,
    isIntermediateRequired: formData.isIntermediateRequired,
    // Education Level Experiences
    mandatoryExpMonthsEduWise:
      formData.mandatoryExperience.educationLevelExperiences?.reduce(
        (acc, exp) => {
          if (exp.educationLevel) {
            acc[exp.educationLevel] =
              Number(exp.years || 0) * 12 + Number(exp.months || 0);
          }
          return acc;
        },
        {}
      ),

    preferredExpMonthsEduWise:
      formData.preferredExperience.educationLevelExperiences?.reduce(
        (acc, exp) => {
          if (exp.educationLevel) {
            acc[exp.educationLevel] =
              Number(exp.years || 0) * 12 + Number(exp.months || 0);
          }
          return acc;
        },
        {}
      ),

    // Toggle States
    isMandatoryExpMonthsEduWise: formData.useMandatoryEducationLevelExperience,
    isPreferredExpMonthsEduWise: formData.usePreferredEducationLevelExperience,

    // Cut Off Date
    //cutoffDate: formData.cutoffDate || null,

    // Root level field
    isProficientInLocalLanguage:
      isProficientInLocalLanguage === true ? true : false,
    isAgeRelRiotVictimFamily: !!isAgeRelRiotVictimFamily,
    isAgeRelWdsWomen: !!isAgeRelWdsWomen,
    dynamicFields,
    

    approvedBy,
    approvedOn,
    indentOthers: indentOthers?.trim() || null,

    mandatoryEduRulesJson: buildEduRulesJson(
      educationData.mandatory,
      "mandatory"
    ),

    preferredEduRulesJson: buildEduRulesJson(
      educationData.preferred,
      "preferred"
    ),

    // IMPORTANT
    positionCategoryNationalDistributions: [],
    positionStateDistributions: [],
    jobPositionExclusion,
  };

  // NATIONAL
  if (!formData.enableStateDistribution) {
    reservationCategories.forEach((cat) => {
      dto.positionCategoryNationalDistributions.push({
        reservationCategoryId: cat.id,
        vacancyCount: Number(nationalCategories[cat.code] || 0),
        isDisability: false,
      });
    });

    disabilityCategories.forEach((dis) => {
      dto.positionCategoryNationalDistributions.push({
        disabilityCategoryId: dis.id,
        vacancyCount: Number(nationalDisabilities[dis.disabilityCode] || 0),
        isDisability: true,
      });
    });
  }

  // STATE
  if (formData.enableStateDistribution) {
    dto.positionStateDistributions = stateDistributions.map((sd) => ({
      positionStateDistributionId: sd.positionStateDistributionId, // 🔑 MISSING TODAY
      stateId: sd.state,
      cityId: sd.city,
      totalVacancies: Number(sd.vacancies),
      localLanguage: sd.language,
      isProficientInLocalLanguage:
        isProficientInLocalLanguage === true ? true : false,
      positionCategoryDistributions: buildCategoryDistributionsForUpdate(
        sd,
        reservationCategories,
        disabilityCategories
      ),
    }));
  }

  return dto;
};
