// src/modules/jobPostings/pages/JobPostingsList.jsx

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
import {
  Search,
  ChevronDown,
  ChevronUp,
  InfoCircle,
  XCircleFill,
} from "react-bootstrap-icons";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { Modal } from "react-bootstrap";
import { getOrganizationPath } from "../../auth/services/organizationContextService";
import "../../../style/css/JobPostingsList.css";
import DeleteConfirmationModal from "../component/DeleteConfirmationModal";
import ConfirmationModal from "../component/ConfirmationModal";
import ApprovalHistoryModal from "../../Approvals/components/ApprovalHistoryModal";
import { useRequisitionApprovalHistory } from "../../Approvals/hooks/useRequisitionApprovalHistory";
import ApprovedInfoStrip from "../../jobPosting/component/ApprovedInfoStrip";
import CloseRequisitionModal from "../../jobPosting/component/CloseRequisitionModal";
import jobPositionApiService from "../services/jobPositionApiService";
import { mapVacancyBreakdown } from "../../jobPosting/mappers/vacancyBreakdownMapper";

import start_icon from "../../../assets/start_icon.png";
import dept_icon from "../../../assets/dept_icon.jpg";
import end_icon from "../../../assets/end_icon.png";
import submitIcon from "../../../assets/submitIcon.png";
import pos_edit_icon from "../../../assets/pos_edit_icon.jpg";
import pos_delete_icon from "../../../assets/pos_delete_icon.jpg";
import pos_plus_icon from "../../../assets/pos_plus_icon.png";
import mingcute_department_line from "../../../assets/mingcute_department-line.png";
import vacancy_icon from "../../../assets/vacancy_icon.png";
import position_Icon from "../../../assets/position_Icon.png";
import view_jobpost from "../../../assets/view_jobpost.jpg";
import history_icon from "../../../assets/history_icon.png";
import { useJobRequisitions } from "../hooks/useJobAllRequisition";
import { useJobPositionsByRequisition } from "../hooks/useJobPositionsByRequisition";
import masterApiService from "../../master/services/masterApiService";
import { toast } from "react-toastify";
import { validateRequisitionSubmission } from "../validations/validateRequisitionSubmission";
import CreatePlus_Icon from "../../../assets/CreatePlus_Icon.png";
import { useTranslation } from "react-i18next";
import requisitionApiService from "../services/requisitionApiService";
import Loader from "../../../shared/components/Loader";
import SinglePositionInfoModal from "../component/SinglePositionInfoModal";
import { mapVacancyBreakdownByPosition } from "../mappers/VacancyBreakdownBySinglePosition";

