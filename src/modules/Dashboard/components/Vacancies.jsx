import React from "react";
import { FaLayerGroup, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import "../../../style/css/Dashboard/Vacancies.css";
import useDashboardDownload from "../hooks/useDashboardDownload";
import { useTranslation } from "react-i18next";
import { FiDownload, FiX } from "react-icons/fi";
const Vacancies = ({ summary, filters = {}, onClose }) => {
  const { downloadReport } = useDashboardDownload();
  const totalVacancies = summary?.totalVacancies ?? 0;
  const filledVacancies = summary?.filledVacancies ?? 0;
  const unfilledVacancies = summary?.unfilledVacancies ?? 0;
  
  const { t } = useTranslation("dashboard");


  const fillRate =
    totalVacancies > 0
      ? ((filledVacancies / totalVacancies) * 100).toFixed(1)
      : 0;
  return (
    <div className="vacancy-widget">
      <div className="vacancy-header-wrapper">
        <div>
         <div className="vacancy-title">{t("vacancies")}</div>

<div className="vacancy-subtitle">
  {t("vacancy_fill_rate_overview")}
</div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <div className="dropdown">
            <button
              className="btn btn-outline-secondary dropdown-toggle"
              data-bs-toggle="dropdown"
            >
              <FiDownload className="me-2" />
              {t("export")}
            </button>

            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <button
                  className="dropdown-item d-flex align-items-center gap-2"
                  onClick={() =>
                    downloadReport({
                      filters,
                      extension: ".pdf",
                      reportScreen: "TOTAL_VACANCIES_METRICS",
                      fileName: "total-vacancies",
                    })
                  }
                >
                  <FiDownload size={14} />
                  {t("total_vacancies_pdf_report")}
                </button>
              </li>

              <li>
                <button
                  className="dropdown-item d-flex align-items-center gap-2"
                  onClick={() =>
                    downloadReport({
                      filters,
                      extension: ".xlsx",
                      reportScreen: "TOTAL_VACANCIES_METRICS",
                      fileName: "total-vacancies",
                    })
                  }
                >
                  <FiDownload size={14} />
                 
                 {t("total_vacancies_excel_report")}
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
                      reportScreen: "TOTAL_ONGOING_VACANCIES_METRICS",
                      fileName: "ongoing-vacancies",
                    })
                  }
                >
                  <FiDownload size={14} />
                {t("ongoing_vacancies_pdf_report")}
                </button>
              </li>

              <li>
                <button
                  className="dropdown-item d-flex align-items-center gap-2"
                  onClick={() =>
                    downloadReport({
                      filters,
                      extension: ".xlsx",
                      reportScreen: "TOTAL_ONGOING_VACANCIES_METRICS",
                      fileName: "ongoing-vacancies",
                    })
                  }
                >
                  <FiDownload size={14} />
                  {t("ongoing_vacancies_excel_report")}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="vacancy-cards">
        <div className="vacancy-stat-card vacancy-total">
          <div className="icon-box">
            <FaLayerGroup />
          </div>

          <div className="stat-value">
            {" "}
            {(summary?.totalVacancies ?? 0).toLocaleString("en-IN")}
          </div>
          <div className="stat-label">{t("total_vacancies")}</div>
        </div>

        <div className="vacancy-stat-card vacancy-filled">
          <div className="icon-box">
            <FaCheckCircle />
          </div>

          <div className="stat-value">
            {" "}
            {(summary?.filledVacancies ?? 0).toLocaleString("en-IN")}
          </div>
          <div className="stat-label">{t("filled_vacancies")}</div>
        </div>

        <div className="vacancy-stat-card vacancy-unfilled">
          <div className="icon-box">
            <FaTimesCircle />
          </div>

          <div className="stat-value">
            {(summary?.unfilledVacancies ?? 0).toLocaleString("en-IN")}
          </div>
          <div className="stat-label">{t("unfilled_vacancies")}</div>
        </div>
      </div>

      <div className="fill-rate-section">
        <div className="fill-rate-header">
          <span>{t("fill_rate")}</span>
          <span>{fillRate}%</span>
        </div>

        <div className="fill-progress">
          <div
            className="fill-progress-bar"
            style={{ width: `${fillRate}%` }}
          />
        </div>

        <div className="fill-rate-footer">
          <span>{filledVacancies} {t("filled")}</span>
          <span>{unfilledVacancies} {t("remaining")}</span>
        </div>
      </div>
    </div>
  );
};

export default Vacancies;
