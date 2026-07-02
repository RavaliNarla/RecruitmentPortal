import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import departmentEn from "../i18n/json/department.en.json";
import departmentHi from "../i18n/json/department.hi.json";
import validationEn from "../i18n/json/validation.en.json";
import validationHi from "../i18n/json/validation.hi.json";
import locationEn from "../i18n/json/location.en.json";
import locationHi from "../i18n/json/location.hi.json";
import positionEn from "../i18n/json/position.en.json";
import positionHi from "../i18n/json/position.hi.json";


import categoryEn from "../i18n/json/category.en.json";
import categoryHi from "../i18n/json/category.hi.json";

import relaxationtypeEn from "../i18n/json/relaxation.en.json";
import relaxationtypeHi from "../i18n/json/relaxation.hi.json";
// Special Category translations
import specialCategoryEn from "../i18n/json/specialCategory.en.json";
import specialCategoryHi from "../i18n/json/specialCategory.hi.json";

import documentsEn from "../i18n/json/documents.en.json";
import documentsHi from "../i18n/json/documents.hi.json";

import interviewPanelEn from "../i18n/json/interviewPanel.en.json";
import interviewPanelHi from "../i18n/json/interviewPanel.hi.json";

import jobGradeEn from "../i18n/json/jobGrade.en.json";
import jobGradeHi from "../i18n/json/jobGrade.hi.json";

// User translations
import userEn from "../i18n/json/user.en.json";
import userHi from "../i18n/json/user.hi.json";

import genericOrAnnexuresEn from "../i18n/json/genericOrAnnexures.en.json";
import genericOrAnnexuresHi from "../i18n/json/genericOrAnnexures.hi.json";

import certificationEn from "../i18n/json/certification.en.json";
import certificationHi from "../i18n/json/certification.hi.json";
import commonEn from "../i18n/json/common.en.json";
import commonHi from "../i18n/json/common.hi.json";

import createRequisitionEn from "../i18n/jobPostingJson/CreateRequisition.en.json";
import createRequisitionHi from "../i18n/jobPostingJson/CreateRequisition.hi.json";

import addPositionEn from "../i18n/jobPostingJson/addPosition.en.json";
import addPositionHi from "../i18n/jobPostingJson/addPosition.hi.json";

import importModalEn from "../i18n/jobPostingJson/importModal.en.json";
import importModalHi from "../i18n/jobPostingJson/importModal.hi.json";

import jobPostingsListEn from "../i18n/jobPostingJson/jobPostingsList.en.json";
import jobPostingsListHi from "../i18n/jobPostingJson/jobPostingsList.hi.json";

import previewEn from "../i18n/previewJson/preview.en.json";
import previewHi from "../i18n/previewJson/preview.hi.json";

import interviewScheduleEn from "../i18n/interviewScheduleJson/interviewSchedule.en.json";
import interviewScheduleHi from "../i18n/interviewScheduleJson/interviewSchedule.hi.json";

import committeeInterviewPanelEn from "../i18n/committeeManagementJson/committeeInterviewPanel.en.json";
import committeeInterviewPanelHi from "../i18n/committeeManagementJson/committeeinterviewPanel.hi.json";

import interviewDayEn from "../i18n/interviewDayJson/interviewDay.en.json";
import interviewDayHi from "../i18n/interviewDayJson/interviewDay.hi.json";

import candidateWorkflowEn from "../i18n/candidateWorkflowJson/candidateWorkflow.en.json";
import candidateWorkflowHi from "../i18n/candidateWorkflowJson/candidateWorkflow.hi.json";

import compensationPoolEn from "./compensationpoolJson/compensationpoolJson.en.json";
import compensationPoolHi from "./compensationpoolJson/compensationpoolJson.hi.json";


import verificationEn from "../i18n/verificationJson/verification.en.json";
import verificationHi from "../i18n/verificationJson/verification.hi.json";

import educationEn from "../i18n/json/education.en.json";
import educationHi from "../i18n/json/education.hi.json";

import dashboardEn from "../i18n/DashboardJson/dashboard.en.json";
import dashboardHi from "../i18n/DashboardJson/dashboard.hi.json";