const JobPostingsList = () => {
  const { orgSlug } = useParams();
  const { t } = useTranslation(["jobPostingsList", "common"]);

  const formatStatusLabel = (status = "") =>
    status
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [pageSize, setPageSize] = useState(10);

  const [showDeletePosModal, setShowDeletePosModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [departmentId, setDepartmentId] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [showApprovedInfo, setShowApprovedInfo] = useState(false);
  const [selectedReqInfo, setSelectedReqInfo] = useState(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedCloseReq, setSelectedCloseReq] = useState(null);
  const [masterData, setMasterData] = useState({});
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [selectedPositionInfo, setSelectedPositionInfo] = useState(null);
  const [selectedReqForModal, setSelectedReqForModal] = useState(null);
  const [parentReqDetails, setParentReqDetails] = useState({});
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
  const handleConfirmDelete = async () => {
    if (!selectedReq) return;

    try {
      if (selectedReq.isDraft) {
        await requisitionApiService.cancelDraftRequisition(
          selectedReq.parentRequisitionId
        );
      } else {
        await deleteRequisition(selectedReq.id);
      }

      setShowDeleteModal(false);
      setSelectedReq(null);

      // 🔥 refresh list (important)
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDeletePosition = async () => {
    if (!selectedPosition) return;

    await deletePosition(
      selectedPosition.requisitionId,
      selectedPosition.positionId,
      selectedPosition.isDraft
    );
    // fetchPositions(selectedPosition.requisitionId);
    fetchPositions(
      selectedPosition.isDraft
        ? selectedPosition.parentRequisitionId
        : selectedPosition.requisitionId,
      selectedPosition.isDraft
    );
    refetch();
    setShowDeletePosModal(false);
    setSelectedPosition(null);
  };
  // 🔹 Backend-driven filters
  const [status, setStatus] = useState(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0); // backend is 0-based
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const { positionsByReq, loadingReqId, fetchPositions, deletePosition } =
    useJobPositionsByRequisition();

  // 🔹 Accordion
  const [openReqId, setOpenReqId] = useState(null);
  const [openDept, setOpenDept] = useState({});

  const toggleAccordion = async (req) => {
    if (req.parentRequisitionId && req.parentRequisitionId !== "") {
      try {
        const res = await jobPositionApiService.getRequisitionById(
          req.parentRequisitionId
        );

        setParentReqDetails((prev) => ({
          ...prev,
          [req.id]: {
            requisitionId: res?.data?.requisitionCode,
            code: res?.data?.requisitionTitle,
          },
        }));
      } catch (error) {
        console.error(error);
      }
    }
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
  const {
    requisitions,
    loading,
    pageInfo,
    yearOptions,
    deleteRequisition,
    submitForApproval,
    refetch,
  } = useJobRequisitions({
    year,
    month,
    status,
    search,
    page,
    size: pageSize,
    departmentId,
  });

  useEffect(() => {
    setPage(0);
  }, [pageSize]);

  useEffect(() => {
    setPage(0);
  }, [month]);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const res = await masterApiService.getMasterDisplayAll();

        setMasterData({
          reservationCategories: (res.data?.reservationCategories || []).map(
            (c) => ({
              id: String(c.reservationCategoriesId),
              code: c.categoryCode,
            })
          ),

          disabilityCategories: (res.data?.disabilityCategories || []).map(
            (c) => ({
              id: String(c.disabilityCategoryId),
              code: c.disabilityCode,
            })
          ),

          employmentTypes: (res.data?.employementTypes || []).map((e) => ({
            id: String(e.employementTypeId),
            name: e.typeName,
            code: e.typeCode,
          })),

          departments: (res.data?.departments || []).map((d) => ({
            id: String(d.departmentId),
            name: d.departmentName,
          })),

          masterPositions: (res.data?.masterPositions || []).map((p) => ({
            id: String(p.masterPositionsId),
            name: p.positionName,
          })),
          states: res.data?.states || [],
          cities: res.data?.cities || [],
        });
      } catch (err) {
        console.error(err);
      }
    };

    loadMasterData();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [departmentId]);

  const [selectedReqIds, setSelectedReqIds] = useState(new Set());
  const [departmentOptions, setDepartmentOptions] = useState([]);

  // 🔹 Fetch departments for filter dropdown
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await masterApiService.getAllDepartments();
        const depts = Array.isArray(res.data) ? res.data : res.data?.data || [];
        // Map to format { id, name }
        const mapped = depts.map((d) => ({
          id: d.departmentId,
          name: d.departmentName,
        }));
        setDepartmentOptions(mapped);
      } catch (err) {
        console.error("Failed to fetch departments", err);
        setDepartmentOptions([]);
      }
    };
    fetchDepartments();
  }, []);

  const selectableRequisitions = requisitions.filter(
    (r) =>
      r.status !== "APPROVED" &&
      r.status !== "L1_PENDING" &&
      r.status !== "L2_PENDING" &&
      !r.hasDraftPositions
  );
  useEffect(() => {
    if (!yearOptions?.length || year) return;

    const currentYear = new Date().getFullYear();

    if (yearOptions.includes(currentYear)) {
      setYear(currentYear);
    } else {
      // fallback to highest year
      const latestYear = Math.max(...yearOptions);
      setYear(latestYear);
    }
  }, [yearOptions]);

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

  const handleCancelSelection = () => {
    setSelectedReqIds(new Set());
  };
  const handleSubmitForApproval = (postingStatus) => {
    // ONLY requisitions currently rendered (current year / filters)
    const visibleRequisitions = requisitions;

    const selectedVisibleRequisitions = visibleRequisitions.filter((r) =>
      selectedReqIds.has(r.id)
    );

    if (selectedVisibleRequisitions.length === 0) {
      toast.error(t("jobPostingsList:no_selected"));
      return;
    }

    const errors = validateRequisitionSubmission({
      requisitions,
      selectedReqIds,
    });

    if (errors.length > 0) {
      errors.forEach((e) => {
        if (typeof e === "string") {
          toast.error(t(e));
        } else {
          toast.error(t(e.key, e.params));
        }
      });
      return;
    }

    const ids = selectedVisibleRequisitions
      .filter((r) => r.status !== "Approved")

      .map((r) => (r.isDraft ? r.parentRequisitionId : r.id));

    if (ids.length === 0) return;

    submitForApproval(ids, postingStatus);
    setSelectedReqIds(new Set());
  };

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

  const handlePublish = async (req) => {
    try {
      setIsPublishing(true);
      await requisitionApiService.publishDraftRequisition(
        req.parentRequisitionId
      );

      toast.success("Published successfully");

      refetch(); // mandatory, otherwise UI lies again
    } catch (err) {
      console.error(err);
      toast.error("Publish failed");
    } finally {
      setIsPublishing(false);
    }
  };

  const selectedRequisitions = requisitions.filter((r) =>
    selectedReqIds.has(r.id)
  );

  const isSubmitEnabled =
    selectedRequisitions.length > 0 &&
    selectedRequisitions.every(
      (r) => r.status === "NEW" || r.status === "DRAFT"
    );
  const isReinitializeEnabled = (() => {
    if (selectedRequisitions.length !== 1) return false;

    const req = selectedRequisitions[0];

    const endDate = req.endDate ? new Date(req.endDate) : null;
    if (!endDate) return false;

    endDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return req.status === "CLOSED" && endDate <= today;
  })();
  return (
    <Container fluid className="job-postings-page">
      {isPublishing && <Loader />}
      {/* ================= HEADER ================= */}
      <Row className="mb-3 align-items-center">
        <Col>
          <h5 className="page-title">{t("jobPostingsList:page_title")}</h5>
        </Col>
        <Col className="text-end create">
          <Button
            onClick={() =>
              navigate(getOrganizationPath("/job-posting/create-requisition", orgSlug))
            }
          >
            <img
              src={CreatePlus_Icon}
              alt="Create New Requisition"
              className="icon-16"
            />{" "}
            {t("jobPostingsList:create_new_requisition")}
          </Button>
        </Col>
      </Row>

      {/* ================= FILTERS ================= */}
      <Row className="filters-row g-2 mb-3">
        <Col xs={12} md={2}>
          <Form.Select
            value={year}
            className="yearfon"
            onChange={(e) => setYear(e.target.value)}
          >
            {yearOptions.map((yr) => (
              <option key={yr} value={yr}>
                {t("jobPostingsList:year_label")} - {yr}
              </option>
            ))}
          </Form.Select>
        </Col>

        <Col xs={12} md={2}>
          <Form.Select value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">{t("common:all_months")}</option>
            <option value="1">{t("common:january")}</option>
            <option value="2">{t("common:february")}</option>
            <option value="3">{t("common:march")}</option>
            <option value="4">{t("common:april")}</option>
            <option value="5">{t("common:may")}</option>
            <option value="6">{t("common:june")}</option>
            <option value="7">{t("common:july")}</option>
            <option value="8">{t("common:august")}</option>
            <option value="9">{t("common:september")}</option>
            <option value="10">{t("common:october")}</option>
            <option value="11">{t("common:november")}</option>
            <option value="12">{t("common:december")}</option>
          </Form.Select>
        </Col>

        <Col xs={12} md={4}>
          <div className="search-boxpost">
            <Search />
            <Form.Control
              type="text"
              placeholder={t("jobPostingsList:search_placeholder")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </Col>

        <Col xs={12} md={2}>
          <Form.Select
            className="department-select"
            value={departmentId || ""}
            onChange={(e) => {
              const value = e.target.value || null;
              setDepartmentId(value);
              setPage(0);
            }}
          >
            <option value="">
              {t("jobPostingsList:all_departments") || "All Departments"}
            </option>
            {departmentOptions.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </Form.Select>
        </Col>

        <Col xs={12} md="2">
          <Form.Select
            className="status-select"
            value={status}
            onChange={(e) => {
              const value = e.target.value || null;
              setStatus(value);
              setPage(0);
            }}
          >
            <option value="">{t("jobPostingsList:status_all")}</option>
            <option value="NEW">{t("jobPostingsList:status_new")}</option>
            <option value="L2_PENDING">
              {t("jobPostingsList:status_l2_pending")}
            </option>
            <option value="L1_PENDING">
              {t("jobPostingsList:status_l1_pending")}
            </option>
            <option value="L1_REJECTED">
              {t("jobPostingsList:status_l1_rejected")}
            </option>
            <option value="L2_REJECTED">
              {t("jobPostingsList:status_l2_rejected")}
            </option>
            <option value="APPROVED">
              {t("jobPostingsList:status_approved")}
            </option>
            <option value="CLOSED">{t("jobPostingsList:status_closed")}</option>
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
        <Col xs={12} md={6} className="text-md-end mt-2 mt-md-0">
          <Button
            variant="primary"
            className="subbtn me-2"
            disabled={!isReinitializeEnabled || loading}
            onClick={() => {
              const req = selectedRequisitions[0];

              navigate(
                getOrganizationPath(
                  `/job-posting/create-requisition?id=${req.id}`,
                  orgSlug
                ),
                {
                  state: { mode: "reinitialize" },
                }
              );
            }}
          >
            {t("jobPostingsList:reinitialize")}
          </Button>

          <Button
            variant="primary"
            className="me-2 subbtn"
            // disabled={selectedReqIds.size === 0 || loading}
            disabled={!isSubmitEnabled || loading}
            onClick={() => setShowSubmitModal(true)}
          >
            <img src={submitIcon} alt="submit" className="icon-16" />{" "}
            {t("jobPostingsList:submit")}
          </Button>

          <Button
            variant="outline-secondary"
            className="canbtn"
            onClick={handleCancelSelection}
            // disabled={selectedReqIds.size === 0 || loading}
            disabled={!isSubmitEnabled || loading}
          >
            {t("common:cancel")}
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
        // console.log("req ---1", req);
        // const positions = positionsByReq[req.id] || [];
        const key = `${req.isDraft ? req.parentRequisitionId : req.id}_${req.isDraft}`;
        const positions = positionsByReq[key] || [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const endDate = req.endDate ? new Date(req.endDate) : null;
        if (endDate) endDate.setHours(0, 0, 0, 0);

        const isApprovedAndExpired =
          req.status === "APPROVED" && endDate && endDate < today;
        const isClosedForReinitialize =
          req.status === "CLOSED" &&
          req.endDate &&
          new Date(req.endDate) <= new Date();

        const isCheckboxEnabled =
          req.status === "NEW" ||
          req.status === "DRAFT" ||
          isApprovedAndExpired ||
          isClosedForReinitialize;

        const isRejected =
          req.status === "L1_REJECTED" || req.status === "L2_REJECTED";

        const positionsGroupedByDept = positions.reduce((acc, pos) => {
          if (!acc[pos.deptId]) {
            acc[pos.deptId] = {
              departmentName: pos.departmentName,
              positions: [],
            };
          }
          acc[pos.deptId].positions.push(pos);
          return acc;
        }, {});

        const displayStatus =
          !req.isHiringCompleted && ["APPROVED", "CLOSED"].includes(req.status)
            ? "OUTSTANDING"
            : "";

        const isReinitializedStatus =
          req.isReinitialized === true ? "Reinitiated" : "";

        return (
          <div
            key={req.id}
            className={`requisition-card mb-3 ${req.isDraft ? "draft-card" : ""}`}
          >
            <Row
              className="align-items-center req-clickable"
              // onClick={() => toggleAccordion(req.id)}
              onClick={() => toggleAccordion(req)}
            >
              {/* -------- LEFT -------- */}
              <Col xs={12} md={6}>
                <div className="req-header">
                  <Badge bg="light" text="primary" className="req-id">
                    {req.requisitionId}
                  </Badge>

                  {/* {displayStatus && (
                    <Badge bg={req.statusType} className="ms-2">
                      {formatStatusLabel(displayStatus)}
                    </Badge>
                  )} */}

                  {displayStatus === "OUTSTANDING" && (
                    <span
                      style={{
                        border: "1px solid #f26522",
                        color: "#f26522",
                        background: "#fff4ee",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "500",
                        marginLeft: "10px",
                        flexShrink: 0,
                      }}
                    >
                      Outstanding
                    </span>
                  )}
                  <Badge bg={req.statusType} className="ms-2">
                    {formatStatusLabel(req.status)}
                  </Badge>

                  {req.status !== "CLOSED" &&
                    (req.isReinitialized || req.parentRequisitionId) && (
                      <span
                        className="ms-2"
                        style={{
                          color: "#f26522",
                          cursor: "pointer",
                          fontWeight: "400",
                          fontSize: "12px",
                        }}
                        onClick={async (e) => {
                          e.stopPropagation();

                          const res =
                            await jobPositionApiService.getVacancyBreakdownByRequisition(
                              req.parentRequisitionId
                            );
                          let parentReqData = {};

                          if (
                            req.parentRequisitionId &&
                            req.parentRequisitionId !== ""
                          ) {
                            const res1 =
                              await jobPositionApiService.getRequisitionById(
                                req.parentRequisitionId
                              );

                            parentReqData = {
                              requisitionId: res1?.data?.requisitionCode,
                              code: res1?.data?.requisitionTitle,
                              startDate: res1?.data?.startDate,
                              endDate: res1?.data?.endDate,
                            };
                          }

                          const mappedData = mapVacancyBreakdown(
                            res.data,
                            masterData
                          );

                          const positionNames = res.data?.data
                            ?.map((item) => {
                              const position =
                                masterData?.masterPositions?.find(
                                  (p) =>
                                    String(p.id) ===
                                    String(item.masterPositionId)
                                );
                              return position?.name;
                            })
                            .filter(Boolean);

                          setSelectedReqInfo({
                            ...req,
                            ...mappedData,
                            ...parentReqData,
                            positionNames,
                          });

                          setShowApprovedInfo(true);
                        }}
                      >
                        Re-Initiated
                      </span>
                    )}
                  {/* {req.status !== "CLOSED" &&
                    (req.isReinitialized || req.parentRequisitionId) && (
                      <Badge bg="warning" text="dark" className="ms-2">
                        Re Initiated
                      </Badge>
                    )} */}

                  {req.status === "APPROVED" &&
                    !req.isInEditMode &&
                    !req.isDraft && (
                      <Button
                        size="sm"
                        className="py-0"
                        variant="btn-outline"
                        onClick={(e) => {
                          e.stopPropagation();

                          navigate(
                            getOrganizationPath(
                              `/job-posting/create-requisition?id=${req.id}`,
                              orgSlug
                            ),
                            {
                              state: { mode: "clone" },
                            }
                          );
                        }}
                        style={{ fontSize: "0.75rem", color: "#f26522" }}
                      >
                        Edit
                      </Button>
                    )}

                  {req.isDraft && req.status === "APPROVED" && (
                    <Button
                      size="sm"
                      variant="primary"
                      className="ms-2 py-0"
                      style={{ fontSize: "0.7rem" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePublish(req);
                      }}
                    >
                      Publish
                    </Button>
                  )}
                </div>

                <div className="d-flex justify-content-between align-items-start">
                  <div className="d-flex align-items-start">
                    <Form.Check
                      type="checkbox"
                      className="me-2 mt-2"
                      checked={selectedReqIds.has(req.id)}
                      disabled={!isCheckboxEnabled || req.hasDraftPositions}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        if (!isCheckboxEnabled) return;

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
                        <h6 className="req-code mb-0" title={req.code}>
                          {req.code}
                        </h6>

                        {req.status !== "NEW" && (
                          <img
                            src={history_icon}
                            alt="history"
                            className="icon-16his cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenHistory(req);
                            }}
                          />
                        )}
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
                    <img src={vacancy_icon} alt="vacancy" className="icon-23" />{" "}
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
                <>
                  {!req.isRejected && req.editable && !req.isDraft && (
                    <OverlayTrigger
                      placement="bottom"
                      overlay={
                        <Tooltip id={`tooltip-add-${req.id}`}>
                          {t("jobPostingsList:add_position")}
                        </Tooltip>
                      }
                    >
                      <Button
                        variant="light"
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            getOrganizationPath(
                              `/job-posting/${req.id}/add-position`,
                              orgSlug
                            )
                          );
                        }}
                      >
                        <img
                          src={pos_plus_icon}
                          alt="add"
                          className="icon-16"
                        />
                      </Button>
                    </OverlayTrigger>
                  )}
                  {(req.editable || (req.isDraft && isRejected)) && (
                    <OverlayTrigger
                      placement="bottom"
                      overlay={
                        <Tooltip id={`tooltip-add-${req.id}`}>
                          {t("jobPostingsList:edit_requisition")}
                        </Tooltip>
                      }
                    >
                      <Button
                        variant="light"
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          // NORMAL REQUISITION EDIT
                          if (!req.isDraft) {
                            navigate(
                              getOrganizationPath(
                                `/job-posting/create-requisition?id=${req.id}`,
                                orgSlug
                              ),
                              {
                                state: {
                                  mode: "edit",
                                },
                              }
                            );

                            return;
                          }

                          // DRAFT REQUISITION EDIT
                          // use clone mode so positions can be selected/unselected
                          navigate(
                            getOrganizationPath(
                              `/job-posting/create-requisition?id=${req.parentRequisitionId}`,
                              orgSlug
                            ),
                            {
                              state: {
                                mode: "clone",
                                isDraftEdit: true,
                                draftId: req.id,
                                parentRequisitionId: req.parentRequisitionId,
                              },
                            }
                          );
                        }}
                      >
                        <img
                          src={pos_edit_icon}
                          alt="edit"
                          className="icon-20"
                        />
                      </Button>
                    </OverlayTrigger>
                  )}
                  {(req.editable || (req.isDraft && isRejected)) && (
                    <OverlayTrigger
                      placement="bottom"
                      overlay={
                        <Tooltip id={`tooltip-add-${req.id}`}>
                          {t("jobPostingsList:delete_requisition")}
                        </Tooltip>
                      }
                    >
                      <Button
                        variant="light"
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReq(req);
                          setShowDeleteModal(true);
                        }}
                      >
                        <img
                          src={pos_delete_icon}
                          alt="delete"
                          className="icon-20"
                        />
                      </Button>
                    </OverlayTrigger>
                  )}
                </>

                {/* {!req.editable || req.isDraft && ( */}
                <OverlayTrigger
                  placement="bottom"
                  overlay={
                    <Tooltip id={`tooltip-add-${req.id}`}>
                      {t("jobPostingsList:view_requisition")}
                    </Tooltip>
                  }
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
                            orgSlug
                          ),
                          {
                            state: {
                              mode: "view",
                            },
                          }
                        );

                        return;
                      }

                      // DRAFT VIEW
                      navigate(
                        getOrganizationPath(
                          `/job-posting/create-requisition?id=${req.parentRequisitionId}`,
                          orgSlug
                        ),
                        {
                          state: {
                            mode: "view",
                            isDraftView: true,
                          },
                        }
                      );
                    }}
                  >
                    <img src={view_jobpost} alt="view" className="icon-19" />
                  </Button>
                </OverlayTrigger>
                {/* 
                {(req.status === "APPROVED" || req.status === "CLOSED") && (
                  <OverlayTrigger
                    placement="bottom"
                    overlay={
                      <Tooltip id={`tooltip-approved-${req.id}`}>
                        Approved View
                      </Tooltip>
                    }
                  >
                    <Button
                      variant="light"
                      className="icon-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReqInfo(req);
                        setShowApprovedInfo(true);
                      }}
                    >
                      <InfoCircle size={20} color="#4F67C1" />
                    </Button>
                  </OverlayTrigger>
                )} */}

                {(req.status === "APPROVED" || req.status === "CLOSED") && (
                  <>
                    <OverlayTrigger
                      placement="bottom"
                      overlay={
                        <Tooltip id={`tooltip-approved-${req.id}`}>
                          View Details
                        </Tooltip>
                      }
                    >
                      <Button
                        variant="light"
                        className="icon-btn"
                        onClick={async (e) => {
                          e.stopPropagation();

                          try {
                            const res =
                              await jobPositionApiService.getVacancyBreakdownByRequisition(
                                req.id
                              );

                            const mappedData = mapVacancyBreakdown(
                              res.data,
                              masterData
                            );

                            const positionNames = res.data?.data
                              ?.map((item) => {
                                const position =
                                  masterData?.masterPositions?.find(
                                    (p) =>
                                      String(p.id) ===
                                      String(item.masterPositionId)
                                  );

                                return position?.name;
                              })
                              .filter(Boolean);

                            setSelectedReqInfo({
                              ...req,
                              ...mappedData,
                              positionNames,
                            });

                            setShowApprovedInfo(true);
                          } catch (error) {
                            console.error(error);
                            toast.error("Failed to load vacancy details");
                          }
                        }}
                      >
                        <InfoCircle size={20} color="#4F67C1" />
                      </Button>
                    </OverlayTrigger>

                    {req.status === "APPROVED" && (
                      <OverlayTrigger
                        placement="bottom"
                        overlay={
                          <Tooltip id={`tooltip-close-${req.id}`}>
                            Close Requisition
                          </Tooltip>
                        }
                      >
                        <Button
                          variant="light"
                          className="icon-btn ms-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCloseReq(req);
                            setShowCloseModal(true);
                          }}
                        >
                          <XCircleFill size={20} color="#dc3545" />
                        </Button>
                      </OverlayTrigger>
                    )}
                  </>
                )}
                {/* )} */}

                <Button
                  variant="none"
                  className="accordion-arrow"
                  onClick={(e) => {
                    e.stopPropagation();
                    // toggleAccordion(req.id);
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

                {Object.values(positionsGroupedByDept).map((dept) => (
                  <div
                    key={dept.departmentName}
                    className="department-card mb-3"
                  >
                    <div
                      className="department-header d-flex align-items-center gap-2 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDeptAccordion(req.id, dept.departmentName);
                      }}
                    >
                      <img
                        src={dept_icon}
                        className="icon-22"
                        alt="dept_icon"
                      />

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
                        {openDept[`${req.id}-${dept.departmentName}`] ? (
                          <ChevronUp />
                        ) : (
                          <ChevronDown />
                        )}
                      </Button>
                    </div>

                    {/* 🔹 SAME position UI you already had */}
                    {/* {dept.positions.map((pos) => ( */}
                    {openDept[`${req.id}-${dept.departmentName}`] &&
                      dept.positions.map((pos) => (
                        <div
                          key={pos.positionId}
                          className="position-card-inner"
                        >
                          <div className="position-header-row">
                            <div
                              className="position-title"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                flexWrap: "wrap",
                              }}
                            >
                              <span>{pos.positionName}</span>

                              {(req.isReinitialized ||
                                pos.parentPositionId) && (
                                <span
                                  style={{
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: "400",
                                    color: "#f26522",
                                  }}
                                  onClick={async (e) => {
                                    e.stopPropagation();

                                    try {
                                      const res =
                                        await jobPositionApiService.getVacancyBreakdownByPosition(
                                          pos.parentPositionId
                                        );

                                      let parentReqData = {};

                                      if (
                                        req.parentRequisitionId &&
                                        req.parentRequisitionId !== ""
                                      ) {
                                        const res1 =
                                          await jobPositionApiService.getRequisitionById(
                                            req.parentRequisitionId
                                          );

                                        parentReqData = {
                                          requisitionId:
                                            res1?.data?.requisitionCode,
                                          code: res1?.data?.requisitionTitle,
                                          startDate: res1?.data?.startDate,
                                          endDate: res1?.data?.endDate,
                                        };
                                      }
                                      const mappedData =
                                        mapVacancyBreakdownByPosition(
                                          res.data,
                                          masterData
                                        );
                                      setSelectedReqForModal({
                                        ...req,
                                        ...parentReqData,
                                      });

                                      // setSelectedReqForModal(req);
                                      setSelectedPositionInfo(mappedData);
                                      setShowPositionModal(true);
                                    } catch (error) {
                                      console.error(error);
                                      toast.error(
                                        "Failed to load position details"
                                      );
                                    }
                                  }}
                                >
                                  {parentReqDetails[req.id]
                                    ? `${parentReqDetails[req.id].requisitionId} - ${parentReqDetails[req.id].code}`
                                    : `${req.requisitionId} - ${req.code}`}{" "}
                                </span>
                              )}
                            </div>
                            <div className="position-meta-inline">
                              <span>
                                <b>{t("jobPostingsList:vacancies")}:</b>{" "}
                                {pos.vacancies}
                              </span>

                              <span>
                                <b>{t("jobPostingsList:age")}:</b> {pos.minAge}{" "}
                                – {pos.maxAge} {t("jobPostingsList:years")}
                              </span>
                            </div>

                            <>
                              {/* EDIT POSITION */}
                              {(req.editable || isRejected) && (
                                <OverlayTrigger
                                  placement="bottom"
                                  overlay={
                                    <Tooltip id={`tooltip-edit-${req.id}`}>
                                      {t("jobPostingsList:edit_position")}
                                    </Tooltip>
                                  }
                                >
                                  <Button
                                    variant="light"
                                    className="icon-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(
                                        getOrganizationPath(
                                          `/job-posting/${req.id}/add-position?positionId=${pos.positionId}`,
                                          orgSlug
                                        ),
                                        {
                                          state: {
                                            mode: "edit",
                                            isInEditMode: req.isInEditMode,
                                            isDraft: req.isDraft === true,
                                            parentRequisitionId:
                                              req.parentRequisitionId,
                                          },
                                        }
                                      );
                                    }}
                                  >
                                    <img
                                      src={pos_edit_icon}
                                      className="icon-20"
                                      alt="edit"
                                    />
                                  </Button>
                                </OverlayTrigger>
                              )}

                              {/* DELETE POSITION */}
                              {!req.isRejected &&
                                req.editable &&
                                !req.isDraft && (
                                  <OverlayTrigger
                                    placement="bottom"
                                    overlay={
                                      <Tooltip id={`tooltip-delete-${req.id}`}>
                                        {t("jobPostingsList:delete_position")}
                                      </Tooltip>
                                    }
                                  >
                                    <Button
                                      variant="light"
                                      className="icon-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedPosition({
                                          requisitionId: req.id,
                                          positionId: pos.positionId,
                                          positionName: pos.positionName,
                                          isDraft: req.isDraft,
                                          parentRequisitionId:
                                            req.parentRequisitionId,
                                        });
                                        setShowDeletePosModal(true);
                                      }}
                                    >
                                      <img
                                        src={pos_delete_icon}
                                        className="icon-20"
                                        alt="delete"
                                      />
                                    </Button>
                                  </OverlayTrigger>
                                )}
                            </>

                            {/* VIEW POSITION */}

                            {!req.editable && (
                              <OverlayTrigger
                                placement="bottom"
                                overlay={
                                  <Tooltip id={`tooltip-add-${req.id}`}>
                                    {t("jobPostingsList:view_position")}
                                  </Tooltip>
                                }
                              >
                                <Button
                                  variant="light"
                                  className="icon-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(
                                      getOrganizationPath(
                                        `/job-posting/${req.id}/add-position?positionId=${pos.positionId}`,
                                        orgSlug
                                      ),
                                      {
                                        state: {
                                          mode: "view",
                                          isDraft: req.isDraft === true,
                                          parentRequisitionId:
                                            req.parentRequisitionId,
                                        },
                                      }
                                    );
                                  }}
                                >
                                  <img
                                    src={view_jobpost}
                                    className="icon-19"
                                    alt="view"
                                  />
                                </Button>
                              </OverlayTrigger>
                            )}
                          </div>

                          <div className="position-details">
                            <div style={{ whiteSpace: "pre-line" }}>
                              <span>
                                {t("jobPostingsList:mandatory_education")}:
                              </span>{" "}
                              {pos.mandatoryEducation}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                whiteSpace: "pre-line",
                              }}
                            >
                              <div>
                                <span>
                                  {t("jobPostingsList:preferred_education")}:
                                </span>{" "}
                                {pos.preferredEducation &&
                                pos.preferredEducation.trim()
                                  ? pos.preferredEducation
                                  : "NA"}
                              </div>

                              {displayStatus === "OUTSTANDING" && (
                                <span
                                  style={{
                                    border: "1px solid #f26522",
                                    color: "#f26522",
                                    padding: "2px 8px",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    fontWeight: "500",
                                    marginLeft: "10px",
                                    flexShrink: 0,
                                  }}
                                >
                                  Not Fulfilled
                                </span>
                              )}
                            </div>
                            {/* <div style={{ whiteSpace: "pre-line" }}>
                              <span>
                                {t("jobPostingsList:preferred_education")}:
                              </span>{" "}
                              {pos.preferredEducation &&
                                pos.preferredEducation.trim()
                                ? pos.preferredEducation
                                : "NA"}
                            </div> */}
                          </div>
                        </div>
                      ))}
                  </div>
                ))}
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
              <span className="fw-semibold pagesize">
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
                    page >= pageInfo.totalPages - 1 || loading ? "disabled" : ""
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

      {/* Requisition Delete */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedReq(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t("jobPostingsList:delete_requisition_title")}
        message={t("jobPostingsList:delete_requisition_message")}
        itemLabel={selectedReq?.code}
      />

      {/* Position Delete */}
      <DeleteConfirmationModal
        show={showDeletePosModal}
        onClose={() => {
          setShowDeletePosModal(false);
          setSelectedPosition(null);
        }}
        onConfirm={handleConfirmDeletePosition}
        title={t("jobPostingsList:delete_position_title")}
        message={t("jobPostingsList:delete_position_message")}
        itemLabel={selectedPosition?.positionName}
      />
      <ConfirmationModal
        show={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={() => {
          setShowSubmitModal(false);

          handleSubmitForApproval("L1_PENDING");
        }}
        title={t("jobPostingsList:send_for_approval")}
        message={t("jobPostingsList:submit_confirm_message_approve")}
        confirmText={t("jobPostingsList:submit")}
        itemLabel={t("jobPostingsList:requisition_count", {
          count: selectedReqIds.size,
        })}
      />

      <ApprovalHistoryModal
        show={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        historyData={history}
        // setHistory={setHistory}
        loading={historyLoading}
      />

      <ApprovedInfoStrip
        show={showApprovedInfo}
        onHide={() => setShowApprovedInfo(false)}
        requisition={selectedReqInfo}
      />
      <CloseRequisitionModal
        show={showCloseModal}
        onHide={() => {
          setShowCloseModal(false);
          setSelectedCloseReq(null);
        }}
        requisitionName={selectedReqForModal}
        onConfirm={() => {
          setShowCloseModal(false);
          setSelectedCloseReq(null);
        }}
      />
      <SinglePositionInfoModal
        show={showPositionModal}
        onHide={() => {
          setShowPositionModal(false);
          setSelectedReqForModal(null);
          setSelectedPositionInfo(null);
        }}
        requisition={selectedReqForModal}
        position={selectedPositionInfo}
      />
    </Container>
  );
};

export default JobPostingsList;
