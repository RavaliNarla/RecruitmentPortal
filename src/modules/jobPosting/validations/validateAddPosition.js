import { validatePositiveInteger } from "./JobpostingcommonValidators";



export const normalizeTitle = (value = "") =>
  value
    .replace(/[ \t]+/g, " ")   // collapse only spaces & tabs
    .replace(/^\s+/, "");

export const TITLE_ALLOWED_PATTERN = /^[A-Za-z0-9 _.,\-():;'&/\n\r]*$/;

export const validateTitleOnType = (value) => {
  const normalized = normalizeTitle(value);

  if (!TITLE_ALLOWED_PATTERN.test(normalized)) {
    return {
      valid: false,
      message: "validation:title_invalid_chars_extended"

    };
  }

  return {
    valid: true,
    value: normalized
  };
};


const validateFile = ({ indentFile, isEditMode, existingIndentPath, errors }) => {

  if (!indentFile && !existingIndentPath) {
    errors.indentFile = "validation:required";
  }
};

const validateBasicFields = (formData, errors) => {
  if (!formData.position) errors.position = "validation:required";
  if (!formData.department) errors.department = "validation:required";
  if (!formData.employmentType) errors.employmentType = "validation:required";
  if (!formData.grade) errors.grade = "validation:required";
  if (!formData.medicalRequired) errors.medicalRequired = "validation:required";
  // if (!formData.cutoffDate) errors.cutoffDate = "validation:required";
};

const validateDuplicate = ({ formData, existingPositions, isEditMode, positionId, errors }) => {
  if (!formData.position || !formData.department || !Array.isArray(existingPositions)) return;

  const duplicate = existingPositions.some(p => {
    const sameDepartment = String(p.deptId) === String(formData.department);
    const samePosition = String(p.masterPositionId) === String(formData.position);
    const notSameRecord = !isEditMode || String(p.positionId) !== String(positionId);

    return sameDepartment && samePosition && notSameRecord;
  });

  if (duplicate) {
    errors.position = "validation:duplicate_position_department";
    errors.department = "validation:duplicate_department_position";
  }
};

const validateNumbers = (formData, errors, isContractEmployment) => {
  const numericChecks = [
    ["vacancies", "Vacancies"],
    ["minAge", "Min age"],
    ["maxAge", "Max age"],
  ];

  numericChecks.forEach(([key, label]) => {
    const err = validatePositiveInteger({
      value: formData[key],
      fieldName: label,
    });
    if (err) errors[key] = err;
  });

  if (isContractEmployment) {
    const contractErr = validatePositiveInteger({
      value: formData.contractualPeriod,
      fieldName: "Contractual period",
      required: true,
      allowZero: false,
    });

    if (contractErr) {
      errors.contractualPeriod = contractErr;
    }
  } else {
    delete errors.contractualPeriod;
  }
};
const validateAge = (formData, errors) => {
  const minAge = Number(formData.minAge);
  const maxAge = Number(formData.maxAge);

  if (!errors.minAge && minAge < 18) {
    errors.minAge = "validation:min_age_18";
  }

  if (!errors.maxAge && maxAge > 60) {
    errors.maxAge = "validation:max_age_60";
  }

  if (!errors.minAge && !errors.maxAge && minAge >= maxAge) {
    errors.maxAge = "validation:max_greater_than_min_age";
  }
};

const validateEducation = (educationData, errors) => {
  if (!educationData.mandatory.text?.trim()) {
    errors.mandatoryEducation = "validation:required";
  }
};

const hasValidDuration = (exp) =>
  exp.years !== undefined && exp.years !== null && exp.years !== '';

const isEmptyExperienceRow = (exp) =>
  !exp.educationLevel &&
  (exp.years === undefined || exp.years === null || exp.years === '');

const validateMandatorySimpleExperience = (exp, errors) => {
  const years = exp.years === "" ? null : Number(exp.years);
  const months = exp.months === "" ? null : Number(exp.months);

  if (years === null && months === null) {
    errors.mandatoryExperience = "validation:experience_duration_required";
    return;
  }

  if (!exp.description?.trim()) {
    errors.mandatoryExperience = "validation:experience_details_required";
  }
};

const validateMandatoryEducationExperience = (formData, errors) => {
  const eduExps = formData.mandatoryExperience?.educationLevelExperiences || [];

  if (!eduExps.length) {
    errors.mandatoryExperience = "validation:experience_duration_required";
    return;
  }

  const isValid = eduExps.every(exp => {
    if (!exp.educationLevel) return false;
    return hasValidDuration(exp);
  });

  if (!isValid) {
    errors.mandatoryExperience = "validation:qualification_and_duration_required";
  }

  if (!formData.mandatoryExperience.description?.trim()) {
    errors.mandatoryExperience = "validation:experience_details_required";
  }
};

const validatePreferredExperience = (formData, errors) => {
  const eduExps = formData.preferredExperience?.educationLevelExperiences || [];

  if (!eduExps.length) {
    errors.preferredExperience = "validation:experience_duration_required";
    return;
  }

  let hasQualificationError = false;
  let hasDurationError = false;

  eduExps.forEach(exp => {
    if (isEmptyExperienceRow(exp)) return;

    if (!exp.educationLevel) hasQualificationError = true;
    if (!hasValidDuration(exp)) hasDurationError = true;
  });

  if (hasQualificationError && hasDurationError) {
    errors.preferredExperience = "validation:qualification_and_duration_required";
  } else if (hasQualificationError) {
    errors.preferredExperience = "validation:qualification_required";
  } else if (hasDurationError) {
    errors.preferredExperience = "validation:experience_duration_required";
  }

  if (!formData.preferredExperience.description?.trim()) {
    errors.preferredExperience = "validation:experience_details_required";
  }
};

// 👉 SAME EXPERIENCE LOGIC (NO CHANGE)
const validateExperienceSection = (formData, errors) => {
  if (!formData.useMandatoryEducationLevelExperience) {
    validateMandatorySimpleExperience(formData.mandatoryExperience, errors);
  } else {
    validateMandatoryEducationExperience(formData, errors);
  }

  if (formData.usePreferredEducationLevelExperience) {
    validatePreferredExperience(formData, errors);
  }
};

const validateDistribution = ({
  formData,
  stateDistributions,
  nationalCategories,
  nationalDisabilities,
  categoryDistributionEnabled = true,
  errors
}) => {
  if (formData.enableStateDistribution) {
    const activeStates = stateDistributions.filter(s => !s.__deleted);

    if (activeStates.length === 0) {
      errors.nationalDistribution = "validation:required";
      return;
    }

    const stateTotal = activeStates.reduce(
      (sum, s) => sum + Number(s.vacancies || 0),
      0
    );

    const vacancies = Number(formData.vacancies || 0);

    if (stateTotal !== vacancies) {
      errors.nationalDistribution = {
        key: "validation:state_total_mismatch",
        params: { stateTotal, vacancies }
      };
    }
  } else if (categoryDistributionEnabled) {
    const categoryTotal = Object.values(nationalCategories || {})
      .reduce((sum, v) => sum + Number(v || 0), 0);

    const disabilityTotal = Object.values(nationalDisabilities || {})
      .reduce((sum, v) => sum + Number(v || 0), 0);

    const vacancies = Number(formData.vacancies || 0);

    if (categoryTotal === 0) {
      errors.nationalDistribution = "validation:required";
    } else if (categoryTotal !== vacancies) {
      errors.nationalDistribution = {
        key: "validation:category_total_mismatch",
        params: { categoryTotal, vacancies }
      };
    } else if (disabilityTotal > categoryTotal) {
      errors.nationalDistribution = {
        key: "validation:disability_exceeds_category",
        params: { disabilityTotal, categoryTotal }
      };
    }
  }
  // categoryDistributionEnabled === false, national mode: no category
  // breakdown is collected — formData.vacancies (validated in
  // validateNumbers) is the sole source of truth, nothing more to check.
};


export const validateAddPosition = (params) => {
  const {
    isEditMode,
    formData,
    educationData,
    indentFile,
    existingIndentPath,
    approvedBy,
    approvedOn,
    nationalCategories,
    nationalDisabilities,
    stateDistributions,
    existingPositions,
    positionId,
    isContractEmployment,
    categoryDistributionEnabled
  } = params;

  const errors = {};

  validateFile({ indentFile, isEditMode, existingIndentPath, errors });

  if (!approvedBy) errors.approvedBy = "validation:required";

  const approvedOnError = validateApprovedOn(approvedOn);
  if (approvedOnError) errors.approvedOn = approvedOnError;

  validateBasicFields(formData, errors);
  validateDuplicate({ formData, existingPositions, isEditMode, positionId, errors });

  validateNumbers(formData, errors, isContractEmployment);
  validateAge(formData, errors);

  validateEducation(educationData, errors);
  validateExperienceSection(formData, errors);

  formData.responsibilities = normalizeTitle(formData.responsibilities);

  if (!formData.responsibilities) {
    errors.responsibilities = "validation:required";
  }

  validateDistribution({
    formData,
    stateDistributions,
    nationalCategories,
    nationalDisabilities,
    categoryDistributionEnabled,
    errors
  });

  return errors;
};

export const validateStateDistribution = ({
  currentState,
  stateDistributions,
  editingIndex,
  categoryDistributionEnabled = true
}) => {
  const errors = {};

  if (!currentState.state) {
    errors.state = "validation:required";
  }

  if (currentState.vacancies === "" || currentState.vacancies === null) {
    errors.stateVacancies = "validation:required";
  } else if (Number(currentState.vacancies) <= 0) {
    errors.stateVacancies = "validation:vacancies_must_be_greater_than_zero";
  }

  // if (!currentState.language) {
  //   errors.stateLanguage = "validation:required";
  // }

  if (categoryDistributionEnabled) {
    const catTotal = Object.values(currentState.categories || {})
      .reduce((a, b) => a + Number(b || 0), 0);

    const disTotal = Object.values(currentState.disabilities || {})
      .reduce((a, b) => a + Number(b || 0), 0);

    const vacancies = Number(currentState.vacancies || 0);

    if (catTotal !== vacancies) {
      errors.stateDistribution = {
        key: "validation:category_total_mismatch",
        params: { categoryTotal: catTotal, vacancies }
      };

    }
    else if (disTotal > catTotal) {
      errors.stateDistribution = {
        key: "validation:disability_exceeds_category",
        params: { disabilityTotal: disTotal, categoryTotal: catTotal }
      };
    }
  }


  const duplicate = stateDistributions.some((s, i) => {
    if (s.__deleted || i === editingIndex) return false;

    const sameState =
      String(s.state) === String(currentState.state);

    if (!sameState) return false;

    const existingCity = String(s.city || "").trim();
    const currentCity = String(currentState.city || "").trim();

    // EXACT SAME STATE + CITY
    if (existingCity === currentCity) {
      errors.state = "validation:state_city_already_added";
      return true;
    }

    // EMPTY/NON-EMPTY CITY CONFLICT
    if (!existingCity && currentCity) {
      errors.state =
        "validation:state_city_conflict_empty_first";
      return true;
    }

    if (existingCity && !currentCity) {
      errors.state =
        "validation:state_city_conflict_city_first";
      return true;
    }
    return false;
  });




  return errors;
};
export const validateApprovedOn = (value) => {
  if (!value) return "validation:required"

  const selected = new Date(value);
  const today = new Date();

  selected.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  if (selected > today) {
    return "validation:approved_date_future";
  }

  return "";
};