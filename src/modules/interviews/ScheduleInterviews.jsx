import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { getOrganizationPath } from "../auth/services/organizationContextService";

import HeaderWithBack from "../../shared/components/HeaderWithBack";

import InterviewPanelsConfig from "../interviews/components/InterviewPanelsConfig";
import InterviewScheduleTable from "../interviews/components/InterviewScheduleTable";
import useInterviewSchedule from "../interviews/hooks/useInterviewSchedule";
import ScheduleReadyBar from "../interviews/components/ScheduleReadyBar";
import RequisitionStripformultiplepositions from "../candidatePreview/components/RequisitionStripformultiplepositions";
import DropdownStripMultipleposition from "../candidatePreview/components/DropdownStripMultipleposition";
import { toast } from "react-toastify";

import "../../style/css/CandidateScreening.css";
import InterviewCentreAllocationModal from "../interviews/components/InterviewCentreAllocationModal";
import InterviewCentreConfirmModal from "../interviews/components/InterviewCentreConfirmModal";
import ScheduleErrorModal from "../interviews/components/ScheduleErrorModal";
const ScheduleInterviews = () => {
  const navigate = useNavigate();
  const { orgSlug } = useParams();

  const [scheduledCount, setScheduledCount] = useState(0);
  const [showReadyBar, setShowReadyBar] = useState(false);
  const [showCentreModal, setShowCentreModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorCandidates, setErrorCandidates] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [showCentreConfirmModal, setShowCentreConfirmModal] = useState(false);
  const [pendingApplyData, setPendingApplyData] = useState(null);

  const [centreRows, setCentreRows] = useState([
    {
      allocatedCentreId: "",
      replacedCentreId: "",
    },
  ]);

  const location = useLocation();
  const state = location.state || {};
  const isEditMode = location.state?.isEditMode;
  const isReschedule = location.state?.isReschedule;
  const {
    schedule,
    setSchedule,
    requisitions,
    selectedRequisitionId,
    loadingRequisitions,
    positions,
    selectedPositionId,
    loadingPositions,
    handleRequisitionChange,
    setSelectedPositionId,
    passedCandidates,
    applySchedule,
    scheduleInterview,
    allInterviewCentres,
  } = useInterviewSchedule(isEditMode, isReschedule);

  const selectedRequisition = requisitions.find(
    (r) => r.id === selectedRequisitionId
  );
const [isScheduling, setIsScheduling] = useState(false);
  const normalizedRequisition = selectedRequisition
    ? {
        requisition_id: selectedRequisition.id,
        requisition_code: selectedRequisition.requisitionCode,
        requisition_title: selectedRequisition.requisitionTitle,
        registration_start_date: selectedRequisition.startDate,
        registration_end_date: selectedRequisition.endDate,
      }
    : null;

  //from schedule pool

  const schedulePoolData = location.state?.schedulePoolData;

  useEffect(() => {
    if (!isEditMode || !schedulePoolData?.length) {
      return;
    }

    const mappedRows = schedulePoolData.map((item) => ({
      id: item.id,

      // ✅ IMPORTANT FOR RESCHEDULE
      applicationId: item.applicationId,

      interviewCenterId: item.interviewCenterId,

      panelId: item.panelId,

      duration: item.duration,

      perDay: item.perDay,

      startTime: item.startTime,

      endTime: item.endTime,

      rawDate: item.rawDate,

      // TABLE DATA
      name: item.name,

      regNo: item.regNo,

      date: item.date,

      time: item.time,

      zone: item.zone,

      panel: item.panel,
      positionId: item.positionId,
    }));

    setSchedule(mappedRows);

    setScheduledCount(mappedRows.length);

    //setShowReadyBar(true);
  }, [isEditMode, schedulePoolData]);

  //end

  const selectedPosition = positions.filter((p) =>
    selectedPositionId?.includes(p.jobPositions?.positionId)
  );
  const isSelectionDone = selectedRequisition && selectedPosition.length > 0;
  const sourceCandidates = isEditMode ? schedulePoolData : passedCandidates;
  const uniqueAllocatedCentres = [
    ...new Map(
      sourceCandidates.map((candidate) => [
        isEditMode ? candidate.interviewCenterId : candidate.interviewCenterId,

        {
          interviewCentreId: isEditMode
            ? candidate.interviewCenterId
            : candidate.interviewCenterId,

          interviewCentre: isEditMode
            ? candidate.zone
            : candidate.interviewCenterName,
        },
      ])
    ).values(),
  ];

  const panelNameMap = {};

  (schedulePoolData || []).forEach((item) => {
    if (item?.panelId && item?.panel) {
      panelNameMap[item.panelId] = item.panel;
    }
  });

  const rebuiltSelectedPanels = Object.values(
    (schedulePoolData || []).reduce((acc, item) => {
      const configurations = item.panelScheduleConfigurations || [];

      configurations.forEach((config) => {
        const panelId = config?.panelId;

        if (!panelId) return;

        const panelName = panelNameMap[panelId] || "";

        // ✅ create panel group
        if (!acc[panelId]) {
          acc[panelId] = {
            id: panelId,

            name: panelName,

            slots: [],
          };
        }

        const slotDate = config?.startDatetime?.split("T")[0];

        if (!slotDate) return;

        const startTime =
          config?.startDatetime?.split("T")[1]?.slice(0, 5) || "";

        const endTime = config?.endDatetime?.split("T")[1]?.slice(0, 5) || "";

        const duration = String(config?.durationMinutes || 15);

        // ✅ SAME PANEL + SAME DATE
        const existingSlot = acc[panelId].slots.find(
          (slot) => slot.date === slotDate
        );

        // ================= MERGE =================

        if (existingSlot) {
          // earliest start
          if (startTime && startTime < existingSlot.startTime) {
            existingSlot.startTime = startTime;
          }

          // latest end
          if (endTime && endTime > existingSlot.endTime) {
            existingSlot.endTime = endTime;
          }

          // ✅ recalculate perDay
          const start = new Date(`2000-01-01T${existingSlot.startTime}`);

          const end = new Date(`2000-01-01T${existingSlot.endTime}`);

          const diffMins = (end - start) / (1000 * 60);

          existingSlot.perDay = String(
            Math.floor(diffMins / Number(existingSlot.duration || 15))
          );
        }

        // ================= NEW SLOT =================
        else {
          const start = new Date(`2000-01-01T${startTime}`);

          const end = new Date(`2000-01-01T${endTime}`);

          const diffMins = (end - start) / (1000 * 60);

          const perDay = String(Math.floor(diffMins / Number(duration || 15)));

          acc[panelId].slots.push({
            date: slotDate,

            startTime,

            endTime,

            duration,

            perDay,
          });
        }
      });

      return acc;
    }, {})
  );
  /* ================= UI ================= */
  const sourceTab = state?.sourceTab || state?.activeTab || "CANDIDATE_POOL";
  return (
    <div className="container-fluid px-4 py-3 mb-5 pb-5">
      <HeaderWithBack
        title="Schedule Interviews"
        subtitle={`Scheduling for ${
          isEditMode
            ? schedulePoolData?.length || 0
            : passedCandidates?.length || 0
        } candidates`}
        requisitionId={state.requisitionId}
        positionId={
          Array.isArray(state.positionId)
            ? state.positionId[0]
            : state.positionId
        }
        activeTab={sourceTab}
        onBack={() => {
          navigate(getOrganizationPath("/candidate-workflow", orgSlug), {
            state: {
              requisitionId: state.requisitionId,
              positionIds: Array.isArray(state.positionId)
                ? state.positionId
                : [state.positionId],
              requisition: state.requisition,
              position: state.position,
              page: state.page,
              pageSize: state.pageSize,
              filters: state.filters,
              activeTab: sourceTab,
            },
          });
        }}
      />
      {/* ===== DROPDOWN STRIP ===== */}
      <div className="card border-0 mt-3">
        <div className="card-body">
          <div className="row g-3">
            <DropdownStripMultipleposition
              requisitions={requisitions}
              positions={positions}
              selectedRequisitionId={selectedRequisitionId}
              selectedPositionId={selectedPositionId}
              loadingRequisitions={loadingRequisitions}
              loadingPositions={loadingPositions}
              onRequisitionChange={handleRequisitionChange}
              onPositionChange={setSelectedPositionId}
              onRequisitionSearch={() => {}}
              disableRequisition={true}
              disablePosition={true}
              isReadonly={true}
            />
          </div>
        </div>
      </div>

      {/* ===== REQUISITION STRIP ===== */}
      {isSelectionDone && (
        <div className="mt-3">
          <RequisitionStripformultiplepositions
            requisition={normalizedRequisition}
            position={selectedPosition.map((p) => ({
              positionId: p.jobPositions?.positionId,
              positionName: p.masterPositions?.positionName,
            }))}
            isCardBg={false}
            isSaveEnabled={false}
            isSaveBtn={false}
            saveButton={false}
            isReadonly={true}
          />
        </div>
      )}

      {/* ===== PANELS CONFIG ===== */}
      <InterviewPanelsConfig
        positionId={selectedPositionId}
        candidates={isEditMode ? schedulePoolData : passedCandidates} // ✅ ADD
        onScheduleReady={(rows) => {
          setSchedule(rows);
          setScheduledCount(rows.length);
          //   setShowReadyBar(true);   // ✅ trigger here
        }} // ✅ ADD
        onApplyAll={(data) => {
          // ✅ EDIT MODE
          if (isEditMode) {
            const editPayload = {
              selectedPanels: data.selectedPanels,

              positionId: Array.isArray(selectedPositionId)
                ? selectedPositionId
                : [selectedPositionId],

              candidates: schedule.map((item) => ({
                id: item.applicationId || item.id,

                interviewCenterId: item.interviewCenterId,
              })),
            };

            setPendingApplyData(editPayload);
          } else {
            setPendingApplyData(data);
          }

          setShowCentreConfirmModal(true);
        }}
        initialSelectedPanels={isReschedule ? [] : rebuiltSelectedPanels}
      />

      {showReadyBar && (
        <div className="mt-3">
          <ScheduleReadyBar
            count={scheduledCount}
             isScheduling={isScheduling}
            onCancel={() => setShowReadyBar(false)}
            onSchedule={async () => {
                if (isScheduling) return;

                try {
                  setIsScheduling(true);

                  const res = await scheduleInterview();

                  if (!res?.success) {
                    setErrorMessage(
                      res?.message || "Failed to schedule interviews"
                    );

                    setErrorCandidates(Array.isArray(res?.data) ? res.data : []);

                    setShowErrorModal(true);

                    return;
                  }

                  toast.success("Interview scheduled successfully");

                  navigate(getOrganizationPath("/candidate-workflow", orgSlug), {
                    state: {
                      requisitionId: selectedRequisitionId,
                      positionIds: Array.isArray(selectedPositionId)
                        ? selectedPositionId
                        : [selectedPositionId],
                      activeTab: "SCHEDULE_POOL",
                      refreshSchedulePool: true,
                    },
                  });
                } finally {
                  setIsScheduling(false);
                }
              }}
          />
        </div>
      )}

      {/* ===== INTERVIEW SCHEDULE TABLE ===== */}
      <InterviewScheduleTable
        rows={schedule}
        positionId={selectedPositionId}
        position={selectedPosition}
      />

      {showCentreModal && (
        <InterviewCentreAllocationModal
          show={showCentreModal}
          onClose={() => setShowCentreModal(false)}
          uniqueAllocatedCentres={uniqueAllocatedCentres}
          centreRows={centreRows}
          setCentreRows={setCentreRows}
          allInterviewCentres={allInterviewCentres}
          onContinue={async () => {
            setShowCentreModal(false);

            // 🔥 Build zonalChangeMap
            const zonalChangeMap = {};

            // 🔥 first add all centres with empty
            uniqueAllocatedCentres.forEach((centre) => {
              zonalChangeMap[centre.interviewCentreId] = "";
            });

            // 🔥 overwrite changed centres
            centreRows.forEach((row) => {
              if (row.allocatedCentreId && row.replacedCentreId) {
                zonalChangeMap[row.allocatedCentreId] = row.replacedCentreId;
              }
            });

            // 🔥 Call scheduling API
            const res = await applySchedule({
              ...pendingApplyData,

              zonalChangeMap,
            });

            if (!res.success) {
              setErrorMessage(res.message);

              setErrorCandidates(res.data || []);

              setShowErrorModal(true);

              return;
            }

            setSchedule(res.rows);

            setScheduledCount(res.rows.length);

            setShowReadyBar(true);
          }}
        />
      )}

      <InterviewCentreConfirmModal
        show={showCentreConfirmModal}
        onClose={() => setShowCentreConfirmModal(false)}
        onReview={() => {
          setShowCentreConfirmModal(false);

          // ✅ ONLY ONE EMPTY ROW
          setCentreRows([
            {
              allocatedCentreId: "",
              replacedCentreId: "",
            },
          ]);

          setShowCentreModal(true);
        }}
        onProceed={async () => {
          setShowCentreConfirmModal(false);

          const zonalChangeMap = {};

          uniqueAllocatedCentres.forEach((centre) => {
            zonalChangeMap[centre.interviewCentreId] = "";
          });
          const res = await applySchedule({
            ...pendingApplyData,
            zonalChangeMap,
          });

          if (!res.success) {
            setErrorMessage(res.message);

            setErrorCandidates(res.data || []);

            setShowErrorModal(true);

            return;
          }

          // ✅ IMPORTANT
          setSchedule(res.rows);

          setScheduledCount(res.rows.length);

          setShowReadyBar(true);
        }}
      />

      <ScheduleErrorModal
        show={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errorMessage={errorMessage}
        errorCandidates={errorCandidates}
      />
    </div>
  );
};

export default ScheduleInterviews;
