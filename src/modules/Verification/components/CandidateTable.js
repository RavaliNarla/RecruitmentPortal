import React from "react";
import { Person, FileText } from "react-bootstrap-icons";
import { useNavigate,useParams } from "react-router-dom";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { getOrganizationPath } from "../../auth/services/organizationContextService";
const CandidateTable = ({
  requisition,
  position,
  isSelectionDone,
  filteredCandidates,
  toggleAbsent,
  selectedDate,
  allCandidatesRaw,
  onViewFile,
  totalElements,
  page,
  pageSize,
  totalPages,
  setPage,
  setPageSize,
  filter,
  searchText,
  activeStage,
}) => {
  const { t } = useTranslation(["verification", "common"]);

  const navigate = useNavigate();
const { orgSlug } = useParams();
  const goToPreview = (c) => {
     navigate(getOrganizationPath("/candidate-preview", orgSlug), {
      state: {
        candidate: c.raw,
        candidateId: c.raw.candidateId,
        applicationId: c.raw.applicationId,
        interviewScheduleId: c.raw.interviewScheduleId,

        positionId:
          position?.raw?.positionId ||
          position?.positionId ||
          position?.value ||
          null,

        selectedDate,
        candidates: allCandidatesRaw,
        requisition,
        position,
        page,
        pageSize,
        filter,
        searchText,
        activeStage,
        fromCandidateList: true,
      },
    });
  };

  return (
    <div className="verification-table-wrapper">
      {/* ================= DESKTOP TABLE ================= */}
      <div className="d-none d-md-block">
        <table className="table align-middle mb-0 verification-table">
          <thead className="fs-14">
            <tr>
              <th className="fs-14">{t("verification:candidate")}</th>
              <th className="fs-14">{t("common:category")}</th>
              <th className="fs-14">{t("common:time")}</th>
              <th className="fs-14">{t("verification:zone")}</th>
              <th className="fs-14 text-center">{t("verification:absent")}</th>
              <th className="fs-14">{t("verification:status")}</th>
              <th className="fs-14 text-center">{t("common:actions")}</th>
            </tr>
          </thead>

          <tbody>
            {/*  No selection OR No data after filter */}
            {(!isSelectionDone || filteredCandidates.length === 0) && (
              <tr className="no-candidates-row">
                <td colSpan="7" className="text-center py-4 text-muted fs-15">
                  {t("verification:no_candidates_found")}
                </td>
              </tr>
            )}

            {/*  Data available */}
            {isSelectionDone &&
              filteredCandidates.length > 0 &&
              filteredCandidates.map((c) => {
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="fw-semibold fs-14">{c.name}</div>
                      <div className="text-muted fs-12">
                        {t("verification:application_number")}: {c.regNo}
                      </div>
                    </td>

                    <td className="fs-14">{c.category}</td>
                    <td className="fs-14">{c.time}</td>
                    <td className="fs-14">{c.zone}</td>

                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={c.absent}
                        disabled={
                          c.status !== "Pending" && c.status !== "Zonal Absent"
                        }
                        onChange={() => toggleAbsent(c.id)}
                      />
                    </td>

                    <td>
                      <span
                        className={`status-badge ${c.status
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {c.status}
                      </span>
                    </td>

                    <td className="text-center">
                      {/* View Profile */}
                      <OverlayTrigger
                        placement="bottom"
                        overlay={<Tooltip>{t("common:view_profile")}</Tooltip>}
                      >
                        <span>
                          <Person
                            size={16}
                            className="me-3 cursor-pointer"
                            style={{ cursor: "pointer" }}
                            onClick={() => goToPreview(c)}
                          />
                        </span>
                      </OverlayTrigger>

                      {/* View Resume */}
                      <OverlayTrigger
                        placement="bottom"
                        overlay={<Tooltip>{t("common:view_resume")}</Tooltip>}
                      >
                        <span>
                          <FileText
                            size={16}
                            className="cursor-pointer"
                            onClick={() => onViewFile(c.raw)}
                          />
                        </span>
                      </OverlayTrigger>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE CARDS ================= */}
      <div className="d-block d-md-none">
        {!isSelectionDone || filteredCandidates.length === 0 ? (
          <div className="text-center py-4 text-muted">
            {t("verification:no_candidates_found")}
          </div>
        ) : (
          filteredCandidates.map((c) => {
            return (
              <div key={c.id} className="candidate-card">
                <div className="card-top">
                  <div>
                    <div className="fw-semibold fs-14">{c.name}</div>
                    <div className="text-muted fs-12">
                      {t("verification:application_number")}: {c.regNo}
                    </div>
                  </div>

                  <span
                    className={`status-badge ${c.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {c.status}
                  </span>
                </div>

                <div className="card-grid">
                  <div>
                    <label className="fs-12 text-muted">
                      {t("common:category")}
                    </label>

                    <div className="fs-14">{c.category}</div>
                  </div>

                  <div>
                    <label className="fs-12 text-muted">
                      {t("common:time")}
                    </label>
                    <div className="fs-14">{c.time}</div>
                  </div>

                  <div>
                    <label className="fs-12 text-muted">
                      {t("verification:zone")}
                    </label>
                    <div className="fs-14">{c.zone}</div>
                  </div>

                  <div>
                    <label className="fs-12 text-muted">
                      {t("verification:absent")}
                    </label>
                    <input
                      type="checkbox"
                      checked={c.absent}
                      disabled={
                        c.status !== "Pending" && c.status !== "Zonal Absent"
                      }
                      onChange={() => toggleAbsent(c.id)}
                    />
                  </div>
                </div>

                <div className="card-actions">
                  <Person
                    size={16}
                    className="me-3 cursor-pointer"
                    style={{ cursor: "pointer" }}
                    onClick={() => goToPreview(c)}
                  />

                  <FileText
                    size={16}
                    className="cursor-pointer"
                    onClick={() => onViewFile(c.raw)}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= FOOTER ================= */}
      <div className="d-flex justify-content-between align-items-center px-3 py-2 table-footer">
        {/* Showing text */}
        <span className="text-muted fs-13">
          {totalElements > 0
            ? `${t("verification:showing")} ${page * pageSize + 1}–${Math.min(
                (page + 1) * pageSize,
                totalElements
              )} ${t("verification:of")} ${totalElements}`
            : `${t("verification:showing")} 0`}
        </span>

        {/* Pagination controls */}
        <div className="d-flex gap-2 align-items-center">
          <select
            className="form-select form-select-sm"
            style={{ width: 80 }}
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>

          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={page === 0}
            onClick={() => setPage((prev) => prev - 1)}
          >
            {t("verification:prev")}
          </button>

          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((prev) => prev + 1)}
          >
            {t("verification:next")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CandidateTable;
