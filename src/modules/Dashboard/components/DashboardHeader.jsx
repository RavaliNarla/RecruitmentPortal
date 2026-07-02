import React from "react";
import { useTranslation } from "react-i18next";

const DashboardHeader = () => {
  const { t } = useTranslation("dashboard");

  return (
    <div className="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 className="fw-bold mb-1 fs-17">
          {t("recruitment_dashboard")}
        </h2>
      </div>
    </div>
  );
};

export default DashboardHeader;