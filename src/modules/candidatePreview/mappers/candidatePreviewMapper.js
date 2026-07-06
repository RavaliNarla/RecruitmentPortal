import {
  getGender,
  getReligion,
  getNationality,
  getMaritalStatus,
  getReservation,
  getEducationLevel,
  getSpecialization,
  getMandatoryQualification,
} from "../../../shared/utils/masterHelpers";

import { formatDateDDMMYYYY } from "../../../shared/utils/dateUtils";

const findById = (arr = [], key, id) =>
  arr.find((x) => String(x[key]) === String(id));

const getStateName = (masters, id) =>
  findById(masters.states, "stateId", id)?.stateName || "-";

const getDistrictName = (masters, id) =>
  findById(masters.districts, "districtId", id)?.districtName || "-";

const getCityName = (masters, id) =>
  findById(masters.cities, "cityId", id)?.cityName || "-";

const getPincode = (masters, id) =>
  findById(masters.pincodes, "pincodeId", id)?.pin || "-";

const getInterviewCentreName = (masters, id) =>
  findById(masters?.interviewCenters || [], "interviewCentreId", id)
    ?.displayName || "-";

/* ===============================
   SINGLE SOURCE OF TRUTH
================================ */
export const mapCandidateToPreview = (apiData = {}, masters = {}, job = {}) => {
  const profile = apiData?.basicDetails?.candidateProfile || {};
  const languagesKnown = apiData?.basicDetails?.languagesKnown || [];
  const address = apiData?.addressDetails || {};
  // const locationprefApiData = apiData?.locationPreference
  const locationprefApiData = apiData?.locationPreference || {};
  const expectedCtcFormatted = safeCurrency(locationprefApiData?.expectedCtc);
  const presentDistrict = getDistrictName(masters, address.districtId);
  const presentState = getStateName(masters, address.stateId);

  const statePreference1 = getStateName(
    masters,
    locationprefApiData.statePreference1
  );
  const statePreference2 = getStateName(
    masters,
    locationprefApiData.statePreference2
  );
  const statePreference3 = getStateName(
    masters,
    locationprefApiData.statePreference3
  );

  const locationPreference1 = getCityName(
    masters,
    locationprefApiData.locationPreference1
  );
  const locationPreference2 = getCityName(
    masters,
    locationprefApiData.locationPreference2
  );
  const locationPreference3 = getCityName(
    masters,
    locationprefApiData.locationPreference3
  );

  const examCenterName = getInterviewCentreName(
    masters,
    locationprefApiData.interviewCenter
  );

  const permanentDistrict = getDistrictName(
    masters,
    address.permanentDistrictId
  );
  const permanentState = getStateName(masters, address.permanentStateId);

  const presentAddressFull = [
    address.addressLine1,
    address.addressLine2,
    address.city,
    presentDistrict,
    presentState,
  ]
    .filter(Boolean)
    .join(", ");

  const permanentAddressFull = [
    address.permanentAddressLine1,
    address.permanentAddressLine2,
    address.permanentCity,
    permanentDistrict,
    permanentState,
  ]
    .filter(Boolean)
    .join(", ");
    

  const educations = apiData?.educationDetails || [];
  const experiences = apiData?.experienceDetails || [];
  const documents = apiData?.documentDetails || [];

  const yesNo = (v) => (v ? "Yes" : "No");

  /* ================= MASTER LOOKUPS ================= */
  const gender = getGender(masters, profile.genderId);
  const religion = getReligion(masters, profile.religionId);
  const nationality = getNationality(masters, profile.nationality);
  const maritalStatus = getMaritalStatus(masters, profile.maritalStatusId);
  const reservation = getReservation(masters, profile.reservationCategoryId);
  const getLanguageName = (masters, id) =>
    findById(masters.languages, "languageId", id)?.languageName || "-";

  /* ========= DOCUMENT GROUP ========= */
  const groupDocs = (fn) =>
    documents
      .filter((d) => fn((d.displayName || d.fileName || "").toLowerCase()))

      .map((d) => {
        const rawName = d.displayName || d.fileName || "";

        const cleanedName = rawName
          .replace(/^candidate_[a-z0-9-]+_/i, "")
          .replace(/_/g, " ")
          .trim();

        return {
          id: d.id,
          name: cleanedName || "Document",
          fileName: d.fileName,
          url: d.fileUrl,
          status: d.documentScreeningStatus || "Pending",
          isValidationPending: d.isValidationPending,
          pendingChecks: d.pendingChecks,
          documentNumber: d.documentNumber,
          isDigilocker: d.isDigilocker,
        };
      });

  const mapLanguageNames = (languages, masters) => {
    if (!languages?.length) return "-";

    return languages
      .map((lang) => {
        const found = masters?.languages?.find(
          (l) => String(l.languageId) === String(lang.languageId)
        );

        if (!found) return null;

        const proficiency = [];

        if (lang.canRead) proficiency.push("Read");
        if (lang.canWrite) proficiency.push("Write");
        if (lang.canSpeak) proficiency.push("Speak");

        return `${found.languageName} (${proficiency.join(", ")})`;
      })
      .filter(Boolean)
      .join(", ");
  };

  return {
    /* ================= PERSONAL ================= */
    personalDetails: {
      fullName:
        profile.firstName + " " + profile.middleName + " " + profile.lastName ||
        "-",
      mobile: profile.contactNo || "-",
      email: profile.email || "-",
      motherName: profile.motherName || "-",
      fatherName: profile.fatherName || "-",
      spouseName: profile.spouseName || "-",
      dob: formatDateDDMMYYYY(profile.dateOfBirth) || "-",
      age: apiData?.age || "-",
      languages: mapLanguageNames(languagesKnown, masters),
      gender_name: gender?.gender || "-",
      religion_name: religion?.religion || "-",
      nationality_name: nationality?.countryName || "-",
      maritalStatus_name: maritalStatus?.maritalStatus || "-",

      caste: profile.community || "-",
      reservationCategory_name: reservation?.categoryName || "-",

      address: presentAddressFull + " - " + address.pincode || "-",
      permanentAddress:
        permanentAddressFull + " - " + address.permanentPincode || "-",

      // exService: yesNo(profile.exServiceman),
      exService: profile.exServiceman,
      physicalDisability: yesNo(profile.disability),
      centralGovtEmployment: yesNo(profile.centralGovtEmployed),
      servingLowerPost: yesNo(profile.employedInLowerPost),
      servingInGovt: yesNo(profile.isPublicSectorUndertaking),
      familyMember1984: yesNo(profile.familyMember1984),
      riotVictimFamily: yesNo(profile.riotVictimFamily),
      disciplinaryAction: yesNo(profile.anyDisciplinaryAction),
      minority: yesNo(profile.minority),
      disciplinaryDetails: profile.disciplinaryDetails || "-",

      socialMediaProfileLink: profile.socialMediaProfileLink || "-",
      cibilScore: profile.cibilScore || "-",
      expectedCtc: expectedCtcFormatted,
      isTwin: profile.isTwin ? "Yes" : "No",
      twinName: profile.twinName || "-",

      statePreference1: statePreference1,
      statePreference2: statePreference2,
      statePreference3: statePreference3,

      locationPreference1: locationPreference1,
      locationPreference2: locationPreference2,
      locationPreference3: locationPreference3,
      examCenter: examCenterName,
      localLanguage: getLanguageName(
        masters,
        locationprefApiData.localLanguageId
      ),
      isLocalLanguageStudied: locationprefApiData.isLocalLanguageStudied
        ? "Yes"
        : "No",
    },

    /* ================= EDUCATION ================= */
    education: educations.map((item) => {
      const edu = item.education || {};
      const qualification = getMandatoryQualification(
        masters,
        edu.educationQualificationsId
      );

      const educationLevel = getEducationLevel(masters, qualification?.levelId);

      const specialization = edu.specializationId
        ? getSpecialization(masters, edu.specializationId)
        : null;

      return {
        institution: edu.institutionName || "-",
        universityName: edu.universityName || "-",
        startDate: formatDateDDMMYYYY(edu.startDate) || "-",
        endDate: formatDateDDMMYYYY(edu.endDate) || "-",

        percentage:
          edu.percentage != null && !isNaN(Number(edu.percentage))
            ? `${Number(edu.percentage).toFixed(2)}%`
            : "-",
        educationLevel_name: educationLevel?.documentName || "-",
        mandatoryQualification_name: qualification?.qualificationName || "-",
        specialization_name: specialization?.specializationName || "-",
      };
    }),

    /* ================= EXPERIENCE ================= */
    experience: experiences.map((e) => ({
      org: e.workExperience.organizationName || "-",
      designation: e.workExperience.postHeld || "-",
      department: e.workExperience.role || "-",
      from: formatDateDDMMYYYY(e.workExperience.fromDate) || "-",
      to: e.workExperience.isPresentlyWorking
        ? "Present"
        : formatDateDDMMYYYY(e.workExperience.toDate) || "-",
      duration: `${e.workExperience.monthsOfExp || 0} Months`,
      nature: e.workExperience.workDescription || "-",
    })),

    experienceSummary: {
      currentCtc: safeCurrency(experiences?.[0]?.workExperience?.currentCtc),
    },
    additionalDetails: {
      dynamicFormData: locationprefApiData?.dynamicFormData || {},
    },
    /* ================= DOCUMENTS ================= */
    documents: {
      allDocs: groupDocs(() => true),
    },
  };
};

