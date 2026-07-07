import React, { useState, useMemo, useEffect } from "react";
import jobPositionApiService from "../../jobPosting/services/jobPositionApiService";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import masterApiService from "../../master/services/masterApiService";
import { Modal } from "react-bootstrap";
import { FaExternalLinkAlt } from "react-icons/fa";
import ApprovalHistoryModal from "../../Approvals/components/ApprovalHistoryModal";
import history_icon from "../../../assets/history_icon.png";
import useOfferApproval from "../../Approvals/hooks/useOfferApproval";

const OFFER_STATUS_CLASS_MAP = {
  OFFER_AWAITED: "bg-warning",
  OFFER_SENT: "bg-primary",
  OFFER_REJECTED: "bg-danger",
  OFFER_ACCEPTED: "bg-success",
  L1_PENDING: "bg-info",
  L2_PENDING: "bg-info",
  L1_REJECTED: "bg-danger",
  L2_REJECTED: "bg-danger",
  OFFER_GENERATED: "bg-secondary"
};

const OFFER_STATUS_LABEL_MAP = {
  OFFER_AWAITED: "Offer Awaited",
  OFFER_SENT: "Offer Sent",
  OFFER_REJECTED: "Offer Rejected",
  OFFER_ACCEPTED: "Offer Accepted",
  L1_PENDING: "L1 Pending",
  L2_PENDING: "L2 Pending",
  L1_REJECTED: "L1 Rejected",
  L2_REJECTED: "L2 Rejected",
  OFFER_GENERATED: "Offer Generated"
};

