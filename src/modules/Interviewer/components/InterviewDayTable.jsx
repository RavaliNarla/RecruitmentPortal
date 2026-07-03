import React from "react";
import { Person, FileText } from "react-bootstrap-icons";
import { useNavigate,useParams  } from "react-router-dom";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { getOrganizationPath } from "../../auth/services/organizationContextService";
const InterviewDayTable = ({
  rows = [],
  totalElements = 0,
  page = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  toggleAbsent,
  updateComment,
  updateScore,
  onViewFile,

  //  ADD THESE
  requisition,
  position,
  selectedDate,
  allCandidatesRaw,
}) => {
  const { t } = useTranslation("interviewDay");

  const navigate = useNavigate();
const { orgSlug } = useParams();
  /*  NAVIGATION */
  const goToPreview = (row) => {
    const posId =
      position?.raw?.positionId ||
      position?.position?.positionId ||
      position?.positionId ||
      position?.value ||
      null;

   navigate(getOrganizationPath("/candidate-preview", orgSlug), {
      state: {
        from: "/candidate-interviewer",
        candidate: row.raw,
        candidateId: row.raw.candidateId,
        applicationId: row.raw.applicationId,
        interviewScheduleId: row.raw.interviewScheduleId,
        positionId: posId,
        selectedDate,
        candidates: allCandidatesRaw,
        requisition,
        position,
        page,
        pageSize,
      },
    });
  };

  const totalPages = Math.ceil(totalElements / pageSize);
  const start = totalElements === 0 ? 0 : page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, totalElements);

  return (
    <div className="verification-table-wrapper">
      {/* DESKTOP */}
      <div className="d-none d-md-block">
        <table className="table align-middle mb-0 verification-table">
          <thead className="fs-14">
            <tr>
              <th className="fs-14">{t("candidate")}</th>
              <th className="fs-14">{t("category")}</th>
              <th className="fs-14">{t("time")}</th>
              <th className="fs-14">{t("zone")}</th>
              <th className="fs-14 text-center">{t("absent")}</th>
              <th className="fs-14">{t("comment")}</th>
              <th className="fs-14" style={{ width: 120 }}>
                {t("score")}
              </th>
              <th className="fs-14 text-center">{t("actions")}</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-4 text-muted fs-15">
                  {t("no_candidates_found")}
                </td>
              </tr>
            )}

            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className="fw-semibold fs-14">{row.name}</div>
                  <div className="text-muted fs-12">
                    {t("reg_no")}: {row.regNo}
                  </div>
                </td>

                <td className="fs-14">{row.category || "-"}</td>
                <td className="fs-14">{row.time}</td>
                <td className="fs-14">{row.zone}</td>

                <td className="text-center">
                  <input
                    type="checkbox"
                    checked={row.absent}
                    disabled={
                      row.isZonalAbsent ||
                      (row.score !== "" &&
                        row.score !== null &&
                        row.score !== undefined)
                    }
                    onChange={() => toggleAbsent(row.id)}
                  />
                </td>

                <td>
                  <input
                    className="form-control form-control-sm fs-14"
                    value={row.comment || ""}
                    disabled={row.isZonalAbsent}
                    onChange={(e) => updateComment(row.id, e.target.value)}
                  />
                </td>

                <td>
               

                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="form-control form-control-sm fs-14"
                    value={row.score ?? ""}
                    disabled={row.absent || row.isZonalAbsent}
                    maxLength={3}
                    onChange={(e) => {
                      let v = e.target.value;

                      // Allow empty
                      if (v === "") {
                        updateScore(row.id, "");
                        return;
                      }

                      // Keep digits only
                      v = v.replace(/\D/g, "");

                      if (v === "") {
                        updateScore(row.id, "");
                        return;
                      }

                      const num = parseInt(v, 10);

                      if (isNaN(num)) {
                        updateScore(row.id, "");
                        return;
                      }

                      // 👉 ADD VALIDATION HERE
                      if (num > 100) {
                        toast.error("Score cannot be greater than 100"); // simple message
                        return;
                      }

                      updateScore(row.id, num);
                    }}
                    onPaste={(e) => {
                      const text = e.clipboardData.getData("text");
                      if (!/^\d+$/.test(text)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </td>

                {/* ✅ ACTIONS */}
                <td className="text-center">
                  <OverlayTrigger
                    placement="bottom"
                    overlay={<Tooltip>{t("view_profile")}</Tooltip>}
                  >
                    <span>
                      <Person
                        className="me-3 cursor-pointer"
                        size={16}
                        onClick={() => goToPreview(row)}
                      />
                    </span>
                  </OverlayTrigger>

                  <OverlayTrigger
                    placement="bottom"
                    overlay={<Tooltip>{t("view_resume")}</Tooltip>}
                  >
                    <span>
                      <FileText
                        className="cursor-pointer"
                        size={16}
                        onClick={() => onViewFile(row.raw)}
                      />
                    </span>
                  </OverlayTrigger>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="d-flex justify-content-between align-items-center px-3 py-2 table-footer">
        <span className="text-muted fs-13">
          {/* Showing {start}-{end} of {totalElements} */}
          {t("showing_entries", {
            start,
            end,
            total: totalElements,
          })}
        </span>

        <div className="d-flex gap-2">
          <select
            className="form-select form-select-sm"
            style={{ width: 70 }}
            value={pageSize}
            onChange={(e) => onPageSizeChange(+e.target.value)}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>

          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
          >
            {t("prev")}
          </button>

          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
          >
            {t("next")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewDayTable;
