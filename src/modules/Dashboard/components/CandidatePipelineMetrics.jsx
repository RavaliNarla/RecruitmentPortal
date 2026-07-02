import React from "react";
import {
  FiBriefcase,
  FiFileText,
  FiUserPlus,
  FiUserX,
  FiClock,
  FiCalendar,
  FiCheckCircle,
  FiAward,
  FiSend,
  FiThumbsUp,
  FiXCircle,
  FiUsers,
  FiDownload,
} from "react-icons/fi";

import { useTranslation } from "react-i18next";

import "../../../style/css/Dashboard/CandidatePipelineMetrics.css";
import useDashboardDownload from "../hooks/useDashboardDownload";




const CandidatePipelineMetrics = ({
  candidatePipeline = {},
  onCardClick,
  filters = {},
}) => {
  const { downloadReport } = useDashboardDownload();
const { t } = useTranslation("dashboard");

const metricConfig = [
  {
    key: "totalVacancies",
    label: t("total_vacancies"),
    icon: <FiBriefcase />,
    color: "red",
  },
  {
    key: "applicationsReceived",
    label: t("applications_received"),
    icon: <FiFileText />,
    color: "orange",
  },
  {
    key: "shortlistedCandidates",
    label: t("shortlisted_candidates"),
    icon: <FiUserPlus />,
    color: "blue",
  },
  {
    key: "rejectedCandidates",
    label: t("rejected_candidates"),
    icon: <FiUserX />,
    color: "red",
  },
  {
    key: "pendingCandidates",
    label: t("pending_candidates"),
    icon: <FiClock />,
    color: "yellow",
  },
  {
    key: "interviewsScheduled",
    label: t("interviews_scheduled"),
    icon: <FiCalendar />,
    color: "purple",
  },
  {
    key: "interviewsCompleted",
    label: t("interviews_completed"),
    icon: <FiCheckCircle />,
    color: "green",
  },
  {
    key: "qualified",
    label: t("qualified"),
    icon: <FiAward />,
    color: "cyan",
  },
  {
    key: "offersSent",
    label: t("offers_sent"),
    icon: <FiSend />,
    color: "cyan",
  },
  {
    key: "offerAccepted",
    label: t("offer_accepted"),
    icon: <FiThumbsUp />,
    color: "green",
  },
  {
    key: "offerRejected",
    label: t("offer_rejected"),
    icon: <FiXCircle />,
    color: "red",
  },
  {
    key: "joined",
    label: t("joined"),
    icon: <FiUsers />,
    color: "green",
  },
];
const colorMap = {
  red: "rgb(225, 29, 72)",
  orange: "rgb(249, 115, 22)",
  blue: "rgb(37, 99, 235)",
  yellow: "rgb(245, 158, 11)",
  purple: "rgb(139, 92, 246)",
  green: "rgb(16, 185, 129)",
  cyan: "rgb(8, 145, 178)",
};

  return (
    <div className="pipeline-wrapper mb-4">
      {/* <div className="pipeline-header">
        <div className="pipeline-header-icon">
          <FiBriefcase />
        </div>
        <div className="candidate-header-wrapper">
          <div>
            <h2>Candidate Pipeline Metrics</h2>
            <p>Comprehensive candidate journey statistics</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="dropdown">
              <button
                className="btn btn-outline-secondary dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                <FiDownload className="me-2" />
                Export
              </button>

              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <button
                    className="dropdown-item d-flex align-items-center gap-2"
                    onClick={() =>
                      downloadReport({
                        filters,
                        extension: ".pdf",
                        reportScreen: "TOTAL_CANDIDATES_JOINED_METRICS",
                        fileName: "total-candidate-joined",
                      })
                    }
                  >
                    <FiDownload size={14} />
                    Total Candidate Joined PDF Report
                  </button>
                </li>

                <li>
                  <button
                    className="dropdown-item d-flex align-items-center gap-2"
                    onClick={() =>
                      downloadReport({
                        filters,
                        extension: ".xlsx",
                        reportScreen: "TOTAL_CANDIDATES_JOINED_METRICS",
                        fileName: "total-candidate-joined",
                      })
                    }
                  >
                    <FiDownload size={14} />
                    Total Candidate Joined Excel Report
                  </button>
                </li>

                <li>
                  <hr className="dropdown-divider" />
                </li>

                <li>
                  <button
                    className="dropdown-item d-flex align-items-center gap-2"
                    onClick={() =>
                      downloadReport({
                        filters,
                        extension: ".pdf",
                        reportScreen: "TOTAL_OFFER_METRICS",
                        fileName: "total-offer",
                      })
                    }
                  >
                    <FiDownload size={14} />
                    Total Offer PDF Report
                  </button>
                </li>

                <li>
                  <button
                    className="dropdown-item d-flex align-items-center gap-2"
                    onClick={() =>
                      downloadReport({
                        filters,
                        extension: ".xlsx",
                        reportScreen: "TOTAL_OFFER_METRICS",
                        fileName: "total-offer",
                      })
                    }
                  >
                    <FiDownload size={14} />
                    Total Offer Excel Report
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div> */}
      <div className="pipeline-header">
        <div className="pipeline-header-left">
          <div className="pipeline-header-icon">
            <FiBriefcase />
          </div>

          <div>
<h2>{t("candidate_pipeline_metrics")}</h2>

<p>{t("candidate_journey_statistics")}</p>
          </div>
        </div>

        <div className="pipeline-header-right">
          <div className="dropdown">
            <button
              className="btn btn-outline-secondary dropdown-toggle"
              data-bs-toggle="dropdown"
            >
              <FiDownload className="me-2" />
             {t("export")}
            </button>

            {/* dropdown menu */}
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <button
                  className="dropdown-item d-flex align-items-center gap-2"
                  onClick={() =>
                    downloadReport({
                      filters,
                      extension: ".pdf",
                      reportScreen: "TOTAL_CANDIDATES_JOINED_METRICS",
                      fileName: "total-candidate-joined",
                    })
                  }
                >
                  <FiDownload size={14} />
                 {t("total_candidate_joined_pdf_report")}
                </button>
              </li>

              <li>
                <button
                  className="dropdown-item d-flex align-items-center gap-2"
                  onClick={() =>
                    downloadReport({
                      filters,
                      extension: ".xlsx",
                      reportScreen: "TOTAL_CANDIDATES_JOINED_METRICS",
                      fileName: "total-candidate-joined",
                    })
                  }
                >
                  <FiDownload size={14} />
                 {t("total_candidate_joined_excel_report")}
                </button>
              </li>

              <li>
                <hr className="dropdown-divider" />
              </li>

              <li>
                <button
                  className="dropdown-item d-flex align-items-center gap-2"
                  onClick={() =>
                    downloadReport({
                      filters,
                      extension: ".pdf",
                      reportScreen: "TOTAL_OFFER_METRICS",
                      fileName: "total-offer",
                    })
                  }
                >
                  <FiDownload size={14} />
                 {t("total_offer_pdf_report")}
                </button>
              </li>

              <li>
                <button
                  className="dropdown-item d-flex align-items-center gap-2"
                  onClick={() =>
                    downloadReport({
                      filters,
                      extension: ".xlsx",
                      reportScreen: "TOTAL_OFFER_METRICS",
                      fileName: "total-offer",
                    })
                  }
                >
                  <FiDownload size={14} />
                {t("total_offer_excel_report")}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="pipeline-grid">
        {metricConfig.map((item, index) => (
          <div key={index} className={`metric-card ${item.color}`}>
            <div className={`metric-icon ${item.color}`}>{item.icon}</div>

            <div className="metric-value">
              {candidatePipeline[item.key] ?? 0}
            </div>

            <div className="metric-label">{item.label}</div>

            <div
              className="metric-details-hover"
              style={{
                color: colorMap[item.color],
                cursor: "pointer",
              }}
              onClick={() => onCardClick(item.key)}
            >
             {t("details")} →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CandidatePipelineMetrics;
