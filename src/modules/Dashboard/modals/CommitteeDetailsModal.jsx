import React from "react";
import { Modal } from "react-bootstrap";
import { FiDownload, FiX } from "react-icons/fi";
import "../../../style/css/Dashboard/MetricDetailsModal.css";
import { useTranslation } from "react-i18next";
import useDashboardDownload from "../hooks/useDashboardDownload";

const CommitteeDetailsModal = ({
  show,
  onClose,
  metric,
  committeeData,
  filters = {},
}) => {
  const { downloadReport, downloading } = useDashboardDownload();

  const { t } = useTranslation("dashboard");

  if (!metric) return null;
  const reportScreenMap = {
  interviewPanel: "COMMITTEE_INTERVIEW_PANEL",
  screeningPanel: "COMMITTEE_INTERVIEW_PANEL",
  compensationPanel: "COMMITTEE_INTERVIEW_PANEL",
};

const committeeMap = {
  interviewPanel: "Interview",
  screeningPanel: "Screening",
  compensationPanel: "Compensation",
};
  const modalConfig = {
  interviewPanel: {
  title: t("interview_panel"),
  color: "#003B95",
  headerBg: "#EEF5FF",
  subtitle: t("interview_panel_member_details"),
  columns: [
    t("name"),
    t("total_positions_assigned"),
    t("number_of_days"),
  ],
  data: committeeData?.interviewPanels || [],
},

 screeningPanel: {
  title: t("screening_panel"),
  color: "#d90429",
  headerBg: "#FFF5F6",
  subtitle: t("screening_panel_member_details"),
  columns: [
    t("name"),
    t("total_positions_assigned"),
    t("number_of_days"),
  ],
  data: committeeData?.screeningPanels || [],
},

  compensationPanel: {
  title: t("compensation_panel"),
  color: "#059669",
  headerBg: "#F0FDF4",
  subtitle: t("compensation_panel_member_details"),
  columns: [
    t("name"),
    t("total_positions_assigned"),
    t("number_of_days"),
  ],
  data: committeeData?.compensationPanels || [],
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

            <span style={{ color: "#64748b" }}>{config.subtitle}</span>
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
    committee: committeeMap[metric],
    fileName: metric,
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
    committee: committeeMap[metric],
    fileName: metric,
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

export default CommitteeDetailsModal;
