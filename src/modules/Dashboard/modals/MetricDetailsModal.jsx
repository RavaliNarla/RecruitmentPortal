import React from "react";
import { Modal } from "react-bootstrap";
import { FiDownload, FiX } from "react-icons/fi";
import "../../../style/css/Dashboard/MetricDetailsModal.css";
import { useTranslation } from "react-i18next";
import useDashboardDownload from "../hooks/useDashboardDownload";
const MetricDetailsModal = ({
  show,
  onClose,
  metric,
  dashboardData,
  filters = {},
}) => {
  const { downloadReport, downloading } = useDashboardDownload();

  const { t } = useTranslation("dashboard");

  if (!metric) return null;

  const reportScreenMap = {
    vacancies: "TOTAL_VACANCIES",
    requisitions: "TOTAL_REQUISITIONS",
    departments: "TOTAL_DEPARTMENTS",
    positions: "TOTAL_POSITIONS",
    ApprovedRequisitions: "APPROVED_REQUISITIONS",
    PendingRequisitions: "PENDING_REQUISITIONS",
    ActiveRequisitions: "ACTIVE_REQUISITIONS",
    ClosedRequisitions: "CLOSED_REQUISITIONS",
  };

  const modalConfig = {
    vacancies: {
      title: t("total_vacancies"),
      color: "#7C3AED",
      headerBg: "#FBF8FF",
      iconBg: "#F3EEFF",
      subtitle: t("detailed_breakdown_metrics"),
     columns: [
  t("requisition_id"),
  t("department"),
  t("position"),
  t("vacancies"),
],
      data: dashboardData?.totalVacancies || [],
    },

    requisitions: {
     title: t("total_requisitions"),
      color: "#003087",
      headerBg: "#FBFDFF",
      iconBg: "#EEF5FF",
      subtitle: t("detailed_breakdown_metrics"),
     columns: [
  t("requisition_id"),
  t("department"),
  t("total_positions"),
  t("vacancies"),
],
      data: dashboardData?.totalRequisitions || [],
    },

    departments: {
     title: t("total_departments"),
      color: "#C8102E",
      headerBg: "#FFF9F9",
      iconBg: "#FFF0F2",
      subtitle: t("detailed_breakdown_metrics"),
     columns: [
  t("department"),
  t("positions_count"),
],
      data: dashboardData?.totalDepartments || [],
    },

    positions: {
     title: t("total_positions"),
      color: "#059669",
      headerBg: "#F7FFFB",
      iconBg: "#ECFFF7",
     subtitle: t("detailed_breakdown_metrics"),
      columns: [
  t("requisition"),
  t("department"),
  t("position"),
  t("vacancies"),
  t("status"),
],
      data: dashboardData?.totalPositions || [],
    },
    ApprovedRequisitions: {
      title: t("approved_requisitions"),
      color: "#059669",
      headerBg: "#F7FFFB",

      iconBg: "#ECFFF7",
      subtitle: t("approved_requisition_details"),

      columns: [
  t("requisition"),
  t("total_positions"),
  t("vacancies"),
],
      data: dashboardData?.approvedRequisitionDetails || [],
    },
    PendingRequisitions: {
     title: t("pending_requisitions"),
      color: "#d97706",
      headerBg: "#FFF9F9",
      iconBg: "#FFF0F2",
      subtitle: t("pending_requisition_details"),
      columns: [
  t("requisition"),
  t("total_positions"),
  t("vacancies"),
],
      data: dashboardData?.pendingRequisitionDetails || [],
    },
    ActiveRequisitions: {
      title: t("active_requisitions"),
      color: "#0891b2",
      headerBg: "#F0F9FF",
      iconBg: "#E6F4FF",
      subtitle: t("active_requisition_details"),
      columns: [
  t("requisition"),
  t("total_positions"),
  t("vacancies"),
],
      data: dashboardData?.activeRequisitionDetails || [],
    },
    ClosedRequisitions: {
     title: t("closed_requisitions"),
      color: "#7c3aed",
      headerBg: "#F9F5FF",
      iconBg: "#F3EEFF",
      subtitle: t("closed_requisition_details"),
      columns: [
  t("requisition"),
  t("total_positions"),
],
      data: dashboardData?.closedRequisitionDetails || [],
    },
  };

  const config = modalConfig[metric];

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
          style={{
            background: config.headerBg,
          }}
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
            <span
              style={{
                color: "#64748b",
              }}
            >
              {config.subtitle}
            </span>
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

            <FiX size={24} style={{ cursor: "pointer" }} onClick={onClose} />
          </div>
        </div>

        <div className="p-4">
          <table className="metrictable">
            <thead>
              <tr>
                {config.columns.map((column) => (
                  <th
                    style={{
                      background: config.headerBg,
                    }}
                    key={column}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {!config.data || config.data.length === 0 ? (
                <tr>
                  <td
                    colSpan={config.columns.length}
                    className="text-center py-4"
                  >
                   {t("no_records_found")}
                  </td>
                </tr>
              ) : (
                config.data.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, idx) => (
                      <td key={idx}>{value ?? "-"}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default MetricDetailsModal;
