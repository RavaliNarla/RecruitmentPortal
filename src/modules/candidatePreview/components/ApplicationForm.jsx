import React, { useState, useEffect, useRef } from "react";
import { Accordion, Card, OverlayTrigger, Tooltip } from "react-bootstrap";
import "../../../style/css/PreviewModal.css";
import viewIcon from "../../../assets/view_icon.png";
import DocumentViewerModal from "../components/DocumentViewerModal";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import jobPositionApiService from "../../jobPosting/services/jobPositionApiService";
import { getOrganizationPath } from "../../auth/services/organizationContextService";
import { toast } from "react-toastify";
import masterApiService from "../../master/services/masterApiService";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleExclamation,
  faTrash,
  faUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import CommentsModal from "./CommentsModal";
import digilockerVerified from "../../../assets/verified-icon.png";

// Utility functions for masking sensitive information
const maskEmail = (email) => {
  if (!email) return "-";
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "-";
  const maskedLocal =
    localPart.charAt(0) +
    "***" +
    (localPart.length > 1 ? localPart.charAt(localPart.length - 1) : "");
  return `${maskedLocal}@${domain}`;
};

const maskPhoneNumber = (phone) => {
  if (!phone) return "-";
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length < 4) return "***";
  return "*".repeat(cleanPhone.length - 4) + cleanPhone.slice(-4);
};

const maskAddress = (address) => {
  if (!address) return "-";
  if (address.length <= 10) return "*".repeat(address.length);
  return "*".repeat(Math.min(50, address.length - 4)) + address.slice(-4);
};

