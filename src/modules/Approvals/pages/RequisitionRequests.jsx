import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Badge,
  Spinner,
} from "react-bootstrap";
import { Search, ChevronDown, ChevronUp } from "react-bootstrap-icons";
import { useNavigate, useParams } from "react-router-dom";
import "../../../style/css/ApprovalsRequsition.css";
import start_icon from "../../../assets/start_icon.png";
import dept_icon from "../../../assets/dept_icon.jpg";
import end_icon from "../../../assets/end_icon.png";
import mingcute_department_line from "../../../assets/mingcute_department-line.png";
import vacancy_icon from "../../../assets/vacancy_icon.png";
import position_Icon from "../../../assets/position_Icon.png";
import view_jobpost from "../../../assets/view_jobpost.jpg";
import history_icon from "../../../assets/history_icon.png";
// Approvals components & validations
import ApprovalCommentModal from "../components/ApprovalCommentModal";
import ApprovalHistoryModal from "../components/ApprovalHistoryModal";
import { validateSelectedRequisitions } from "../validations/requisitionValidation";

// Job Posting hooks (NO extra "modules")
import { useJobPositionsByRequisition } from "../../jobPosting/hooks/useJobPositionsByRequisition";
import { useRequisitionApprovalHistory } from "../hooks/useRequisitionApprovalHistory";

//  Utilities
import { toast } from "react-toastify";

//  i18n
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useApprovalRequisitions } from "../hooks/useApprovalRequisitions";
import requisitionApiService from "../../jobPosting/services/requisitionApiService";
import masterApiService from "../../master/services/masterApiService";
import {
  getOrganizationPath,
  getSavedLoginOrganization,
} from "../../auth/services/organizationContextService";

