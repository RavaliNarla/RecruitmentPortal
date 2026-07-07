import { requiredField } from "./common-validations";
import i18n from "i18next";

/* =========================
   HELPERS
========================= */

const normalize = (v = "") => String(v).trim().toLowerCase();

const validText = (value) => /^[A-Za-z0-9\s.&,()\-_/]+$/.test(value);

const validTextForm = (value) => /^[A-Za-z0-9\s.,&()+/_\-–—]+$/.test(value);

/* =========================
   FIELD VALIDATIONS
========================= */

export const validateEducationLevel = (value) => {
  return requiredField(value) || null;
};

export const validateCourse = (value) => {
  let error = requiredField(value);
  if (error) return error;

  if (!validTextForm(value)) {
    return i18n.t("education:invalid_characters", "Invalid characters");
  }

  return null;
};

export const validateCourseCode = (value, existing = [], currentId = null) => {
  // REQUIRED
  let error = requiredField(value);
  if (error) {
    return i18n.t("education:course_code_required", "Course code is required");
  }

  // DUPLICATE CHECK
  const normalized = normalize(value);

  const isDuplicate = existing.some((item) => {
    const sameCode = normalize(item.qualificationCode) === normalized;

    const isSameId = item.educationQualificationsId === currentId;

    return sameCode && !isSameId;
  });

  if (isDuplicate) {
    return i18n.t(
      "education:duplicate_course_code",
      "Course code already exists"
    );
  }

  return null;
};

export const validateSpecializationTest = (list = []) => {
  const seen = new Set();
  const seenCodes = new Set();

  for (let val of list) {
    const value = typeof val === "string" ? val : val?.name;

    const code = typeof val === "object" ? val?.code : "";

  // Empty row is allowed here.
// Save validation will decide whether it's required.
if (!value?.trim()) {
  continue;
}

// Once Name is entered, Code becomes mandatory.
if (!code?.trim()) {
  return i18n.t(
    "education:specialization_code_required",
    "Specialization code is required"
  );
}

    const normalized = normalize(value);
    const normalizedCode = normalize(code);

    // skip empty values
    if (!normalized) continue;

    if (!validText(value)) {
      return i18n.t("education:invalid_characters", "Invalid characters");
    }
    if (seenCodes.has(normalizedCode)) {
      return i18n.t(
        "education:duplicate_specialization_code",
        "Duplicate specialization code"
      );
    }

    if (seen.has(normalized)) {
      return i18n.t(
        "education:duplicate_specialization",
        "Duplicate specialization"
      );
    }

    seen.add(normalized);
    seenCodes.add(normalizedCode);
  }

  return null;
};

export const validateSpecialization = (list = []) => {
  const seen = new Set();
  const seenCodes = new Set();
  for (let val of list) {
    const value = typeof val === "string" ? val : val?.name;

    const code = typeof val === "object" ? val?.code : "";

    // ✅ specialization required
 // Empty row is allowed here.
// Save validation will decide whether it's required.
if (!value?.trim()) {
  continue;
}

// Once Name is entered, Code becomes mandatory.
if (!code?.trim()) {
  return i18n.t(
    "education:specialization_code_required",
    "Specialization code is required"
  );
}

    const normalized = normalize(value);
    const normalizedCode = normalize(code);

    // ✅ invalid character validation
    if (!validText(value)) {
      return i18n.t("education:invalid_characters", "Invalid characters");
    }

    // ✅ duplicate validation
    if (seen.has(normalized)) {
      return i18n.t(
        "education:duplicate_specialization",
        "Duplicate specialization"
      );
    }
    if (seenCodes.has(normalizedCode)) {
      return i18n.t(
        "education:duplicate_specialization_code",
        "Duplicate specialization code"
      );
    }

    seen.add(normalized);
    seenCodes.add(normalizedCode);
  }

  return null;
};

export const validateEducationForm = (formData = {}, options = {}) => {
  const errors = {};
  const { existing = [], currentId = null, editMode = false } = options;

  // ✅ Education Level
  const eduError = validateEducationLevel(formData.educationLevel);
  if (eduError) errors.educationLevel = eduError;

  // ✅ Course (WITH DUPLICATE CHECK)
  const courseError = validateCourse(formData.course);

  if (courseError) {
    errors.course = courseError;
  } else {
    const { existing = [], currentId = null } = options;

    const isDuplicate = existing.some((item) => {
      const sameCourse =
        item.course?.trim().toLowerCase() ===
        formData.course?.trim().toLowerCase();

      const isSameId = item.educationQualificationsId === currentId;

      return sameCourse && !isSameId;
    });

    if (isDuplicate) {
      errors.course = i18n.t(
        "education:duplicate_course",
        "Course already exists"
      );
    }
  }

  /* =========================
   COURSE CODE VALIDATION
========================= */

  const courseCodeError = validateCourseCode(
    formData.courseCode,
    existing,
    currentId
  );

  if (courseCodeError) {
    errors.courseCode = courseCodeError;
  }
  // ✅ Specialization (WITH DUPLICATE CHECK)
  if (editMode) {
    const specError = validateSpecialization(
      formData.specializationOthers || []
    );
    if (specError) {
      if (
        specError ===
        i18n.t(
          "education:specialization_code_required",
          "Specialization code is required"
        )
      ) {
        errors.specializationCode = specError;
      } else {
        errors.specialization = specError;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  } else {
    const specError = validateSpecializationTest(
      formData.specializationOthers || []
    );
    if (specError) errors.specialization = specError;

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }
};

/* =========================
   DEFAULT EXPORT
========================= */

const educationValidations = {
  validateEducationForm,
  validateEducationLevel,
  validateCourse,
  validateCourseCode,
  validateSpecialization,
};
export default educationValidations;
