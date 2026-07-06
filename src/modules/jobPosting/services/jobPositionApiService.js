import { api, formDataApi } from "../../../core/service/apiService";

const jobPositionApiService = {
  getPositionsByRequisition: (requisitionId) =>
    api.get(
      `/recruiter/job-positions/get-job-position-by-requisition/${requisitionId}`
    ),

  getDraftPositionsByRequisition: (requisitionId) =>
    api.get(
      `/recruiter/job-positions/get-draft-job-position-by-requisition/${requisitionId}`
    ),

  getPositionById: (positionId) =>
    api.get(`/recruiter/job-positions/get-job-position-by-id/${positionId}`),

  /** ✅ multipart/form-data */
  createPosition: ({ dto, indentFile }) => {
    const formData = new FormData();

    formData.append(
      "jobPositionsDTO",
      new Blob([JSON.stringify(dto)], { type: "application/json" })
    );

    if (indentFile) {
      formData.append("indentFile", indentFile);
    }

    return api.post("/recruiter/job-positions/create-job-position", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getExaminationSummary: (positionIds = []) => {
    return api.post(
      "/recruiter/examination-marks/get-summary",

      positionIds,

      {
        headers: {
          "X-Client": "AzureAD",
        },
      }
    );
  },

  deleteExamSection(sectionId) {
    return api.delete(
      `/recruiter/examination-config/delete-section/${sectionId}`,
      {
        headers: {
          "X-Client": "AzureAD",
        },
      }
    );
  },

  validateExamConfiguration(positionId) {
    return api.get(
      `recruiter/examination-config/validate-exam-configuration?positionId=${positionId}`
    );
  },

  finalizeExamConfiguration: (payload) => {
    return api.post(
      "/recruiter/examination-config/submit-for-approval",

      payload,

      {
        headers: {
          "X-Client": "AzureAD",
        },
      }
    );
  },

  updatePosition: ({ dto, indentFile }) => {
    const formData = new FormData();

    // REQUIRED by backend
    formData.append(
      "jobPositionsDTO",
      new Blob([JSON.stringify(dto)], { type: "application/json" })
    );

    // optional
    if (indentFile) {
      formData.append("indentFile", indentFile);
    }

    return api.post("/recruiter/job-positions/update-job-position", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "X-Client": "AzureAD",
      },
    });
  },

  updateDraftPosition: ({
    requisitionId,
    parentPositionId,
    dto,
    indentFile,
  }) => {
    const formData = new FormData();

    formData.append(
      "jobPositionsDTO",
      new Blob([JSON.stringify(dto)], { type: "application/json" })
    );

    if (indentFile) {
      formData.append("indentFile", indentFile);
    }

    return api.put(
      `/recruiter/job-requisitions/${requisitionId}/edit-drafts/current/positions/${parentPositionId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          "X-Client": "AzureAD",
        },
      }
    );
  },

  deletePositionById: (positionId) =>
    api.delete(
      `/recruiter/job-positions/delete-job-position-by-id/${positionId}`
    ),

  getRequisitionById: (id) => api.get(`/recruiter/job-requisitions/${id}`),

  downloadTemplate: () =>
    api.get("/recruiter/job-positions/download-template", {
      responseType: "blob",
    }),

  bulkImport: (requisitionId, file) => {
    const formData = new FormData();
    formData.append("file", file);

    return api.post(
      `/recruiter/job-positions/create-bulk-positions/${requisitionId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          "X-Client": "AzureAD",
        },
      }
    );
  },

  // CANDIDATE SCREENING APIs
  getRequisitions: (name = "") =>
    api.get("/recruiter/job-requisitions/get-requisitions", {
      params: { name },
      headers: { "X-Client": "AzureAD" },
    }),

  getPositionsByReqId: ({ requisitionId, searchText = "" }) =>
    api.get("/recruiter/job-positions/get-positions", {
      params: { requisitionId, searchText },
      headers: { "X-Client": "AzureAD" },
    }),

  getCandidatesByPosition: (payload) =>
    api.post("/recruiter/candidate-screening/get-candidate-details", payload, {
      headers: { "X-Client": "AzureAD" },
    }),

  getScreeningCommitteeStatus: (applicationId) =>
    api.get(
      `/recruiter/document-verification/get-screening-committee/${applicationId}`,
      {
        headers: {
          "X-Client": "AzureAD",
        },
      }
    ),

  getZonalDocumentStatus: (applicationId) =>
    api.get(`/recruiter/zonal-verification/documents/${applicationId}`, {
      headers: {
        "X-Client": "AzureAD",
      },
    }),

  saveScreeningDecision: (payload) =>
    api.post(
      "/recruiter/document-verification/save-screening-committee/verify",
      payload,
      {
        headers: { "X-Client": "AzureAD" },
      }
    ),

  saveCandidateDiscrepancyDetails(payload) {
    return api.post(
      "/recruiter/candidate-screening/save-candidate-discrepancy-details",
      payload,
      {
        headers: {
          "X-Client": "AzureAD",
        },
      }
    );
  },

  submitOverallZonalVerification(payload) {
    return api.post(
      "/recruiter/zonal-verification/submit-overall-verification",
      payload
    );
  },

  verifyZonalDocument(payload) {
    return api.post("/recruiter/zonal-verification/verify-document", payload, {
      headers: {
        "X-Client": "AzureAD",
      },
    });
  },

  updateZonalAbsent(applicationId, isAbsent) {
    return api.post(
      `/recruiter/zonal-verification/update-absent-status`,
      null,
      {
        params: { applicationId, isAbsent },
        headers: {
          "X-Client": "AzureAD",
        },
      }
    );
  },

  getCandidateDiscrepancyDetails(applicationId) {
    return api.get(
      "/recruiter/candidate-screening/get-candidate-discrepancy-details",
      {
        params: { applicationId },
        headers: {
          "X-Client": "AzureAD",
        },
      }
    );
  },

  downloadInterviewScheduleTemplate: (positionId) =>
    api.get(`/recruiter/interview-scheduling/download-template/${positionId}`, {
      responseType: "blob",
      headers: {
        "X-Client": "AzureAD",
      },
    }),

  bulkScheduleInterviews: ({ file, applicationIds, positionId }) => {
    const formData = new FormData();

    // file (xlsx)
    formData.append("file", file);

    // model object → must be JSON blob
    formData.append(
      "model",
      new Blob(
        [
          JSON.stringify({
            applicationIds,
            positionId,
          }),
        ],
        { type: "application/json" }
      )
    );

    return api.post("/recruiter/interview-scheduling/bulk-schedule", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "X-Client": "AzureAD",
      },
    });
  },

  downloadCandidateDetails: (payload) =>
    api.post("/recruiter/candidate-details/download", payload, {
      responseType: "blob",
      headers: {
        "X-Client": "AzureAD",
      },
    }),

  generateRankListdownload: (positionId) => {
    return api.get(
      `/recruiter/candidate-offer/download-rank-list/${positionId}`,
      {
        responseType: "blob",
        headers: {
          "X-Client": "AzureAD",
        },
      }
    );
  },

  getL1Requisitions: ({ year, search, page, size, statuses }) =>
    api.get("/recruiter/job-requisitions/l1-requisitions", {
      params: { year, search, page, size, statuses },
      headers: { "X-Client": "AzureAD" },
    }),
  getL2Requisitions: ({ year, search, page, size, statuses }) =>
    api.get("/recruiter/job-requisitions/l2-requisitions", {
      params: { year, search, page, size, statuses },
      headers: { "X-Client": "AzureAD" },
    }),

  getRequisitionApprovalHistory: (requisitionId) =>
    api.get(
      `/recruiter/workflow-approval/get-requisition-approval-history-including-drafts/${requisitionId}`,
      {
        headers: {
          "X-Client": "AzureAD",
        },
      }
    ),
  getExamConfigurationsByPositions: (positionIds) =>
    api.get("/recruiter/examination-config/get-by-positions", {
      params: {
        positionIds,
      },

      headers: {
        "X-Client": "AzureAD",
      },
    }),

  saveConfiguration: (payload) =>
    api.post("/recruiter/examination-config/save-exam-config", payload, {
      headers: {
        "X-Client": "AzureAD",
      },
    }),
  approveRequisitions: ({ ids, postingStatus, comments }) =>
    api.post(
      "/recruiter/job-requisitions/approve-job-requisitions",
      {
        jobRequisitionIds: ids,
        postingStatus,
        comments,
      },
      {
        headers: {
          "X-Client": "AzureAD",
        },
      }
    ),

  sendToOfferPool(applicationIds) {
    return api.post(
      "/recruiter/candidate-offer/send-to-offer-pool",
      applicationIds,
      {
        headers: {
          "X-Client": "AzureAD",
        },
      }
    );
  },

  getOffersByPosition(positionId) {
    return api.get(`/recruiter/candidate-offer/get-offers/${positionId}`, {
      headers: {
        "X-Client": "AzureAD",
      },
    });
  },

  downloadAssignLocationExcel: (positionId) => {
    return api.get(
      `/recruiter/candidate-offer/download-assign-locations-excel/${positionId}`,
      {
        headers: {
          "X-Client": "AzureAD",
        },
        responseType: "blob",
      }
    );
  },

  downloadOffersZip(payload) {
    return api.post("/recruiter/candidate-offer/download-offers/zip", payload, {
      responseType: "blob",
    });
  },
  uploadSignedOffers(file, positionId) {
    const formData = new FormData();
    formData.append("file", file);

    return api.post(
      `/recruiter/candidate-offer/upload-signed-offers/${positionId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },
  uploadRanksExcel: (file) => {
    const formData = new FormData();
    formData.append("file", file);

    return formDataApi.post(
      "/recruiter/candidate-offer/upload-assign-locations-excel",
      formData,
      {
        headers: {
          "X-Client": "AzureAD",
        },
      }
    );
  },

  sendOffer(payload) {
    return api.post("/recruiter/candidate-offer/send-offer", payload);
  },

  sendOfferApproval(payload) {
    return api.post(
      "/recruiter/candidate-offer/send-offer/for-approval",
      payload
    );
  },

  generateOffers(payload) {
    return api.post("/recruiter/candidate-offer/generate-offers", payload);
  },

  getScreeningComments(applicationId) {
    return api.get(`/recruiter/screening-comments/${applicationId}`, {
      headers: {
        "X-Client": "AzureAD",
      },
    });
  },

  postScreeningComment(applicationId, payload) {
    return api.post(`/recruiter/screening-comments/${applicationId}`, payload, {
      headers: {
        "X-Client": "AzureAD",
      },
    });
  },

  getVacancyBreakdownByRequisition: (requisitionId) =>
    api.get(
      `/recruiter/job-positions/vacancy-breakdown/by-requisition/${requisitionId}`,
      {
        headers: {
          "X-Client": "AzureAD",
        },
      }
    ),

  getVacancyBreakdownByPosition: (positionId) =>
    api.get(
      `/recruiter/job-positions/vacancy-breakdown/by-position/${positionId}`,
      {
        headers: {
          "X-Client": "AzureAD",
        },
      }
    ),
};

export default jobPositionApiService;
