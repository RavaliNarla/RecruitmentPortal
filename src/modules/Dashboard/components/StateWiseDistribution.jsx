import React from "react";
import { FiDownload, FiGrid } from "react-icons/fi";
import "./../../../style/css/Dashboard/StateWiseDistribution.css";
import { useTranslation } from "react-i18next";
import useDashboardDownload from "../hooks/useDashboardDownload";

const StateWiseDistribution = ({
  stateVacancyDistribution = [],
  filters = {},
  onClose,
}) => {
  const { downloadReport, downloading } = useDashboardDownload();

  const REPORT_SCREEN = "STATE_WISE_DISTRIBUTION";
  const totalVacancies = stateVacancyDistribution.reduce(
    (sum, row) => sum + row.total,
    0
  );

  const { t } = useTranslation("dashboard");

  const totalFilled = stateVacancyDistribution.reduce(
    (sum, row) => sum + row.filled,
    0
  );

  const totalUnfilled = stateVacancyDistribution.reduce(
    (sum, row) => sum + row.unfilled,
    0
  );

  const overallFillRate =
    totalVacancies > 0 ? ((totalFilled / totalVacancies) * 100).toFixed(1) : 0;
  return (
    <div className="state-distribution-card mb-4">
      <div className="state-header">
        <div className="state-title">
          <div className="title-icon">
            <FiGrid />
          </div>

          <div>
           <h3>{t("state_distribution")}</h3>
<p>{t("vacancies_distributed_by_state_city")}</p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <button
            className="pdf-btn btn btn-primary"
            disabled={downloading}
            onClick={() =>
              downloadReport({
                filters,
                extension: ".pdf",
                reportScreen: REPORT_SCREEN,
                fileName: "state-wise-distribution",
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
            disabled={downloading}
            onClick={() =>
              downloadReport({
                filters,
                extension: ".xlsx",
                reportScreen: REPORT_SCREEN,
                fileName: "state-wise-distribution",
              })
            }
          >
            <FiDownload />
            <span className="ms-2">
              {downloading ? t("downloading") : t("export_excel")}
            </span>
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="state-table">
          <thead>
            <tr>
             <th>{t("state")}</th>
              <th>{t("city")}</th>
             <th>{t("total_vacancies")}</th>
             <th>{t("filled_vacancies")}</th>
             <th>{t("unfilled_vacancies")}</th>
             <th>{t("fill_rate")}</th>
            </tr>
          </thead>

          <tbody>
            {stateVacancyDistribution.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  {t("no_records_found")}
                </td>
              </tr>
            ) : (
              stateVacancyDistribution.map((row) => (
                <tr key={row.state}>
                  <td className="state-name">{row.state}</td>

                  <td className="city-name">{row.city}</td>

                  <td className="total">{row.total}</td>

                  <td className="filled">{row.filled}</td>

                  <td className="unfilled">{row.unfilled}</td>

                  <td>
                    <div className="fill-rate">
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${row.rate}%`,
                            background: row.color,
                          }}
                        />
                      </div>

                      <span className="rate-value" style={{ color: "#0f3b96" }}>
                        {row.rate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="total-wrapper">
          <table className="state-total-table">
            <tbody>
              <tr className="total-row">
               <td>{t("total")}</td>
               <td className="city-name">{t("all_states")}</td>
                <td className="total">{totalVacancies}</td>
                <td className="filled">{totalFilled}</td>
                <td className="unfilled">{totalUnfilled}</td>
                <td>
                  <div className="fill-rate">
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${overallFillRate}%`,
                          background: "#0f3b96",
                        }}
                      />
                    </div>

                    <span className="rate-value" style={{ color: "#0f3b96" }}>
                      {overallFillRate}%
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StateWiseDistribution;