const RequisitionRequests = () => {
  const { t } = useTranslation(["jobPostingsList", "common"]);

  const navigate = useNavigate();
  const { orgSlug } = useParams();
  const currentOrg = orgSlug || getSavedLoginOrganization();
  const [pageSize, setPageSize] = useState(10);

  const [showCommentModal, setShowCommentModal] = useState(false);
  const [actionType, setActionType] = useState(null); // "approve" | "reject"
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryReq, setSelectedHistoryReq] = useState(null);

  const handleApprovalAction = async (comment) => {
    const ids = [
      ...new Set(
        requisitions
          .filter((req) => selectedReqIds.has(req.id))
          .map((req) => (req.isDraft ? req.parentRequisitionId : req.id))
      ),
    ];

    if (ids.length === 0) return;

    const isApprove = actionType === "approve";

    try {
      let result;

      if (isApprove) {
        result = await approve(ids, comment);
      } else {
        result = await reject(ids, comment);
      }

      if (!result || result.success !== true) {
        toast.error(
          t(
            isApprove
              ? "jobPostingsList:failed_to_approve"
              : "jobPostingsList:failed_to_reject"
          )
        );
        return;
      }

      toast.success(
        t(
          isApprove
            ? "jobPostingsList:approved_successfully"
            : "jobPostingsList:rejected_successfully"
        )
      );

      setShowCommentModal(false);
      setSelectedReqIds(new Set());
    } catch (error) {
      console.error("Approval error:", error);

      toast.error(
        t(
          isApprove
            ? "jobPostingsList:failed_to_approve"
            : "jobPostingsList:failed_to_reject"
        )
      );
    }
  };
  const {
    history,
    setHistory,
    loading: historyLoading,
    fetchHistory,
  } = useRequisitionApprovalHistory();

  const handleOpenHistory = async (req) => {
    setShowHistoryModal(true);

    try {
      if (!req.isDraft) {
        await fetchHistory(req.id);
        return;
      }

      const [historyRes, usersRes] = await Promise.all([
        requisitionApiService.getDraftRequisitionApprovalHistory(req.id),
        masterApiService.getUser(),
      ]);

      const historyList = historyRes?.data || [];
      const usersList = usersRes?.data || [];

      const userMap = usersList.reduce((acc, user) => {
        acc[user.userId] = user.name;
        return acc;
      }, {});

      const historyData = historyList.map((item) => ({
        ...item,
        approverName: userMap[item.approverId] || item.approverRole || "-",
      }));

      setHistory(historyData);
    } catch (err) {
      console.error("Failed to fetch approval history", err);
      toast.error("Failed to load approval history");
    }
  };

  // 🔹 Backend-driven filters
  const [year, setYear] = useState("2026");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0); // backend is 0-based
  const { positionsByReq, loadingReqId, fetchPositions } =
    useJobPositionsByRequisition();
  const [openDept, setOpenDept] = useState({});
  const [statuses, setStatuses] = useState([]);
  const privileges = useSelector((state) => state.user.privileges);

  const isL1 = privileges?.["L1 Approval"];
  const isL2 = privileges?.["L2 Approval"];

  const approvalLevel = isL2 ? "L2" : isL1 ? "L1" : null;
  const formatStatusLabel = (status) => {
    if (!status) return "";

    return status
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  const statusOptions =
    approvalLevel === "L1"
      ? ["L1_PENDING", "L2_PENDING", "L1_REJECTED", "APPROVED", "L2_REJECTED"]
      : approvalLevel === "L2"
        ? ["L2_PENDING", "APPROVED", "L2_REJECTED"]
        : [];
  useEffect(() => {
    setStatuses([]);
    setSelectedReqIds(new Set());
  }, [approvalLevel]);

  // 🔹 Accordion
  const [openReqId, setOpenReqId] = useState(null);
  const toggleAccordion = (req) => {
    setOpenReqId((prev) => {
      const next = prev === req.id ? null : req.id;

      if (next) {
        fetchPositions(
          req.isDraft ? req.parentRequisitionId : req.id,
          req.isDraft
        );
      }

      return next;
    });
  };
  const toggleDeptAccordion = (reqId, deptId) => {
    setOpenDept((prev) => ({
      ...prev,
      [`${reqId}-${deptId}`]: !prev[`${reqId}-${deptId}`],
    }));
  };
  // 🔹 API Hook
  const { requisitions, loading, pageInfo, approve, reject } =
    useApprovalRequisitions({
      year,

      search,
      page,
      size: pageSize,
      statuses,
    });

  useEffect(() => {
    setPage(0);
  }, [pageSize]);

  const [selectedReqIds, setSelectedReqIds] = useState(new Set());
  const selectableStatus =
    approvalLevel === "L1"
      ? "L1_PENDING"
      : approvalLevel === "L2"
        ? "L2_PENDING"
        : null;

  const selectableRequisitions = requisitions.filter(
    (r) => r.status === selectableStatus
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(0); // reset pagination on new search
    }, 500); // ⏱️ 400–600ms is ideal

    return () => clearTimeout(timeout);
  }, [searchInput]);

  const allSelected =
    selectableRequisitions.length > 0 &&
    selectableRequisitions.every((r) => selectedReqIds.has(r.id));

  useEffect(() => {
    setSelectedReqIds(new Set());
  }, [year]);

  const formatDateDDMMYYYY = (isoDate) => {
    if (!isoDate) return "";

    const [year, month, day] = isoDate.split("-");
    return `${day}-${month}-${year}`;
  };
  const getVisiblePages = (currentPage, totalPages) => {
    const windowSize = 3;

    let start = currentPage - 1;
    let end = currentPage + 2;

    // Clamp start & end
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

  const groupPositionsByDept = (positions) => {
    return positions.reduce((acc, pos) => {
      if (!acc[pos.deptId]) {
        acc[pos.deptId] = {
          departmentName: pos.departmentName,
          positions: [],
        };
      }
      acc[pos.deptId].positions.push(pos);
      return acc;
    }, {});
  };

  const renderDepartment = ({
    dept,
    req,
    openDept,
    toggleDeptAccordion,
    navigate,
    t,
  }) => {
    const isOpen = openDept[`${req.id}-${dept.departmentName}`];

    return (
      <div key={dept.departmentName} className="department-card mb-3">
        <div
          className="department-header d-flex align-items-center gap-2 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            toggleDeptAccordion(req.id, dept.departmentName);
          }}
        >
          <img src={dept_icon} className="icon-22" alt="dept_icon" />
          <span className="depname">{dept.departmentName}</span>

          <Badge bg="light" text="primary" className="deppos">
            {dept.positions.length}{" "}
            {dept.positions.length === 1
              ? t("jobPostingsList:position")
              : t("jobPostingsList:positions_plural")}
          </Badge>

          <Button
            variant="none"
            className="accordion-arrow-position ms-auto"
            onClick={(e) => {
              e.stopPropagation();
              toggleDeptAccordion(req.id, dept.departmentName);
            }}
          >
            {isOpen ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>

        {isOpen &&
          dept.positions.map((pos) => (
            <div key={pos.positionId} className="position-card-inner">
              <div className="position-header-row">
                <div className="position-title">{pos.positionName}</div>

                <div className="position-meta-inline">
                  <span>
                    <b>{t("jobPostingsList:vacancies")}:</b> {pos.vacancies}
                  </span>

                  <span>
                    <b>{t("jobPostingsList:age")}:</b> {pos.minAge} -{" "}
                    {pos.maxAge} {t("jobPostingsList:years")}
                  </span>
                </div>

                <Button
                  variant="light"
                  className="icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(
                      getOrganizationPath(
                        `/job-posting/${req.id}/add-position?positionId=${pos.positionId}`,
                        currentOrg
                      ),
                      {
                        state: {
                          mode: "view",
                          from: "approval",
                          isDraft: req.isDraft === true,
                          parentRequisitionId: req.parentRequisitionId,
                        },
                      }
                    );
                  }}
                >
                  <img src={view_jobpost} className="icon-19" alt="view" />
                </Button>
              </div>

              <div className="position-details">
                <div style={{ whiteSpace: "pre-line" }}>
                  <span>{t("jobPostingsList:mandatory_education")}:</span>{" "}
                  {pos.mandatoryEducation}
                </div>

                <div style={{ whiteSpace: "pre-line" }}>
                  <span>{t("jobPostingsList:preferred_education")}:</span>{" "}
                  {pos.preferredEducation?.trim() || "NA"}
                </div>
              </div>
            </div>
          ))}
      </div>
    );
  };
  return (
    <div className="requisition-request">
      <Container fluid className="requisition-page">
        {/* ================= HEADER ================= */}
        <Row className="mb-3 align-items-center">
          <Col>
            <h5 className="page-title">{t("requisitionRequests")}</h5>
            <p className="page-subtitle">
              {t("review_and_approve_or_reject_requisition_requests")}
            </p>
          </Col>

          <Col xs={12} md={4}>
            <div className="search-boxpost">
              <Search />
              <Form.Control
                type="text"
                placeholder={t("search_placeholder")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </Col>
          <Col xs={12} md={2} className="filters-row">
            <Form.Select
              value={statuses[0] || ""}
              className="status-filter"
              onChange={(e) => {
                const value = e.target.value;
                setPage(0);

                if (!value) {
                  setStatuses([]);
                } else {
                  setStatuses([value]);
                }
              }}
            >
              <option value="">{t("jobPostingsList:status_all")}</option>

              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {t(`jobPostingsList:status_${status.toLowerCase()}`)}
                </option>
              ))}
            </Form.Select>
          </Col>
        </Row>

        {/* ================= BULK ACTIONS ================= */}
        <Row className="bulk-actions align-items-center mb-3">
          <Col xs={12} md={6} className="selectcheck">
            <Form.Check
              type="checkbox"
              id="select-all-requisitions"
              className="selectall d-flex align-items-center"
              label={t("jobPostingsList:select_all")}
              checked={allSelected}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedReqIds(
                    new Set(selectableRequisitions.map((r) => r.id))
                  );
                } else {
                  setSelectedReqIds(new Set());
                }
              }}
            />
          </Col>
          <Col xs={12} md={6} className="d-flex justify-content-end gap-2">
            <Button
              variant="outline-danger"
              className="px-4 reject-btn"
              disabled={loading || selectedReqIds.size === 0}
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
              {t("reject")}
            </Button>

            <Button
              variant="outline-success"
              className="px-4 approve-btn"
              disabled={loading || selectedReqIds.size === 0}
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
              {t("approve")}
            </Button>
          </Col>
        </Row>

        {/* ================= LOADER ================= */}
        {loading && (
          <div className="text-center my-4">
            <Spinner animation="border" />
          </div>
        )}

        {/* ================= LIST ================= */}
        {!loading && requisitions.length === 0 && (
          <div className="text-center text-muted my-4">
            {t("jobPostingsList:no_requisitions")}
          </div>
        )}

        {requisitions.map((req) => {
          const positionsKey = `${
            req.isDraft ? req.parentRequisitionId : req.id
          }_${req.isDraft}`;
          const positions = positionsByReq[positionsKey] || [];

          const positionsGroupedByDept = groupPositionsByDept(positions);

          return (
            <div
              key={req.id}
              className={`requisition-card mb-3 ${req.isDraft ? "draft-card" : ""}`}
            >
              <Row
                className="align-items-center req-clickable"
                onClick={() => toggleAccordion(req)}
              >
                {/* -------- LEFT -------- */}
                <Col xs={12} md={6}>
                  <div className="req-header">
                    <Badge bg="light" text="primary" className="req-id">
                      {req.requisitionId}
                    </Badge>
                    <Badge
                      bg={req.statusType}
                      className="ms-2 capitalize-status"
                    >
                      {formatStatusLabel(req.status)}
                    </Badge>
                  </div>

                  <div className="d-flex justify-content-between align-items-start">
                    <div className="d-flex align-items-start">
                      <Form.Check
                        type="checkbox"
                        className="me-2 mt-2"
                        checked={selectedReqIds.has(req.id)}
                        disabled={req.status !== selectableStatus}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          if (req.status === "Approved") return;

                          setSelectedReqIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) {
                              next.add(req.id);
                            } else {
                              next.delete(req.id);
                            }
                            return next;
                          });
                        }}
                      />
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <h6 className="req-code mb-0">{req.code}</h6>

                          <img
                            src={history_icon}
                            alt="history_icon"
                            className="icon-20his"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenHistory(req);
                            }}
                          />
                        </div>
                        <div className="req-dates">
                          <div>
                            <img
                              src={start_icon}
                              alt="start_icon"
                              className="icon-12"
                            />{" "}
                            {t("jobPostingsList:start_date")}:{" "}
                            {formatDateDDMMYYYY(req.startDate)}
                          </div>
                          <div>
                            <img
                              src={end_icon}
                              alt="end_icon"
                              className="icon-12"
                            />{" "}
                            {t("jobPostingsList:end_date")}:{" "}
                            {formatDateDDMMYYYY(req.endDate)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col xs={12} md={4}>
                  <div className="req-meta">
                    <div>
                      <img
                        src={mingcute_department_line}
                        alt="department"
                        className="icon-16"
                      />{" "}
                      {t("jobPostingsList:department")} - {req.departments}
                    </div>
                    <div>
                      <img
                        src={position_Icon}
                        alt="position"
                        className="icon-16"
                      />{" "}
                      {t("jobPostingsList:positions")} - {req.positions}
                    </div>
                    <div>
                      <img
                        src={vacancy_icon}
                        alt="vacancy"
                        className="icon-23"
                      />{" "}
                      {t("jobPostingsList:vacancies")} - {req.vacancies}
                    </div>
                  </div>
                </Col>

                {/* -------- ACTIONS -------- */}
                <Col
                  xs={12}
                  md={2}
                  className="text-md-end mt-3 mt-md-0 actions d-flex justify-content-end align-items-center gap-2"
                >
                  <Button
                    variant="light"
                    className="icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!req.isDraft) {
                        	
					          navigate(
                          getOrganizationPath(
                            `/job-posting/create-requisition?id=${req.id}`,
                            currentOrg
                          ),
                          {
                            state: {
                              mode: "view",
                              from: "approval",
                            },
                          }
                        );
						

                        return;
                      }

                      // DRAFT REQUISITION
                    navigate(
                      getOrganizationPath(
                        `/job-posting/create-requisition?id=${req.parentRequisitionId}`,
                        currentOrg
                      ),
                        {
                          state: {
                            mode: "view",
                            from: "approval",
                            isDraftView: true,
                          },
                        }
                      );
                    }}
                  >
                    <img src={view_jobpost} alt="view" className="icon-19" />
                  </Button>

                  <Button
                    variant="none"
                    className="accordion-arrow"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAccordion(req);
                    }}
                  >
                    {openReqId === req.id ? <ChevronUp /> : <ChevronDown />}
                  </Button>
                </Col>
              </Row>

              {/* -------- ACCORDION BODY (STATIC FOR NOW) -------- */}
              {openReqId === req.id && (
                <div className="accordion-body mt-3">
                  {loadingReqId === req.id && (
                    <Spinner animation="border" size="sm" />
                  )}

                  {!loadingReqId && positions.length === 0 && (
                    <div className="text-muted">
                      {t("jobPostingsList:no_positions")}
                    </div>
                  )}

                  {Object.values(positionsGroupedByDept).map((dept) =>
                    renderDepartment({
                      dept,
                      req,
                      openDept,
                      toggleDeptAccordion,
                      navigate,
                      t,
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
        {/* ================= PAGINATION ================= */}
        {pageInfo && pageInfo.totalPages > 1 && (
          <Row className="mt-4 mb-4">
            <Col className="d-flex justify-content-end align-items-center gap-3">
              {/* Page size */}
              <div className="d-flex align-items-center gap-2">
                <span className="pagesize">
                  {t("jobPostingsList:page_size")}:
                </span>
                <Form.Select
                  size="sm"
                  style={{ width: "90px" }}
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(0);
                  }}
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
                  <li
                    className={`page-item ${page === 0 || loading ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setPage((p) => Math.max(p - 1, 0))}
                      disabled={page === 0 || loading}
                    >
                      &laquo;
                    </button>
                  </li>

                  {/* Pages */}
                  {(() => {
                    const { pages, showStartEllipsis, showEndEllipsis } =
                      getVisiblePages(page, pageInfo.totalPages);

                    return (
                      <>
                        {/* Leading ellipsis */}
                        {showStartEllipsis && (
                          <li className="page-item disabled">
                            <span className="page-link">…</span>
                          </li>
                        )}

                        {/* Page numbers */}
                        {pages.map((p) => (
                          <li
                            key={p}
                            className={`page-item ${page === p ? "active" : ""}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => setPage(p)}
                              disabled={loading}
                            >
                              {p + 1}
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

                  {/* Next */}
                  <li
                    className={`page-item ${
                      page >= pageInfo.totalPages - 1 || loading
                        ? "disabled"
                        : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= pageInfo.totalPages - 1 || loading}
                    >
                      &raquo;
                    </button>
                  </li>
                </ul>
              </nav>
            </Col>
          </Row>
        )}
        <ApprovalCommentModal
          show={showCommentModal}
          actionType={actionType}
          onClose={() => setShowCommentModal(false)}
          onConfirm={handleApprovalAction}
        />
        <ApprovalHistoryModal
          show={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          historyData={history}
          loading={historyLoading}
        />
      </Container>
    </div>
  );
};

export default RequisitionRequests;