import ApprovalEn from "../i18n/ApprovalJson/approvalhistory.en.json";
import ApprovalHi from "../i18n/ApprovalJson/approvalhistory.hi.json";
import messagesEn from "../i18n/Messages/messages.en.json";
import messagesHi from "../i18n/Messages/messages.hi.json";
import stateLanguagesEn from "../i18n/json/stateLanguages.en.json";
import stateLanguagesHi from "../i18n/json/stateLanguages.hi.json";

import extensionsRequestsEn from "../i18n/ExtensionsRequests/extensionsRequests_en.json";
import extensionsRequestsHi from "../i18n/ExtensionsRequests/extensionsRequests_hi.json";



import examconfigurationEn from "../i18n/ExamconfigurationJson/examconfiguration.en.json";
import examconfigurationHi from "../i18n/ExamconfigurationJson/examconfiguration.hi.json";

import examRequestEn from "../i18n/ExamRequestJson/examRequest.en.json";
import examRequestHi from "../i18n/ExamRequestJson/examRequest.hi.json";

import interviewRequestEn from "../i18n/InterviewRequestJson/interviewRequest.en.json";
import interviewRequestHi from "../i18n/InterviewRequestJson/interviewRequest.hi.json";

import offerLetterRequestEn from "../i18n/offerLetterRequest/offerLetterRequest.en.json";
import offerLetterRequestHi from "../i18n/offerLetterRequest/offerLetterRequest.hi.json";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: commonEn,
      department: departmentEn,
      user: userEn,
      jobGrade: jobGradeEn,
      specialCategory: specialCategoryEn,
      documents: documentsEn,
      interviewPanel: interviewPanelEn,
      location: locationEn,
      certification: certificationEn,
      position: positionEn,
      category: categoryEn,
      relaxationType: relaxationtypeEn,
      validation: validationEn,
      genericOrAnnexures: genericOrAnnexuresEn,
      CreateRequisition: createRequisitionEn,
      addPosition: addPositionEn,
      importModal: importModalEn,
      jobPostingsList: jobPostingsListEn,
      preview: previewEn,
      interviewSchedule: interviewScheduleEn,
      interviewPanelCommittee: committeeInterviewPanelEn,
      interviewDay: interviewDayEn,
      candidateWorkflow: candidateWorkflowEn,
      verification: verificationEn,
      education: educationEn,
      approvalHistory: ApprovalEn,
      messages: messagesEn,
      stateLanguages: stateLanguagesEn,
      extensionsRequests: extensionsRequestsEn,
      examconfiguration: examconfigurationEn,
      compensationPool: compensationPoolEn,
      examRequest: examRequestEn,
      interviewRequest: interviewRequestEn,
      offerLetterRequest: offerLetterRequestEn,
        dashboard: dashboardEn,
    },
    hi: {
      common: commonHi,
      department: departmentHi,
      user: userHi,
      jobGrade: jobGradeHi,
      specialCategory: specialCategoryHi,
      documents: documentsHi,
      interviewPanel: interviewPanelHi,
      location: locationHi,
      certification: certificationHi,
      position: positionHi,
      category: categoryHi,
      relaxationType: relaxationtypeHi,
      validation: validationHi,
      genericOrAnnexures: genericOrAnnexuresHi,
      CreateRequisition: createRequisitionHi,
      addPosition: addPositionHi,
      importModal: importModalHi,
      jobPostingsList: jobPostingsListHi,
      preview: previewHi,
      interviewSchedule: interviewScheduleHi,
      interviewPanelCommittee: committeeInterviewPanelHi,
      interviewDay: interviewDayHi,
      candidateWorkflow: candidateWorkflowHi,
      verification: verificationHi,
      education: educationHi,
      approvalHistory: ApprovalHi,
      messages: messagesHi,
      stateLanguages: stateLanguagesHi,
      extensionsRequests: extensionsRequestsHi,
      examconfiguration: examconfigurationHi,
      compensationPool: compensationPoolHi,
      examRequest: examRequestHi,
      interviewRequest: interviewRequestHi,
      offerLetterRequest: offerLetterRequestHi,
       dashboard: dashboardHi,  
    },
  },
  lng: "en",
  fallbackLng: "en",
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
    defaultVariables: {
      min: 2,
      max: 100,
    },
  },
});

export default i18n;
