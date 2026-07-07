// src/modules/candidatePreview/components/RequisitionStrip.jsx

import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import NationalVacancyTable from "./NationalVacancyTable";
import LocationWiseVacancyTable from "./LocationWiseVacancyTable";
import "../../../style/css/RequisitionStrip.css";
import candidateWorkflowServices from "../services/CandidateWorkflowServices";
import masterApiService from "../../master/services/masterApiService"; // ADDED
import { mapJobPositionToRequisitionStrip } from "../mappers/candidatePreviewMapper";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
const RequisitionStripformultiplepositions = ({
  requisition,
  position,
  isCardBg,
  onRemovePosition,
  isReadonly = false,
}) => {
  const [showPosition, setShowPosition] = useState(false);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);

  const [masterData, setMasterData] = useState(null); //  INTERNAL

  const [selectedPositionIdForModal, setSelectedPositionIdForModal] =
    useState(null);

  const handlePositionClick = (id) => {
    setSelectedPositionIdForModal(id);
    setShowPosition(true);
  };

  //const orderedPattern = /^\s*(\(?\d+[.)\]]|\(?[ivxlcdm]+[.)\]])\s*/i;
  const MAX_REGEX_INPUT = 500;

  const orderedPattern =
    /^\s*(?:\(?\d+[).\]]|\(?[ivxlcdm]+[).\]])\s*/i;

  const isOrderedListItem = (text) => {
    if (!text || text.length > MAX_REGEX_INPUT) {
      return false;
    }

    return orderedPattern.test(text);
  };

  const renderBullets = (text) => {
    if (!text) return <li>-</li>;

    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    return lines.map((line, idx) => {
      const cleaned = line.replace(/\.+$/, "");

      // ✅ If already numbered → DO NOT ADD BULLET
      if (isOrderedListItem(cleaned)) {
        return (
          <div key={idx} className="no-bullet-line">
            {cleaned}
          </div>
        );
      }

      // ✅ Otherwise normal bullet
      return <li key={idx}>{cleaned}</li>;
    });
  };

  const formatDMY = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd-MM-yyyy");
    } catch {
      return dateStr;
    }
  };

  /* ================= LOAD MASTER DATA ================= */

  useEffect(() => {
    const loadMasters = async () => {
      try {
     const [masterRes, exclusionsRes] = await Promise.all([
  masterApiService.getMasterDisplayAll(),
  masterApiService.getExclusions(),
]);

setMasterData({
  ...masterRes.data,
  exclusions: exclusionsRes.data || [],
});
      } catch (err) {
        console.error("Failed to load master data", err);
        setMasterData({});
      }
    };

    loadMasters();
  }, []);

  /* ================= FETCH JOB ================= */


