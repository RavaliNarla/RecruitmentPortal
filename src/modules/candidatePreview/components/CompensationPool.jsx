import React, { useState, useMemo } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { Person, FileText } from "react-bootstrap-icons";
import briefcaseIcon from "../../../assets/breifcase.png";
import { useNavigate } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import { useSelector } from "react-redux";
import candidateWorkflowServices from "../services/CandidateWorkflowServices";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

import "../../../style/css/Compensationpool.css";

export default function CompensationPool({
  candidates = [],
  selectedIds = [],
  setSelectedIds = () => { },
  page = 0,
  pageSize = 10,
  totalElements = 0,
  onPageChange = () => { },
  onPageSizeChange = () => { },
  onViewFile,
  selectedRequisitionId,
  selectedPositionId,
  requisition,
  position,
  refetch = () => { },
  triggerRefresh = () => { },
  panelData,
  filters,
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const canEditCompensation =
    selectedCandidate?.status === "SUBMITTED" ||
    selectedCandidate?.status === "RENEGOTIATE";

  const { t } = useTranslation("compensationPool");

  const canEditManagerCompensation =
    selectedCandidate?.status !== "NEW" &&
    selectedCandidate?.status !== "APPROVED" &&
    selectedCandidate?.status !== "RENEGOTIATE" &&
    selectedCandidate?.status !== "REJECTED"; //  ADD THIS

  const formatNumberWithCommas = (value) => {
    const numeric = value.replace(/[^0-9]/g, ""); // allow only digits
    return numeric ? Number(numeric).toLocaleString("en-IN") : "";
  };

  const navigate = useNavigate();

  const [managerForm, setManagerForm] = useState({
    fixedPay: "",
    variablePay: "",
    joiningBonus: "",
    recruiterComments: "",
    panelComments: "",
  });



  const [editingField, setEditingField] = useState(null);

  const removeCommas = (value) => String(value || "").replace(/,/g, "");

  const formatNumber = (value) => {
    const numeric = removeCommas(value).replace(/\D/g, "");
    return numeric ? Number(numeric).toLocaleString("en-IN") : "";
  };



  const user = useSelector((state) => state.user.user);
  const privileges = useSelector((state) => state.user.privileges);

  const canCompensationPool = privileges?.["Compensation Pool"];

  const userEmail = user?.email?.toLowerCase();
  const userRole = user?.role?.toLowerCase();

  const isRecruiter = userRole === "recruiter";

  const isUserInCompensationPanel =
    Array.isArray(panelData?.compensationPanelList) &&
    panelData.compensationPanelList.some(
      (panel) =>
        Array.isArray(panel?.interviewPanel?.panelMembers) &&
        panel.interviewPanel.panelMembers.some((member) => {
          const apiEmail = member?.panelMember?.email?.toLowerCase();
          const apiRole = member?.panelMember?.role?.toLowerCase();

          return apiEmail === userEmail && apiRole === userRole;
        })
    );

  const getNegotiationClass = (status) => {
    switch (status) {
      case "APPROVED":
      case "SUBMITTED":
        return "neg-green";

      case "PENDING":
      case "NEW":
        return "neg-orange";

      default:
        return "neg-orange";
    }
  };

  const [showRecruiterModal, setShowRecruiterModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);

  const [saveClicked, setSaveClicked] = useState(false);
  const [managerSaveClicked, setManagerSaveClicked] = useState(false);

  const allSelected =
    candidates.length > 0 && selectedIds.length === candidates.length;

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : candidates.map((c) => c.id));
  };

  const toggleRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const [formData, setFormData] = useState({
    fixedPay: "",
    variablePay: "",
    joiningBonus: "",
    recruiterComments: "",
    panelComments: "",
  });

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

  const parseAmount = (val) => Number(String(val).replace(/,/g, "")) || 0;

  const handleManagerAction = async (actionType) => {
    try {
      setManagerSaveClicked(true);

      if (!managerForm.panelComments?.trim()) {
        toast.error("Comments are required");
        return;
      }

      if (!managerForm.fixedPay) {
        toast.error("Fixed Pay is required");
        return;
      }

      const payload = {
        compensation: {
          candidateId: selectedCandidate.candidateId,
          candidateProfile: selectedCandidate.candidateProfile,
          application: selectedCandidate.application,
          interviewScheduleId: selectedCandidate.interviewScheduleId,
          submitBeforeDate: selectedCandidate.submitBeforeDate,

          currentCtc: selectedCandidate.currentCtc ?? 0,
          expectedCtc: selectedCandidate.expectedCtc ?? 0,
          fixedPay:
            parseAmount(managerForm.fixedPay) ||
            selectedCandidate.fixedPay ||
            0,

          variablePay:
            parseAmount(managerForm.variablePay) ||
            selectedCandidate.variablePay ||
            0,

          joiningBonus:
            parseAmount(managerForm.joiningBonus) ||
            selectedCandidate.joiningBonus ||
            0,
          agreedCtc:
            (parseAmount(managerForm.fixedPay) || 0) +
            (parseAmount(managerForm.variablePay) || 0),

          hike: selectedCandidate?.hike || 0,

          recruiterComments: selectedCandidate.recruiterComments || "", //  IMPORTANT
          panelComments: managerForm.panelComments || "",
          compensationStatus: selectedCandidate.status,
          candidateCompensationId: selectedCandidate.id,
        },
        action: actionType,
      };

      const res =
        await candidateWorkflowServices.addCompensationDetails(payload);
      //  Normalize response properly (simple + reliable)
      const responseData =
        res?.data?.success !== undefined
          ? res.data
          : res?.success !== undefined
            ? res
            : res?.data || res;
      //  Strict success check
      if (responseData?.success === true) {
        toast.success(responseData?.message || "Success");

        setShowManagerModal(false);
        refetch();
        triggerRefresh();
      } else {
        const errorMsg =
          typeof responseData === "string"
            ? responseData
            : responseData?.data ||
            responseData?.message ||
            "Something went wrong";

        toast.error(errorMsg);
        setShowManagerModal(false);
      }
    } catch (err) {
      console.error(" FULL ERROR:", err);

      const errorMsg =
        err?.response?.data?.data ||
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong";

      toast.error(errorMsg);
    }
  };

  const handleCompensationClick = (c) => {
    setSelectedCandidate(c);

    const userEmail = user?.email?.toLowerCase();
    const userRole = user?.role?.toLowerCase();

    const isRecruiter = userRole === "recruiter";
    const isCommitteeMember = userRole === "committee_member";

    // PANEL CHECK
    const matchedPanel = panelData?.compensationPanelList?.find((panel) =>
      panel?.interviewPanel?.panelMembers?.some((member) => {
        const apiEmail = member?.panelMember?.email?.toLowerCase();

        const apiRole = member?.panelMember?.role?.toLowerCase();

        return apiEmail === userEmail && apiRole === userRole;
      })
    );

    const isUserInPanel = !!matchedPanel;

    // DATE CHECK
    let isWithinDateRange = false;

    if (matchedPanel?.startDate && matchedPanel?.endDate) {
      const today = new Date();
      const start = new Date(matchedPanel.startDate);
      const end = new Date(matchedPanel.endDate);

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      isWithinDateRange = today >= start && today <= end;
    } else {
      console.log("DATE CHECK FAILED -> startDate or endDate missing");
    }

    // ===== FINAL DECISION =====

    if (isCommitteeMember && isUserInPanel && canCompensationPool) {
      setShowManagerModal(true);
    } else if (isRecruiter && isUserInPanel && isWithinDateRange) {
      setShowManagerModal(true);
    } else if (isRecruiter && isUserInPanel && !isWithinDateRange) {
      setShowRecruiterModal(true);
    } else if (isRecruiter && !isUserInPanel) {
      setShowRecruiterModal(true);
    } else {
      console.log({
        userEmail,
        userRole,
        isRecruiter,
        isCommitteeMember,
        isUserInPanel,
        isWithinDateRange,
        canCompensationPool,
      });

      console.warn("No matching condition for modal");
    }
  };

  // const canEditManagerFields = isUserInCompensationPanel && isRecruiter;

  const canEditManagerFields =
    isUserInCompensationPanel && canEditManagerCompensation;

  const handleSaveCompensation = async () => {
    try {
      setSaveClicked(true);

      if (!formData.fixedPay || !formData.recruiterComments?.trim()) {
        return;
      }

      //  ADD THIS BLOCK (no changes to your logic)

      const payload = {
        compensation: {
          candidateId: selectedCandidate.candidateId,
          candidateProfile: selectedCandidate.candidateProfile,
          application: selectedCandidate.application,
          interviewScheduleId: selectedCandidate.interviewScheduleId,
          submitBeforeDate: selectedCandidate.submitBeforeDate,

          currentCtc: selectedCandidate.currentCtc ?? 0,
          expectedCtc: selectedCandidate.expectedCtc ?? 0,

          fixedPay: parseAmount(formData.fixedPay) || 0,
          variablePay: parseAmount(formData.variablePay) || 0,
          joiningBonus: parseAmount(formData.joiningBonus) || 0,

          agreedCtc:
            (parseAmount(formData.fixedPay) || 0) +
            (parseAmount(formData.variablePay) || 0),

          hike: selectedCandidate?.hike || 0,

          recruiterComments: formData.recruiterComments || "",
          panelComments: formData.panelComments || "",

          compensationStatus: selectedCandidate.status,
          candidateCompensationId: selectedCandidate.id,
        },
        action: "SUBMIT",
      };

      const res =
        await candidateWorkflowServices.addCompensationDetails(payload);

      //  Normalize response (same as manager API)
      const responseData =
        res?.data?.success !== undefined
          ? res.data
          : res?.success !== undefined
            ? res
            : res?.data || res;

      //  SUCCESS CASE
      if (responseData?.success === true) {
        toast.success(
          responseData?.message || "Compensation saved successfully"
        );

        setShowRecruiterModal(false);
        refetch();
        triggerRefresh();
      } else {
        //  ERROR CASE
        const errorMsg =
          responseData?.data || responseData?.message || "Something went wrong";

        toast.error(errorMsg);
      }
    } catch (err) {
      console.error(" ERROR:", err);

      const errorMsg =
        err?.response?.data?.data ||
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong";

      toast.error(errorMsg);
    }
  };

  const sortIcon = (key) => {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };

  return (
    <>
      <div className="card-body p-0">
        <table className="table table-hover mb-0">
          {/* ================= HEADER ================= */}
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
                style={{ width: "192px", maxWidth: "192px" }}
                onClick={() => requestSort("name")}
              >
                {t("candidate")} {sortIcon("name")}
              </th>

              <th
                className="fs-14 fw-normal py-3"
                onClick={() => requestSort("currentCtc")}
              >
                {t("currentCTC")} {sortIcon("currentCtc")}
              </th>

              <th
                className="fs-14 fw-normal py-3"
                onClick={() => requestSort("expectedCtc")}
              >
                {t("expectedCTC")} {sortIcon("expectedCtc")}
              </th>

              <th
                className="fs-14 fw-normal py-3"
                onClick={() => requestSort("hike")}
              >
                {t("expectedHike")}
              </th>

              <th
                className="fs-14 fw-normal py-3"
                onClick={() => requestSort("agreedCtc")}
              >
                {t("agreedCTC")}
              </th>

              <th className="fs-14 fw-normal py-3">{t("comments")}</th>

              <th className="fs-14 fw-normal py-3">{t("status")}</th>

              <th className="text-center fs-14 fw-normal py-3">
                {t("actions")}
              </th>
            </tr>
          </thead>

          {/* ================= BODY ================= */}
          <tbody>
            {sortedCandidates.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-4 text-muted fs-14">
                  {t("noCandidates")}
                </td>
              </tr>
            ) : (
              sortedCandidates.map((c) => (
                <tr key={c.id}>
                  {/* Checkbox */}
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

                  {/* Candidate */}
                  <td className="align-content-center">
                    <p className="fw-normal fs-14 mb-0">{c.name}</p>
                    <p className="text-muted fs-12 mb-0">
                      {t("reg_no")}: {c.regNo || "-"}
                    </p>
                  </td>

                  <td className="fs-14 align-content-center">
                    {c.currentCtc != null
                      ? Number(c.currentCtc).toLocaleString("en-IN")
                      : "-"}
                  </td>
                  <td className="fs-14 align-content-center">
                    {c.expectedCtc != null
                      ? Number(c.expectedCtc).toLocaleString("en-IN")
                      : "-"}
                  </td>

                  <td className="fs-14 align-content-center">
                    {c.hike !== null && c.hike !== undefined
                      ? `${Number(c.hike).toFixed(2)}%`
                      : "-"}
                  </td>
                  <td className="fs-14 align-content-center">
                    {c.agreedCtc !== null &&
                      c.agreedCtc !== undefined &&
                      c.agreedCtc !== ""
                      ? Number(c.agreedCtc).toLocaleString("en-IN")
                      : "-"}

                    {c.agreedCtc != null && c.agreedCtc !== "" && (
                      <div className="compensation-box fs-12">
                        <div className="comp-detail">
                          <span>{t("fixed")}: </span>
                          <span className="fixcomp">
                            {Number(c.fixedPay || 0).toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div className="comp-detail">
                          <span>{t("variable")}: </span>
                          <span className="fixcomp">
                            {Number(c.variablePay || 0).toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div className="comp-detail">
                          <span>{t("joining_bonus")}: </span>
                          <span className="fixcomp">
                            {Number(c.joiningBonus || 0).toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        </div>

                        <div className="comp-detail">
                          <span>{t("hike")} %: </span>
                          <span className="fixcomp">
                            {c.agreedHike ?? "-"}%
                          </span>
                        </div>
                      </div>
                    )}
                  </td>

                  <td className="fs-14 align-content-center">
                    {isRecruiter
                      ? c.recruiterComments || "-"
                      : c.panelComments || "-"}
                  </td>

                  {/*  SAME BADGE STYLE AS INTERVIEW */}
                  <td className="align-content-center">
                    <span
                      className={`round_badge px-3 py-1 fs-12 rounded ${getNegotiationClass(c.negotiation)}`}
                    >
                      {c.negotiation}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="text-center align-content-center">
                    {/* Profile */}
                    <OverlayTrigger
                      placement="bottom"
                      overlay={<Tooltip>{t("viewProfile")}</Tooltip>}
                    >
                      <Person
                        size={16}
                        className="me-3 cursor-pointer"
                        onClick={() => {
                          navigate("/candidate-preview", {
                            state: {
                              candidate: c,
                              applicationId: c.applicationId,

                              positionId: selectedPositionId,
                              positionIds: selectedPositionId,

                              requisitionId: selectedRequisitionId,

                              fromCompensationPool: true,
                              activeTab: "COMPENSATION_POOL",
                              // ADD THESE
                              page,
                              pageSize,
                              interviewPage: page,
                              interviewPageSize: pageSize,
                              filters,
                              candidatePositionId: c.positionId,

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
                            },
                          });
                        }}
                      />
                    </OverlayTrigger>

                    {/* Document */}
                    <OverlayTrigger
                      placement="bottom"
                      overlay={<Tooltip>{t("viewResume")}</Tooltip>}
                    >
                      <FileText
                        size={16}
                        className="me-3 cursor-pointer"
                        onClick={() => {
                          if (onViewFile) {
                            onViewFile(c);
                          } else {
                            console.log("Resume clicked", c);
                          }
                        }}
                      />
                    </OverlayTrigger>

                    {/*  Compensation (NEW ICON) */}
                    <OverlayTrigger
                      placement="bottom"
                      overlay={<Tooltip>{t("compensationDetails")}</Tooltip>}
                    >
                      <span>
                        <img
                          src={briefcaseIcon}
                          alt="Compensation"
                          className="cursor-pointer"
                          style={{ width: "18px", height: "18px" }}
                          onClick={() => {
                            setSaveClicked(false);

                            setFormData({
                              fixedPay: "",
                              variablePay: "",
                              joiningBonus: "",
                              recruiterComments: "",
                              panelComments: "",
                            });

                            setSelectedCandidate(c);

                            //  Prefill recruiter form
                            setFormData({
                              fixedPay: c.fixedPay
                                ? Number(c.fixedPay).toLocaleString("en-IN")
                                : "",
                              variablePay: c.variablePay
                                ? Number(c.variablePay).toLocaleString("en-IN")
                                : "",
                              joiningBonus: c.joiningBonus
                                ? Number(c.joiningBonus).toLocaleString("en-IN")
                                : "",
                              recruiterComments: c.recruiterComments || "",
                              panelComments: c.panelComments || "",
                            });

                            //  Prefill manager form
                            setManagerForm({
                              fixedPay: c.fixedPay
                                ? Number(c.fixedPay).toLocaleString("en-IN")
                                : "",
                              variablePay: c.variablePay
                                ? Number(c.variablePay).toLocaleString("en-IN")
                                : "",
                              joiningBonus: c.joiningBonus
                                ? Number(c.joiningBonus).toLocaleString("en-IN")
                                : "",
                              recruiterComments: c.recruiterComments || "",
                              panelComments: c.panelComments || "",
                            });

                            handleCompensationClick(c);
                          }}
                        />
                      </span>
                    </OverlayTrigger>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* ================= PAGINATION ================= */}
        <div className="d-flex justify-content-between align-items-center px-3 py-3 border-top">
          <div className="fs-14 text-muted">
            {t("showingRecords", {
              start: page * pageSize + 1,
              end: Math.min((page + 1) * pageSize, totalElements),
              total: totalElements,
            })}
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
  {t("previous")}
</button>

<button
  className="btn btn-sm btn-outline-secondary"
  disabled={(page + 1) * pageSize >= totalElements}
  onClick={() => onPageChange(page + 1)}
>
  {t("next")}
</button>
          </div>
        </div>
      </div>

      <Modal
        show={showRecruiterModal}
        onHide={() => {
          setShowRecruiterModal(false);
          setSaveClicked(false);
        }}
        centered
        backdrop="static"
        dialogClassName="custom-modal compensation-modal"
        size="lg"
      //size="xl"
      >
        <Modal.Header closeButton className="custom-modal-header border-0">
          <Modal.Title className="fw-semibold fs-5">
            {t("agreedCompensation")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="pt-2">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-medium">
                {t("fixedPay")} <span className="text-danger">*</span>
              </label>
              <input
                className={`form-control ${saveClicked && !formData.fixedPay ? "is-invalid" : ""
                  }`}
                placeholder="Enter Value"
                value={
                  editingField === "fixedPay"
                    ? removeCommas(formData.fixedPay)
                    : formatNumber(formData.fixedPay)
                }
                onFocus={() => setEditingField("fixedPay")}
                onBlur={() => {
                  setEditingField(null);
                  setFormData((prev) => ({
                    ...prev,
                    fixedPay: formatNumber(prev.fixedPay),
                  }));
                }}
                disabled={!canEditCompensation}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    fixedPay: removeCommas(e.target.value),
                  }))
                }
              />
              {!formData.fixedPay && (
                <div className="invalid-feedback">Fixed Pay is required</div>
              )}
            </div>
            <div className="col-md-6">
              <label className="form-label fw-medium">{t("variablePay")}</label>
              <input
                className="form-control"
                placeholder="Enter Value"

                disabled={!canEditCompensation}
                value={
                  editingField === "variablePay"
                    ? removeCommas(formData.variablePay)
                    : formatNumber(formData.variablePay)
                }

                onFocus={() => setEditingField("variablePay")}

                onBlur={() => {
                  setEditingField(null);
                  setFormData((prev) => ({
                    ...prev,
                    variablePay: formatNumber(prev.variablePay),
                  }));
                }}

                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    variablePay: removeCommas(e.target.value),
                  }))
                }
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-medium">
                {t("joiningBonus")}
              </label>
              <input
                className="form-control"
                placeholder="Enter Value"

                disabled={!canEditCompensation}
                value={
                  editingField === "joiningBonus"
                    ? removeCommas(formData.joiningBonus)
                    : formatNumber(formData.joiningBonus)
                }

                onFocus={() => setEditingField("joiningBonus")}

                onBlur={() => {
                  setEditingField(null);
                  setFormData((prev) => ({
                    ...prev,
                    joiningBonus: formatNumber(prev.joiningBonus),
                  }));
                }}

                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    joiningBonus: removeCommas(e.target.value),
                  }))
                }
              />
            </div>

            <div className="col-md-12">
              <label className="form-label fw-medium">
                {" "}
                {t("comments")} <span className="text-danger">*</span>{" "}
              </label>
              <textarea
                className={`form-control ${saveClicked && !formData.recruiterComments?.trim()
                    ? "is-invalid"
                    : ""
                  }`}
                rows={3}
                placeholder="Enter Comment"
                value={formData.recruiterComments}
                disabled={!canEditCompensation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    recruiterComments: e.target.value,
                  })
                }
              />

              {saveClicked && !formData.recruiterComments?.trim() && (
                <div className="invalid-feedback d-block">
                  Comments are required
                </div>
              )}
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer className="border-0 pt-2">
          <Button
            variant="light"
            className="px-4"
            onClick={() => {
              setShowRecruiterModal(false);
              setSaveClicked(false);
            }}
          >
            {t("cancel")}
          </Button>

          <Button
            style={{ backgroundColor: "#f36f21", border: "none" }}
            className="btn-save text-white"
            onClick={handleSaveCompensation}
            disabled={!canEditCompensation}
          >
            {t("save")}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showManagerModal}
        onHide={() => setShowManagerModal(false)}
        centered
        backdrop="static"
        dialogClassName="custom-modal compensation-modal"
        size="lg"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-semibold fs-5">
            {t("approveRejectCompensation")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">
                {t("fixedPay")} <span className="text-danger">*</span>
              </label>
              <input
                className={`form-control ${managerSaveClicked && !managerForm.fixedPay
                    ? "is-invalid"
                    : ""
                  }`}

                disabled={!canEditManagerFields}
                value={
                  editingField === "managerFixedPay"
                    ? removeCommas(managerForm.fixedPay)
                    : formatNumber(managerForm.fixedPay)
                }
                onFocus={() => setEditingField("managerFixedPay")}
                onBlur={() => {
                  setEditingField(null);
                  setManagerForm((prev) => ({
                    ...prev,
                    fixedPay: formatNumber(prev.fixedPay),
                  }));
                }}
                onChange={(e) =>
                  setManagerForm((prev) => ({
                    ...prev,
                    fixedPay: removeCommas(e.target.value),
                  }))
                }
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">{t("variablePay")}</label>
              <input
                className="form-control"

                disabled={!canEditManagerFields}
                value={
                  editingField === "managerVariablePay"
                    ? removeCommas(managerForm.variablePay)
                    : formatNumber(managerForm.variablePay)
                }
                onFocus={() => setEditingField("managerVariablePay")}
                onBlur={() => {
                  setEditingField(null);
                  setManagerForm((prev) => ({
                    ...prev,
                    variablePay: formatNumber(prev.variablePay),
                  }));
                }}
                onChange={(e) =>
                  setManagerForm((prev) => ({
                    ...prev,
                    variablePay: removeCommas(e.target.value),
                  }))
                }
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">{t("joiningBonus")}</label>
              <input
                className="form-control"

                disabled={!canEditManagerFields}
                value={
                  editingField === "managerJoiningBonus"
                    ? removeCommas(managerForm.joiningBonus)
                    : formatNumber(managerForm.joiningBonus)
                }
                onFocus={() => setEditingField("managerJoiningBonus")}
                onBlur={() => {
                  setEditingField(null);
                  setManagerForm((prev) => ({
                    ...prev,
                    joiningBonus: formatNumber(prev.joiningBonus),
                  }));
                }}
                onChange={(e) =>
                  setManagerForm((prev) => ({
                    ...prev,
                    joiningBonus: removeCommas(e.target.value),
                  }))
                }
              />
            </div>

            <div className="col-md-12">
              <label className="form-label">
                {t("comments")} <span className="text-danger">*</span>{" "}
              </label>
              <textarea
                className="form-control"
                rows={3}
                value={managerForm.panelComments} //  correct
                disabled={!canEditManagerCompensation}
                onChange={(e) =>
                  setManagerForm({
                    ...managerForm,
                    panelComments: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer className="border-0 justify-content-end gap-1">
          {/*  APPROVE */}
          <Button
            style={{ backgroundColor: "#28a745", border: "none" }}
            onClick={() => handleManagerAction("APPROVE")}
            disabled={!canEditManagerCompensation}
          >
            {t("approve")}
          </Button>

          {/*  REJECT */}
          <Button
            style={{ backgroundColor: "#f36f21", border: "none" }}
            onClick={() => handleManagerAction("REJECT")}
            disabled={!canEditManagerCompensation}
          >
            {t("reject")}
          </Button>

          {/*  RENEGOTIATE */}
          <Button
            style={{ backgroundColor: "#3f51b5", border: "none" }}
            onClick={() => handleManagerAction("RENEGOTIATE")}
            disabled={!canEditManagerCompensation}
          >
            {t("renegotiate")}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
