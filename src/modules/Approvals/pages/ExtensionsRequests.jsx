import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Form, Button, Badge } from "react-bootstrap";
import "../../../style/css/Extensions.css";
import start_icon from "../../../assets/start_icon.png";
import end_icon from "../../../assets/end_icon.png";
import history_icon from "../../../assets/history_icon.png";
import ApprovalCommentModal from "../components/ApprovalCommentModal";
import ApprovalHistoryModal from "../components/ApprovalHistoryModal";
import { useTranslation } from "react-i18next";
import Select from "react-select";

import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faLayerGroup,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { validateSelectedRequisitions } from "../validations/requisitionValidation";

//  Mapper
import useExtensionRequests from "../hooks/useExtensionRequests";
import MessageHistory from "../../Messages/components/messageHistory";
import committeeManagementService from "../../committeeManagement/services/committeeManagementService";
import { useSelector } from "react-redux";

const ExtensionsRequests = () => {
  const { t } = useTranslation([
    "jobPostingsList",
    "common",
    "extensionsRequests",
  ]);
  const [pageSize, setPageSize] = useState(10);

  const [showCommentModal, setShowCommentModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryReq, setSelectedHistoryReq] = useState(null);

  // Filters
  const [status, setStatus] = useState("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);

  const [selectedReqIds, setSelectedReqIds] = useState(new Set());
  // Requisition & Position state
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const formatDate = (date) => {
    if (!date) return "-";

    const d = new Date(date);

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const formatTime = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const selectStyles = {
    control: (base) => ({
      ...base,
      height: "38px",
      minHeight: "38px", // 🔥 override default 38px
      fontSize: "14px",
    }),

    valueContainer: (base) => ({
      ...base,
      height: "38px",
      padding: "0 8px", // 🔥 remove vertical padding
    }),

    indicatorsContainer: (base) => ({
      ...base,
      height: "34px",
    }),

    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
    }),

    singleValue: (base) => ({
      ...base,
      fontSize: "14px",
    }),

    placeholder: (base) => ({
      ...base,
      fontSize: "14px",
    }),

    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
  };
  const [selectedRequestType, setSelectedRequestType] = useState(null);
  const privileges = useSelector((state) => state.user.privileges);

  const [openThreadId, setOpenThreadId] = useState(null);
  const {
    requisitionOptions,
    positionOptions,
    requestTypeOptions,
    extensionRequests,
    setExtensionRequests,
    loadingRequisitions,
    loadingPositions,
    fetchRequisitions,
    fetchPositions,
    fetchRequestTypes,
    fetchExtensionRequests,
    setPositionOptions,
    approvalPage,
    threadMessagesMap,
    fetchThreadMessages,
    historyData,
    loadingHistory,
    fetchApprovalHistory,
    fetchInterviewCenters,
    zonalDisplayMap,
  } = useExtensionRequests();

  useEffect(() => {
    fetchRequisitions();
    fetchInterviewCenters();
  }, [fetchRequisitions, fetchInterviewCenters]);

  const handleToggleThread = async (threadId) => {
    if (!threadId) return;

    if (!threadMessagesMap[threadId]) {
      await fetchThreadMessages(threadId);
    }

    setOpenThreadId((prev) => (prev === threadId ? null : threadId));
  };

  const onRequisitionChange = async (req) => {
    setSelectedRequisition(req);
    setSelectedPosition(null);
    setSelectedRequestType(null);
    setPositionOptions([]);
    setExtensionRequests([]);
    setPage(0);

    if (!req?.id) return;
    await fetchPositions(req.id);
  };

  const onPositionChange = (pos) => {
    setSelectedPosition(pos);
    setPage(0);
  };

  useEffect(() => {
    if (!selectedRequisition?.id || !selectedPosition?.positionId) {
      setExtensionRequests([]);
      return;
    }

    fetchExtensionRequests({
      requisitionId: selectedRequisition.id,
      positionId: selectedPosition.positionId,
      requestTypeId: selectedRequestType?.requestTypeId,
      status,
      searchInput,
      page,
      size: pageSize,
    });
  }, [
    selectedRequisition?.id,
    selectedPosition?.positionId,
    selectedRequestType?.requestTypeId,
    status,
    searchInput,
    page,
    pageSize,
    fetchExtensionRequests,
    setExtensionRequests,
  ]);
  useEffect(() => {
    fetchRequestTypes();
  }, [fetchRequestTypes]);
  const selectedRequisitionOption = selectedRequisition
    ? {
        label: `${selectedRequisition.requisitionCode}- ${selectedRequisition.requisitionTitle}`,
        value: selectedRequisition.id,
        raw: selectedRequisition,
      }
    : null;

  const selectedPositionOption = selectedPosition
    ? {
        label: selectedPosition.positionName,
        value: selectedPosition.positionId,
        raw: selectedPosition,
      }
    : null;

  const isL1 = privileges?.["L1 Approval"];
  const isL2 = privileges?.["L2 Approval"];

const statusOptionsByApproval = {
  L1: [
    { value: "ALL", label: t("common:all") },
    { value: "L1_PENDING", label: t("common:l1_pending") },
    { value: "L2_PENDING", label: t("common:l2_pending") },
    { value: "L1_REJECTED", label: t("common:l1_rejected") },
    { value: "L2_REJECTED", label: t("common:l2_rejected") },
    { value: "APPROVED", label: t("common:approved") },
  ],

  L2: [
    { value: "ALL", label: t("common:all") },
    { value: "L2_PENDING", label: t("common:l2_pending") },
    { value: "L2_REJECTED", label: t("common:l2_rejected") },
    { value: "APPROVED", label: t("common:approved") },
  ],
};
  const requestTypeCol = isL2 ? 3 : 2;
  const statusCol = isL2 ? 2 : 1;

 const {  i18n } = useTranslation([
  "jobPostingsList",
  "common",
  "extensionsRequests",
]);

const statusOptions = useMemo(() => {
  if (isL1) return statusOptionsByApproval.L1;
  if (isL2) return statusOptionsByApproval.L2;

  return [
    {
      value: "ALL",
      label: t("common:all"),
    },
  ];
}, [isL1, isL2, i18n.language]);

const requestTypeDropdownOptions = useMemo(() => {
  const options = [
    {
      label: t("common:all"),
      value: "ALL",
      raw: null,
    },
    ...requestTypeOptions,
  ];

  if (isL2) {
    return options.filter(
      (opt) =>
        opt.value === "ALL" ||
        !opt.label?.toLowerCase().includes("zone office change request")
    );
  }

  return options;
}, [isL2, requestTypeOptions, i18n.language]);

  const getStatusBadge = (status = "") => {
    switch (status) {
      case "L1_PENDING":
        return "warning";

      case "L2_PENDING":
        return "info";

      case "APPROVED":
        return "success";

      case "L1_REJECTED":
      case "L2_REJECTED":
        return "danger";

      default:
        return "secondary";
    }
  };

  const formatStatus = (status = "") => {
    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const paginatedData = extensionRequests;
  const totalPages = approvalPage?.totalPages || 0;

  const getApprovalStatus = (actionType) => {
    if (isL1) {
      return actionType === "approve" ? "L2_PENDING" : "L1_REJECTED";
    }

    if (isL2) {
      return actionType === "approve" ? "APPROVED" : "L2_REJECTED";
    }

    return actionType === "approve" ? "APPROVED" : "REJECTED";
  };

  const handleApprovalAction = async (comment) => {
    const threadIds = Array.from(selectedReqIds);

    if (!threadIds.length) return;

    try {
      const payload = {
        conversationThreadId: threadIds,
        status: getApprovalStatus(actionType),
        comments: comment,
      };

      const res =
        await committeeManagementService.submitForL1L2Approval(payload);

      if (res?.success !== true) {
        toast.error(
          res?.data || res?.message || t("extensionsRequests:failed_to_submit")
        );
        return;
      }

      toast.success(
        actionType === "approve"
          ? t("extensionsRequests:approved_successfully")
          : t("extensionsRequests:rejected_successfully")
      );

      setSelectedReqIds(new Set());
      setShowCommentModal(false);
      await fetchExtensionRequests({
        requisitionId: selectedRequisition?.id,
        positionId: selectedPosition?.positionId,
        requestTypeId: selectedRequestType?.requestTypeId,
        status,
        page,
        size: pageSize,
      });
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          t("extensionsRequests:failed_to_submit")
      );
    }
  };

  const handleOpenHistory = async (req) => {
    if (!req?.conversationThreadId) {
      toast.error(t("extensionsRequests:conversation_thread_not_found"));
      return;
    }

    setSelectedHistoryReq(req);
    setShowHistoryModal(true);
    await fetchApprovalHistory(req.conversationThreadId);
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [status, searchInput, pageSize]);

  const isCheckboxDisabled = (req) => {
    const status = req?.status;

    // L1 users can act only on L1_PENDING
    if (isL1) {
      return status !== "L1_PENDING";
    }

    // L2 users can act only on L2_PENDING
    if (isL2) {
      return status !== "L2_PENDING";
    }

    // default fallback
    return true;
  };

  const getVisiblePages = (currentPage, totalPages) => {
    const windowSize = 3;

    let start = currentPage - 1;
    let end = currentPage + 2;

    if (start < 0) {
      start = 0;
      end = windowSize;
    }

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(0, end - windowSize);
    }

    const pages = [];
    for (let i = start; i < end; i++) {
      pages.push(i);
    }

    return {
      pages,
      showStartEllipsis: start > 0,
      showEndEllipsis: end < totalPages,
    };
  };

  return (
    <div className="extension_request">
      <Container fluid className="extensions-page">
        {/* ================= HEADER ================= */}
        <Row className="mb-3 align-items-center">
          <Col>
            <h5 className="page-title">
              {" "}
              {isL1
                ? t("extensionsRequests:extension_zone_change_requests")
                : t("extensionsRequests:extension_requests")}
            </h5>
            <p className="page-subtitle">
              {isL1
                ? t("extensionsRequests:review_extension_zone_change_requests")
                : t("extensionsRequests:review_extension_requests")}
            </p>
          </Col>
        </Row>

        {/* Requisition */}

        <Row className="mb-3 align-items-end filters-row border rounded p-3 bulk-actions">
          <Col xs={12} md={4}>
            <div className="field-label">
              {" "}
              {t("extensionsRequests:requisition")}
            </div>
            <Select
              placeholder={t("extensionsRequests:select_requisition")}
              styles={selectStyles}
              classNamePrefix="react-select"
              menuPortalTarget={document.body}
              options={requisitionOptions}
              isLoading={loadingRequisitions}
              value={selectedRequisitionOption}
              onChange={(opt) => {
                onRequisitionChange(opt?.raw || null);
                onPositionChange(null);
                setPage(0);
              }}
            />
          </Col>

          {/* Position */}
          <Col xs={12} md={4}>
            <div className="field-label">
              {" "}
              {t("extensionsRequests:position")}
            </div>
            <Select
              styles={selectStyles}
              classNamePrefix="react-select"
              placeholder={t("extensionsRequests:select_position")}
              menuPortalTarget={document.body}
              options={positionOptions}
              isLoading={loadingPositions}
              value={selectedPositionOption}
              isDisabled={!selectedRequisitionOption}
              onChange={(opt) => {
                onPositionChange(opt?.raw || null);
                setPage(0);
              }}
            />
          </Col>
          <Col xs={12} md={2}>
            <div className="field-label">
              {" "}
              {t("extensionsRequests:request_type")}
            </div>
            <Form.Select
              className="status-select"
              value={selectedRequestType?.requestTypeId || "ALL"}
              onChange={(e) => {
                const value = e.target.value;

                if (value === "ALL") {
                  setSelectedRequestType(null);
                } else {
                  const selected = requestTypeOptions.find(
                    (item) => item.value === value
                  );
                  setSelectedRequestType(selected?.raw || null);
                }

                setPage(0);
              }}
            >
              {requestTypeDropdownOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={12} md={2}>
            <div className="field-label">{t("extensionsRequests:status")}</div>
            <Form.Select
              className="status-select"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Form.Select>
          </Col>
        </Row>
        <Row className="align-items-center mt-4 mb-4">
          <Col xs={12} md={12} className="d-flex justify-content-end gap-2 ">
            <Button
              variant="outline-danger"
              className="px-4 reject-btn"
              disabled={selectedReqIds.size === 0}
              onClick={() => {
                const errors = validateSelectedRequisitions(selectedReqIds);

                if (errors.length > 0) {
                  errors.forEach((err) => toast.error(err));
                  return;
                }
                setActionType("reject");
                setShowCommentModal(true);
              }}
            >
              {t("extensionsRequests:reject")}
            </Button>

            <Button
              variant="outline-success"
              className="px-4 approve-btn"
              disabled={selectedReqIds.size === 0}
              onClick={() => {
                const errors = validateSelectedRequisitions(selectedReqIds);

                if (errors.length > 0) {
                  errors.forEach((err) => toast.error(err));
                  return;
                }

                setActionType("approve");
                setShowCommentModal(true);
              }}
            >
              {t("extensionsRequests:approve")}
            </Button>
          </Col>
        </Row>

        {paginatedData.length === 0 ? (
          <div className="text-center text-muted my-4">
            {isL1
              ? t("extensionsRequests:no_extension_zone_change_requests_found")
              : t("extensionsRequests:no_extension_requests_found")}
          </div>
        ) : (
          <>
            {paginatedData.map((req) => {
              const isOpen = openThreadId === req.conversationThreadId;

              const historyItems = (
                threadMessagesMap[req.conversationThreadId] || []
              ).map((msg) => ({
                title: msg.senderType,
                comment: msg.comments || msg.message || msg.content || "-",

                time: `${formatDate(msg.createdDate)} ${formatTime(msg.createdDate)}`,
                attachmentPath: msg.attachmentPath || null,
              }));

              return (
                <div
                  key={req.conversationThreadId}
                  className="bulk-actions align-items-center mt-3 mb-3"
                >
                  <Row className="align-items-center gx-3">
                    <Col xs="auto" className="checkbox-col me-3">
                      <Form.Check
                        type="checkbox"
                        checked={selectedReqIds.has(req.conversationThreadId)}
                        disabled={isCheckboxDisabled(req)}
                        onChange={(e) => {
                          if (isCheckboxDisabled(req)) return;

                          setSelectedReqIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) {
                              next.add(req.conversationThreadId);
                            } else {
                              next.delete(req.conversationThreadId);
                            }
                            return next;
                          });
                        }}
                      />
                    </Col>

                    <Col md={4}>
                      <div
                        className="d-flex align-items-center gap-3"
                        style={{ cursor: "pointer" }}
                      >
                        <div className="avatar-circle">
                          {req.candidateName
                            ?.split(" ")
                            .filter(Boolean)
                            .map((word) => word.charAt(0).toUpperCase())
                            .slice(0, 2)
                            .join("")}
                        </div>

                        <div className="user-info">
                          <div className="user-name-row">
                            <span className="user-name">
                              {req.candidateName || "-"}
                            </span>

                            <img
                              src={history_icon}
                              alt="history_icon"
                              className="icon-14 mb-2 cursor-pointer"
                              onClick={() => handleOpenHistory(req)}
                            />
                          </div>

                          <div className="user-meta">
                            <div className="reg-no">
                              {t("extensionsRequests:application_number")}:{" "}
                              {req.applicationNo || "-"}
                            </div>

                            <div className="date-row d-flex align-items-center gap-3">
                              {/* Date */}
                              <div className="d-flex align-items-center gap-1">
                                <img
                                  src={start_icon}
                                  alt="start_icon"
                                  className="icon-14"
                                />

                                <span>{formatDate(req.createdDate)}</span>
                              </div>

                              {/* Time */}
                              <div className="d-flex align-items-center gap-1">
                                <img
                                  src={end_icon}
                                  alt="end_icon"
                                  className="icon-14"
                                />

                                <span>{formatTime(req.createdDate)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Col>

                    <Col xs={12} md={2} className="data-col">
                      <div className="d-flex align-items-start gap-2">
                        <FontAwesomeIcon
                          icon={faCalendarDays}
                          className="text-muted mt-1"
                          style={{ fontSize: "18px" }}
                        />

                        <div>
                          <div className="field-label">
                            {t("extensionsRequests:extension_date")}
                          </div>

                          <div className="field-value">
                            {req.dateExtension
                              ? formatDate(req.dateExtension)
                              : "-"}
                          </div>
                        </div>
                      </div>
                    </Col>

                    <Col xs={12} md={requestTypeCol} className="data-col">
                      <div className="d-flex align-items-start gap-2">
                        <FontAwesomeIcon
                          icon={faLayerGroup}
                          className="text-muted mt-1"
                          style={{ fontSize: "18px" }}
                        />

                        <div>
                          <div className="field-label">
                            {t("extensionsRequests:request_type")}
                          </div>

                          <div className="field-value">
                            {requestTypeOptions.find(
                              (type) => type.value === req.requestTypeId
                            )?.label || "-"}
                          </div>
                        </div>
                      </div>
                    </Col>
                    {!isL2 && (
                      <Col xs={12} md={2} className="data-col">
                        <div className="d-flex align-items-start gap-2">
                          <FontAwesomeIcon
                            icon={faLocationDot}
                            className="text-muted mt-1"
                            style={{ fontSize: "18px" }}
                          />

                          <div>
                            <div className="field-label">
                              {t("extensionsRequests:zone_change")}
                            </div>

                            <div className="field-value">
                              {zonalDisplayMap[req.zonalId] || "-"}
                            </div>
                          </div>
                        </div>
                      </Col>
                    )}

                    <Col
                      xs={12}
                      md={statusCol}
                      className="data-col d-flex align-items-center justify-content-between"
                    >
                      <div>
                        <Badge bg={getStatusBadge(req.status)}>
                          {formatStatus(req.status)}
                        </Badge>
                      </div>

                      <button
                        type="button"
                        className="btn btn-link p-0 ms-4"
                        onClick={() =>
                          handleToggleThread(req.conversationThreadId)
                        }
                        style={{ textDecoration: "none" }}
                      >
                        <i
                          className={`bi ${isOpen ? "bi-chevron-up" : "bi-chevron-down"}`}
                        ></i>
                      </button>
                    </Col>
                  </Row>

                  {isOpen && (
                    <Row className="mt-3 border-top pt-3">
                      <Col xs={12}>
                        <div className="p-3 border rounded bg-white">
                          <MessageHistory item={{ history: historyItems }} />
                        </div>
                      </Col>
                    </Row>
                  )}
                </div>
              );
            })}
          </>
        )}

        {totalPages > 1 && (
          <Row className="mt-4 mb-4">
            <Col className="d-flex justify-content-end align-items-center gap-3">
              {/* Page size */}
              <div className="d-flex align-items-center gap-2">
                <span className="fw-semibold pagesize">
                  {t("extensionsRequests:page_size")}:
                </span>
                <Form.Select
                  size="sm"
                  style={{ width: "90px" }}
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  {[5, 10, 15, 20, 25, 30].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Form.Select>
              </div>

              {/* Pagination */}
              <nav aria-label="Page navigation">
                <ul className="pagination mb-0 justify-content-center">
                  {/* Prev */}
                  <li className={`page-item ${page === 0 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setPage((p) => Math.max(p - 1, 0))}
                      disabled={page === 0}
                    >
                      &laquo;
                    </button>
                  </li>

                  {/* Pages */}
                  {(() => {
                    const { pages, showStartEllipsis, showEndEllipsis } =
                      getVisiblePages(page, totalPages);

                    return (
                      <>
                        {showStartEllipsis && (
                          <li className="page-item disabled">
                            <span className="page-link">…</span>
                          </li>
                        )}

                        {pages.map((p) => (
                          <li
                            key={p}
                            className={`page-item ${page === p ? "active" : ""}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => setPage(p)}
                            >
                              {p + 1}
                            </button>
                          </li>
                        ))}

                        {showEndEllipsis && (
                          <li className="page-item disabled">
                            <span className="page-link">…</span>
                          </li>
                        )}
                      </>
                    );
                  })()}

                  {/* Next */}
                  <li
                    className={`page-item ${page >= totalPages - 1 ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= totalPages - 1}
                    >
                      &raquo;
                    </button>
                  </li>
                </ul>
              </nav>
            </Col>
          </Row>
        )}

        {/* Modals */}
        <ApprovalCommentModal
          show={showCommentModal}
          actionType={actionType}
          onClose={() => setShowCommentModal(false)}
          onConfirm={handleApprovalAction}
        />
        <ApprovalHistoryModal
          show={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          historyData={historyData}
          loading={loadingHistory}
        />
      </Container>
    </div>
  );
};

export default ExtensionsRequests;