useEffect(() => {
  if (!selectedPositionIdForModal || !masterData) return;

  const fetchJob = async () => {
    try {
      setLoading(true);

      const res = await candidateWorkflowServices.getJobPositionById(
        selectedPositionIdForModal
      );

      const mapped = mapJobPositionToRequisitionStrip(
        res.data,
        masterData
      );

      //  Correct property name from API
      mapped.exclusionNames =
        (res.data?.jobPositionExclusion || [])
          .filter((item) => item.isExcluded)
          .map((item) => {
            const exclusion = masterData?.exclusions?.find(
              (e) =>
                String(e.exclusionId) === String(item.exclusionId)
            );

            return exclusion?.exclusionValue;
          })
          .filter(Boolean);

      mapped.isAgeRelRiotVictimFamily =
        res.data?.isAgeRelRiotVictimFamily || false;

      mapped.isAgeRelWdsWomen =
        res.data?.isAgeRelWdsWomen || false;

      console.log("Mapped Exclusions:", mapped.exclusionNames);

      setJob(mapped);
    } catch (err) {
      console.error("Failed to fetch job details", err);
      toast.error(t("candidateWorkflow:failed_load_position_details"));
    } finally {
      setLoading(false);
    }
  };

  fetchJob();
}, [selectedPositionIdForModal, masterData]);

  const { t } = useTranslation(["candidateWorkflow", "common"]);
  const formatExperience = (years = 0, months = 0) => {
    if (years === 0 && months === 0) return `0 ${t("candidateWorkflow:years")}`;

    if (years > 0 && months === 0)
      return `${years} ${t("candidateWorkflow:years")}`;

    if (years === 0 && months > 0)
      return `${months} ${t("candidateWorkflow:months")}`;

    return `${years} ${t("candidateWorkflow:years")} ${months} ${t("candidateWorkflow:months")}`;
  };

  const getEducationNameById = (id) => {
    const docs = masterData?.educationLevels || []; // ✅ FIXED

    const match = docs.find(
      (doc) => doc.documentTypeId === id && doc.docType === "educationdocs"
    );

    return match?.documentName || "-";
  };

  const getEduWiseExperience = () => {
    if (!job?.mandatoryExpMonthsEduWise) return [];

    return Object.entries(job.mandatoryExpMonthsEduWise).map(([id, months]) => {
      const name = getEducationNameById(id);

      const years = Math.floor(months / 12);
      const remMonths = months % 12;

      let exp = "";
      if (years > 0) exp += `${years} yr `;
      if (remMonths > 0) exp += `${remMonths} mo`;

      return `${name}: ${exp || "0 mo"}`;
    });
  };

  const selectedModalPosition = Array.isArray(position)
    ? position.find((p) => p.positionId === selectedPositionIdForModal)
    : position;

  return (
    <>
      {/* ================= STRIP ================= */}
      <div
        className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center px-3 py-2 wraps"
        style={{
          background: isCardBg ? "#ffffff" : "none",
          border: isCardBg ? "1px solid #e0e0e0" : "none",
          borderRadius: "8px",
        }}
      >
        {/* ===== LEFT CONTENT ===== */}
        <div className="w-100">
          <div className="d-flex flex-column flex-md-row flex-wrap align-items-center gap-2">
            <OverlayTrigger
              placement="bottom"
              overlay={
                <Tooltip>
                  {requisition?.requisitionCode ||
                    requisition?.requisition_code ||
                    ""}{" "}
                  -{" "}
                  {requisition?.requisitionTitle ||
                    requisition?.requisition_title ||
                    "-"}
                </Tooltip>
              }
            >
              <span className="req-code me-3 cursor-pointer">
                {requisition?.requisitionCode ||
                  requisition?.requisition_code ||
                  ""}{" "}
                -{" "}
                {requisition?.requisitionTitle ||
                  requisition?.requisition_title ||
                  "-"}
              </span>
            </OverlayTrigger>

            <span className="date-text">
              <i className="bi bi-calendar3 me-1"></i>
              {t("candidateWorkflow:start")}:{" "}
              {formatDMY(
                requisition?.startDate || requisition?.registration_start_date
              )}
              
            </span>

            <span className="date-divider">|</span>

            <span className="date-text">
              <i className="bi bi-clock me-1"></i>
              {t("candidateWorkflow:end")}:{" "}
              {formatDMY(
                requisition?.endDate || requisition?.registration_end_date
              )}
            </span>
          </div>

          <div className="req-position-wrapper mt-2">
            {Array.isArray(position) ? (
              position.map((p) => (
                <span className="req-position-chip-wrapper">
                  <div
                    key={p.positionId}
                    onClick={() => handlePositionClick(p.positionId)}
                    className="req-position-chip"
                  >
                    <span className="req-position-text">{p.positionName}</span>

                    {!isReadonly && onRemovePosition && (
                      <span
                        className="req-position-close"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemovePosition(p.positionId);
                        }}
                      >
                        ×
                      </span>
                    )}
                  </div>
                </span>
              ))
            ) : (
              <div className="req-position-chip">
                <span className="req-position-text">
                  {position?.positionName ||
                    position?.masterPositions?.positionName ||
                    "—"}
                </span>

                {!isReadonly && onRemovePosition && (
                  <span
                    className="req-position-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemovePosition(position?.positionId);
                    }}
                  >
                    ×
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= MODAL ================= */}
      <Modal
        show={showPosition}
        onHide={() => setShowPosition(false)}
        centered
        size="lg"
        // scrollable
      >
        <Modal.Header closeButton className="knowmore-header">
          <div className="w-100">
            <div className="modal-header-row">
              <span className="modal-req-title">
                {requisition?.requisition_title ||
                  requisition?.requisitionTitle ||
                  "-"}
              </span>

              <span className="modal-date">
                <i className="bi bi-calendar3 me-1"></i>
                {t("candidateWorkflow:start")}:{" "}
                {formatDMY(
                  requisition?.startDate || requisition?.registration_start_date
                )}
              </span>

              <span className="modal-divider">|</span>

              <span className="modal-date">
                <i className="bi bi-clock me-1"></i>
                {t("candidateWorkflow:end")}:{" "}
                {formatDMY(
                  requisition?.endDate || requisition?.registration_end_date
                )}
              </span>
            </div>

            <div
              className="job-title mt-1 d-flex flex-wrap align-items-center gap-2"
              style={{ color: "#162B75", fontWeight: 500 }}
            >
              <span
                style={{
                  color: "#162B75",
                  textDecoration: "underline",
                }}
              >
                {selectedModalPosition?.positionName ||
                  selectedModalPosition?.masterPositions?.positionName ||
                  "—"}
              </span>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body>
          {loading ? (
            <div className="text-center py-5">
              {t("candidateWorkflow:loading_job_details")}
            </div>
          ) : (
            <>
              <div className="stats-container mb-3">
                <div className="row g-2 small">
                  {/* Employment */}
                  <div className="col-12 col-md-4">
                    <span className="stat-label">
                      {t("candidateWorkflow:employment_type")}:
                    </span>{" "}
                    <span className="stat-value">
                      {job?.employment_type || "-"}
                    </span>
                  </div>

                  {/* Contract — show only if employment type is Contract */}
                  {job?.employment_type?.toLowerCase() === "contract" && (
                    <div className="col-12 col-md-4">
                      <span className="stat-label">
                        {t("candidateWorkflow:contract_period")}:
                      </span>{" "}
                      <span className="stat-value">
                        {job?.contract_years ?? 0}{" "}
                        {t("candidateWorkflow:years")}
                      </span>
                    </div>
                  )}

                  {/* Eligibility */}
                  <div className="col-12 col-md-4">
                    <span className="stat-label">
                      {t("candidateWorkflow:eligibility_age")}:
                    </span>{" "}
                    <span className="stat-value">
                      {job?.eligibility_age_min} - {job?.eligibility_age_max}{" "}
                      {t("candidateWorkflow:years")}
                    </span>
                  </div>

                  {/* Vacancies */}
                  <div className="col-12 col-md-4">
                    <span className="stat-label">
                      {t("candidateWorkflow:vacancies")}:
                    </span>{" "}
                    <span className="stat-value">
                      {job?.no_of_vacancies ?? 0}
                    </span>
                  </div>

                  {/* Department */}
                  <div className="col-12 col-md-4">
                    <span className="stat-label">
                      {t("candidateWorkflow:department")}:
                    </span>{" "}
                    <span className="stat-value">{job?.dept_name || "-"}</span>
                  </div>

                  <div className="col-12 col-md-4">
                    <span className="stat-label">
                      {t("candidateWorkflow:experience")}:
                    </span>{" "}
                    <span className="stat-value">
                      {job?.isMandatoryExpMonthsEduWise
                        ? getEduWiseExperience().join("/ ")
                        : formatExperience(
                            job?.mandatory_experience_years,
                            job?.mandatory_experience_months
                          )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="info-card">
                <div className="section-title">
                  {t("candidateWorkflow:mandatory_education")}:
                </div>
                <ul className="section-list">
                  <li style={{ whiteSpace: "pre-line" }}>
                    {job?.mandatory_qualification || "-"}
                  </li>
                </ul>

                <div className="section-title mt-2">
                  {t("candidateWorkflow:preferred_education")}:
                </div>
                <ul className="section-list">
                  <li style={{ whiteSpace: "pre-line" }}>
                    {job?.preferred_qualification || "NA"}
                  </li>
                </ul>
              </div>

              <div className="info-card">
                <div className="section-title">
                  {t("candidateWorkflow:mandatory_experience")}:
                </div>
                <ul className="section-lists">
                  {renderBullets(job?.mandatory_experience)}
                </ul>

                <div className="section-title mt-2">
                  {t("candidateWorkflow:preferred_experience")}:
                </div>
                <ul className="section-lists">
                  {renderBullets(job?.preferred_experience || "NA")}
                </ul>
              </div>

              <div className="info-card">
                <div className="section-title">
                  {t("candidateWorkflow:key_responsibilities")}:
                </div>
                <ul className="section-lists">
                  {renderBullets(job?.roles_responsibilities)}
                </ul>
              </div>


{/* INCLUSIONS */}
{(job?.isAgeRelRiotVictimFamily || job?.isAgeRelWdsWomen) && (
  <div className="info-card">
    <div className="section-title">    {t("addPosition:age_relaxation_for")}:</div>
    <ul className="section-lists">
      {job?.isAgeRelRiotVictimFamily && (
     <li>{t("addPosition:persons_affected_by_1984_riots")}</li>
      )}

      {job?.isAgeRelWdsWomen && (
        <li>
         {t("addPosition:widowed_divorced_separated_women")}
        </li>
      )}
    </ul>
  </div>
)}

     

{/* EXCLUSIONS */}
{/* EXCLUSIONS */}
{job?.exclusionNames?.length > 0 && (
  <div className="info-card">
    <div className="section-title">
      {t("addPosition:Exclusions")}:
    </div>

    <ul className="section-lists">
      {job.exclusionNames.map((name, index) => (
        <li key={index}>{name}</li>
      ))}
    </ul>
  </div>
)}



              {job?.positionStateDistributions?.length > 0 && (
                <LocationWiseVacancyTable
                  positionStateDistributions={job.positionStateDistributions}
                  states={masterData?.states || []}
                  cities={masterData?.cities || []}
                  reservationCategories={
                    masterData?.reservationCategories || []
                  }
                  disabilityCategories={masterData?.disabilityCategories || []}
                />
              )}

              {job?.positionStateDistributions?.length === 0 &&
                job?.nationalCategoryDistribution && (
                  <NationalVacancyTable
                    nationalCategoryDistribution={
                      job.nationalCategoryDistribution
                    }
                    reservationCategories={
                      masterData?.reservationCategories || []
                    }
                    disabilityCategories={
                      masterData?.disabilityCategories || []
                    }
                  />
                )}
            </>
          )}
        </Modal.Body>

        <Modal.Footer className="justify-content-center">
          <button className="ok-btn" onClick={() => setShowPosition(false)}>
            {t("common:ok")}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default RequisitionStripformultiplepositions;
