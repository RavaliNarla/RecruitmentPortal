import React, { useState, useEffect } from "react";

import "../../style/css/Committee.css";
import { useAssignPositions } from "./hooks/useAssignPositions";
import RequisitionStrip from "../candidatePreview/components/RequisitionStrip";
import ErrorModal from "./components/ErrorModal";
import Select from "react-select";
import Loader from "../../shared/components/Loader";
import { useTranslation } from "react-i18next";
import { Modal } from "react-bootstrap";
import { FiUpload } from "react-icons/fi";
import PositionAssignmentImportModal from "./components/PositionAssignmentImportModal";
import ApprovalHistoryModal from "../Approvals/components/ApprovalHistoryModal"; // adjust path
import history_icon from "../../assets/history_icon.png";
import useCommitteeRequests from "../Approvals/hooks/useCommitteeRequests"; // adjust path
import masterApiService from "../master/services/masterApiService";
import { preparePanelPayload } from "./mappers/InterviewPanelMapper";
import InterviewPanelFormModal from "./components/InterviewPanelFormModal";
import committeeManagementService from "../committeeManagement/services/committeeManagementService";
import { mapInterviewMembersApi } from "../committeeManagement/mappers/interviewMembersMapper";
import pos_edit_icon from "../../assets/pos_edit_icon.png";
import { toast } from "react-toastify";