const OfferPool = ({
  selectedPositionId,
  selectedRequisitionId,
  filters,
  selectedIds,
  setSelectedIds,
  refreshKey,
  onOffersLoaded,
  offerTemplateId,
  acceptBeforeDate,
  joiningDate,
  offerApprovalId,

}) => {
  const { t } = useTranslation(["candidateWorkflow", "common"]);
  const [offers, setOffers] = useState([]);
  const [hasExamConfiguration, setHasExamConfiguration] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);






  const fetchExamConfiguration = async () => {
    try {
      if (!selectedPositionId) {
        setHasExamConfiguration(false);
        return;
      }

      const query = Array.isArray(selectedPositionId)
        ? selectedPositionId.join(",")
        : selectedPositionId;

      const res =
        await jobPositionApiService.getExamConfigurationsByPositions(query);

      const data = res?.data || [];

      setHasExamConfiguration(data.length > 0);
    } catch (err) {
      console.error(err);
      setHasExamConfiguration(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const d = new Date(value);

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  };
  const { users, fetchUsers, getWorkflowHistory } = useOfferApproval();
  const userMap = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.userId] = user.name;
      return acc;
    }, {});
  }, [users]);
  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setShowPreview(false);
    setPreviewUrl("");
  };

  const handleCandidatePreview = async (templateId, applicationId) => {
    try {
      const res = await masterApiService.candidatePreview(
        templateId,
        applicationId
      );

      const file = new Blob([res.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(file);

      // Option 2 (better): show in modal
      setPreviewUrl(fileURL);
      setShowPreview(true);
    } catch (err) {
      console.error(err);

      toast.error(t("candidateWorkflow:wentwrong"));
    }
  };

  const handleCandidateOfferPreview = async (offerFileUrl) => {
    try {
      const encodedPath = encodeURIComponent(offerFileUrl);

      const res =
        await masterApiService.getMessagesAzureBlobSasUrl(encodedPath);

      const fileUrl = res;

      if (fileUrl) {
        setPreviewUrl(fileUrl); // ✅ set URL
        setShowPreview(true); // ✅ open modal
      }
    } catch (err) {
      console.error(err);

      toast.error(t("candidateWorkflow:wentwrong"));
    }
  };

  const toggleRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const fetchOffers = async () => {
    if (!selectedPositionId) {
      setOffers([]);
      return;
    }

    try {
      setLoading(true);
      const res =
        await jobPositionApiService.getOffersByPosition(selectedPositionId);
      console.log("Offer API Response:", res.data);

      const rawList = res?.data || [];
      const mapped = rawList.map((item) => {
        const offer = item.candidateOffersDTO;

        return {
          id: offer.candidateOfferId,
          applicationNo: item.regNo,
          applicationId: offer.applicationId,
          offerFileUrl: offer.offerFileUrl,
          letterNumber: offer.letterNumber,

          name: item.candidateFullName,
          categoryName: item.reservationCategory,
          // NEW FIELDS
          dateOfBirth: item.candidateDob
            ? formatDate(item.candidateDob)
            : "-",

          age: item.age || "-",

          ageConcession: item.hasAgeConcession ? "Yes" : "No",

          qnq: offer.qualified ? "Q" : "NQ",

          writtenMarks:
            item.examMarks !== null && item.examMarks !== undefined
              ? item.examMarks
              : "-",

          interviewScore:
            item.interviewMarks !== null && item.interviewMarks !== undefined
              ? item.interviewMarks
              : "-",

          combinedScore:
            item.finalScore !== null && item.finalScore !== undefined
              ? item.finalScore
              : "-",

          score: item.finalScore,
          // qnq: offer.qualified === true ? "Q" : "NQ",
          status: offer.status,
          selectList: offer.selectList,
          waitList: offer.waitList,
          location: item.location,
          state: item.state,
          designation: item.designationName,
          offerReleaseDate: formatDate(offer.offerReleaseDate),
          acceptBeforeDate: formatDate(offer.acceptBeforeDate),
          joiningDate: formatDate(offer.joiningDate),
          historyId: item.offerApprovalId, // add this|
          cutOffDate: "-",
          shortlisted: "-",

        };
      });

      setOffers(mapped);
      if (typeof onOffersLoaded === "function") {
        onOffersLoaded(mapped);
      }
    } catch (err) {
      toast.error("Failed to load offers");
    } finally {
      setLoading(false);
    }
  };
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  const handleViewHistory = async (historyId) => {
    const data = await getWorkflowHistory(historyId);

    setHistoryData(data);
    setShowHistoryModal(true);
  };

  // FETCH OFFERS DIRECTLY HERE
  useEffect(() => {
    console.log("OfferPool render, refreshKey =", refreshKey);
    fetchOffers();
    fetchUsers();
    fetchExamConfiguration();
  }, [selectedPositionId, refreshKey, fetchUsers]);

  // APPLY STATUS FILTER LOCALLY
  const filteredOffers = useMemo(() => {
    if (!filters.status || filters.status.length === 0) {
      return offers;
    }

    return offers.filter((o) => filters.status.includes(o.status));
  }, [offers, filters.status]);

  const totalElements = filteredOffers.length;

  const paginatedOffers = useMemo(() => {
    const start = page * pageSize;
    return filteredOffers.slice(start, start + pageSize);
  }, [filteredOffers, page, pageSize]);

  /* ---------- Selection logic ---------- */

  const InfoField = ({ label, value }) => (
    <div className="col-12 col-md-4 mb-3">
      <p className="fw-400 fs-13 mb-1" style={{ color: "#8e939f" }}>
        {label}
      </p>
      <p className="fs-14">{value || "-"}</p>
    </div>
  );

  useEffect(() => {
    setPage(0);
  }, [pageSize]);

  useEffect(() => {
    setPage(0);
  }, [filters.status]);

  useEffect(() => {
    const totalPages = Math.ceil(filteredOffers.length / pageSize);
    if (page >= totalPages && totalPages > 0) {
      setPage(totalPages - 1);
    }
  }, [filteredOffers, pageSize, page]);

  return (
    <div className="card-body p-0 d-none d-md-block">
      <div className="table-responsive m-0" style={{ overflowX: "auto" }}>
        <table
          className="table table-hover mb-0"
          style={{ minWidth: "1600px", whiteSpace: "nowrap" }}
        >
          <thead className="bg-light">
            <tr className="align-content-center">
              <th
                className="sticky-col-checkbox border-top"
                style={{
                  width: "50px",
                  minWidth: "50px",
                  paddingLeft: "1.5rem",
                }}
              ></th>
              <th
                className="fs-14 fw-normal py-3 border-top sticky-col-1"
                scope="col"
                style={{
                  paddingLeft: "1rem",
                  width: "200px",
                  minWidth: "200px",
                }}
              >
                {t("candidateWorkflow:candidate")}
              </th>
              <th
                className="fs-14 fw-normal py-3 border-top"
                style={{
                  paddingLeft: "1rem",
                  width: "160px",
                  minWidth: "160px",
                }}
                scope="col"
              >
                {t("candidateWorkflow:registration_number")}
              </th>


              <th
                className="fs-14 fw-normal py-3 border-top"
                style={{ paddingLeft: "2rem" }}
                scope="col"
              >
                {t("candidateWorkflow:caste")}
              </th>
              <th
                className="fs-14 fw-normal py-3 border-top"
                scope="col"
                style={{ paddingLeft: "1.25rem" }}
              >
                {t("candidateWorkflow:combined_score")}
              </th>
              <th
                className="fs-14 fw-normal py-3 border-top"
                scope="col"
                style={{ paddingLeft: "1.25rem" }}
              >
                {t("candidateWorkflow:qnq")}
              </th>
              <th
                className="fs-14 fw-normal py-3 border-top"
                scope="col"
                style={{ paddingLeft: "1.25rem" }}
              >
                {t("candidateWorkflow:status")}
              </th>
              <th
                className="fs-14 fw-normal py-3 border-top"
                scope="col"
                style={{ paddingLeft: "1.25rem" }}
              >
                {t("candidateWorkflow:select_list")}
              </th>
              <th
                className="fs-14 fw-normal py-3 border-top"
                scope="col"
                style={{ paddingLeft: "1.25rem" }}
              >
                {t("candidateWorkflow:wait_list")}
              </th>
              <th
                className="fs-14 fw-normal py-3 border-top"
                scope="col"
                style={{ paddingLeft: "1.25rem" }}
              >
                {t("candidateWorkflow:state")}
              </th>
              <th
                className="fs-14 fw-normal py-3 border-top"
                scope="col"
                style={{ paddingLeft: "1.25rem" }}
              >
                {t("candidateWorkflow:city")}
              </th>


               <th
                className="fs-14 fw-normal py-3 border-top"
                scope="col"
                style={{ paddingLeft: "1.25rem" }}
              >
                {t("candidateWorkflow:offer_letter_number")}
              </th>

              <th
                className="fs-14 fw-normal py-3 border-top"
                scope="col"
                style={{ paddingLeft: "1.25rem" }}
              >
                {t("candidateWorkflow:offer_release_date")}
              </th>
              <th
                className="fs-14 fw-normal py-3 border-top"
                scope="col"
                style={{ paddingLeft: "1.25rem" }}
              >
                {t("candidateWorkflow:accept_before_date")}
              </th>
              <th
                className="fs-14 fw-normal py-3 border-top"
                scope="col"
                style={{ paddingLeft: "1.25rem" }}
              >
                {t("candidateWorkflow:joining_date")}
              </th>


             
              <th
                className="fs-14 fw-normal py-3 border-top sticky-col-action border-left"
                scope="col"
                style={{ paddingLeft: "1.25rem" }}
              >
                {t("common:action")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="15" className="text-center py-4">
                  {t("loading_candidates")}
                </td>
              </tr>
            ) : paginatedOffers.length === 0 ? (
              <tr>
                <td colSpan="15" className="text-center py-4">
                  {t("no_candidates_found")}
                </td>
              </tr>
            ) : (
              paginatedOffers.map((c) => (
                <tr key={c.id}>
                  <td
                    className="sticky-col-checkbox"
                    style={{
                      width: "50px",
                      minWidth: "50px",
                      paddingLeft: "1.5rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      style={{ marginTop: "0.75rem" }}
                      checked={selectedIds.includes(c.id)}
                      onChange={() => toggleRow(c.id)}
                      //  disabled={c.status !== "OFFER_AWAITED"}
                      disabled={
                        ![
                          "OFFER_AWAITED",
                          "L1_REJECTED",
                          "L2_REJECTED",
                          "OFFER_GENERATED"
                        ].includes(c.status)
                      }
                    />
                  </td>
                  <td
                    className="align-content-center sticky-col-1"
                    style={{
                      paddingLeft: "1rem",
                      width: "200px",
                      minWidth: "200px",
                    }}
                  >
                    <div className="d-flex align-items-center gap-2 py-2">
                      <p className="fw-normal fs-14 mb-0 text-muted">
                        {c.name}
                      </p>

                      {c.status !== "OFFER_AWAITED" && (
                        <button
                          type="button"
                          className="history-btn border-0 bg-transparent p-0"
                          onClick={() => handleViewHistory(c.historyId)}
                        >
                          <img
                            src={history_icon}
                            alt="History"
                            width={14}
                            height={14}
                          />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="align-content-center">
                    <p
                      className="fw-normal fs-14 mb-0 py-2 text-muted"
                      style={{
                        paddingLeft: "0.5rem",
                        width: "160px",
                        minWidth: "160px",
                      }}
                    >
                      {c.applicationNo}
                    </p>
                  </td>
                  <td className="align-content-center">
                    <p
                      className="fw-normal fs-14 mb-0 py-2 text-muted"
                      style={{ paddingLeft: "1.5rem" }}
                    >
                      {c.categoryName || "-"}
                    </p>
                  </td>
                  <td
                    className="align-content-center"
                    style={{ paddingLeft: "1.25rem" }}
                  >
                    <p className="fw-normal fs-14 mb-0 py-2 text-muted">
                      {c.score || "-"}
                    </p>
                  </td>
                  <td
                    className="align-content-center"
                    style={{ paddingLeft: "1.25rem" }}
                  >
                    <p className="fw-normal fs-14 mb-0 py-2 text-muted">
                      {c.qnq || "-"}
                    </p>
                  </td>
                  <td
                    className="align-content-center"
                    style={{ paddingLeft: "1.25rem", alignContent: "center" }}
                  >
                    <span
                      className={`round_badge px-3 py-1 fs-12 rounded text-white ${OFFER_STATUS_CLASS_MAP[c.status] || "bg-secondary"
                        }`}
                    >
                      {OFFER_STATUS_LABEL_MAP[c.status] || c.status}
                    </span>
                  </td>
                  <td
                    className="align-content-center"
                    style={{ paddingLeft: "1.25rem" }}
                  >
                    <p className="fw-normal fs-14 mb-0 py-2 text-muted">
                      {c.selectList || "-"}
                    </p>
                  </td>
                  <td
                    className="align-content-center"
                    style={{ paddingLeft: "1.25rem" }}
                  >
                    <p className="fw-normal fs-14 mb-0 py-2 text-muted">
                      {c.waitList || "-"}
                    </p>
                  </td>
                  <td
                    className="align-content-center"
                    style={{ paddingLeft: "1.25rem" }}
                  >
                    <p className="fw-normal fs-14 mb-0 py-2 text-muted">
                      {c.state || "-"}
                    </p>
                  </td>
                  <td
                    className="align-content-center"
                    style={{ paddingLeft: "1.25rem" }}
                  >
                    <p className="fw-normal fs-14 mb-0 py-2 text-muted">
                      {c.location || "-"}
                    </p>
                  </td>

                    <td
                    className="align-content-center"
                    style={{ paddingLeft: "1.25rem" }}
                  >
                    <p className="fw-normal fs-14 mb-0 py-2 text-muted">
                      {c.letterNumber || "-"}
                    </p>
                  </td>

                  <td
                    className="align-content-center"
                    style={{ paddingLeft: "1.25rem" }}
                  >
                    <p className="fw-normal fs-14 mb-0 py-2 text-muted">
                      {c.offerReleaseDate}
                    </p>
                  </td>
                  <td
                    className="align-content-center"
                    style={{ paddingLeft: "1.25rem" }}
                  >
                    <p className="fw-normal fs-14 mb-0 py-2 text-muted">
                      {c.acceptBeforeDate}
                    </p>
                  </td>
                  <td
                    className="align-content-center"
                    style={{ paddingLeft: "1.25rem" }}
                  >
                    <p className="fw-normal fs-14 mb-0 py-2 text-muted">
                      {c.joiningDate}
                    </p>
                  </td>
                

                  <td
                    className="align-content-center sticky-col-action"
                    style={{ paddingLeft: "1.5rem" }}
                  >
                    {/* File Button Tooltip */}
                    <OverlayTrigger
                      placement="bottom"
                      overlay={
                        <Tooltip id={`tooltip-file-${c.id}`}>
                          {t("common:view_file")}
                        </Tooltip>
                      }
                    >
                      <button
                        className="btn btn-sm btn-outline-secondary border-0 me-2"
                        onClick={() => {
                          if (c.offerFileUrl) {
                            handleCandidateOfferPreview(c.offerFileUrl);
                          } else {
                            if (!offerTemplateId) {
                              toast.error(t("candidateWorkflow:OfferTemplate"));
                              return;
                            }

                            handleCandidatePreview(
                              offerTemplateId,
                              c.applicationId
                            );
                          }
                        }}
                        style={{ backgroundColor: "#eff6ff" }}
                      >
                        <i
                          className="bi bi-file-text"
                          style={{ color: "black" }}
                        ></i>
                      </button>
                    </OverlayTrigger>

                    {/* Eye Button Tooltip */}
                    <OverlayTrigger
                      placement="bottom"
                      overlay={
                        <Tooltip id={`tooltip-${c.id}`}>
                          {t("common:view_details")}
                        </Tooltip>
                      }
                    >
                      <button
                        className="btn btn-sm btn-outline-secondary border-0"
                        onClick={() => {
                          setSelectedOffer(c);
                          setShowModal(true);
                        }}
                        style={{ backgroundColor: "#eff6ff" }}
                      >
                        <i className="bi bi-eye" style={{ color: "black" }}></i>
                      </button>
                    </OverlayTrigger>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top">
        <div>
          <select
            className="form-select form-select-sm"
            style={{ width: "120px" }}
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div>
          <button
            className="btn btn-sm btn-outline-secondary me-2"
            disabled={page === 0}
            onClick={() => setPage((prev) => prev - 1)}
          >
            {t("candidateWorkflow:prev")}
          </button>

          <span className="fs-14">
            {t("candidateWorkflow:page")} {page + 1} {t("candidateWorkflow:of")}{" "}
            {Math.ceil(totalElements / pageSize) || 1}
          </span>

          <button
            className="btn btn-sm btn-outline-secondary ms-2"
            disabled={(page + 1) * pageSize >= totalElements}
            onClick={() => setPage((prev) => prev + 1)}
          >
            {t("candidateWorkflow:next")}
          </button>
        </div>
      </div>
      {showModal && selectedOffer && (
        <>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content rounded-4 border-0">
                {/* Header */}
                <div className="modal-header border-0 pb-0">
                  <p className="modal-title fs-16 fw-500 mb-0 blue-color py-2">
                    {t("candidateWorkflow:candidate_rank_details")}
                  </p>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  />
                </div>

                {/* Body */}
                <div className="modal-body pt-2">
                  <div
                    className="container-fluid rounded p-4 shadow-sm"
                    style={{ backgroundColor: "#f7f8fb" }}
                  >
                    <div className="row g-3">

                      <InfoField
                        label={t("candidateWorkflow:registration_number")}
                        value={selectedOffer.applicationNo}
                      />

                      <InfoField
                        label={t("common:name")}
                        value={selectedOffer.name}
                      />

                      <InfoField
                        label={t("candidateWorkflow:caste")}
                        value={selectedOffer.categoryName}
                      />

                      <InfoField
                        label={t("candidateWorkflow:date_of_birth")}
                        value={selectedOffer.dateOfBirth}
                      />

                      <InfoField
                        label={t("candidateWorkflow:cutoff_date")}
                        value={selectedOffer.cutOffDate}
                      />

                      <InfoField
                        label={t("candidateWorkflow:age")}
                        value={selectedOffer.age}
                      />

                      <InfoField
                        label={t("candidateWorkflow:age_concession")}
                        value={selectedOffer.ageConcession}
                      />

                      <InfoField
                        label={t("candidateWorkflow:qnq")}
                        value={selectedOffer.qnq}
                      />

                      <InfoField
                        label={t("candidateWorkflow:shortlisted")}
                        value={selectedOffer.shortlisted}
                      />

                      {hasExamConfiguration && (
                        <InfoField
                          label={t("candidateWorkflow:written_mark")}
                          value={selectedOffer.writtenMarks}
                        />
                      )}

                      <InfoField
                        label={t("candidateWorkflow:interview_score")}
                        value={selectedOffer.interviewScore}
                      />

                      <InfoField
                        label={t("candidateWorkflow:combined_score_details")}
                        value={selectedOffer.combinedScore}
                      />

                      <InfoField
                        label={t("candidateWorkflow:status")}
                        value={
                          OFFER_STATUS_LABEL_MAP[selectedOffer.status] ||
                          selectedOffer.status
                        }
                      />

                      <InfoField
                        label={t("candidateWorkflow:select_list")}
                        value={selectedOffer.selectList}
                      />

                      <InfoField
                        label={t("candidateWorkflow:wait_list")}
                        value={selectedOffer.waitList}
                      />

                      <InfoField
                        label={t("candidateWorkflow:city")}
                        value={selectedOffer.location}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Backdrop */}
          <div
            className="modal-backdrop fade show"
            onClick={() => setShowModal(false)}
          />
        </>
      )}
      <Modal show={showPreview} onHide={handleClose} size="xl" centered>
        {/* HEADER */}
        <Modal.Header closeButton className="border-0 pb-2">
          <div className="w-100 d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-0 fw-semibold">{"Preview Offer"}</h6>
            </div>

            {/* ACTION BUTTONS */}
            <div
              className="d-flex gap-4 align-items-center"
              style={{
                paddingRight: "15px",
              }}
            >
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-primary"
                >
                  {" "}
                  <FaExternalLinkAlt />
                </a>
              )}
            </div>
          </div>
        </Modal.Header>

        {/* BODY */}
        <Modal.Body
          style={{
            height: "85vh",
            background: "#f8f9fa",
            padding: "10px",
            borderRadius: "10px",
          }}
        >
          {previewUrl ? (
            <iframe
              src={previewUrl}
              width="100%"
              height="100%"
              title="PDF Preview"
              style={{
                border: "none",
                borderRadius: "8px",
                background: "#fff",
              }}
            />
          ) : (
            <div className="d-flex justify-content-center align-items-center h-100 text-muted">
              No preview available
            </div>
          )}
        </Modal.Body>
      </Modal>
      <ApprovalHistoryModal
        show={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        historyData={historyData.map((item) => ({
          ...item,
          approverName:
            userMap[item.approverId] ||
            userMap[item.userId] ||
            item.approverRole ||
            "-",
        }))}
      />
    </div>
  );
};

export default OfferPool;
