import React from "react";
import "../../../style/css/Dashboard/requisitionstatus.css";
import { useTranslation } from "react-i18next";
import { FiCheckCircle, FiClock, FiZap, FiXCircle } from "react-icons/fi";

const RequisitionStatus = ({ summary, onCardClick }) => {

  const { t } = useTranslation("dashboard");


const data = [
  {
    key: "ApprovedRequisitions",
    label: t("approved_requisitions"),
    value: (summary?.approvedRequisitions ?? 0).toLocaleString("en-IN"),
    color: "#16a34a",
    icon: <FiCheckCircle />,
  },
  {
    key: "PendingRequisitions",
    label: t("pending_requisitions"),
    value: (summary?.pendingRequisitions ?? 0).toLocaleString("en-IN"),
    color: "#d97706",
    icon: <FiClock />,
  },
  {
    key: "ActiveRequisitions",
    label: t("active_requisitions"),
    value: (summary?.activeRequisitions ?? 0).toLocaleString("en-IN"),
    color: "#0891b2",
    icon: <FiZap />,
  },
  {
    key: "ClosedRequisitions",
    label: t("closed_requisitions"),
    value: (summary?.closedRequisitions ?? 0).toLocaleString("en-IN"),
    color: "#7c3aed",
    icon: <FiXCircle />,
  },
];
  return (
    <div className="req-status-card">
      <div className="req-status-header">
      <h4>{t("requisition_status_overview")}</h4>
        <p>{t("current_status_breakdown")}</p>
      </div>

      <div className="req-status-grid">
        {data.map((item) => (
          <div
            key={item.label}
            className="req-status-item"
            style={{ borderTopColor: item.color }}
            onClick={() => onCardClick?.(item.key)}
          >
            <div
              className="req-status-icon"
              style={{
                color: item.color,
                background: `${item.color}15`,
              }}
            >
              {item.icon}
            </div>

            <h2 style={{ color: item.color }}>{item.value}</h2>

            <span>{item.label}</span>
            <div
              className="req-details-hover"
              style={{
                color: item.color,
              }}
            >
           {t("details")} →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RequisitionStatus;
