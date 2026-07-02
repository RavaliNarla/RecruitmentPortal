import React from "react";
import { useTranslation } from "react-i18next";
import "../../../style/css/Dashboard/StatCard.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const StatCard = ({ title, value, color, bgColor, iconBg, icon }) => {
  const { t } = useTranslation("dashboard");
  return (
    <div className="dashboard-stat-card" style={{ background: bgColor }}>
      <div className="dashboard-stat-icon" style={{ background: iconBg }}>
        <FontAwesomeIcon icon={icon} size="2x" style={{ color }} />
      </div>

      <div className="dashboard-stat-content">
        <h2 style={{ color }}>{value}</h2>

        <div className="stat-card-title">{title}</div>
<div className="view-details" style={{ color }}>
  {t("click_for_details")} →
</div>
      </div>
    </div>
  );
};

export default StatCard;
