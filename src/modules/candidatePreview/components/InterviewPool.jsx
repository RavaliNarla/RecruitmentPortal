import React, { useState, useMemo } from "react";
import { Person, FileText } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import I_icon from "../../../assets/I_icon.png";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

export default function InterviewPool({
  selectedIds,
  setSelectedIds,
  candidates,
  selectedRequisitionId,
  selectedPositionId,
  requisition,
  position,
  onViewFile,
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  filters,
  totalElements,
  onOpenFeedback,
  onOpenZonalComments,
  canReschedule,
  onReschedule,
  allCandidatesForFilters,
}) {
  const { t } = useTranslation(["candidateWorkflow", "common"]);
  const navigate = useNavigate();
  const STATUS_CLASS_MAP = {
    SCHEDULED: "blue-bg",
    QUALIFIED: "bg-success",
    DISQUALIFIED: "bg-danger",
    PROVISIONALLY_APPROVED: "bg-secondary",
    ZONAL_ABSENT: "bg-info",
    INTERVIEW_ABSENT: "bg-info",
    PENDING: "bg-warning",
    ZONAL_REJECTED: "bg-danger",
    RESCHEDULED: "bg-warning",
    // OFFER_AWAITED: "bg-dark"
  };
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const formatStatus = (status = "") =>
    status
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const allSelected =
    allCandidatesForFilters?.length > 0 &&
    allCandidatesForFilters.every((c) => selectedIds.includes(String(c.id)));

  const toggleSelectAll = () => {
    if (!filters?.status?.length) {
      toast.error("Please select the status filter first");
      return;
    }

    const allIds = allCandidatesForFilters.map((c) => String(c.id));
    if (allSelected) {
      setSelectedIds([]);

      toast.info("Selection cleared");
    } else {
      setSelectedIds(allIds);

      toast.success(
        `${allIds.length} ${filters?.status?.[0]} candidates selected`
      );
    }
  };

  const toggleRow = (id) => {
    const normalizedId = String(id);

    setSelectedIds((prev) =>
      prev.includes(normalizedId)
        ? prev.filter((x) => x !== normalizedId)
        : [...prev, normalizedId]
    );
  };

  const sortedCandidates = useMemo(() => {
    if (!sortConfig.key) return candidates;

    return [...candidates].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [candidates, sortConfig]);

  return (
    <div className="card-body p-0 interview-pool">
      {canReschedule && (
        <div className="d-flex justify-content-end px-3 pt-3">
          <button className="btn btn-primary fs-14" onClick={onReschedule}>
           {t("candidateWorkflow:reschedule")}
          </button>
        </div>
      )}
      <table className="table table-hover mb-0">
        <thead className="bg-light">
          <tr>
            <th
              className="fs-14 fw-normal py-3"
              style={{ paddingLeft: "1rem" }}
            >
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
              />
            </th>
            <th className="fs-14 fw-normal py-3">
              {t("candidateWorkflow:candidate")}
            </th>
            {/* <th className="fs-14 fw-normal py-3" >{t("candidateWorkflow:position")}</th> */}
            <th className="fs-14 fw-normal py-3">{t("common:date")}</th>
            <th className="fs-14 fw-normal py-3">{t("common:time")}</th>
            <th className="fs-14 fw-normal py-3">
              {t("candidateWorkflow:zone")}
            </th>
            <th className="fs-14 fw-normal py-3">
              {t("candidateWorkflow:panel_details")}
            </th>
            <th className="fs-14 fw-normal py-3">
              {t("candidateWorkflow:interview_status")}
            </th>
            <th className="fs-14 fw-normal py-3">{t("common:score")}</th>
            <th className="text-center fs-14 fw-normal py-3">
              {t("common:actions")}
            </th>
          </tr>
        </thead>

        <tbody>
          {candidates.length === 0 ? (
            <tr>
              <td colSpan="8" className="text-center py-4 text-muted fs-14">
                {t("candidateWorkflow:no_candidates_interview_pool")}
              </td>
            </tr>
          ) : (
            sortedCandidates.map((c) => (
              <tr key={c.id}>
                <td
                  className="align-content-center"
                  style={{ paddingLeft: "1rem" }}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(String(c.id))}
                    onChange={() => toggleRow(String(c.id))}
                  />
                </td>

                <td className="align-content-center">
                  <p className="fw-normal fs-14 mb-0">{c.name}</p>
                  <p className="text-muted fs-12 mb-0">
                    {t("candidateWorkflow:application_number")}: {c.regNo}
                  </p>
                  <p className="text-muted fs-12 mb-0">
                    Position:{" "}
                    {position?.find((p) => p.positionId === c.positionId)
                      ?.positionName || "-"}
                  </p>
                </td>
                <td className="fs-14 align-content-center">{c.date}</td>
                <td className="fs-14 align-content-center">{c.time}</td>
                <td className="fs-14 align-content-center">{c.zone}</td>
                <td className="fs-14 align-content-center">{c.panel}</td>

                <td className="align-content-center">
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className={`round_badge px-3 py-1 fs-12 rounded text-white ${
                        STATUS_CLASS_MAP[c.status] || "bg-secondary"
                      }`}
                    >
                      {formatStatus(c.status)}
                    </span>

                    {["ZONAL_REJECTED", "PROVISIONALLY_APPROVED"].includes(
                      c.status
                    ) && (
                      <OverlayTrigger
                        placement="bottom"
                        overlay={
                          <Tooltip>
                            {t("candidateWorkflow:view_zonal_comments")}
                          </Tooltip>
                        }
                      >
                        <img
                          src={I_icon}
                          alt="zonal-comment"
                          className="infoicon-16 cursor-pointer"
                          onClick={() => onOpenZonalComments(c.zonalHrComments)}
                        />
                      </OverlayTrigger>
                    )}
                  </div>
                </td>

                <td className="fs-14 align-content-center">
                  <div className="d-flex align-items-center gap-2">
                    <span className="scorebg">
                      {c.score !== null &&
                      c.score !== undefined &&
                      c.score !== ""
                        ? c.score
                        : "-"}
                    </span>

                    <span
                      className="cursor-pointer text-danger fw-bold"
                      onClick={() => onOpenFeedback(c.id)}
                    >
                      <OverlayTrigger
                        placement="bottom"
                        overlay={
                          <Tooltip>
                            {t("candidateWorkflow:view_feedback_history")}
                          </Tooltip>
                        }
                      >
                        <img
                          src={I_icon}
                          alt="feedback"
                          className="infoicon-16"
                        />
                      </OverlayTrigger>
                    </span>
                  </div>
                </td>

                <td className="text-center align-content-center">
                  <OverlayTrigger
                    placement="bottom"
                    overlay={
                      <Tooltip id={`tooltip-${c.id}`}>
                        {t("common:view_profile")}
                      </Tooltip>
                    }
                  >
                    <Person
                      size={16}
                      className="me-3 cursor-pointer"
                      onClick={() =>
                        navigate("/candidate-preview", {
                          state: {
                            candidate: c,
                            applicationId: c.applicationId,
                            positionId: selectedPositionId,
                            requisitionId: selectedRequisitionId,
                            fromInterviewPool: true,
                            activeTab: "INTERVIEW_POOL",
                            candidatePositionId: c.positionId, // ADD THIS
                            // 🔥 IMPORTANT FIX
                            interviewPage: page,
                            interviewPageSize: pageSize,
                            page,
                            pageSize,
                            filters,
                            requisition: requisition
                              ? {
                                  requisition_code:
                                    requisition.requisition_code,
                                  requisition_title:
                                    requisition.requisition_title,
                                  registration_start_date:
                                    requisition.registration_start_date,
                                  registration_end_date:
                                    requisition.registration_end_date,
                                }
                              : null,
                            positionIds: selectedPositionId,

                            position:
                              position?.map?.((p) => ({
                                positionId: p.positionId,
                                positionName: p.positionName,
                                isLocationWise: p.isLocationWise,
                              })) || [],
                          },
                        })
                      }
                    />
                  </OverlayTrigger>
                  <OverlayTrigger
                    placement="bottom"
                    overlay={
                      <Tooltip id={`tooltip-${c.id}`}>
                        {t("common:view_resume")}
                      </Tooltip>
                    }
                  >
                    <FileText
                      size={16}
                      className="cursor-pointer"
                      onClick={() => onViewFile(c)}
                    />
                  </OverlayTrigger>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="d-flex justify-content-between align-items-center px-3 py-3 border-top">
        <div className="fs-14 text-muted">
          {t("candidateWorkflow:showing")} {page * pageSize + 1}–
          {Math.min((page + 1) * pageSize, totalElements)}{" "}
          {t("candidateWorkflow:of")} {totalElements}
        </div>

        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select fs-14"
            style={{ width: "90px" }}
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(0);
            }}
          >
            {[10, 20, 50].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
          >
            {t("candidateWorkflow:prev")}
          </button>

          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={(page + 1) * pageSize >= totalElements}
            onClick={() => onPageChange(page + 1)}
          >
            {t("candidateWorkflow:next")}
          </button>
        </div>
      </div>
    </div>
  );
}