const AssignPositionsPage = ({ refreshPanels }) => {
  const { t } = useTranslation(["interviewPanelCommittee", "common"]);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showUpdateWarning, setShowUpdateWarning] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  const {
    requisitions,
    positions,
    selectedRequisition,
    selectedPosition,
    setSelectedPosition,
    handleRequisitionChange,
    loading,
    availablePanels,
    setAvailablePanels,
    updateCommitteeDate,
    activeTab,
    setActiveTab,
    selectedCommittees,
    setSelectedCommittees,
    handleAssignCommittees,
    panelErrors,
    showErrorModal,
    setShowErrorModal,
    errorMessage,
    errorList,
    isDirty,
    setIsManuallyDirty,
    bulkImportPositionAssignments,
    downloadPositionAssignmentTemplate,
    loadPositionData,
  } = useAssignPositions();

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [communityOptions, setCommunityOptions] = useState([]);
  const [membersOptions, setMembersOptions] = useState([]);
  const [updatingPanel, setUpdatingPanel] = useState(false);
  useEffect(() => {
    const loadMetaData = async () => {
      try {
        const [commRes, memRes] = await Promise.all([
          masterApiService.getMasterDropdownData(),
          committeeManagementService.getPanelMembers(),
        ]);

        setCommunityOptions(
          (commRes?.data || []).map((c) => ({
            id: c.interviewCommitteeId,
            name: c.committeeName,
          }))
        );
        setMembersOptions(mapInterviewMembersApi(memRes));
      } catch (err) {
        console.error("Failed to load metadata", err);
      }
    };

    loadMetaData();
  }, []);

  const { fetchApprovalHistory } = useCommitteeRequests();

  const handleOpenHistory = async (committeeId) => {
    try {
      setShowHistoryModal(true);
      setLoadingHistory(true);

      const history = await fetchApprovalHistory(committeeId);

      setHistoryData(history);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };
  const handleEditPanel = async (committee) => {
    try {
      const res = await masterApiService.getInterviewPanelById(committee.id);
      const data = res?.data;

      const mapped = {
        id: data?.interviewPanelId,
        name: data?.panelName,
        community: data?.committee?.interviewCommitteeId || "",

        // ✅ FIX: array of IDs
        members: data?.panelMembers?.map((m) => m.panelMember?.userId) || [],
      };

      setEditFormData(mapped);
      setShowEditModal(true);
    } catch (err) {
      console.error(err);
    }
  };
  const selectedPositionTitle =
    positions.find((p) => p.jobPositions?.positionId === selectedPosition)
      ?.masterPositions?.positionName || "";

  const toggleCommittee = (type, committee) => {
    setSelectedCommittees((prev) => {
      const isSelected = prev[type].some((c) => c.id === committee.id);

      if (isSelected) {
        // REMOVE → move back to available
        setAvailablePanels((ap) => [...ap, committee]);
        setIsManuallyDirty(true);
        return {
          ...prev,
          [type]: prev[type].filter((c) => c.id !== committee.id),
        };
      } else {
        // ADD → remove from available
        setAvailablePanels((ap) => ap.filter((c) => c.id !== committee.id));

        return {
          ...prev,
          [type]: [
            ...prev[type],
            {
              ...committee,
              startDate: committee.startDate || "",
              endDate: committee.endDate || "",
              canEdit: true,
            },
          ],
        };
      }
    });
  };

  const renderAvailableCommittee = (committee, type) => (
    <div className="committee-row" key={committee.id}>
      <div>
        <div className="committee-title" style={{ width: "350px" }}>
          {committee.name}
        </div>
        <div className="committee-chips">
          {committee.members.map((m) => (
            <span key={m} className="chip">
              {m.name}
            </span>
          ))}
        </div>
      </div>

      <button
        className="action-pill add"
        onClick={() => toggleCommittee(type, committee)}
      >
        {t("add_button")} →
      </button>
    </div>
  );
  const renderSelectedCommittee = (committee, type) => {
    const errorKey = `${type}_${committee.id}`;
    const errors = panelErrors?.[errorKey] || {};
    const today = new Date().toISOString().split("T")[0];

    const shouldDisableFields = committee.rawStatus === "L2_PENDING";

    const shouldDisableRemove =
      committee.rawStatus === "L2_PENDING" ||
      committee.rawStatus === "APPROVED";

    return (
      <div className="committee-row selected" key={committee.id}>
        <div>
          <div
            className="committee-title d-flex align-items-center gap-2"
            style={{ width: "350px" }}
          >
            {committee.name}

            {/* ✅ SHOW ONLY IF SAVED PANEL */}
            {committee.positionPanelId && (
              <>
                <span
                  className={`status-text badge bg-${committee.statusType}`}
                >
                  {committee.positionPanelStatus || "-"}
                </span>

                <img
                  src={history_icon}
                  alt="history"
                  className="icon-history"
                  onClick={() => handleOpenHistory(committee.positionPanelId)}
                />
                <button
                  className="edit-btn"
                  onClick={() => handleEditPanel(committee)}
                  disabled={shouldDisableFields}
                >
                  <img src={pos_edit_icon} alt="Edit" className="edit-icon" />
                </button>
              </>
            )}
          </div>

          <div className="committee-chips">
            {committee.members.map((m) => (
              <span key={m.name} className="chip">
                {m.name}
              </span>
            ))}
          </div>

          <div className="date-row">
            <div>
              <label>{t("start_date_label")}</label>
              <input
                type="date"
                min={today}
                value={committee.startDate}
                disabled={shouldDisableRemove}
                onChange={(e) => {
                  const value = e.target.value;

                  if (value < today) {
                    toast.error("Past dates are not allowed");
                    return;
                  }

                  updateCommitteeDate(type, committee.id, "startDate", value);
                }}
              />
              {errors.startDate && (
                <div className="field-error">{t(errors.startDate)}</div>
              )}
            </div>

            <div>
              <label>{t("end_date_label")}</label>
              <input
                type="date"
                min={
                committee.startDate
                  ? (committee.startDate > today ? committee.startDate : today)
                  : today
                }
                value={committee.endDate}
                disabled={shouldDisableFields}
                onChange={(e) => {
                    const value = e.target.value;

                    const minEndDate =
                      committee.startDate && committee.startDate > today
                        ? committee.startDate
                        : today;

                    if (value < minEndDate) {
                      toast.error(
                        committee.startDate > today
                          ? "End date cannot be before start date"
                          : "Past dates are not allowed"
                      );
                      return;
                    }

                    updateCommitteeDate(type, committee.id, "endDate", value);
                  }}
              />
              {errors.endDate && (
                <div className="field-error">{t(errors.endDate)}</div>
              )}
            </div>
          </div>
        </div>

        <button
          className="action-pill remove"
          onClick={() => toggleCommittee(type, committee)}
          disabled={shouldDisableRemove}
        >
          ← {t("remove_button")}
        </button>
      </div>
    );
  };

  const filteredPanels = availablePanels.filter(
    (p) => p.committeeName?.toUpperCase() === activeTab
  );

  const selectedRequisitionObj = requisitions.find(
    (r) => r.id === selectedRequisition
  );

  const normalizedRequisition = {
    ...selectedRequisitionObj,
    registration_start_date: selectedRequisitionObj?.startDate,
    registration_end_date: selectedRequisitionObj?.endDate,
  };

  const selectedPositionObj = positions.find(
    (p) => p.jobPositions?.positionId === selectedPosition
  )?.jobPositions;

  const selectedPositionFull = positions.find(
    (p) => p.jobPositions?.positionId === selectedPosition
  );
  const normalizedPosition = {
    ...selectedPositionObj,
    positionName: selectedPositionFull?.masterPositions?.positionName,
  };
  const requisitionOptions = requisitions.map((req) => ({
    value: req.id,
    label: `${req.requisitionCode} - ${req.requisitionTitle}`,
  }));

  const positionOptions = positions.map((pos) => ({
    value: pos.jobPositions?.positionId,
    label: pos.masterPositions?.positionName,
  }));
  const updatePanel = async (payload) => {
    try {
      setUpdatingPanel(true);

      const res = await masterApiService.updateInterviewPanel(
        editFormData.id,
        payload
      );

      if (!res?.success) {
        toast.error(res?.data || res?.message || "Validation failed");
        return;
      }

      setSelectedCommittees((prev) => {
        const updated = { ...prev };

        Object.keys(updated).forEach((type) => {
          updated[type] = updated[type].map((panel) => {
            if (panel.id === editFormData.id) {
              return {
                ...panel,
                isDirty: true,
                members: membersOptions
                  .filter((m) => editFormData.members.includes(m.value))
                  .map((m) => ({
                    name: m.label,
                    userId: m.value,
                    email: m.email,
                    role: m.role,
                  })),
              };
            }

            return panel;
          });
        });

        return updated;
      });

      setIsManuallyDirty(true);

      await refreshPanels();

      toast.success("Panel updated successfully");

      setShowEditModal(false);
    } finally {
      setUpdatingPanel(false);
    }
  };
  return (
    <div className="assign-positions-page">
      {/* ===== PAGE HEADER ===== */}

      {/* ===== SELECTION CONTROLS ===== */}
      <div className="selection-section">
        <div class="mb-3">
          <div class="assign-position-title">{t("select_position_title")}</div>
          <div class="assign-position-muted">
            {t("choose_requisition_position_desc")}
          </div>
        </div>
        <div className="selection-grid">
          {/* Requisition */}
          <div className="form-group">
            <label className="form-label">{t("requisition_label")}</label>
            <Select
              isSearchable
              placeholder={t("select_requisition_placeholder")}
              options={requisitionOptions}
              filterOption={(option, inputValue) =>
                option.label.toLowerCase().includes(inputValue.toLowerCase())
              }
              value={
                requisitionOptions.find(
                  (option) => option.value === selectedRequisition
                ) || null
              }
              onChange={(selectedOption) =>
                handleRequisitionChange({
                  target: { value: selectedOption?.value || "" },
                })
              }
              classNamePrefix="custom-select"
            />
          </div>

          {/* Position */}
          <div className="form-group">
            <label className="form-label">{t("position_label")}</label>
            <Select
              isSearchable
              placeholder={t("select_position_placeholder")}
              options={positionOptions}
              value={
                positionOptions.find(
                  (option) => option.value === selectedPosition
                ) || null
              }
              onChange={(selectedOption) =>
                setSelectedPosition(selectedOption?.value || "")
              }
              isDisabled={!selectedRequisition}
              classNamePrefix="custom-select"
            />
          </div>
        </div>

        {/* ===== REQUISITION STRIP ===== */}
        {selectedRequisition && selectedPosition && (
          <div className="requisition-strip-section">
            <RequisitionStrip
              requisition={normalizedRequisition}
              position={normalizedPosition}
              isCardBg={false}
              isSaveEnabled={false}
            />
          </div>
        )}
      </div>

      {/* ===== COMMITTEE CONFIGURATION ===== */}
      <div className="committee-config-section">
        <div className="config-header">
          <div className="config-title-section">
            <h2 className="config-title">{t("configure_committees")}</h2>
            <p className="config-subtitle">
              {selectedPositionTitle
                ? t("assign_to_position", { position: selectedPositionTitle })
                : t("select_position_to_assign")}
            </p>
          </div>
          <div className="d-flex gap-2">
            <button
              className="assign-button"
              onClick={handleAssignCommittees}
              disabled={!selectedPosition || !isDirty()}
            >
              {loading ? t("assigning") : t("assign_committees")}
            </button>
            <button
              className="assign-button bulk-import-btn"
              onClick={() => setShowBulkImportModal(true)}
              disabled={loading}
            >
              <FiUpload className="me-2" />
              {t("interviewPanelCommittee:bulk_import")}
            </button>
          </div>
        </div>

        {/* ===== TABS ===== */}
        <div className="committee-tabs">
          <button
            className={`tab-item ${activeTab === "SCREENING" ? "active" : ""}`}
            onClick={() => setActiveTab("SCREENING")}
          >
            {t("screening_committee")}
          </button>
          <button
            className={`tab-item ${activeTab === "INTERVIEW" ? "active" : ""}`}
            onClick={() => setActiveTab("INTERVIEW")}
          >
            {t("interview_committee")}
          </button>
          <button
            className={`tab-item ${activeTab === "COMPENSATION" ? "active" : ""}`}
            onClick={() => setActiveTab("COMPENSATION")}
          >
            {t("compensation_committee")}
          </button>
        </div>

        {/* ===== DUAL PANELS ===== */}
        <div className="panels-container">
          {/* Available Panels */}
          <div className="panel-box available">
            <div className="panel-header">
              <h3 className="panel-title">{t("available_panels")}</h3>
              <span className="panel-count">{filteredPanels.length}</span>
            </div>
            <div className="panel-divider"></div>
            <div className="assignpanel-content">
              {filteredPanels.map((c) =>
                renderAvailableCommittee(c, activeTab)
              )}
            </div>
          </div>

          {/* Swap Icon */}
          <div className="swap-divider">
            <div className="swap-icon">⇄</div>
          </div>

          {/* Selected Panels */}
          <div className="panel-box selected">
            <div className="panel-header">
              <h3 className="panel-title">{t("selected_panels")}</h3>
              <span className="panel-count">
                {selectedCommittees[activeTab].length}
              </span>
            </div>
            <div className="panel-divider"></div>
            <div className="assignpanel-content">
              {selectedCommittees[activeTab].length > 0 ? (
                selectedCommittees[activeTab].map((c) =>
                  renderSelectedCommittee(c, activeTab)
                )
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <div className="empty-text">{t("no_panels_selected")}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ErrorModal
        show={showErrorModal}
        message={errorMessage}
        errors={errorList}
        onClose={() => setShowErrorModal(false)}
      />

      <Modal
        show={showBulkImportModal}
        onHide={() => setShowBulkImportModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="header-title">
            {t("interviewPanelCommittee:bulk_import_position_assignments")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <PositionAssignmentImportModal
            t={t}
            bulkImportPositionAssignments={bulkImportPositionAssignments}
            downloadPositionAssignmentTemplate={
              downloadPositionAssignmentTemplate
            }
            loading={loading}
            onClose={() => setShowBulkImportModal(false)}
            onSuccess={() => {
              loadPositionData(selectedPosition);
              setShowBulkImportModal(false);
            }}
          />
        </Modal.Body>
      </Modal>
      {(loading || updatingPanel) && <Loader />}

      <ApprovalHistoryModal
        show={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        historyData={historyData}
        loading={loadingHistory}
      />
      <Modal
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);

          setShowUpdateWarning(false);
          setPendingPayload(null);
        }}
        size="lg"
        centered
        className="modaleditcustom"
      >
        <Modal.Header closeButton>
       <Modal.Title>{t("edit_panel")}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {showUpdateWarning && (
            <div className="panel-update-warning">
              <div className="panel-update-warning-icon">
                <i className="bi bi-exclamation-triangle-fill" />
              </div>

              <div className="panel-update-warning-content">
                <div className="panel-update-warning-title">
                  Scheduled Interviews Found
                </div>

                <div className="panel-update-warning-text">
                  Scheduled interviews already exist for this panel. Continuing
                  the update will notify newly added panel members about the
                  scheduled interviews.
                </div>
              </div>

              <div className="panel-update-warning-actions">
                <button
                  className="btn btn-light"
                  onClick={() => {
                    setShowUpdateWarning(false);
                    setPendingPayload(null);
                  }}
                >
                  Cancel
                </button>

                <button
                  className="btn btn-warning text-white"
                  onClick={async () => {
                    setShowUpdateWarning(false);

                    if (pendingPayload) {
                      await updatePanel(pendingPayload);
                      setPendingPayload(null);
                    }
                  }}
                >
                  Continue Update
                </button>
              </div>
            </div>
          )}
          {editFormData && (
            <InterviewPanelFormModal
            editcancelbutton={false}
              formData={editFormData}
              setFormData={setEditFormData}
              communityOptions={communityOptions} // ✅ ADD THIS
              membersOptions={membersOptions}
              showUpdateWarning={showUpdateWarning}
              disableName={true}
              disableType={true} // ✅ ADD THIS
              onSave={async () => {
                // ✅ MEMBERS MANDATORY
                if (
                  !editFormData?.members ||
                  editFormData.members.length === 0
                ) {
                  toast.error("Please select at least one panel member");
                  return;
                }

                try {
                  const payload = preparePanelPayload(
                    editFormData,
                    communityOptions,
                    membersOptions
                  );

                  const isresScheduled =
                    await masterApiService.checkScheduledInterviews(
                      editFormData.id
                    );

                  if (isresScheduled?.data) {
                    setPendingPayload(payload);
                    setShowUpdateWarning(true);
                    return;
                  }

                  await updatePanel(payload);
                } catch (err) {
                  console.error("UPDATE PANEL ERROR", err);

                  toast.error(
                    err?.response?.data?.data ||
                      err?.response?.data?.message ||
                      "Failed to update panel"
                  );
                }
              }}
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AssignPositionsPage;
