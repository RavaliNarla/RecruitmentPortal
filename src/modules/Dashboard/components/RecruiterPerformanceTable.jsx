import React, { useMemo, useState } from "react";
import {
  Card,
  Table,
  Form,
  InputGroup,
  Pagination,
  Button,
} from "react-bootstrap";
import { FiSearch, FiGrid, FiDownload } from "react-icons/fi";
import { useTranslation } from "react-i18next";

import "../../../style/css/Dashboard/RecruiterPerformanceTable.css";
import useDashboardDownload from "../hooks/useDashboardDownload";

const ROWS_PER_PAGE = 10;

const RecruiterPerformanceTable = ({
  recruiterPerformance = [],
  filters = {},
}) => {
  const { t } = useTranslation("dashboard");
  const { downloadReport, downloading } = useDashboardDownload();

  const REPORT_SCREEN = "RECRUITER_PERFORMANCE_TABLE";
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // First pages
    if (currentPage <= 2) {
      return [1, 2, 3, "...", totalPages];
    }

    // Last pages
    if (currentPage >= totalPages - 1) {
      return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    }

    // Middle pages
    return ["...", currentPage - 1, currentPage, currentPage + 1, "..."];
  };

  const filteredData = useMemo(() => {
    return recruiterPerformance.filter(
      (item) =>
        item.requisition?.toLowerCase().includes(search.toLowerCase()) ||
        item.position?.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, recruiterPerformance]);

  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  const getStatusClass = (status) => {
    switch (status) {
      case "APPROVED":
        return "status-active";
      case "L1 PENDING":
        return "status-pending";
      case "CLOSED":
        return "status-completed";
      default:
        return "";
    }
  };

  return (
    <Card className="recruiter-card mb-4">
      <Card.Body>
        <div className="recruiter-header">
          <div className="header-left">
            <div className="header-icon">
              <FiGrid />
            </div>

            <div>
             <h4>{t("recruiter_performance")}</h4>

<p>{t("recruitment_metrics")}</p>
            </div>
          </div>

          <div className="header-actions">
            <div className="search-container">
              <FiSearch className="search-icon" />

              <input
                type="text"
                className="search-input"
                placeholder={t("search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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
                    fileName: "recuirter-performance",
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
                    fileName: "recuirter-performance",
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
        </div>

        <div className="table-responsive">
          <Table className="recruiter-table">
            <thead>
              <tr>
                <th>{t("requisition")}</th>

<th>{t("position")}</th>

<th>{t("vacancy")}</th>

<th>{t("applied")}</th>

<th>{t("shortlisted")}</th>

<th>{t("interview")}</th>

<th>{t("qualified")}</th>

<th>{t("offer_sent")}</th>

<th>{t("offer_accepted")}</th>

<th>{t("joined")}</th>

<th>{t("extension")}</th>

<th>{t("cancelled")}</th>

<th>{t("offer_rejected")}</th>

<th>{t("waitlist")}</th>

<th>{t("status")}</th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="15" className="text-center py-4">
                   {t("no_records_found")}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => (
                  <tr key={index}>
                    <td className="req-cell">{row.requisition}</td>

                    <td>{row.position}</td>
                    <td>{row.vacancy}</td>

                    <td>
                      <div className="applied-cell">
                        {row.applied}
                        <div className="mini-progress">
                          <div
                            style={{
                              width: `${Math.min(row.applied / 6, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td>{row.shortlisted}</td>
                    <td>{row.interview}</td>
                    <td>{row.qualified}</td>

                    <td className="offer-sent">{row.offerSent}</td>

                    <td className="accepted">{row.offerAccepted}</td>

                    <td className="joined">{row.joined}</td>

                    <td className="extension">{row.extension}</td>

                    <td className="cancelled">{row.cancelled}</td>

                    <td className="rejected">{row.rejected}</td>

                    <td className="waitlist">{row.waitlist}</td>

                    <td>
                      <span className={getStatusClass(row.status)}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        <div className="pagination-wrapper">
          <span>
           {t("showing")} {paginatedData.length} {t("of")} {filteredData.length} {t("requisitions")}
          </span>

          <Pagination className="custom-pagination">
            <Pagination.Prev
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
            />

            {getPageNumbers().map((page, index) =>
              page === "..." ? (
                <Pagination.Ellipsis key={`ellipsis-${index}`} />
              ) : (
                <Pagination.Item
                  key={page}
                  active={page === currentPage}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Pagination.Item>
              )
            )}

            <Pagination.Next
              onClick={() =>
                currentPage < totalPages && setCurrentPage(currentPage + 1)
              }
            />
          </Pagination>
        </div>
      </Card.Body>
    </Card>
  );
};

export default RecruiterPerformanceTable;