const ApplicationForm = ({
  previewData,
  candidateId,
  positionId,
  positionIds,
  applicationId,
  requisitionId,
  interviewScheduleId,
  isLocationWise,
  selectedDate,
  zonalVerificationStatus,
  examQualificationStatus,
  zonalSubmitBeforeDate,
  zonalHrComments,
  isFromInterview,
  isFromCompensationPool,
  page,
  pageSize,
  isCandidateWorkflow,
  dynamicFormData,
  dynamicFields,
}) => {
   console.log("test55 1", dynamicFormData, dynamicFields);
  const { t } = useTranslation(["preview", "common", "validation"]);

  const navigate = useNavigate();
  const { orgSlug } = useParams();
  const [activeAccordion, setActiveAccordion] = useState([
    "0",
    "1",
    "2",
    "3",
    "4",
  ]);
   const [exServicemen, setExServicemen] = useState([]);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [otherDocuments, setOtherDocuments] = useState([]);
  const [otherDocumentErrors, setOtherDocumentErrors] = useState({});
  const location = useLocation();
  const isInterviewView = location.state?.fromInterviewPool;
  const candidate = location.state?.candidate;

  const zonalInitRef = useRef(true);
  const submitRef = useRef(false);
  const zonalSubmitRef = useRef(false);
  const docActionRef = useRef(false);
  const isZonalAbsent =
    String(zonalVerificationStatus || "").toUpperCase() === "ZONAL_ABSENT";
  const [isLptRequired, setIsLptRequired] = useState("");
  const [lptType, setLptType] = useState("");

  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!isZonalHr) return;

    // Skip initial page load
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    // Clear radio selection whenever LPT changes
    setZonalDecision("");
  }, [lptType]);
  const [submitting, setSubmitting] = useState(false);
  const [zonalSubmitting, setZonalSubmitting] = useState(false);
  const formatDate = (date) => {
    if (!date) return "-";

    const [year, month, day] = date.split("-");
    return `${day}-${month}-${year}`;
  };
  const deriveShortlistStatus = () => {
    const ageOk = isCategorySatisfied("AGE");
    const workOk = isCategorySatisfied("WORK");
    const eduOk = isCategorySatisfied("EDUCATION");

    if (!ageOk || !workOk || !eduOk) return "NO";

    return "YES";
  };

  const isExamDisqualified = examQualificationStatus === "DISQUALIFIED";

  useEffect(() => {
    if (!candidate) return;

    // LPT Required
    const required =
      candidate?.lptRequired === true
        ? "YES"
        : candidate?.lptRequired === false
          ? "NO"
          : "";

    setIsLptRequired(required);

    // IMPORTANT
    if (required === "YES") {
      setLptType(candidate?.lptStatus || "");
    } else {
      setLptType("");
    }
  }, [candidate]);
  useEffect(() => {
  const fetchMasterData = async () => {
    try {
      const exServiceRes = await masterApiService.getExServiceCategories();
      console.log("exServiceRes", exServiceRes.data);
      setExServicemen(exServiceRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  fetchMasterData();
}, []);

  const [screeningForm, setScreeningForm] = useState({
    applicationId,
    candidateId,

    isWorkCriteriaMet: "",
    isAgeCriteriaMet: "",
    isEducationCriteriaMet: "",
    isShortlisted: "",

    workCriteriaRemark: "",
    ageCriteriaRemark: "",
    educationCriteriaRemark: "",
    finalScreeningRemark: "",
    zonalSubmitDate: "",

    submitBeforeDate: "",
    isScreeningCompleted: false,
    screeningId: null,
    lptExtensionDate: "",
  });
  const [screeningDocuments, setScreeningDocuments] = useState([]);

  const formatLocation = (a, b) => {
    const values = [a, b].filter((v) => v && v !== "-");
    return values.length ? values.join(", ") : "-";
  };

  const [screeningRemarks, setScreeningRemarks] = useState("");

  const user = useSelector((state) => state.user.user);
  const role = user?.role?.toLowerCase();

  const privileges = useSelector((state) => state.user.privileges);

  const isZonalHr = privileges?.Verification;
  const canCandidatePool = privileges?.["Candidate Pool"];
  const mapDecisionToStatus = (val) => {
    const v = String(val || "")
      .toUpperCase()
      .trim();

    if (v === "YES") return "VERIFIED";
    if (v === "NO") return "REJECTED";
    if (v === "PROVISIONALLY_APPROVED") return "PROVISIONALLY_APPROVED";

    console.warn("⚠️ Unknown zonalDecision:", val);
    return "PENDING";
  };

  const mapStatusToDecision = (status) => {
    const s = String(status || "")
      .toUpperCase()
      .trim();
    if (s === "VERIFIED") {
      return "YES";
    }
    if (s === "REJECTED" || s === "ZONAL_REJECTED") {
      return "NO";
    }
    if (s === "PROVISIONALLY_APPROVED") {
      return "PROVISIONALLY_APPROVED";
    }
    if (s === "PENDING") {
      return "";
    }
    return "";
  };

  useEffect(() => {
    if (!isZonalHr) return;
    if (zonalVerificationStatus) {
      setZonalDecision(mapStatusToDecision(zonalVerificationStatus));
    }

    const mappedDecision = mapStatusToDecision(zonalVerificationStatus);
    if (zonalSubmitBeforeDate) {
      setScreeningForm((prev) => ({
        ...prev,
        zonalSubmitDate: zonalSubmitBeforeDate.split("T")[0], // safe for input[type=date]
      }));
    }
    if (zonalHrComments) {
      setScreeningRemarks(zonalHrComments);
    }
    const isLptFailed = isLptRequired === "YES" && lptType === "FAIL";

    // FAIL -> clear YES only
    if (mappedDecision === "YES" && isLptFailed) {
      setZonalDecision("");
      return;
    } else if (mappedDecision === "NO" && !isLptFailed) {
      setZonalDecision("");
      return;
    }

    setZonalDecision(mappedDecision);
  }, [
    zonalVerificationStatus,
    zonalSubmitBeforeDate,
    zonalHrComments,
    isZonalHr,
    isLptRequired,
    lptType,
  ]);

  const handleZonalSubmit = async () => {
    if (zonalSubmitRef.current) return;
    // Helper Conditions
    const allVerified = areAllDocumentsVerified(); // returns true/false
    const anyRejected = hasAnyRejectedDocument(); // returns true/false
    const hasPendingDocument = documentRows.some((doc) => {
      const status = docStatusMap[doc.candidateDocumentId]?.status;
      return !status || status === "PENDING";
    });

    // -----------------------------------------
    // 1️⃣ Decision not selected
    // -----------------------------------------

    if (isZonalAbsent) {
      // toast.info("Zonal Absent candidates cannot be processed.");
      toast.info(t("zonal_absent_cannot_process"));
      return;
    }

    if (hasPendingDocument) {
      toast.warning(t("all_documents_must_verified"));
      return;
    }

    if (!zonalDecision) {
      // toast.error("Please select decision");
      toast.error(t("please_select_decision"));
      return;
    }
    if (zonalDecision === "NO") {
      if (!screeningRemarks?.trim()) {
        setErrors((prev) => ({
          ...prev,
          zonalComments: t("validation:required"),
        }));
        return;
      }
    }

    // -----------------------------------------
    // 2️⃣ All documents VERIFIED but decision = NO
    // -----------------------------------------

    if (zonalDecision === "NO" && allVerified) {
      toast.warning(t("all_documents_verified_select_other"));
      return;
    }

    // 3️⃣ Decision = YES but any document REJECTED
    if (zonalDecision === "YES" && anyRejected) {
      toast.error(t("cannot_approve_documents_rejected"));
      return;
    }

    const isLptFailed = isLptRequired === "YES" && lptType === "FAIL";

    if (zonalDecision === "YES" && isLptFailed) {
      toast.error(t("candidate_failed_lpt"));
      return;
    }

    // 4️⃣ Decision = PROVISIONAL but all VERIFIED
    if (zonalDecision === "PROVISIONALLY_APPROVED" && allVerified) {
      toast.warning(t("all_documents_verified_select_other"));
      return;
    }

    // 5️⃣ PROVISIONAL requires future date
    if (zonalDecision === "PROVISIONALLY_APPROVED") {
      let hasError = false;

      // 🔴 Comments mandatory
      if (!screeningRemarks?.trim()) {
        setErrors((prev) => ({
          ...prev,
          zonalComments: "This field is required",
        }));
        hasError = true;
      }

      // 🔴 Date mandatory
      if (!screeningForm.zonalSubmitDate) {
        setErrors((prev) => ({
          ...prev,
          zonalSubmitDate: "This field is required",
        }));
        hasError = true;
      } else {
        const selected = new Date(screeningForm.zonalSubmitDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selected <= today) {
          setErrors((prev) => ({
            ...prev,
            // zonalSubmitDate: "Must be future date"
            zonalSubmitDate: t("must_be_future_date"),
          }));
          hasError = true;
        }
      }

      if (hasError) return;
    }
    zonalSubmitRef.current = true;
    setZonalSubmitting(true);
    const toastId = toast.loading(t("submitting_zonal_verification"));

    try {
      const payload = {
        candidateId,
        applicationId,
        interviewScheduleId,
        zonalVerificationStatus: mapDecisionToStatus(zonalDecision),
        zonalSubmitBeforeDate: screeningForm.zonalSubmitDate || null,
        zonalHrComments: screeningRemarks || "",
        lptRequired: isLptRequired === "YES",

        lptStatus: isLptRequired === "YES" ? lptType : null,
      };

      await jobPositionApiService.submitOverallZonalVerification(payload);

      // -----------------------------------------
      // 7️⃣ Success Toast
      // -----------------------------------------
      toast.update(toastId, {
        // render: "Zonal verification submitted successfully",
        render: t("zonal_verification_success"),

        type: "success",
        isLoading: false,
        autoClose: 2000,
      });

      sessionStorage.setItem("fromZonalSubmit", "true");

      navigate(getOrganizationPath("/candidate-verification", orgSlug), {
        state: {
          requisition: location.state?.requisition,
          position: location.state?.position,
          preloadedCandidates: location.state?.candidates || [],
          selectedDate,
          page: page,
          pageSize: pageSize,
        },
      });
    } catch (err) {
      // -----------------------------------------
      // 8️⃣ Error Toast
      // -----------------------------------------
      toast.update(toastId, {
        // render: "Zonal submit failed. Please try again.",
        render: t("zonal_submit_failed"),
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });

      console.error(err);
    } finally {
      zonalSubmitRef.current = false;
      setZonalSubmitting(false);
    }
  };
  const data = previewData || {
    personalDetails: {},
    experienceSummary: {},
    documents: {},
    education: [],
    experience: [],
  };
  const CRITERIA_OPTIONS = ["YES", "NO", "DISCREPANCY"];

  const documentRows = [
    ...(screeningDocuments.length > 0
      ? screeningDocuments
      : data.documents?.allDocs || []),
  ].map((doc) => ({
    ...doc,
    candidateDocumentId: doc.candidateDocumentId ?? doc.id,
  }));

  const [photo, setPhoto] = useState();
  const [signature, setSignature] = useState();

  const allDocs =
    screeningDocuments.length > 0 ? screeningDocuments : data.documents.allDocs;

  const photoDoc = allDocs.find((doc) => doc.name === "Photo");
  const signatureDoc = allDocs.find((doc) => doc.name === "Signature");
  const birthDoc = allDocs.find((doc) => doc.name === "Birth Certificate");
  const tenthDoc = allDocs.find((doc) => doc.name === "10th Certificate");

  const photoUrl = photoDoc?.url || "";
  const signatureUrl = signatureDoc?.url || "";

  const normalizeCriteria = (val) => (val === "DEFAULT" ? "" : (val ?? ""));

  useEffect(() => {
    if (!photoUrl) return;

    const fetchPhoto = async () => {
      try {
        const res = await masterApiService.getAzureBlobSasUrl(
          photoUrl,
          "candidate"
        );

        const trimmedUrl = res.trim();

        setPhoto(trimmedUrl);
      } catch (err) {
        console.error(t("failed_load_candidate_photo"), err);
      }
    };

    fetchPhoto();
  }, [photoUrl]);

  useEffect(() => {
    if (!signatureUrl) return;

    const fetchPhoto = async () => {
      try {
        const res = await masterApiService.getAzureBlobSasUrl(
          signatureUrl,
          "candidate"
        );

        const trimmedUrl = res.trim();

        setSignature(trimmedUrl);
      } catch (err) {
        console.error(t("failed_load_candidate_photo"), err);
      }
    };

    fetchPhoto();
  }, [signatureUrl]);

  const [showViewer, setShowViewer] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docStatusMap, setDocStatusMap] = useState({});
  const [docStatusLoading, setDocStatusLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [zonalDecision, setZonalDecision] = useState("");

  const getDocCategory = (name = "") => {
    const n = name.toLowerCase().trim();

    // AGE
    if (
      n.includes("birth certificate") ||
      n.includes("10th") ||
      n.includes("10th certificate")
    ) {
      return "AGE";
    }

    // WORK
    if (/^work[_\s]?experience/i.test(name)) {
      return "WORK";
    }

    // EDUCATION
    if (
      n.includes("board") ||
      n.includes("intermediate") ||
      n.includes("graduation") ||
      n.includes("post-graduation") ||
      n.includes("doctorate") ||
      n.includes("professional")
    ) {
      return "EDUCATION";
    }

    return "OTHER";
  };

  const groupedDocs = documentRows.reduce((acc, doc) => {
    const category = getDocCategory(doc.name);

    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);

    return acc;
  }, {});

  const isCategorySatisfied = (category) => {
    const docs = groupedDocs[category] || [];
    if (category === "WORK" && docs.length === 0) {
      return true;
    }
    return docs.some((doc) => {
      const status = docStatusMap[doc.candidateDocumentId]?.status;
      return status === "VERIFIED";
    });
  };
  const exServiceName =
    exServicemen.find(
      (item) =>
        item.exServicemanCategoryId === previewData?.personalDetails?.exService,
    )?.exsCategoryName || "Not Applicable";
    console.log("exServiceName", exServiceName);

  const refreshDocStatuses = async () => {
    try {
      setDocStatusLoading(true);

      let res;

      if (isZonalHr) {
        res = await jobPositionApiService.getZonalDocumentStatus(applicationId);
      } else {
        res =
          await jobPositionApiService.getScreeningCommitteeStatus(
            applicationId
          );
      }

      const map = {};
      const documents = [];

      (res.data || []).forEach((item) => {
        const isZonal = isZonalHr;

        const status = isCandidateWorkflow
          ? item.docScreeningStatus || "PENDING"
          : item.zonalHrDocStatus || "PENDING";

        const comments = isZonal
          ? item.zonalHrDocComments
          : item.docScreeningComments;

        map[item.candidateDocumentId] = {
          status: status?.toUpperCase() || "PENDING",
          comments: comments,
          verificationId: item.verificationId,
        };

        documents.push({
          id: item.candidateDocumentId,
          candidateDocumentId: item.candidateDocumentId,
          name: item.displayName || item.fileName || "Document",
          fileName: item.fileName,
          url: item.fileUrl,
          status: status?.toUpperCase() || "PENDING",
          isValidationPending: item.isValidationPending,
          pendingChecks: item.pendingChecks || [],
          isDigilocker: item.isDigilocker,
        });
      });

      setDocStatusMap(map);
      setScreeningDocuments(documents);
    } catch (e) {
      console.error(t("failed_fetch_document_status"), e);
    } finally {
      setDocStatusLoading(false);
    }
  };

  useEffect(() => {
    if (!applicationId) return;

    const fetchDiscrepancyDetails = async () => {
      try {
        const res =
          await jobPositionApiService.getCandidateDiscrepancyDetails(
            applicationId
          );

        const data = res?.data;

        if (!data) return; // no record → fresh form

        setScreeningForm((prev) => ({
          ...prev,
          applicationId,
          candidateId,

          isWorkCriteriaMet: normalizeCriteria(data.isWorkCriteriaMet),
          isAgeCriteriaMet: normalizeCriteria(data.isAgeCriteriaMet),
          isEducationCriteriaMet: normalizeCriteria(
            data.isEducationCriteriaMet
          ),
          isShortlisted: normalizeCriteria(data.isShortlisted),

          workCriteriaRemark: data.workCriteriaRemark ?? "",
          ageCriteriaRemark: data.ageCriteriaRemark ?? "",
          educationCriteriaRemark: data.educationCriteriaRemark ?? "",
          finalScreeningRemark: data.finalScreeningRemark ?? "",
          submitBeforeDate: data.submitBeforeDate ?? "",
          screeningId: data.screeningId ?? null,
          isScreeningCompleted: data.isScreeningCompleted ?? false,
        }));
        setIsEligible(Boolean(data.isEligible));
      } catch (err) {
        console.error(t("failed_fetch_discrepancy_details"), err);
      }
    };

    fetchDiscrepancyDetails();
  }, [applicationId]);

  useEffect(() => {
    if (applicationId) {
      refreshDocStatuses();
    }
  }, [applicationId]);

  useEffect(() => {
    setScreeningForm((prev) => ({
      ...prev,
      applicationId,
      candidateId,
    }));
  }, [applicationId, candidateId]);

  const getStatusClass = (status) => {
    switch (status) {
      case "VERIFIED":
        return "verified-pill";
      case "REJECTED":
        return "rejected-pill";
      case "YET TO UPLOAD":
        return "yet-upload-pill";
      default:
        return "pending-pill";
    }
  };

  const handleRadioChange = (field, value) => {
    setScreeningForm((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };

      // Always clear respective remark when radio changes
      if (field === "isWorkCriteriaMet") updated.workCriteriaRemark = "";
      if (field === "isAgeCriteriaMet") updated.ageCriteriaRemark = "";
      if (field === "isEducationCriteriaMet")
        updated.educationCriteriaRemark = "";

      return updated;
    });

    setErrors((prev) => {
      const updated = { ...prev };

      delete updated[field];
      delete updated.workCriteriaRemark;
      delete updated.ageCriteriaRemark;
      delete updated.educationCriteriaRemark;

      return updated;
    });
  };

  const handleInputChange = (field, value) => {
    setScreeningForm((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };

      if (field === "isShortlisted") {
        updated.finalScreeningRemark = "";
      }

      return updated;
    });

    // shortlist selected -> clear eligible
    if (field === "isShortlisted" && (value === "YES" || value === "NO")) {
      setIsEligible(false);
    }

    setErrors((prev) => {
      const updated = { ...prev };

      delete updated[field];

      if (field === "isShortlisted") {
        delete updated.finalScreeningRemark;
      }

      return updated;
    });
  };

  const handleVerify = async (comment) => {
    if (!selectedDoc) return;
    if (docActionRef.current) return;
    docActionRef.current = true;

    try {
      if (isZonalHr) {
        await jobPositionApiService.verifyZonalDocument({
          candidateDocumentId: selectedDoc.candidateDocumentId,
          candidateId,
          applicationId,
          zonalHrDocStatus: "VERIFIED",
          zonalHrDocComments: "",
        });
      } else {
        // 🔹 DO NOT TOUCH — existing flow
        await jobPositionApiService.saveScreeningDecision({
          candidateDocumentId: selectedDoc.candidateDocumentId,
          candidateId,
          applicationId,
          docScreeningStatus: "VERIFIED",
          docScreeningComments: comment || "",
          verificationId: selectedDoc.verificationId,
        });
      }

      setShowViewer(false);
      setSelectedDoc(null);
      await refreshDocStatuses();
    } catch (err) {
      console.error(t("reject_failed"), err);
    } finally {
      docActionRef.current = false;
    }
  };

  const handleReject = async (comment) => {
    if (!selectedDoc) return;
    if (docActionRef.current) return;
    docActionRef.current = true;

    try {
      if (isZonalHr) {
        await jobPositionApiService.verifyZonalDocument({
          candidateDocumentId: selectedDoc.candidateDocumentId,
          candidateId,
          applicationId,
          zonalHrDocStatus: "REJECTED",
          zonalHrDocComments: comment || "",
        });
      } else {
        // 🔹 existing screening API — untouched
        await jobPositionApiService.saveScreeningDecision({
          candidateDocumentId: selectedDoc.candidateDocumentId,
          candidateId,
          applicationId,
          docScreeningStatus: "REJECTED",
          docScreeningComments: comment || "",
          verificationId: selectedDoc.verificationId,
        });
      }

      setShowViewer(false);
      setSelectedDoc(null);
      await refreshDocStatuses();
    } catch (err) {
      console.error(t("reject_failed"), err);
    } finally {
      docActionRef.current = false;
    }
  };

  const hasAdditionalDocuments = otherDocuments.some((doc) =>
    doc.documentName?.trim()
  );

  const hasAnyDiscrepancy =
    screeningForm.isWorkCriteriaMet === "DISCREPANCY" ||
    screeningForm.isAgeCriteriaMet === "DISCREPANCY" ||
    screeningForm.isEducationCriteriaMet === "DISCREPANCY" ||
    hasAdditionalDocuments;

  const hasYetToUpload = documentRows.some((doc) => !doc?.url);
  const shouldShowSubmitBefore = hasAnyDiscrepancy || hasYetToUpload;

  const validateForm = () => {
    const newErrors = {};

    // Criteria validations
    if (!screeningForm.isWorkCriteriaMet) {
      newErrors.isWorkCriteriaMet = t("please_select_option");
    }

    if (!screeningForm.isAgeCriteriaMet) {
      newErrors.isAgeCriteriaMet = t("please_select_option");
    }

    if (!screeningForm.isEducationCriteriaMet) {
      newErrors.isEducationCriteriaMet = t("please_select_option");
    }

    // Work criteria remark mandatory if NO or DISCREPANCY
    if (
      screeningForm.isWorkCriteriaMet === "NO" ||
      screeningForm.isWorkCriteriaMet === "DISCREPANCY"
    ) {
      if (!screeningForm.workCriteriaRemark?.trim()) {
        newErrors.workCriteriaRemark = t("required");
      }
    }

    // Age criteria remark mandatory if NO or DISCREPANCY
    if (
      screeningForm.isAgeCriteriaMet === "NO" ||
      screeningForm.isAgeCriteriaMet === "DISCREPANCY"
    ) {
      if (!screeningForm.ageCriteriaRemark?.trim()) {
        newErrors.ageCriteriaRemark = t("required");
      }
    }

    // Education criteria remark mandatory if NO or DISCREPANCY
    if (
      screeningForm.isEducationCriteriaMet === "NO" ||
      screeningForm.isEducationCriteriaMet === "DISCREPANCY"
    ) {
      if (!screeningForm.educationCriteriaRemark?.trim()) {
        newErrors.educationCriteriaRemark = t("required");
      }
    }

    if (hasMissingUploads) {
      toast.error("All mandatory documents must be uploaded");
      return false;
    }

    if (
      !disableShortlistedSection &&
      !screeningForm.isShortlisted &&
      !isEligible
    ) {
      newErrors.isShortlisted = t("please_select_option");
    }

    if (screeningForm.isShortlisted === "NO") {
      if (!screeningForm.finalScreeningRemark?.trim()) {
        newErrors.finalScreeningRemark = t("validation:required");
      }
    }

    // Submit before date validation
    if (shouldShowSubmitBefore) {
      if (!screeningForm.submitBeforeDate) {
        newErrors.submitBeforeDate = t("please_select_date");
      } else {
        const selectedDate = new Date(screeningForm.submitBeforeDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate <= today) {
          newErrors.submitBeforeDate = t("date_after_today");
        }
      }
    }

    const docErrors = {};

    otherDocuments.forEach((doc) => {
      if (!doc.documentName?.trim()) {
        docErrors[doc.id] = t("document_name_required");
      }
    });

    setOtherDocumentErrors(docErrors);

    if (Object.keys(docErrors).length > 0) {
      return false;
    }

    setErrors(newErrors);

    // valid if no errors
    return Object.keys(newErrors).length === 0;
  };

  const areAllDocumentsValidated = () => {
    return documentRows.every((doc) => {
      const status = docStatusMap[doc.candidateDocumentId]?.status;

      return status === "VERIFIED" || status === "REJECTED";
    });
  };

  const disableDocAction = isInterviewView || isFromInterview;

  const allDocsVerified = documentRows.length > 0 && areAllDocumentsValidated();

  const areAllDocumentsVerified = () => {
    if (!documentRows.length) return false;
    if (docStatusLoading) return false;

    return documentRows.every((doc) => {
      const status = docStatusMap[doc.candidateDocumentId]?.status;
      return status === "VERIFIED";
    });
  };

  const areAllCriteriaYes = () => {
    return (
      screeningForm.isWorkCriteriaMet === "YES" &&
      screeningForm.isAgeCriteriaMet === "YES" &&
      screeningForm.isEducationCriteriaMet === "YES"
    );
  };

  const hasMissingUploads = documentRows.some((doc) => !doc?.url);

  const disableEligibleCheckbox =
    !areAllCriteriaYes() ||
    // hasShortlistSelection ||
    hasAdditionalDocuments ||
    hasMissingUploads;

  const hasAnyRejectedDocument = () => {
    return documentRows.some((doc) => {
      const status = docStatusMap[doc.candidateDocumentId]?.status;
      return status === "REJECTED";
    });
  };

  const areAllCriteriaSelected =
    screeningForm.isWorkCriteriaMet &&
    screeningForm.isAgeCriteriaMet &&
    screeningForm.isEducationCriteriaMet;

  // Disable shortlist section if:
  // 1. Criteria are not all selected, OR
  // 2. ANY criteria is marked as DISCREPANCY
  // const disableShortlistedSection = !areAllCriteriaSelected || hasAnyDiscrepancy;
  const disableShortlistedSection =
    !areAllCriteriaSelected ||
    hasAnyDiscrepancy ||
    // disableShortlistBecauseEligible ||
    hasMissingUploads;

  // 2. NOT all criteria are marked as YES
  const disableYesOption = disableShortlistedSection || !areAllCriteriaYes();

  // NO option is disabled if shortlist section is disabled
  const disableNoOption = disableShortlistedSection;

  const handleFinalSubmit = async () => {
    console.log("Final submit clicked");
    if (submitRef.current) {
      return;
    }
    submitRef.current = true;
    setSubmitting(true);

    // ✅ Validation 1: Criteria must be selected
    const isValid = validateForm();
    if (!isValid) return;

    // ✅ Validation 2: Check document satisfaction for shortlist logic
    const isAgeValid = isCategorySatisfied("AGE");
    const isWorkValid = isCategorySatisfied("WORK");
    const isEducationValid = isCategorySatisfied("EDUCATION");

    let finalShortlist = screeningForm.isShortlisted;

    // If any criteria is DISCREPANCY,
    // shortlist must stay empty
    if (hasAnyDiscrepancy) {
      finalShortlist = "";
    } else if (!isAgeValid || !isEducationValid) {
      finalShortlist = "NO";
    }

    const payload = {
      ...screeningForm,
      isShortlisted: finalShortlist,
      isScreeningCompleted: true,
      isEligible,
      additionalDocumentNames: otherDocuments
        .map((doc) => doc.documentName?.trim())
        .filter(Boolean),
    };
    submitRef.current = true;
    try {
      await jobPositionApiService.saveCandidateDiscrepancyDetails(payload);
      // toast.success("Screening submitted successfully");
      toast.success(t("screening_submitted_success"));

      navigate(getOrganizationPath("/candidate-workflow", orgSlug), {
        state: {
          requisitionId,

          positionIds: Array.isArray(positionIds)
            ? positionIds.map((item) => item.positionId)
            : positionId
              ? [positionId]
              : [],
          page: page,
          pageSize: pageSize,
        },
      });
    } catch (err) {
      console.error(t("screening_submit_failed"), err);
      toast.error(t("submission_failed"));
    }
  };

  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  const minDate = getTomorrowDate();
  const minFutureDate = minDate;

  const handleDateChange = (e) => {
    let value = e.target.value;

    // Hard-stop: max length for YYYY-MM-DD is 10
    if (value.length > 10) {
      value = value.slice(0, 10);
    }

    // Always update state so typing doesn't feel broken
    setScreeningForm((prev) => ({
      ...prev,
      submitBeforeDate: value,
    }));

    // Clear error while typing
    setErrors((prev) => ({ ...prev, submitBeforeDate: undefined }));

    if (value.length < 10) return;

    // Enforce exact YYYY-MM-DD
    const strictDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!strictDateRegex.test(value)) {
      setErrors((prev) => ({
        ...prev,
        submitBeforeDate: t("invalid_date"),
      }));
      return;
    }

    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      setErrors((prev) => ({
        ...prev,
        submitBeforeDate: t("date_after_today"),
      }));
    }
  };

  useEffect(() => {
    if (!disableShortlistedSection || hasAnyDiscrepancy) return;
    if (screeningForm.isScreeningCompleted) return;
    setScreeningForm((prev) => ({
      ...prev,
      submitBeforeDate: "",
    }));

    setErrors((prev) => ({
      ...prev,
      submitBeforeDate: undefined,
    }));
  }, [
    disableShortlistedSection,
    screeningForm.isScreeningCompleted,
    hasAnyDiscrepancy,
  ]);

  useEffect(() => {
    const derived = deriveShortlistStatus();

    if (derived === "DEFAULT") {
      setScreeningForm((prev) => {
        if (prev.isScreeningCompleted) return prev;

        return {
          ...prev,
          isShortlisted: "",
          finalScreeningRemark: "",
        };
      });

      setErrors((prev) => ({
        ...prev,
        finalScreeningRemark: undefined,
        submitBeforeDate: undefined,
        isShortlisted: undefined,
      }));
    }
  }, [screeningForm.isAgeCriteriaMet, screeningForm.isEducationCriteriaMet]);

  useEffect(() => {
    if (!disableShortlistedSection) return;

    if (screeningForm.isShortlisted || screeningForm.finalScreeningRemark) {
      setScreeningForm((prev) => ({
        ...prev,
        isShortlisted: "",
        finalScreeningRemark: "",
      }));

      setErrors((prev) => ({
        ...prev,
        isShortlisted: undefined,
        finalScreeningRemark: undefined,
      }));
    }
  }, [disableShortlistedSection]);

  useEffect(() => {
    if (!hasMissingUploads) return;

    // clear eligible
    if (isEligible) {
      setIsEligible(false);
    }

    // clear shortlist
    if (screeningForm.isShortlisted || screeningForm.finalScreeningRemark) {
      setScreeningForm((prev) => ({
        ...prev,
        isShortlisted: "",
        finalScreeningRemark: "",
      }));

      setErrors((prev) => ({
        ...prev,
        isShortlisted: undefined,
        finalScreeningRemark: undefined,
      }));
    }
  }, [hasMissingUploads]);

  const allDocsAreVerified = areAllDocumentsVerified();
  const hasWorkDiscrepancy = (groupedDocs["WORK"] || []).some((doc) => {
    const status = docStatusMap[doc.candidateDocumentId]?.status;

    return (
      status === "REJECTED" || status === "PENDING" || status === "DISCREPANCY"
    );
  });
  const isOptionDisabled = (option, category) => {
    const categorySatisfied = isCategorySatisfied(category);
    if (category === "WORK" && option === "YES" && hasWorkDiscrepancy) {
      return true;
    }
    // Disable YES if no VERIFIED doc exists
    if (option === "YES" && !categorySatisfied) {
      return true;
    }

    // Disable DISCREPANCY if all docs verified
    if (option === "DISCREPANCY" && allDocsAreVerified) {
      return true;
    }

    return false;
  };

  useEffect(() => {
    const ageVerified = isCategorySatisfied("AGE");
    const workVerified = isCategorySatisfied("WORK");
    const educationVerified = isCategorySatisfied("EDUCATION");

    setScreeningForm((prev) => {
      let changed = false;

      const updated = { ...prev };

      // AGE
      const nextAge = ageVerified
        ? prev.isAgeCriteriaMet === "NO" ||
          prev.isAgeCriteriaMet === "DISCREPANCY"
          ? prev.isAgeCriteriaMet
          : "YES"
        : prev.isAgeCriteriaMet === "YES"
          ? ""
          : prev.isAgeCriteriaMet;

      if (nextAge !== prev.isAgeCriteriaMet) {
        updated.isAgeCriteriaMet = nextAge;
        changed = true;
      }

      // WORK
      const nextWork = workVerified
        ? prev.isWorkCriteriaMet === "NO" ||
          prev.isWorkCriteriaMet === "DISCREPANCY"
          ? prev.isWorkCriteriaMet
          : "YES"
        : prev.isWorkCriteriaMet === "YES"
          ? ""
          : prev.isWorkCriteriaMet;

      if (nextWork !== prev.isWorkCriteriaMet) {
        updated.isWorkCriteriaMet = nextWork;
        changed = true;
      }

      // EDUCATION
      const nextEducation = educationVerified
        ? prev.isEducationCriteriaMet === "NO" ||
          prev.isEducationCriteriaMet === "DISCREPANCY"
          ? prev.isEducationCriteriaMet
          : "YES"
        : prev.isEducationCriteriaMet === "YES"
          ? ""
          : prev.isEducationCriteriaMet;

      if (nextEducation !== prev.isEducationCriteriaMet) {
        updated.isEducationCriteriaMet = nextEducation;
        changed = true;
      }

      return changed ? updated : prev;
    });
  }, [docStatusMap]);

  useEffect(() => {
    const allVerified = areAllDocumentsVerified();

    if (zonalDecision === "YES" && !allVerified) {
      setZonalDecision("");
    }

    if (zonalDecision === "PROVISIONALLY_APPROVED" && allVerified) {
      setZonalDecision("");

      setScreeningForm((prev) => ({
        ...prev,
        zonalSubmitDate: "",
      }));

      setScreeningRemarks("");

      setErrors((prev) => ({
        ...prev,
        zonalSubmitDate: undefined,
        zonalComments: undefined,
      }));
    }
  }, [docStatusMap]);

  useEffect(() => {
    if (zonalInitRef.current) {
      zonalInitRef.current = false;
      return;
    }

    if (zonalDecision !== "PROVISIONALLY_APPROVED") {
      setScreeningForm((prev) => ({
        ...prev,
        zonalSubmitDate: "",
      }));

      setErrors((prev) => ({
        ...prev,
        zonalSubmitDate: undefined,
      }));
    }
  }, [zonalDecision]);

  const getPendingMessage = (doc) => {
    if (!doc?.pendingChecks?.length) {
      return t("validation_pending");
    }

    const formatted = doc.pendingChecks
      .map((item) => String(item).toUpperCase())
      .join(", ");

    // return `Please verify the correctness of ${formatted}`;
    return `${t("please_verify_correctness")} ${formatted}`;
  };

  const isBirthPending = birthDoc?.isValidationPending === true;
  const isTenthPending = tenthDoc?.isValidationPending === true;
  const isPending = isBirthPending || isTenthPending;

  const handleEligibleChange = (checked) => {
    setIsEligible(checked);

    // If eligible checked -> clear shortlist
    if (checked) {
      setScreeningForm((prev) => ({
        ...prev,
        isShortlisted: "",
        finalScreeningRemark: "",
      }));

      setErrors((prev) => ({
        ...prev,
        isShortlisted: undefined,
        finalScreeningRemark: undefined,
      }));
    }
  };

  const handleAddDocumentRow = () => {
    setOtherDocuments((prev) => [
      ...prev,
      {
        id: Date.now(),
        documentName: "",
        criteriaType: "",
      },
    ]);
  };

  const handleRemoveDocumentRow = (id) => {
    setOtherDocuments((prev) => {
      const updated = prev.filter((row) => row.id !== id);

      // Recalculate discrepancy after delete
      const hasAge = updated.some((r) => r.criteriaType === "Age");
      const hasWork = updated.some((r) => r.criteriaType === "Work");
      const hasEducation = updated.some((r) => r.criteriaType === "Education");

      setScreeningForm((current) => ({
        ...current,

        isAgeCriteriaMet:
          current.isAgeCriteriaMet === "DISCREPANCY" && !hasAge
            ? ""
            : current.isAgeCriteriaMet,

        isWorkCriteriaMet:
          current.isWorkCriteriaMet === "DISCREPANCY" && !hasWork
            ? ""
            : current.isWorkCriteriaMet,

        isEducationCriteriaMet:
          current.isEducationCriteriaMet === "DISCREPANCY" && !hasEducation
            ? ""
            : current.isEducationCriteriaMet,
      }));

      return updated;
    });
  };

  const handleOtherDocumentChange = (id, field, value) => {
    setOtherDocuments((prev) => {
      const updated = prev.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: value,
            }
          : row
      );

      // Get latest selected values
      const selectedRow = updated.find((r) => r.id === id);

      setScreeningForm((current) => {
        const next = { ...current };

        // Reset first
        const hasAge = updated.some((r) => r.criteriaType === "Age");
        const hasWork = updated.some((r) => r.criteriaType === "Work");
        const hasEducation = updated.some(
          (r) => r.criteriaType === "Education"
        );

        if (hasAge) {
          next.isAgeCriteriaMet = "DISCREPANCY";
        }

        if (hasWork) {
          next.isWorkCriteriaMet = "DISCREPANCY";
        }

        if (hasEducation) {
          next.isEducationCriteriaMet = "DISCREPANCY";
        }

        if (field === "documentName" && value.trim()) {
          setOtherDocumentErrors((prev) => {
            const updated = { ...prev };
            delete updated[id];
            return updated;
          });
        }

        return next;
      });

      return updated;
    });
  };

  useEffect(() => {
    if (disableYesOption && screeningForm.isShortlisted === "YES") {
      setScreeningForm((prev) => ({
        ...prev,
        isShortlisted: "",
        finalScreeningRemark: "",
      }));

      setErrors((prev) => ({
        ...prev,
        isShortlisted: undefined,
        finalScreeningRemark: undefined,
      }));
    }
  }, [disableYesOption]);

  const parseDate = (dateStr) => {
    if (!dateStr) return new Date(0);

    const [day, month, year] = dateStr.split("-");
    return new Date(year, month - 1, day);
  };

  return (
    <>
      <Accordion
        activeKey={activeAccordion}
        onSelect={(key) => setActiveAccordion(key)}
        alwaysOpen
        className="bob-accordion"
      >
        {/* === PERSONAL DETAILS === */}
        <Accordion.Item eventKey="0">
          <Accordion.Header>{t("personal_details")}</Accordion.Header>
          <Accordion.Body>
            <div className="personal-details-wrapper">
              <table className="table table-bordered bob-table w-100 mb-0">
                <tbody>
                  <tr>
                    <td className="fw-med" style={{ width: "20%" }}>
                      {t("full_name")}
                    </td>
                    <td className="fw-reg" colSpan={4} style={{ width: "60%" }}>
                      {data.personalDetails.fullName}
                    </td>
                    <td
                      rowSpan="3"
                      className="bob-photo-cell align-top text-center"
                      style={{ width: "20%", verticalAlign: "top" }}
                    >
                      <div className="photo-signature-wrapper">
                        {/* PHOTO BOX */}
                        <div className="photo-box">
                          {photo ? (
                            <img
                              src={photo}
                              alt="Applicant-photo"
                              className="photo-img"
                            />
                          ) : (
                            <div className="no-image">{t("no_photo")}</div>
                          )}
                        </div>

                        {/* SIGNATURE BOX */}
                        <div className="signature-box">
                          {signature ? (
                            <img
                              src={signature}
                              alt="Signature"
                              className="signature-img"
                            />
                          ) : (
                            <div className="no-image">{t("no_signature")}</div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td className="fw-med">{t("address")}</td>
                    <td className="fw-reg" colSpan={4}>
                      {role !== "recruiter"
                        ? maskAddress(data.personalDetails.address)
                        : data.personalDetails.address}
                    </td>
                  </tr>

                  <tr>
                    <td className="fw-med">{t("permanent_address")}</td>
                    <td className="fw-reg" colSpan={4}>
                      {role !== "recruiter"
                        ? maskAddress(data.personalDetails.permanentAddress)
                        : data.personalDetails.permanentAddress}
                    </td>
                  </tr>

                  <tr>
                    <td className="fw-med">{t("mobile")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {role !== "recruiter"
                        ? maskPhoneNumber(data.personalDetails.mobile)
                        : data.personalDetails.mobile}
                    </td>
                    <td className="fw-med">{t("email")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {role !== "recruiter"
                        ? maskEmail(data.personalDetails.email)
                        : data.personalDetails.email}
                    </td>
                  </tr>

                  <tr>
                    <td className="fw-med">{t("mother_name")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.personalDetails.motherName || "-"}
                    </td>
                    <td className="fw-med">{t("father_name")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.personalDetails.fatherName}
                    </td>
                  </tr>

                  <tr>
                    <td className="fw-med">{t("gender")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.personalDetails.gender_name || "-"}
                    </td>
                    <td className="fw-med">{t("religion")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.personalDetails.religion_name || "-"}
                    </td>
                  </tr>

                  <tr>
                    <td className="fw-med">{t("category")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.personalDetails.reservationCategory_name || "-"}
                    </td>
                    <td className="fw-med">{t("caste")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.personalDetails.caste || "-"}
                    </td>
                  </tr>

                  <tr>
                    <td className="fw-med">{t("dob")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.personalDetails.dob}
                    </td>
                    <td className="fw-med">{t("age_cutoff")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.personalDetails.age || "-"}
                    </td>
                  </tr>

                  <tr>
                    <td className="fw-med">{t("ex_serviceman")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {/* {data.personalDetails.exService || t("not_available")} */}
                      {exServiceName}
                    </td>
                    <td className="fw-med">{t("physical_disability")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.personalDetails.physicalDisability || "N"}
                    </td>
                  </tr>

                  <tr>
                    <td className="fw-med">{t("exam_center")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.personalDetails.examCenter}
                    </td>
                    <td className="fw-med">{t("nationality")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.personalDetails.nationality_name}
                    </td>
                  </tr>

                  <tr>
                    <td className="fw-med">{t("marital_status")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.personalDetails.maritalStatus_name}
                    </td>
                    <td className="fw-med">{t("spouse_name")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.personalDetails.spouseName || "-"}
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-med">{t("twin_sibling")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.personalDetails.isTwin === "Yes"
                        ? `Yes (${data.personalDetails.twinName})`
                        : "No"}
                    </td>
                    <td className="fw-med">{t("cibil_score")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.personalDetails.cibilScore}
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-med">{t("current_ctc")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.experienceSummary?.currentCtc || "-"}
                    </td>
                    <td className="fw-med">{t("expected_ctc")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.personalDetails.expectedCtc}
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-med">{t("language_proficiency")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.personalDetails.languages || "-"}
                    </td>

                    <td className="fw-med">{t("social_media_links")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.personalDetails.socialMediaProfileLink}
                    </td>
                  </tr>

                  <tr>
                    <td className="fw-med">{t("location_pref1")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {formatLocation(
                        data.personalDetails.locationPreference1,
                        data.personalDetails.statePreference1
                      )}
                    </td>
                    <td className="fw-med">{t("location_pref2")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {formatLocation(
                        data.personalDetails.locationPreference2,
                        data.personalDetails.statePreference2
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td className="fw-med">{t("location_pref3")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {formatLocation(
                        data.personalDetails.locationPreference3,
                        data.personalDetails.statePreference3
                      )}
                    </td>
                    <td className="fw-med">{t("language_preference")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.personalDetails.localLanguage || "-"}
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-med">{t("is_local_language_studied")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {isLocationWise
                        ? data.personalDetails.isLocalLanguageStudied
                        : "-"}
                    </td>
                  </tr>

                  <tr>
                    <td className="fw-med">{t("central_govt_employment")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.personalDetails.centralGovtEmployment || "No"}
                    </td>
                    <td className="fw-med">{t("lower_post")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.personalDetails.servingLowerPost || "No"}
                    </td>
                  </tr>

                  <tr>
                    <td className="fw-med">{t("riot_family_member")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.personalDetails.riotVictimFamily || "No"}
                    </td>
                    <td className="fw-med">{t("religious_minority")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.personalDetails.minority || "No"}
                    </td>
                  </tr>

                  <tr>
                    <td className="fw-med">{t("govt_service")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.personalDetails.servingInGovt || "No"}
                    </td>
                    <td className="fw-med">{t("disciplinary_action")}</td>
                    <td className="fw-reg" colSpan={2}>
                      {data.personalDetails.disciplinaryAction || "No"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Accordion.Body>
        </Accordion.Item>

        {/* === EDUCATION DETAILS === */}
        <Accordion.Item eventKey="1" className="edu-accordion">
          <Accordion.Header>{t("education_details")}</Accordion.Header>
          <Accordion.Body>
            <div>
              <table className="edu-table">
                <thead>
                  <tr>
                    <th style={{ width: "4rem" }}>{t("s_no")}</th>
                    <th>{t("education_level")}</th>
                    <th>{t("school_college")}</th>
                    <th>{t("university_name")}</th>
                    <th>{t("board")}</th>
                    <th>{t("specialization")}</th>
                    <th style={{ width: "10%" }}>{t("from_date")}</th>
                    <th style={{ width: "10%" }}>{t("to_date")}</th>
                    <th style={{ width: "9%" }}>{t("percentage_cgpa")}</th>
                  </tr>
                </thead>

                <tbody>
                  {/* {(data.education || []).map((edu, index) => ( */}
                  {(data.education || [])
                    .sort((a, b) => parseDate(b.endDate) - parseDate(a.endDate))
                    .map((edu, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{edu.educationLevel_name || "-"}</td>
                        <td>{edu.institution || "-"}</td>
                        <td>{edu.universityName || "-"}</td>
                        <td>{edu.mandatoryQualification_name || "-"}</td>
                        <td>{edu.specialization_name || "-"}</td>
                        <td>{edu.startDate || "-"}</td>
                        <td>{edu.endDate || "-"}</td>
                        <td>{edu.percentage || "-"}</td>
                      </tr>
                    ))}

                  {(!data.education || data.education.length === 0) && (
                    <tr>
                      <td colSpan="8" className="text-center">
                        {t("no_education")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Accordion.Body>
        </Accordion.Item>

        {/* === EXPERIENCE DETAILS === */}
        <Accordion.Item eventKey="2" className="exp-accordion">
          <Accordion.Header>{t("experience_details")}</Accordion.Header>

          <Accordion.Body>
            <table className="exp-table">
              <thead>
                <tr className="exp-table-header">
                  <th>{t("s_no")}</th>
                  <th>{t("organization")}</th>
                  <th>{t("post")}</th>
                  <th>{t("role")}</th>
                  <th>{t("from_date")}</th>
                  <th>{t("to_date")}</th>
                  <th>{t("duration")}</th>
                  <th>{t("work_profile")}</th>
                </tr>
              </thead>

              <tbody>
                {(data.experience || []).map((exp, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{exp.org}</td>
                    <td>{exp.designation}</td>
                    <td>{exp.department}</td>
                    <td>{exp.from}</td>
                    <td>{exp.to}</td>
                    <td>{exp.duration}</td>
                    <td>{exp.nature}</td>
                  </tr>
                ))}

                {(!data.experience || data.experience.length === 0) && (
                  <tr>
                    <td colSpan="8" className="text-center">
                      {t("no_experience")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Accordion.Body>
        </Accordion.Item>
        {dynamicFields?.fields?.length > 0 && (
          <Accordion.Item eventKey="4" className="additional-accordion">
            <Accordion.Header>Additional Details</Accordion.Header>

            <Accordion.Body>
              <table className="table table-bordered bob-table add-table">
                <thead>
                  <tr className="exp-table-header">
                    <th>Detail</th>
                    <th>Provided Information</th>
                  </tr>
                </thead>

                <tbody>
                  {dynamicFields.fields.map((field) => (
                    <tr key={field.id}>
                      <td style={{ width: "35%" }}>{field.label}</td>
                      <td>
                        {field.type === "date"
                          ? formatDate(dynamicFormData?.[field.id])
                          : (dynamicFormData?.[field.id] ?? "-")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Accordion.Body>
          </Accordion.Item>
        )}
        <Accordion.Item eventKey="3">
          <Accordion.Header>{t("documents_details")}</Accordion.Header>

          <Accordion.Body>
            <table className="bob-doc-table">
              {/* COLUMN WIDTH CONTROL */}
              <colgroup>
                <col style={{ width: "16.66%" }} />
                <col style={{ width: "16.66%" }} />
                <col style={{ width: "16.66%" }} />
                <col style={{ width: "16.66%" }} />
                <col style={{ width: "16.66%" }} />
                <col style={{ width: "16.66%" }} />
              </colgroup>

              <thead>
                <tr>
                  <th style={{ width: "44%" }}>{t("file_type")}</th>
                  <th className="px-3" style={{ width: "5%" }}>
                    {t("status")}
                  </th>
                  <th className="text-center" style={{ width: "1%" }}>
                    {t("action")}
                  </th>

                  <th style={{ width: "44%" }}>{t("file_type")}</th>
                  <th className="px-3" style={{ width: "5%" }}>
                    {t("status")}
                  </th>
                  <th className="text-center" style={{ width: "1%" }}>
                    {t("action")}
                  </th>
                </tr>
              </thead>

              <tbody>
                {Array.from({ length: Math.ceil(documentRows.length / 2) }).map(
                  (_, rowIndex) => {
                    const left = documentRows[rowIndex * 2];
                    const right = documentRows[rowIndex * 2 + 1];

                    const leftStatus = !left?.url
                      ? "YET TO UPLOAD"
                      : docStatusMap[left?.candidateDocumentId]?.status ||
                        "PENDING";

                    const rightStatus = !right?.url
                      ? "YET TO UPLOAD"
                      : docStatusMap[right?.candidateDocumentId]?.status ||
                        "PENDING";

                    return (
                      <tr key={rowIndex}>
                        {/* LEFT SIDE */}
                        {/* <td>{left?.name}</td> */}
                        <td>
                          {left?.name}

                          {left?.isDigilocker === true && (
                            <OverlayTrigger
                              placement="bottom"
                              overlay={
                                <Tooltip
                                  id={`tooltip-digilocker-${left.candidateDocumentId}`}
                                >
                                  Verified by Digilocker
                                </Tooltip>
                              }
                            >
                              <span className="mx-2">
                                <img
                                  src={digilockerVerified}
                                  alt="DigiLocker"
                                  style={{
                                    width: "16px",
                                    height: "16px",
                                    marginTop: "-2px",
                                  }}
                                />
                              </span>
                            </OverlayTrigger>
                          )}

                          {left?.isValidationPending && (
                            <OverlayTrigger
                              placement="bottom"
                              overlay={
                                <Tooltip
                                  id={`tooltip-left-${left.candidateDocumentId}`}
                                >
                                  {getPendingMessage(left)}
                                </Tooltip>
                              }
                            >
                              <span>
                                <FontAwesomeIcon
                                  icon={faCircleExclamation} // ⚠️ warning icon
                                  style={{ color: "#ffc107" }}
                                  className="ms-2"
                                />
                              </span>
                            </OverlayTrigger>
                          )}
                        </td>

                        <td>
                          {left && (
                            <span className={getStatusClass(leftStatus)}>
                              {t(leftStatus)}
                            </span>
                          )}
                        </td>

                        <td className="action-cell divider1">
                          {left && leftStatus !== "YET TO UPLOAD" && (
                            <>
                              <img
                                src={viewIcon}
                                alt={t("view")}
                                style={{
                                  cursor: disableDocAction
                                    ? "not-allowed"
                                    : "pointer",
                                  opacity: disableDocAction ? 0.4 : 1,
                                  pointerEvents: disableDocAction
                                    ? "none"
                                    : "auto",
                                  // marginLeft: "12px",
                                }}
                                onClick={() => {
                                  if (disableDocAction) return;

                                  setSelectedDoc({
                                    candidateDocumentId:
                                      left.candidateDocumentId,
                                    status: leftStatus,
                                    candidateId: previewData.candidateId,
                                    applicationId: previewData.applicationId,
                                    verificationId:
                                      docStatusMap[left.candidateDocumentId]
                                        ?.verificationId,
                                    docScreeningComments:
                                      docStatusMap[left.candidateDocumentId]
                                        ?.comments || "",
                                    name: left.name,
                                    fileUrl: left.url,
                                  });

                                  setShowViewer(true);
                                }}
                              />
                            </>
                          )}
                        </td>

                        {/* RIGHT SIDE */}
                        {/* <td>{right?.name || "-"}</td> */}
                        <td>
                          {right?.name || "-"}

                          {right?.isDigilocker === true && (
                            <OverlayTrigger
                              placement="bottom"
                              overlay={
                                <Tooltip
                                // id={`tooltip-digilocker-${right.candidateDocumentId}`}
                                >
                                  Verified by Digilocker
                                </Tooltip>
                              }
                            >
                              <span className="mx-2">
                                <img
                                  src={digilockerVerified}
                                  alt="DigiLocker"
                                  style={{
                                    width: "16px",
                                    height: "16px",
                                    marginTop: "-2px",
                                  }}
                                />
                              </span>
                            </OverlayTrigger>
                          )}

                          {right?.isValidationPending && (
                            <OverlayTrigger
                              placement="bottom"
                              overlay={
                                <Tooltip
                                  id={`tooltip-right-${right.candidateDocumentId}`}
                                >
                                  {getPendingMessage(right)}
                                </Tooltip>
                              }
                            >
                              <span>
                                <FontAwesomeIcon
                                  icon={faCircleExclamation}
                                  style={{ color: "#ffc107" }}
                                  className="ms-2"
                                />
                              </span>
                            </OverlayTrigger>
                          )}
                        </td>

                        <td>
                          {right && (
                            <span className={getStatusClass(rightStatus)}>
                              {t(rightStatus)}
                            </span>
                          )}
                        </td>

                        <td className="action-cell">
                          {right && rightStatus !== "YET TO UPLOAD" && (
                            <>
                              <img
                                src={viewIcon}
                                alt={t("view")}
                                style={{
                                  cursor: disableDocAction
                                    ? "not-allowed"
                                    : "pointer",
                                  opacity: disableDocAction ? 0.4 : 1,
                                  pointerEvents: disableDocAction
                                    ? "none"
                                    : "auto",
                                  // marginLeft: "12px",
                                }}
                                onClick={() => {
                                  if (disableDocAction) return;

                                  setSelectedDoc({
                                    candidateDocumentId:
                                      right.candidateDocumentId,
                                    candidateId: previewData.candidateId,
                                    applicationId: previewData.applicationId,
                                    verificationId:
                                      docStatusMap[right.candidateDocumentId]
                                        ?.verificationId,
                                    docScreeningComments:
                                      docStatusMap[right.candidateDocumentId]
                                        ?.comments || "",
                                    name: right.name,
                                    fileUrl: right.url,
                                  });

                                  setShowViewer(true);
                                }}
                              />
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </Accordion.Body>
        </Accordion.Item>

        {canCandidatePool &&
          !disableDocAction &&
          !isFromInterview &&
          !isFromCompensationPool && (
            <div className="card mt-3 border-0">
              <div className="d-flex gap-3 align-items-center border-bottom p-3">
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#162B75",
                  }}
                >
                  {t("additional_required_documents")}
                </label>
                <button
                  className="btn-submit-orange py-1 px-2"
                  style={{ height: "auto", fontSize: "0.75rem" }}
                  onClick={handleAddDocumentRow}
                >
                  + {t("add_document")}
                </button>
              </div>

              {otherDocuments.map((row) => (
                <div key={row.id} className="d-flex align-items-end gap-3 p-3">
                  <div style={{ flex: 1 }}>
                    <label
                      className="mb-1"
                      style={{
                        color: "#162B75",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                      }}
                    >
                      {t("document_name")}
                    </label>

                    <input
                      type="text"
                      className="form-control"
                      value={row.documentName}
                      onChange={(e) =>
                        handleOtherDocumentChange(
                          row.id,
                          "documentName",
                          e.target.value
                        )
                      }
                      style={{ minHeight: "auto", padding: "0.4rem 0.8rem" }}
                      placeholder={t("enter_document_name")}
                    />
                    {otherDocumentErrors[row.id] && (
                      <small className="text-danger fs-12">
                        {otherDocumentErrors[row.id]}
                      </small>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn-link p-0 mb-1"
                    onClick={() => handleRemoveDocumentRow(row.id)}
                  >
                    <FontAwesomeIcon
                      icon={faTrash}
                      style={{
                        color: "#ccc",
                        fontSize: "16px",
                      }}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}

        {/* ================= CRITERIA SECTION ================= */}
        {canCandidatePool &&
          !disableDocAction &&
          !isFromInterview &&
          !isFromCompensationPool && (
            <Card className="criteria-main-card">
              <div className="criteria-wrapper">
                {/* WORK CRITERIA */}
                <div className="criteria-card">
                  <label className="criteria-title">{t("work_criteria")}</label>

                  <div className="criteria-radio mb-0">
                    {CRITERIA_OPTIONS.map((option) => (
                      <label key={option} className={`radio-label`}>
                        <input
                          type="radio"
                          name="workCriteria"
                          checked={screeningForm.isWorkCriteriaMet === option}
                          onChange={() =>
                            handleRadioChange("isWorkCriteriaMet", option)
                          }
                          disabled={isOptionDisabled(option, "WORK")}
                        />
                        <span className="custom-radio"></span>
                        {t(option)}
                      </label>
                    ))}
                  </div>
                  {errors.isWorkCriteriaMet && (
                    <small className="text-danger fs-12">
                      {errors.isWorkCriteriaMet}
                    </small>
                  )}

                  <textarea
                    // type="text"
                    className="criteria-remark mt-2"
                    placeholder={t("work_remark")}
                    value={screeningForm.workCriteriaRemark}
                    onChange={(e) =>
                      handleInputChange("workCriteriaRemark", e.target.value)
                    }
                    maxLength={2000}
                    rows={4}
                    // disabled={screeningForm.isWorkCriteriaMet !== "DISCREPANCY"}
                  />
                  {errors.workCriteriaRemark && (
                    <small className="text-danger fs-12">
                      {errors.workCriteriaRemark}
                    </small>
                  )}
                </div>

                {/* AGE CRITERIA */}
                <div className="criteria-card">
                  <label className="criteria-title">{t("age_criteria")}</label>

                  <div className="criteria-radio mb-0">
                    {CRITERIA_OPTIONS.map((option) => (
                      <label
                        key={option}
                        className={`radio-label ${isOptionDisabled(option, "AGE") ? "disabled" : ""}`}
                      >
                        <input
                          type="radio"
                          name="ageCriteria"
                          checked={screeningForm.isAgeCriteriaMet === option}
                          onChange={() =>
                            handleRadioChange("isAgeCriteriaMet", option)
                          }
                          disabled={isOptionDisabled(option, "AGE")}
                        />
                        <span className="custom-radio"></span>
                        {t(option)}
                      </label>
                    ))}
                  </div>
                  {errors.isAgeCriteriaMet && (
                    <small className="text-danger fs-12">
                      {errors.isAgeCriteriaMet}
                    </small>
                  )}

                  <textarea
                    // type="text"
                    className="criteria-remark mt-2"
                    placeholder={t("age_remark")}
                    value={screeningForm.ageCriteriaRemark}
                    onChange={(e) =>
                      handleInputChange("ageCriteriaRemark", e.target.value)
                    }
                    maxLength={2000}
                    rows={4}
                    // disabled={screeningForm.isAgeCriteriaMet !== "DISCREPANCY"}
                  />
                  {errors.ageCriteriaRemark && (
                    <small className="text-danger fs-12">
                      {errors.ageCriteriaRemark}
                    </small>
                  )}
                </div>

                {/* EDUCATION CRITERIA */}
                <div className="criteria-card">
                  <label className="criteria-title">
                    {" "}
                    {t("education_criteria")}
                  </label>

                  <div className="criteria-radio mb-0">
                    {CRITERIA_OPTIONS.map((option) => (
                      <label
                        key={option}
                        className={`radio-label ${isOptionDisabled(option, "EDUCATION") ? "disabled" : ""}`}
                      >
                        <input
                          type="radio"
                          name="educationCriteria"
                          checked={
                            screeningForm.isEducationCriteriaMet === option
                          }
                          onChange={() =>
                            handleRadioChange("isEducationCriteriaMet", option)
                          }
                          disabled={isOptionDisabled(option, "EDUCATION")}
                        />
                        <span className="custom-radio"></span>
                        {t(option)}
                      </label>
                    ))}
                  </div>
                  {errors.isEducationCriteriaMet && (
                    <small className="text-danger fs-12">
                      {errors.isEducationCriteriaMet}
                    </small>
                  )}

                  <textarea
                    // type="text"
                    className="criteria-remark mt-2"
                    placeholder={t("education_remark")}
                    value={screeningForm.educationCriteriaRemark}
                    onChange={(e) =>
                      handleInputChange(
                        "educationCriteriaRemark",
                        e.target.value
                      )
                    }
                    maxLength={2000}
                    rows={4}
                    // disabled={screeningForm.isEducationCriteriaMet !== "DISCREPANCY"}
                  />
                  {errors.educationCriteriaRemark && (
                    <small className="text-danger fs-12">
                      {errors.educationCriteriaRemark}
                    </small>
                  )}
                </div>

                {/* FINAL REMARK */}
                <div
                  className={`criteria-card ${
                    disableShortlistedSection ? "criteria-disabled" : ""
                  }`}
                >
                  <label className="criteria-title">{t("shortlisted")}</label>

                  <div className="criteria-radio mb-0">
                    {["YES", "NO"].map((option) => {
                      const isDisabled =
                        (option === "YES" && disableYesOption) ||
                        (option === "NO" && disableNoOption);

                      return (
                        <label
                          key={option}
                          className={`radio-label ${isDisabled ? "disabled" : ""}`}
                        >
                          <input
                            type="radio"
                            name="shortlisted"
                            value={option}
                            checked={screeningForm.isShortlisted === option}
                            disabled={isDisabled}
                            onChange={() =>
                              handleInputChange("isShortlisted", option)
                            }
                          />
                          <span className="custom-radio"></span>
                          {option}
                        </label>
                      );
                    })}
                  </div>
                  {!disableShortlistedSection && errors.isShortlisted && (
                    <small className="text-danger fs-12">
                      {errors.isShortlisted}
                    </small>
                  )}

                  <textarea
                    // type="text"
                    className="criteria-remark mt-2"
                    placeholder={t("final_remark")}
                    value={screeningForm.finalScreeningRemark}
                    onChange={(e) =>
                      handleInputChange("finalScreeningRemark", e.target.value)
                    }
                    maxLength={2000}
                    rows={4}
                  />
                  {errors.finalScreeningRemark && (
                    <small className="text-danger fs-12">
                      {errors.finalScreeningRemark}
                    </small>
                  )}
                </div>
              </div>

              {/* ================= SUBMIT ROW ================= */}
              <div
                className={`criteria-submit-row ${
                  shouldShowSubmitBefore
                    ? "justify-content-between"
                    : "justify-content-end"
                }`}
              >
                {!isZonalHr && shouldShowSubmitBefore && (
                  <div className="d-grid">
                    <label className="submit-label">{t("submit_before")}</label>
                    <input
                      type="date"
                      className="criteria-date"
                      min={minDate}
                      value={screeningForm.submitBeforeDate}
                      onChange={handleDateChange}
                    />
                    {errors.submitBeforeDate && (
                      <small className="text-danger mt-1 fs-12">
                        {errors.submitBeforeDate}
                      </small>
                    )}
                  </div>
                )}

                {!isFromCompensationPool && (
                  <div className="d-flex">
                    <div className="d-flex align-items-center gap-2 me-4">
                      <input
                        type="checkbox"
                        checked={isEligible}
                        disabled={disableEligibleCheckbox}
                        onChange={(e) => handleEligibleChange(e.target.checked)}
                      />

                      <label
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "#162B75",
                          marginBottom: 0,
                          cursor: disableEligibleCheckbox
                            ? "not-allowed"
                            : "pointer",
                          opacity: disableEligibleCheckbox ? 0.6 : 1,
                        }}
                      >
                        {t("eligible")}?
                      </label>
                    </div>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#f47c2c",
                        cursor: "pointer",
                        alignContent: "center",
                        // textDecoration: "underline",
                      }}
                      className="me-4"
                      onClick={() => setShowCommentsModal(true)}
                    >
                      {t("view_all_comments")}
                      <FontAwesomeIcon
                        icon={faUpRightFromSquare}
                        style={{ fontSize: "12px" }}
                        className="ms-1"
                      />
                    </span>
                    <button
                      className="btn-submit-orange"
                      onClick={handleFinalSubmit}
                      disabled={
                        isExamDisqualified || submitting || zonalSubmitting
                      }
                      style={{
                        opacity: isExamDisqualified ? 0.5 : 1,
                        cursor: isExamDisqualified ? "not-allowed" : "pointer",
                      }}
                    >
                      {t("submit")}
                    </button>
                  </div>
                )}
              </div>
            </Card>
          )}
        {isZonalHr && (
          <Card className="criteria-main-card p-3 mb-3">
            <label className="criteria-title mb-3">{t("lpt_title")}</label>

            <div className="d-flex align-items-start gap-3 flex-wrap">
              {/* LPT REQUIRED */}
              <div style={{ width: "220px" }}>
                <label
                  className="submit-label mb-1"
                  style={{
                    whiteSpace: "nowrap",
                    fontSize: "13px",
                  }}
                >
                  {t("lpt_required")}
                </label>

                <select
                  className="form-select"
                  value={isLptRequired}
                  disabled={isZonalAbsent}
                  onChange={(e) => {
                    const value = e.target.value;

                    // clear ONLY during manual change
                    if (value === "" || value === "NO") {
                      setLptType("");
                      setZonalDecision("");
                    }

                    setIsLptRequired(value);
                  }}
                >
                  <option value="">select</option>
                  <option value="YES">YES</option>
                  <option value="NO">NO</option>
                </select>
              </div>

              {isLptRequired === "YES" && (
                <div style={{ width: "260px" }}>
                  <label
                    className="submit-label mb-1"
                    style={{
                      whiteSpace: "nowrap",
                      fontSize: "13px",
                    }}
                  >
                    {t("lpt_status")}
                  </label>

                  <select
                    className="form-select"
                    value={lptType}
                    disabled={isZonalAbsent}
                    onChange={(e) => {
                      setLptType(e.target.value);
                      setZonalDecision("");
                    }}
                  >
                    <option value="">Select</option>
                    <option value="PASS">Studied in Class X/XII</option>

                    {/* <option value="PASS">Pass</option> */}

                    <option value="FAIL">Fail</option>

                    <option value="EXTENSION_GRANTED">Extension Granted</option>
                  </select>
                </div>
              )}
            </div>
          </Card>
        )}

        {isZonalHr && !isInterviewView && (
          <Card
            className={`criteria-main-card p-3 ${
              isZonalAbsent ? "criteria-disabled" : ""
            }`}
          >
            <label className="criteria-title mb-2">
              {t("all_docs_verified_q")}
            </label>

            {/* RADIO OPTIONS — same pattern as Shortlisted */}
            <div className="criteria-radio mb-3">
              {["YES", "NO", "PROVISIONALLY_APPROVED"].map((opt) => {
                const isLptSelectionPending =
                  !isLptRequired || (isLptRequired === "YES" && !lptType);
                const isLptFailed =
                  isLptRequired === "YES" && lptType === "FAIL";

                const disableYes =
                  opt === "YES" && (!areAllDocumentsVerified() || isLptFailed);
                const disableNo = opt === "NO" && !isLptFailed;

                const disableProvisionallyApproved =
                  opt === "PROVISIONALLY_APPROVED" && areAllDocumentsVerified();

                const isDisabled =
                  isZonalAbsent ||
                  !allDocsVerified ||
                  disableProvisionallyApproved ||
                  disableYes ||
                  disableNo ||
                  isLptSelectionPending;

                return (
                  <label
                    key={opt}
                    className={`radio-label me-4 ${isDisabled ? "disabled" : ""}`}
                  >
                    <input
                      type="radio"
                      name="docVerified"
                      value={opt}
                      checked={zonalDecision === opt}
                      disabled={isDisabled}
                      onChange={(e) => {
                        const value = e.target.value;
                        setZonalDecision(value);
                        setErrors((prev) => ({
                          ...prev,
                          zonalSubmitDate: undefined,
                          zonalComments: undefined,
                        }));
                        if (value === "YES") {
                          setScreeningRemarks("");
                        }
                      }}
                    />
                    <span className="custom-radio"></span>
                    {t(opt)}
                  </label>
                );
              })}
            </div>

            {/* DATE */}

            {/* DATE - Show only for PROVISIONALLY APPROVED */}
            {zonalDecision === "PROVISIONALLY_APPROVED" && (
              <div className="submit-date-group d-flex flex-column">
                <label className="submit-label">{t("submit_before")}</label>

                <input
                  type="date"
                  className={`criteria-date ${errors.zonalSubmitDate ? "input-error" : ""}`}
                  min={minFutureDate}
                  value={screeningForm.zonalSubmitDate}
                  disabled={isZonalAbsent || !allDocsVerified}
                  onChange={(e) => {
                    setScreeningForm((prev) => ({
                      ...prev,
                      zonalSubmitDate: e.target.value,
                    }));

                    setErrors((prev) => ({
                      ...prev,
                      zonalSubmitDate: undefined,
                    }));
                  }}
                />

                {errors.zonalSubmitDate && (
                  <small className="text-danger mt-1">
                    {errors.zonalSubmitDate}
                  </small>
                )}
              </div>
            )}

            {/* REMARKS */}

            <div className="remarks-row">
              {/* LEFT SIDE */}
              <div className="remarks-left">
                <textarea
                  className={`remarks-box ${errors.zonalComments ? "input-error" : ""}`}
                  placeholder={t("enter_comments")}
                  rows={5}
                  disabled={docStatusLoading || isZonalAbsent}
                  value={screeningRemarks}
                  onChange={(e) => {
                    setScreeningRemarks(e.target.value);
                    setErrors((prev) => ({
                      ...prev,
                      zonalComments: undefined,
                    }));
                  }}
                />

                {/* Reserved error space */}
                <div className="remarks-error-space">
                  {errors.zonalComments && (
                    <small className="text-danger">
                      {errors.zonalComments}
                    </small>
                  )}
                </div>
              </div>

              {/* RIGHT SIDE */}
              <div className="remarks-button">
                <button
                  className="btn-submit-orange"
                  disabled={
                    docStatusLoading || isZonalAbsent || zonalSubmitting
                  }
                  onClick={handleZonalSubmit}
                >
                  {t("submit")}
                </button>
              </div>
            </div>
          </Card>
        )}
      </Accordion>
      <DocumentViewerModal
        show={showViewer}
        onHide={() => setShowViewer(false)}
        document={selectedDoc}
        onVerify={handleVerify}
        onReject={handleReject}
        isZonalAbsent={isZonalAbsent}
        isFromCompensationPool={isFromCompensationPool}
      />

      <CommentsModal
        show={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        applicationId={applicationId}
      />
    </>
  );
};

export default ApplicationForm;
