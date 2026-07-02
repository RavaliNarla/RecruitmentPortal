import React from "react";
import { Modal } from "react-bootstrap";
import { FiDownload, FiX } from "react-icons/fi";
import "../../../style/css/Dashboard/MetricDetailsModal.css";
import { useTranslation } from "react-i18next";
import useDashboardDownload from "../hooks/useDashboardDownload";
const CandidateMetricDetailsModal = ({
  show,
  onClose,
  metric,
  pipelineDetails = [],
  filters = {},
}) => {
  const { downloadReport, downloading } = useDashboardDownload();

  const { t } = useTranslation("dashboard");

  if (!metric) return null;
  const reportScreenMap = {
    totalVacancies: "CANDIDATE_PIPELINE_TOTAL_VACANCIES",
    applicationsReceived: "CANDIDATE_PIPELINE_APPLICATIONS_RECEIVED",
    shortlistedCandidates: "CANDIDATE_PIPELINE_SHORTLISTED_CANDIDATES",
    rejectedCandidates: "CANDIDATE_PIPELINE_REJECTED_CANDIDATES",
    pendingCandidates: "CANDIDATE_PIPELINE_PENDING_CANDIDATES",
    interviewsScheduled: "CANDIDATE_PIPELINE_INTERVIEWS_SCHEDULED",
    interviewsCompleted: "CANDIDATE_PIPELINE_INTERVIEWS_COMPLETED",
    qualified: "CANDIDATE_PIPELINE_QUALIFIED_CANDIDATES",
    offersSent: "CANDIDATE_PIPELINE_OFFERS_SENT",
    offerAccepted: "CANDIDATE_PIPELINE_OFFER_ACCEPTED",
    offerRejected: "CANDIDATE_PIPELINE_OFFER_REJECTED",
    joined: "CANDIDATE_PIPELINE_JOINED",
  };

  const modalConfig = {
    totalVacancies: {
    title: t("total_vacancies"),
      color: "#E11D48",
      headerBg: "#FFF8FA",
     subtitle: t("detailed_vacancy_breakdown"),
     columns: [
  t("requisition_id"),
  t("department"),
  t("position"),
  t("count"),
],
    },

    applicationsReceived: {
    title: t("applications_received"),
      color: "#F97316",
      headerBg: "#FFF8F2",
      subtitle: t("application_details"),
     columns: [
  t("requisition_id"),
  t("department"),
  t("position"),
  t("count"),
],
    },

    shortlistedCandidates: {
     title: t("shortlisted_candidates"),

      color: "#2563EB",
      headerBg: "#F5F9FF",
     subtitle: t("shortlisted_candidate_details"),

     columns: [
  t("requisition_id"),
  t("department"),
  t("position"),
  t("count"),
],
    },

    rejectedCandidates: {
      title: t("rejected_candidates"),
      color: "#EF4444",
      headerBg: "#FFF7F7",
      subtitle: t("rejected_candidate_details"),
     columns: [
  t("requisition_id"),
  t("department"),
  t("position"),
  t("count"),
],
    },

    pendingCandidates: {
     title: t("pending_candidates"),
      color: "#F59E0B",
      headerBg: "#FFFDF5",
      subtitle: t("pending_applications"),
      columns: [
  t("requisition_id"),
  t("department"),
  t("position"),
  t("count"),
],
    },

    interviewsScheduled: {
     title: t("interviews_scheduled"),
      color: "#8B5CF6",
      headerBg: "#FAF8FF",
     subtitle: t("interview_schedule_details"),
    columns: [
  t("requisition_id"),
  t("department"),
  t("position"),
  t("count"),
],
    },

    interviewsCompleted: {
     title: t("interviews_completed"),
      color: "#10B981",
      headerBg: "#F7FCF9",
     subtitle: t("completed_interviews"),
     columns: [
  t("requisition_id"),
  t("department"),
  t("position"),
  t("count"),
],
    },

    qualified: {
      title: t("qualified_candidates"),
      color: "#0891B2",
      headerBg: "#F5FCFF",
      subtitle: t("qualified_candidate_details"),
     columns: [
  t("requisition_id"),
  t("department"),
  t("position"),
  t("count"),
],
    },

    offersSent: {
     title: t("offers_sent"), 
      color: "#0891B2",
      headerBg: "#F5FCFF",
      subtitle: t("offer_details"),
     columns: [
  t("requisition_id"),
  t("department"),
  t("position"),
  t("count"),
],
    },

    offerAccepted: {
     title: t("offer_accepted"),
      color: "#10B981",
      headerBg: "#F7FCF9",
     subtitle: t("accepted_offers"),
     columns: [
  t("requisition_id"),
  t("department"),
  t("position"),
  t("count"),
],
    },

    offerRejected: {
    title: t("offer_rejected"),
      color: "#EF4444",
      headerBg: "#FFF8F8",
     subtitle: t("rejected_offers"),
      columns: [
  t("requisition_id"),
  t("department"),
  t("position"),
  t("count"),
],
    },

    joined: {
      title: t("joined_candidates"),
      color: "#10B981",
      headerBg: "#F7FCF9",
     subtitle: t("employee_joining_details"),
      columns: [
  t("requisition_id"),
  t("department"),
  t("position"),
  t("count"),
],
    },
  };
  const metricFieldMap = {
    totalVacancies: "vacancyCount",
    applicationsReceived: "applicationsReceived",
    shortlistedCandidates: "shortlistedCandidates",
    rejectedCandidates: "rejectedCandidates",
    pendingCandidates: "pendingCandidates",
    interviewsScheduled: "interviewsScheduled",
    interviewsCompleted: "interviewsCompleted",
    qualified: "qualified",
    offersSent: "offersSent",
    offerAccepted: "offerAccepted",
    offerRejected: "offerRejected",
    joined: "joined",
  };

  const config = modalConfig[metric];
  const metricField = metricFieldMap[metric];

  const tableData = pipelineDetails
    .filter((item) => (item[metricField] || 0) > 0)
    .map((item) => ({
      requisitionId: item.requisitionId,
      department: item.department,
      position: item.position,
      count: item[metricField],
    }));

  if (!config) return null;

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      size="xl"
      backdrop="static"
      className="metric-details-modal"
    >
      <Modal.Body className="p-0">
        <div
          className="metric-modal-header"
          style={{ background: config.headerBg }}
        >
          <div>
            <h4
              className="mb-1"
              style={{
                color: config.color,
                fontWeight: 700,
              }}
            >
              {config.title}
            </h4>

            <span>{config.subtitle}</span>
          </div>

          <div className="d-flex align-items-center gap-3">
            <button
              className="pdf-btn btn btn-primary"
              style={{
                background: "#fff",
                border: `1px solid ${config.color}20`,
                color: config.color,
              }}
              disabled={downloading}
              onClick={() =>
                downloadReport({
                  filters,
                  extension: ".pdf",
                  reportScreen: reportScreenMap[metric],
                })
              }
            >
              <FiDownload />
              <span className="ms-2">
              {downloading ? t("downloading") : t("export_pdf")}
              </span>
            </button>

            <button
              className="excel-btn btn btn-primary"
              style={{
                background: "#fff",
                border: `1px solid ${config.color}20`,
                color: config.color,
              }}
              disabled={downloading}
              onClick={() =>
                downloadReport({
                  filters,
                  extension: ".xlsx",
                  reportScreen: reportScreenMap[metric],
                })
              }
            >
              <FiDownload />
              <span className="ms-2">
              {downloading ? t("downloading") : t("export_excel")}
              </span>
            </button>

            <FiX size={22} onClick={onClose} style={{ cursor: "pointer" }} />
          </div>
        </div>

        <div className="p-4">
          <table className="metrictable">
            <thead>
              <tr>
                {config.columns.map((column) => (
                  <th
                    key={column}
                    style={{
                      background: config.headerBg,
                    }}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {tableData.length > 0 ? (
                tableData.map((row, index) => (
                  <tr key={index}>
                    <td>{row.requisitionId}</td>
                    <td>{row.department}</td>
                    <td>{row.position}</td>
                    <td>{Number(row.count).toLocaleString("en-IN")}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-4">
                   {t("no_records_found")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default CandidateMetricDetailsModal;
