import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Form, Button, Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import Select from "react-select";
import "../../../style/css/OfferLetterRequestApproval.css";
import ApprovalCommentModal from "../components/ApprovalCommentModal";
import useOfferApproval from "../hooks/useOfferApproval";
import masterApiService from "../../master/services/masterApiService";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import ApprovalHistoryModal from "../components/ApprovalHistoryModal";
import history_icon from "../../../assets/history_icon.png";
import { useTranslation } from "react-i18next";
const formatDateDDMMYYYY = (isoDate) => {
  if (!isoDate) return "";

  const [year, month, day] = isoDate.split("-");
  return `${day}-${month}-${year}`;
};
const OfferLetterRequestApproval = () => {
  const { t } = useTranslation([
    "offerLetterRequest",
    "approvalHistory",
    "common",
  ]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [actionType, setActionType] = useState(null); // "approve" | "reject"
  const [comment, setComment] = useState("");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const privileges = useSelector((state) => state.user.privileges);

  const isL1 = privileges?.["L1 Approval"];
  const isL2 = privileges?.["L2 Approval"];

  const approvalLevel = isL2 ? "L2" : isL1 ? "L1" : null;

  const selectableStatus =
    approvalLevel === "L1"
      ? "L1_PENDING"
      : approvalLevel === "L2"
        ? "L2_PENDING"
        : null;

  const handleOpenCommentModal = (type) => {
    if (selectedIds.size === 0) {
      alert(t("offerLetterRequest:select_at_least_one_candidate"));
      return;
    }

    setActionType(type);
    setComment("");
    setShowCommentModal(true);
  };

  const handleConfirmAction = async (comment) => {
    const payload = {
      offerApprovalIds: Array.from(selectedIds),
      action: actionType === "approve" ? "APPROVE" : "REJECT",
      comments: comment,
    };

    const success = await approveOrRejectCandidates(payload, actionType);

    if (success) {
      setShowCommentModal(false);
      setSelectedIds(new Set());

      await fetchCandidates({
        positionId: selectedPosition?.value,
        page: 0,
        size: 10,
      });
    }
  };
  const handleCandidateOfferPreview = async (offerFileUrl) => {
    try {
      const encodedPath = encodeURIComponent(offerFileUrl);

      const fileUrl =
        await masterApiService.getMessagesAzureBlobSasUrl(encodedPath);

      if (fileUrl) {
        setPreviewUrl(fileUrl);
        setShowPreview(true);
      }
    } catch (err) {
      console.error(err);
      toast.error(t("offerLetterRequest:failed_to_preview_file"));
    }
  };

  const handleViewHistory = async (historyId) => {
    const data = await getWorkflowHistory(historyId);

    setHistoryData(data);
    setShowHistoryModal(true);
  };

  const {
    requisitionOptions,
    positionOptions,
    candidates,
    fetchRequisitions,
    fetchPositions,
    fetchCandidates,
    approveOrRejectCandidates,
    clearCandidates,
    getWorkflowHistory,
    users,
    fetchUsers,
  } = useOfferApproval();

  const userMap = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.userId] = user.name;
      return acc;
    }, {});
  }, [users]);

  useEffect(() => {
    fetchRequisitions();
    fetchUsers();
  }, [fetchRequisitions, fetchUsers]);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const selectableCandidates = candidates.filter(
    (c) => c.status === selectableStatus
  );

  const allSelected =
    selectableCandidates.length > 0 &&
    selectableCandidates.every((c) => selectedIds.has(c.id));

  const selectStyles = {
    control: (base) => ({
      ...base,
      minHeight: "38px",
      height: "38px",
      fontSize: "14px",
    }),
    valueContainer: (base) => ({
      ...base,
      height: "38px",
      padding: "0 8px",
    }),
    indicatorsContainer: (base) => ({
      ...base,
      height: "38px",
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
  };

  return (
    <div className="offer-letter-request-page">
      <Container fluid className="offerletter-page">
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <h5 className="offer-page-title">
              {t("offerLetterRequest:offer_letter_requests")}
            </h5>

            <p className="offer-page-subtitle">
              {t("offerLetterRequest:review_offer_letter_requests")}
            </p>
          </Col>
        </Row>
        {/* Filters */}
        <Row className="mb-4">
          <Col md={4}>
            <div className="offer-filter-label">
              {t("approvalHistory:requisition")}
            </div>

            <Select
              styles={selectStyles}
              options={requisitionOptions}
              value={selectedRequisition}
              onChange={(option) => {
                setSelectedRequisition(option);
                setSelectedPosition(null);

                setSelectedIds(new Set());

                clearCandidates();

                fetchPositions(option?.value);
              }}
              placeholder={t("approvalHistory:select_requisition")}
              menuPortalTarget={document.body}
            />
          </Col>

          <Col md={4}>
            <div className="offer-filter-label">
              {t("approvalHistory:position")}
            </div>

            <Select
              styles={selectStyles}
              options={positionOptions}
              value={selectedPosition}
              onChange={(option) => {
                setSelectedPosition(option);

                fetchCandidates({
                  positionId: option?.value,
                  statusList: ["L1_PENDING"],
                  page: 0,
                  size: 10,
                });
              }}
              placeholder={t("approvalHistory:select_position")}
              menuPortalTarget={document.body}
            />
          </Col>
        </Row>
        {/* Bulk Actions */}
        <Row className="offer-bulk-actions align-items-center mb-3">
          <Col md={6}>
            <Form.Check
              type="checkbox"
              label={t("approvalHistory:select_all")}
              checked={allSelected}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedIds(
                    new Set(selectableCandidates.map((c) => c.id))
                  );
                } else {
                  setSelectedIds(new Set());
                }
              }}
            />
          </Col>

          <Col md={6} className="d-flex justify-content-end gap-2">
            <Button
              variant="outline-danger"
              className="offer-reject-btn"
              disabled={selectedIds.size === 0}
              onClick={() => handleOpenCommentModal("reject")}
            >
              {t("approvalHistory:reject")}
            </Button>

            <Button
              variant="outline-success"
              className="offer-approve-btn"
              disabled={selectedIds.size === 0}
              onClick={() => handleOpenCommentModal("approve")}
            >
              {t("approvalHistory:approve")}
            </Button>
          </Col>
        </Row>
        {/* Cards */}

        <table responsive bordered hover className="offer-request-table mt-5">
          <thead>
            <tr>
              <th></th>
              <th>{t("offerLetterRequest:candidate_name")}</th>
              <th>{t("offerLetterRequest:application_number")}</th>
              <th>{t("approvalHistory:state")}</th>
              <th>{t("approvalHistory:city")}</th>
              <th>{t("common:score")}</th>
              <th>{t("offerLetterRequest:joining_date")}</th>
              <th>{t("offerLetterRequest:offer_release_date")}</th>
              <th>{t("offerLetterRequest:accept_before")}</th>
              <th>{t("approvalHistory:status")}</th>
              <th>{t("common:action")}</th>
            </tr>
          </thead>

          <tbody>
            {candidates.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center py-4 text-muted">
                  {t("offerLetterRequest:no_candidates_found")}
                </td>
              </tr>
            ) : (
              candidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td>
                    <Form.Check
                      type="checkbox"
                      checked={selectedIds.has(candidate.id)}
                      disabled={candidate.status !== selectableStatus}
                      onChange={(e) => {
                        const updated = new Set(selectedIds);

                        if (e.target.checked) {
                          updated.add(candidate.id);
                        } else {
                          updated.delete(candidate.id);
                        }

                        setSelectedIds(updated);
                      }}
                    />
                  </td>

                  <td>
                    {candidate.name}{" "}
                    <button
                      className="btn btn-sm border-0 history-btn"
                      onClick={() => handleViewHistory(candidate.historyId)}
                    >
                      <img
                        src={history_icon}
                        alt="History"
                        width={14}
                        height={14}
                      />
                    </button>
                  </td>
                  <td>{candidate.applicationNumber}</td>
                  <td>{candidate.state}</td>
                  <td>{candidate.city}</td>
                  <td>{candidate.score}</td>
                  <td>{formatDateDDMMYYYY(candidate.joiningDate)}</td>
                  <td>{formatDateDDMMYYYY(candidate.offerReleaseDate)}</td>
                  <td>{formatDateDDMMYYYY(candidate.acceptBefore)}</td>
                  <td>
                    <span className={`badge bg-${candidate.statusBadge}`}>
                      {candidate.statusLabel}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <OverlayTrigger
                        placement="bottom"
                        overlay={
                          <Tooltip id={`offer-preview-${candidate.id}`}>
                            Preview Offer Letter
                          </Tooltip>
                        }
                      >
                        <span className="d-inline-block">
                          <button
                            className="btn btn-sm btn-outline-secondary border-0"
                            style={{ backgroundColor: "#eff6ff" }}
                            onClick={() =>
                              handleCandidateOfferPreview(
                                candidate.offerFileUrl
                              )
                            }
                            disabled={!candidate.offerFileUrl}
                          >
                            <i
                              className="bi bi-file-text"
                              style={{ color: "black" }}
                            />
                          </button>
                        </span>
                      </OverlayTrigger>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Modal
          show={showPreview}
          onHide={() => setShowPreview(false)}
          size="xl"
          centered
        >
          <Modal.Header closeButton>
            <h6 className="mb-0">{t("common:view_file")}</h6>
          </Modal.Header>

          <Modal.Body style={{ height: "85vh" }}>
            {previewUrl ? (
              <iframe
                src={previewUrl}
                width="100%"
                height="100%"
                title={t("offerLetterRequest:pdf_preview")}
                style={{ border: "none" }}
              />
            ) : (
              <div>{t("offerLetterRequest:no_preview_available")}</div>
            )}
          </Modal.Body>
        </Modal>
        <ApprovalCommentModal
          show={showCommentModal}
          actionType={actionType}
          onClose={() => setShowCommentModal(false)}
          onConfirm={handleConfirmAction}
        />
      </Container>
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

export default OfferLetterRequestApproval;
