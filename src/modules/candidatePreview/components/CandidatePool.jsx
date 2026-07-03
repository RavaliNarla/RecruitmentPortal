import React, { useState, useMemo, useEffect } from "react";
import { useNavigate,useParams  } from "react-router-dom";
import { Person, FileText } from "react-bootstrap-icons";
import { OverlayTrigger, Popover, Tooltip } from "react-bootstrap";
import I_icon from "../../../assets/I_icon.png";
import { toast } from "react-toastify";

import { useTranslation } from "react-i18next";
import { getOrganizationPath } from "../../auth/services/organizationContextService";
export default function CandidatePool({
  candidates,
  selectedIds,
  setSelectedIds,
  onViewFile,
  loading,
  page,
  pageSize,
  filters,
  totalElements,
  onPageChange,
  onPageSizeChange,
  selectedPositionId,
  requisition,
  position,
  selectedRequisitionId,
  isRankEnabled,
  hasLocationData,
  allCandidatesForFilters,
  isMarksUploaded,
}) {
  const { t } = useTranslation(["candidateWorkflow", "common"]);
  const STATUS_CLASS_MAP = {
    Applied: "bg-secondary",
    Shortlisted: "bg-warning",
    Discrepancy: "bg-primary",
    Rejected: "bg-danger",
    Pending: "bg-info",
  };
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  /* ---------- Selection logic ---------- */
const { orgSlug } = useParams();
  const allSelected =
    allCandidatesForFilters?.length > 0 &&
    allCandidatesForFilters.every((c) => selectedIds.includes(c.id));

  useEffect(() => {
    if (!filters?.status?.length) {
      setSelectedIds([]);
    }
  }, [filters?.status]);

  const formatStatus = (status = "") =>
    status
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const toggleSelectAll = () => {
    if (!filters?.status?.length) {
      toast.error("Please select the status filter first");
      return;
    }

    const allIds = allCandidatesForFilters.map((c) => c.id);

    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allIds);

      toast.success(
        `${allIds.length} ${formatStatus(filters?.status?.[0])} candidate${allIds.length > 1 ? "s" : ""} selected`
      );
    }
  };

  const toggleRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /* ---------- Sorting logic ---------- */

  const requestSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
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

  const sortIcon = (key) => {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };
  const getLevelFrom100 = (val) => {
    if (val >= 75) return { label: "Strong", color: "green" };
    if (val >= 50) return { label: "Moderate", color: "orange" };
    return { label: "Weak", color: "red" };
  };

  const renderPopover = (c) => {
    const scoreMeta = getLevelFrom100(c.finalScore);
    return (
      <Popover className="rank-popover">
        <div className="rank-header">Candidate Analysis - {c.name}</div>

        <div className="rank-body">
          {/* 🔥 FINAL SCORE FIRST */}
          <div className="final-score">
            <p className="m-0 p-0 greenfin">Final Score</p>
            <div className="score">{c.finalScore}%</div>
            <div className={`score-label ${scoreMeta.color}`}>
              {scoreMeta.label}
            </div>
          </div>

          <hr />

          {/* ✅ SCORE BREAKDOWN */}
          <div className="section">
            <div className="section-header">
              <span>Score Details</span>
              <span className="weight-header">Weightage</span>
            </div>

            <div className="item">
              <span className="dot green"></span>

              <span className="label">
                Education: <strong>{c.educationScore}%</strong>
              </span>

              <span className="weight">25%</span>
            </div>

            <div className="item">
              <span className="dot green"></span>

              <span className="label">
                Experience: <strong>{c.experienceScore}%</strong>
              </span>

              <span className="weight">25%</span>
            </div>
          </div>

          <hr />

          {/* ⚠️ RISK SECTION */}
          <div className="section">
            <div className="section-header">
              <span>Areas for Review</span>
              <span className="weight-header">Weightage</span>
            </div>

            <div className="item">
              <span className="dot yellow"></span>

              <span className="label">
                Education Similarity: <strong>{c.educationSimilarity}%</strong>
              </span>

              <span className="weight">25%</span>
            </div>

            <div className="item">
              <span className="dot yellow"></span>

              <span className="label">
                Experience Similarity:{" "}
                <strong>{c.experienceSimilarity}%</strong>
              </span>

              <span className="weight">25%</span>
            </div>
          </div>
        </div>
      </Popover>
    );
  };
  return (
    <>
      {/* Desktop Table */}
      <div className="card-body p-0 d-none d-md-block">
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

              <th
                className="fs-14 fw-normal py-3"
                onClick={() => requestSort("name")}
                role="button"
              >
                {t("candidateWorkflow:candidate")} {sortIcon("name")}
              </th>

              <th className="fs-14 fw-normal py-3" role="button">
                {t("common:rank")}
              </th>

              <th
                className="fs-14 fw-normal py-3"
                onClick={() => requestSort("score")}
                role="button"
              >
                {t("common:score")} {sortIcon("score")}
              </th>

              <th
                className="fs-14 fw-normal py-3"
                onClick={() => requestSort("experienceMonths")}
                role="button"
              >
                {t("candidateWorkflow:experience")}{" "}
                {sortIcon("experienceMonths")}
              </th>

              <th className="fs-14 fw-normal py-3">
                {t("candidateWorkflow:status")}
              </th>

              {hasLocationData && (
                <th className="fs-14 fw-normal py-3">{t("common:location")}</th>
              )}

              <th className="fs-14 fw-normal py-3">{t("common:category")}</th>

              {isMarksUploaded && (
                <th className="fs-14 fw-normal py-3">
                  {t("common:total_marks_obtained")}
                </th>
              )}

              {isMarksUploaded && (
                <th className="fs-14 fw-normal py-3">
                  {t("common:exam_status")}
                </th>
              )}

              <th className="text-center fs-14 fw-normal py-3">
                {t("common:actions")}
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" className="text-center py-4">
                  {t("candidateWorkflow:loading_candidates")}
                </td>
              </tr>
            ) : sortedCandidates.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center py-4">
                  {t("candidateWorkflow:no_candidates_found")}
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
                      checked={selectedIds.includes(c.id)}
                      onChange={() => toggleRow(c.id)}
                    />
                  </td>

                  <td className="align-content-center">
                    <p className="fw-normal fs-14 mb-0">{c.name}</p>
                    <p className="text-muted fs-12 mb-0">
                      {t("candidateWorkflow:application_number")}:{" "}
                      {c.applicationNo}
                    </p>
                    <p className="text-muted fs-12 mb-0">
                        {t("candidateWorkflow:position")}:{" "}
                      {position?.find((p) => p.positionId === c.positionId)
                        ?.positionName || "-"}
                    </p>
                  </td>

                  <td className="align-content-center">
                    <p className="fw-normal fs-14 mb-0">{c?.rank || "-"}</p>
                  </td>

                  <td className="align-content-center">
                    <div className="rank-cell">
                      <span className="rank-value fw-normal fs-14 mb-0">
                        {c?.finalScore || "-"}
                      </span>

                      {isRankEnabled && (
                        <OverlayTrigger
                          trigger="click"
                          placement="auto"
                          rootClose
                          overlay={renderPopover(c)}
                          popperConfig={{
                            modifiers: [
                              {
                                name: "offset",
                                options: {
                                  offset: [0, 12],
                                },
                              },
                            ],
                          }}
                        >
                          <img
                            src={I_icon}
                            alt="info_icon"
                            className="info-icon"
                          />
                        </OverlayTrigger>
                      )}
                    </div>
                  </td>

                  <td className="align-content-center">
                    {/* <p className="fw-normal fs-14 mb-0">{(c.experienceMonths / 12).toFixed(1)} {t("candidateWorkflow:years")}</p> */}
                    <p className="fw-normal fs-14 mb-0">
                      {((c.experienceMonths ?? 0) / 12).toFixed(1)}{" "}
                      {t("candidateWorkflow:years")}
                    </p>
                  </td>

                  <td className="align-content-center">
                    <span
                      className={`round_badge px-3 py-1 fs-12 rounded text-white ${
                        STATUS_CLASS_MAP[c.status] || "bg-secondary"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>

                  {hasLocationData && (
                    <td className="align-content-center">
                      <p className="fw-normal fs-14 mb-0">{c.location}</p>
                    </td>
                  )}

                  <td className="align-content-center">
                    <p className="fw-normal fs-14 mb-0">{c.categoryName}</p>
                  </td>

                  {isMarksUploaded && (
                    <td className="align-content-center">
                      <p className="fw-normal fs-14 mb-0">
                        {c.totalMarksObtained ?? "-"}
                      </p>
                    </td>
                  )}

                  {isMarksUploaded && (
                    <td className="align-content-center">
                      <p className="fw-normal fs-14 mb-0">
                        {c.examQualificationStatus || "-"}
                      </p>
                    </td>
                  )}

                  <td className="text-center align-content-center">
                    <OverlayTrigger
                      placement="bottom"
                      overlay={
                        <Tooltip id={`tooltip-${c.id}`}>
                          {t("candidateWorkflow:view_profile")}
                        </Tooltip>
                      }
                    >
                      <Person
                        size={16}
                        className="me-3 cursor-pointer"
                        onClick={() => {
                          navigate(getOrganizationPath("/candidate-preview", orgSlug), {
                            state: {
                              from: "/candidate-workflow",
                              candidate: c,

                              positionId: selectedPositionId, // for preview API
                              positionIds: selectedPositionId, // for auto populate after back
                              candidatePositionId: c.positionId,
                              requisitionId: selectedRequisitionId,
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
                              position:
                                position?.map?.((p) => ({
                                  positionId: p.positionId,
                                  positionName: p.positionName,
                                  isLocationWise: p.isLocationWise,
                                })) || [],
                              activeTab: "CANDIDATE_POOL",
                              isRankEnabled,

                              //ADD THESE
                              page,
                              pageSize,
                              filters,
                            },
                          });
                        }}
                      />
                    </OverlayTrigger>
                    <OverlayTrigger
                      placement="bottom"
                      overlay={
                        <Tooltip id={`tooltip-${c.id}`}>
                          {t("candidateWorkflow:view_resume")}
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

        {/* Pagination */}
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

      {/* Mobile Cards (NO checkboxes here on purpose) */}
      <div className="d-md-none">
        {candidates.map((c) => (
          <div key={c.id} className="card mb-3">
            <div className="card-body">
              <h6 className="fw-bold mb-1">{c.name}</h6>
              <small className="text-muted d-block mb-2">
                {t("candidateWorkflow:application_number")}: {c.regNo}
              </small>

              <div className="mb-1">
                <strong>{t("candidateWorkflow:experience")}:</strong>
                {((c.experienceMonths ?? 0) / 12).toFixed(1)}{" "}
                {t("candidateWorkflow:years")}
                {/* <strong>{t("candidateWorkflow:experience")}:</strong> {(c.experienceMonths / 12).toFixed(1)} {t("candidateWorkflow:years")} */}
              </div>
              <div className="mb-1">
                <strong>{t("candidateWorkflow:status")}:</strong>{" "}
                <span
                  className={`round_badge px-3 py-1 fs-12 rounded text-white ${
                    STATUS_CLASS_MAP[c.status] || "bg-secondary"
                  }`}
                >
                  {/* {c.status} */}
                  {t(`candidateWorkflow:status_${c.status?.toLowerCase()}`, {
                    defaultValue: c.status,
                  })}
                </span>
              </div>
              <div className="mb-1">
                <strong>{t("common:location")}:</strong> {c.location}
              </div>
              <div className="mb-2">
                <strong>{t("common:category")}:</strong> {c.categoryName}
              </div>

              <div className="d-flex gap-2">
                <Person
                  size={16}
                  className="me-3 cursor-pointer"
                  onClick={() =>
                    navigate(getOrganizationPath("/candidate-preview", orgSlug), {
                      state: {
                        from: "/candidate-workflow",
                        isRankEnabled,
                        //  ADD
                        activeTab: "CANDIDATE_POOL",
                        page,
                        pageSize,
                        filters,
                        candidate: c,
                        positionId: selectedPositionId,
                        requisitionId: selectedRequisitionId,
                        requisition: requisition
                          ? {
                              requisition_code: requisition.requisition_code,
                              requisition_title: requisition.requisition_title,
                              registration_start_date:
                                requisition.registration_start_date,
                              registration_end_date:
                                requisition.registration_end_date,
                            }
                          : null,
                        position: position
                          ? {
                              positionId: position.positionId,
                              positionName: position.positionName,
                            }
                          : null,
                      },
                    })
                  }
                />
                <FileText
                  className="cursor-pointer"
                  onClick={() => onViewFile(c)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