const safeCurrency = (value) =>
  value && Number(value) > 0
    ? `₹${Number(value).toLocaleString("en-IN")}`
    : "-";

export const mapJobPositionToRequisitionStrip = (
  apiData = {},
  masters = {}
) => {
  const positionObj = masters?.masterPositions?.find(
    (p) => p.masterPositionsId === apiData.masterPositionId
  );

  const employmentTypeObj = masters?.employementTypes?.find(
    (e) => e.employementTypeId === apiData.employmentType
  );

  const departmentObj = masters?.departments?.find(
    (d) => d.departmentId === apiData.deptId
  );
  const dynamicFields = apiData?.dynamicFields || {};
  const nationalCategoryCounts = {};
  const nationalDisabilityCounts = {};

  // initialize
  masters?.reservationCategories?.forEach((cat) => {
    nationalCategoryCounts[cat.reservationCategoriesId] = 0;
  });

  masters?.disabilityCategories?.forEach((dis) => {
    nationalDisabilityCounts[dis.disabilityCategoryId] = 0;
  });

  // populate
  apiData.positionCategoryNationalDistributions?.forEach((c) => {
    if (!c.isDisability && c.reservationCategoryId) {
      if (nationalCategoryCounts.hasOwnProperty(c.reservationCategoryId)) {
        nationalCategoryCounts[c.reservationCategoryId] += c.vacancyCount;
      }
    }

    if (c.isDisability && c.disabilityCategoryId) {
      if (nationalDisabilityCounts.hasOwnProperty(c.disabilityCategoryId)) {
        nationalDisabilityCounts[c.disabilityCategoryId] += c.vacancyCount;
      }
    }
  });
  const totalMonths = apiData.mandatoryExperienceMonths ?? 0;

  const mandatoryYears = Math.floor(totalMonths / 12);
  const mandatoryMonths = totalMonths % 12;

  return {
    requisition_code: apiData.requisitionId || "-",

    position_title: positionObj?.positionName || "-",
    employment_type: employmentTypeObj?.typeName || "-",
    dept_name: departmentObj?.departmentName || "-",

    isMandatoryExpMonthsEduWise: apiData.isMandatoryExpMonthsEduWise,
    mandatoryExpMonthsEduWise: apiData.mandatoryExpMonthsEduWise || {},

    /*  ADD THESE */
    contract_years: apiData.contractYears ?? 0,
    mandatory_experience_years: mandatoryYears,
    mandatory_experience_months: mandatoryMonths,
    registration_start_date: formatToIST(apiData.createdDate),
    registration_end_date: formatToIST(apiData.modifiedDate),

    eligibility_age_min: apiData.eligibilityAgeMin ?? "-",
    eligibility_age_max: apiData.eligibilityAgeMax ?? "-",

    mandatory_experience: apiData.mandatoryExperience || "-",
    preferred_experience: apiData.preferredExperience || "NA",

    no_of_vacancies: apiData.totalVacancies ?? 0,

    mandatory_qualification: apiData.mandatoryEducation || "-",
    preferred_qualification: apiData.preferredEducation?.trim() || "NA",

    roles_responsibilities: apiData.rolesResponsibilities || "-",

    isLocationWise: apiData.isLocationWise,
     dynamicFields: dynamicFields,

    /* ========= NATIONAL (READY FOR UI) ========= */
    nationalCategoryDistribution: {
      categories: nationalCategoryCounts,
      disabilities: nationalDisabilityCounts,
      totalVacancies: apiData.totalVacancies ?? 0,
    },

    /* ========= STATE + CATEGORY + DISABILITY (PIVOTED) ========= */
    positionStateDistributions:
      apiData.positionStateDistributions?.map((state) => {
        const categoryCounts = {};
        const disabilityCounts = {};

        // initialize using IDs
        masters?.reservationCategories?.forEach((cat) => {
          categoryCounts[cat.reservationCategoriesId] = 0;
        });

        masters?.disabilityCategories?.forEach((dis) => {
          disabilityCounts[dis.disabilityCategoryId] = 0;
        });

        state.positionCategoryDistributions?.forEach((c) => {
          // Reservation categories
          if (!c.isDisability && c.reservationCategoryId) {
            if (categoryCounts.hasOwnProperty(c.reservationCategoryId)) {
              categoryCounts[c.reservationCategoryId] += c.vacancyCount;
            }
          }

          // Disability categories
          if (c.isDisability && c.disabilityCategoryId) {
            if (disabilityCounts.hasOwnProperty(c.disabilityCategoryId)) {
              disabilityCounts[c.disabilityCategoryId] += c.vacancyCount;
            }
          }
        });

        return {
          stateId: state.stateId,
          cityId: state.cityId,
          totalVacancies: state.totalVacancies,
          localLanguage: state.localLanguage,

          categories: categoryCounts,
          disabilities: disabilityCounts,
        };
      }) || [],
  };
};

/* 
   MAP REQUISITION → REQUISITION STRIP HEADER*/
export const mapRequisitionToStripHeader = (requisition = {}) => {
  return {
    requisition_id: requisition.id, //  UUID (for API)
    requisition_code: requisition.requisitionCode, //  Display
    requisition_title: requisition.requisitionTitle || "-",
    registration_start_date: requisition.startDate || "-",
    registration_end_date: requisition.endDate || "-",
  };
};

/* 
   MAP POSITION LIST ITEM (FOR DROPDOWN)
 */
export const mapPositionListItem = (apiItem = {}) => {
  return {
    positionId: apiItem.jobPositions?.positionId,
    positionName: apiItem.masterPositions?.positionName || "-",
    masterPositionId: apiItem.masterPositions?.masterPositionsId,
  };
};

// shared/utils/dateUtils.js
export const formatToIST = (isoDate) => {
  if (!isoDate) return "-";

  const date = new Date(isoDate);

  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
