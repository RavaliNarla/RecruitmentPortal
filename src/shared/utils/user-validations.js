import i18n from "i18next";
import {
  requiredField,
  minLength,
  maxLength,
  emailFormat,
} from "./common-validations";

/**
 * Normalize a string for comparison (trim + lowercase)
 */
const normalizeString = (str = "") => String(str).trim().toLowerCase();

const onlyAlphabetsAndSpaces = (value) => /^[A-Za-z\s]+$/.test(value);

/* =========================
   FIELD VALIDATIONS
========================= */

export const validateUserRole = (role) => {
  return requiredField(role, i18n.t("validation:role"));
};

export const validateFullName = (name) => {
  let error = requiredField(name, i18n.t("validation:full_name"));
  if (error) return error;

  if (!onlyAlphabetsAndSpaces(name)) {
    return i18n.t("validation:no_special_chars");
  }

  error = minLength(name, 2, i18n.t("validation:full_name"));
  if (error) return error;

  error = maxLength(name, 100, i18n.t("validation:full_name"));
  if (error) return error;

  return null;
};

export const validateUserEmail = (email) => {
  let error = requiredField(email, i18n.t("validation:email"));
  if (error) return error;

  error = emailFormat(email);
  if (error) return error;

  return null;
};

export const validateUserPassword = (password, isRequired = true) => {
  if (!isRequired && !password) return null;

  let error = requiredField(password, i18n.t("validation:password"));
  if (error) return error;

  error = minLength(password, 6, i18n.t("validation:password"));
  if (error) return error;

  return null;
};

export const validatePasswordConfirmation = (confirmPassword, password) => {
  let error = requiredField(password, i18n.t("validation:password"));
  if (error) return error;

  if (!confirmPassword) return i18n.t("validation:confirm_password_required");

  if (confirmPassword !== password)
    return i18n.t("validation:passwords_not_match");

  return null;
};

/* =========================
   FORM VALIDATION
========================= */

export const validateUserForm = (formData = {}, options = {}) => {
  const {
    requirePassword = false,
    existing = [],
    currentId = null,
    skipEmailCheck = false,
  } = options;

  const errors = {};
  if (formData.role === "Zonal_HR" && !formData.interviewCenterId) {
    errors.interviewCenterId = "This filed is required";
  }

  // Role
  const roleError = validateUserRole(formData.role);
  if (roleError) errors.role = roleError;

  // Full name
  const nameError = validateFullName(formData.fullName);
  if (nameError) errors.fullName = nameError;

  // Email
  if (!skipEmailCheck) {
    const emailError = validateUserEmail(formData.email);
    if (emailError) {
      errors.email = emailError;
    } else {
      const emailNorm = normalizeString(formData.email);
      const duplicateEmail = existing.find(
        (user) =>
          user.email &&
          normalizeString(user.email) === emailNorm &&
          user.userId !== currentId
      );

      if (duplicateEmail) {
        errors.email = i18n.t("validation:email_exists");
      }
    }
  }

  // Password — only required for orgs whose defaultLoginMethod is EMAIL_PASSWORD
  if (requirePassword) {
    const passwordError = validateUserPassword(formData.password, true);
    if (passwordError) errors.password = passwordError;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

// utils/getDefaultRoute.js
export const getDefaultRoute = (privileges = {}) => {
  if (privileges.Admin) return "/users";
  if (privileges.Dashboard) return "/dashboard";
  if (privileges.JobPostings) return "/job-posting";

  if (privileges["Candidate Pool"] || privileges["Compensation Pool"])
    return "/candidate-workflow";
  if (privileges.Verification) return "/candidate-verification";
  if (privileges.Interview) return "/candidate-interviewer";
  if (privileges["Committee Management"]) return "/interviewpanel";
  if (privileges["Requisition Approval"]) return "/requisition-requests";

  return "/unauthorized";
};

// export const getDefaultRoute = (privileges = {}) => {
//   return "/dashboard";
// };
const userValidations = {
  validateUserRole,
  validateFullName,
  validateUserEmail,
  validateUserPassword,
  validatePasswordConfirmation,
  validateUserForm,
  getDefaultRoute,
};
export default userValidations;
