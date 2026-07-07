import React from "react";
import { Table, Button } from "react-bootstrap";
import editIcon from "../../../../../assets/edit_icon.png";
import viewIcon from "../../../../../assets/view_icon.png";
import { useTranslation } from "react-i18next";

const EducationTable = ({
  data,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  onEdit,
  onDelete,
  onView,
}) => {
  const { t } = useTranslation(["education", "common"]);

  const indexOfLast = currentPage * pageSize;
  const indexOfFirst = indexOfLast - pageSize;
  const current = data.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(data.length / pageSize);

  const getVisiblePages = (currentPage, totalPages) => {
    let pages = [];
    let showStartEllipsis = false;
    let showEndEllipsis = false;

    if (totalPages <= 3) {
      pages = [...Array(totalPages)].map((_, i) => i + 1);
    } else {
      if (currentPage <= 2) {
        pages = [1, 2, 3];
        showEndEllipsis = true;
      } else if (currentPage >= totalPages - 1) {
        pages = [totalPages - 2, totalPages - 1, totalPages];
        showStartEllipsis = true;
      } else {
        pages = [currentPage - 1, currentPage, currentPage + 1];
        showStartEllipsis = true;
        showEndEllipsis = true;
      }
    }

    return { pages, showStartEllipsis, showEndEllipsis };
  };

  return (
    <>
      <div className="table-responsive">
        <Table hover className="user-table">
          <thead>
            <tr>
              <th>{t("education:s_no")}</th>
              <th>{t("education:education_level")}</th>
              <th>{t("education:course")}</th>
              <th>{t("education:specialization")}</th>
              <th style={{ textAlign: "center" }}>{t("common:actions")}</th>
            </tr>
          </thead>

          <tbody>
            {current.length ? (
              current.map((item, idx) => (
                <tr key={idx}>
                  <td>{indexOfFirst + idx + 1}</td>

                  <td>{item.educationLevel}</td>

                  <td>
                    {item.course}({item.qualificationCode})
                  </td>

               <td>
  {item.specialization
    .map(
      (s) =>
        `${s.name} (${s.code})${s.groupName ? ` - ${s.groupName}` : ""}`
    )
    .join(", ")}
</td>
                  <td>
                    <div className="action-buttons">
                      {/* VIEW */}
                      <Button
                        variant="link"
                        className="action-btn view-btn"
                        onClick={() => onView(item, idx)}
                      >
                        <img src={viewIcon} alt="View" className="icon-16" />
                      </Button>

                      {/* EDIT */}
                        {/* EDIT */}
                     {!["Any Graduation", "Any Post-Graduation"].includes(item.course) && (
  <Button
    variant="link"
    className="action-btn edit-btn"
    onClick={() => onEdit(item, idx)}
  >
    <img src={editIcon} alt="Edit" className="icon-16" />
  </Button>
)}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">
                  {t("education:no_data")}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* PAGINATION */}
      {data.length > 0 && (
        <div
          className="d-flex justify-content-end align-items-center gap-3 mt-2"
          style={{ marginBottom: "60px" }} // ✅ ADD THIS
        >
          {/* Page size */}
          <div className="d-flex align-items-center gap-2 user-actions">
            <span
              className="fw-semibold"
              style={{ color: "var(--bs-heading-color)" }}
            >
              {t("page_size")}
            </span>

            <select
              className="form-select form-select-sm"
              style={{ width: "90px" }}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {[5, 10, 15, 20, 25, 30].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Pagination */}
          <ul className="pagination mb-0">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                &laquo;
              </button>
            </li>

            {(() => {
              const { pages, showStartEllipsis, showEndEllipsis } =
                getVisiblePages(currentPage, totalPages);

              return (
                <>
                  {/* Leading ellipsis */}
                  {showStartEllipsis && (
                    <li className="page-item disabled">
                      <span className="page-link">…</span>
                    </li>
                  )}

                  {/* Page numbers */}
                  {pages.map((number) => (
                    <li
                      key={number}
                      className={`page-item ${currentPage === number ? "active" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(number)}
                      >
                        {number}
                      </button>
                    </li>
                  ))}

                  {/* Trailing ellipsis */}
                  {showEndEllipsis && (
                    <li className="page-item disabled">
                      <span className="page-link">…</span>
                    </li>
                  )}
                </>
              );
            })()}

            <li
              className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
            >
              <button
                className="page-link"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                &raquo;
              </button>
            </li>
          </ul>
        </div>
      )}
    </>
  );
};

export default EducationTable;
