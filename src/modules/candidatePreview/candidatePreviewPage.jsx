import React, { useEffect, useState } from "react";
import "../../style/css/PreviewModal.css";

import RequisitionStrip from "../candidatePreview/components/RequisitionStrip";
import ApplicationForm from "../candidatePreview/components/ApplicationForm";

import masterApiService from "../master/services/masterApiService";
import candidateWorkflowServices from "../candidatePreview/services/CandidateWorkflowServices";
import { mapCandidateToPreview } from "../candidatePreview/mappers/candidatePreviewMapper";

import { useLocation, useNavigate, useParams } from "react-router-dom";
import HeaderWithBack from "../../../src/shared/components/HeaderWithBack";
import HeaderWithBacks from "../../../src/shared/components/headerwithbacks";
import HeaderWithBackss from "../../../src/shared/components/headerwithbackss";
import { useSelector } from "react-redux";
import { getOrganizationPath } from "../auth/services/organizationContextService";
import { useTranslation } from "react-i18next";

const CandidatePreviewPage = ({ onHide }) => {
  const { t } = useTranslation(["candidateWorkflow", "common"]);
  const location = useLocation();
  const navigate = useNavigate();
  const { orgSlug } = useParams();

  //  DEFINE STATE FIRST
  const state = location.state || {};
  const activeTab = state?.activeTab;
  const isCandidateWorkflow = activeTab === "CANDIDATE_POOL";
  const user = useSelector((state) => state.user.user);
  const role = user?.role ? user.role.toLowerCase() : ""; // const isZonalHr = role === "zonal_hr";

  const isFromCompensationPool = state?.fromCompensationPool;

  const privileges = useSelector((state) => state.user.privileges);
  const candidatePositionId = state?.candidatePositionId;

  const isInterviewer = privileges?.Interview;
  const isZonalHr = privileges?.Verification;

  const isRecruiter = role === "recruiter";

  const selectedDate = state?.selectedDate;

  //  Now safe to use state
  const interviewScheduleId = state?.interviewScheduleId;

  const candidate = state?.candidate;
  const requisition = state?.requisition;
  const requisitionTitle = requisition?.requisition_title;
  const positionName = state?.position?.positionName;
  const isLocationWise = state?.position?.isLocationWise;

  const position = Array.isArray(state?.position)
    ? state.position.find((p) => p.positionId === candidatePositionId) ||
      state.position[0]
    : state?.position || null;

  const candidateId = candidate?.candidateId;
  const positionId = state?.positionId;
  const requisitionId = state?.requisitionId;
  const positionIds = state?.positionIds || [];
  const positionss = state.position;

  const backRequisitionId =
    state?.requisitionId || state?.requisition?.id || state?.requisition?.requisitionId;
  const backPositionIds =
    Array.isArray(state?.positionIds) && state.positionIds.length > 0
      ? state.positionIds
      : Array.isArray(state?.position)
      ? state.position.map((p) => p.positionId).filter(Boolean)
      : state.position?.positionId
      ? [state.position.positionId]
      : [];

  const applicationId = isZonalHr
    ? state?.applicationId
    : (state?.applicationId ?? state?.candidate?.id);

  const [masters, setMasters] = useState({});
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dynamicFormData, setDynamicFormData] = useState([]);
  const [dynamicFields, setDynamicFields] = useState([]);

  const isFromInterview = state?.from === "/candidate-interviewer";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const masterRes = await masterApiService.getMasterDisplayAll();
        const fullMasters = masterRes?.data || {};

        const InterviewCenters =
          await masterApiService.getAllInterviewCenters();
        const ZonalStats = await masterApiService.getZonalStates();
        setMasters(fullMasters);
        /* ---------- Load Candidate ---------- */
        if (candidateId && (positionId || positionIds.length > 0)) {
          const candidateRes =
            await candidateWorkflowServices.getCandidateAllDetails(
              candidateId,
              candidatePositionId || positionId
            );

          const candidateMasters = {
            genders: fullMasters.genderMasters || [],
            religions: fullMasters.religionMaster || [],
            marital_statuses: fullMasters.maritalStatusMaster || [],
            reservation_categories: fullMasters.reservationCategories || [],
            education_levels: fullMasters.educationLevels || [],
            mandatory_qualifications: fullMasters.mandatoryQualification || [],
            specializations: fullMasters.specializationMaster || [],
            countries: fullMasters.countries || [],
            states: fullMasters.states,
            districts: fullMasters.districts,
            cities: fullMasters.cities,
            pincodes: fullMasters.pincodes,
            interviewCenters: InterviewCenters.data || [],
            zonalStats: ZonalStats.data || [],
            languages: fullMasters.languageMasters || [],
          };

          const mapped = mapCandidateToPreview(
            candidateRes.data,
            candidateMasters
          );

          setPreviewData(mapped);
          setDynamicFormData(mapped?.additionalDetails?.dynamicFormData || []);
           console.log("PreviewPage mapped ", mapped || []);
        }
      } catch (error) {
        console.error("Candidate preview load failed", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [candidateId, positionId]);

  return (
    <div className="bob-preview-page container-fluid p-4">
      {/* Close Button */}
      <button
        type="button"
        className="btn-close position-absolute"
        style={{ top: "6px", right: "15px", zIndex: 1 }}
        onClick={onHide || (() => navigate(-1))}
        aria-label="Close"
      />

      {/* Header */}
      {isFromInterview ? (
        <HeaderWithBackss
          title={t("candidateWorkflow:candidate_profile")}
          subtitle={t("candidateWorkflow:view_candidate_application_status")}
        />
      ) : isRecruiter ||
      privileges?.["Candidate Pool"] ||
      privileges?.["Compensation Pool"] ? (
        <HeaderWithBack
          title={t("candidateWorkflow:candidate_screening")}
          subtitle={t("candidateWorkflow:manage_schedule_interviews")}
          onBack={() => {
            navigate(getOrganizationPath("/candidate-workflow", orgSlug), {
              state: {
                requisition: state.requisition,
                position: state.position,
                requisitionId: backRequisitionId,
                positionIds: backPositionIds,
                preloadedCandidates:
                  state.preloadedCandidates || state.candidates || [],
                selectedDate: state.selectedDate,
                page: state.page,
                pageSize: state.pageSize,
                filters: state.filters,
                activeTab: state.activeTab,
              },
            });
          }}
          positionId={positionId}
          requisitionId={requisitionId}
          candidateScreening={true}
          activeTab={activeTab}
        />
      ) : isZonalHr ? (
        <HeaderWithBacks
          title={t("candidateWorkflow:candidate_profile")}
          subtitle={t("candidateWorkflow:view_candidate_application_status")}
          onBack={() => {
            sessionStorage.setItem("fromPreviewBack", "true");

            navigate(getOrganizationPath("/candidate-verification", orgSlug), {
              state: {
                requisition,
                position,
                requisitionId: backRequisitionId,
                positionIds: backPositionIds,
                preloadedCandidates: state.preloadedCandidates || state.candidates || [],
                selectedDate,
                page: state.page,
                pageSize: state.pageSize,
                filters: state.filters,
              },
            });
          }}
        />
      ) : isInterviewer ? (
        <HeaderWithBackss
          title={t("candidateWorkflow:candidate_profile")}
          subtitle={t("candidateWorkflow:view_candidate_application_status")}
          onBack={() => {
            sessionStorage.setItem("fromPreviewBack", "true");

            navigate(getOrganizationPath("/candidate-interviewer", orgSlug), {
              state: {
                requisition,
                position,
                requisitionId: backRequisitionId,
                positionIds: backPositionIds,
                preloadedCandidates:
                  state.preloadedCandidates || state.candidates || [],
                selectedDate,
                page: state.page,
                pageSize: state.pageSize,
                filters: state.filters,
              },
            });
          }}
        />
      ) : null}

      {/* Requisition Strip */}
      {isZonalHr && requisition && position && (
        <RequisitionStrip
          requisition={requisition}
          position={position}
          isCardBg
          isSaveEnabled={false}
          showSaveButton={true}
          isSaveBtn={false}
          setDynamicFields={setDynamicFields}
        />
      )}

      {!isZonalHr && requisition && position && (
        <RequisitionStrip
          requisition={requisition}
          position={position}
          isCardBg
          isSaveEnabled={false}
          setDynamicFields={setDynamicFields}
        />
      )}

      {/* Application Form */}
      <div className="my-4">
        {loading ? (
          <div className="text-center py-4">
            {t("candidateWorkflow:loading_candidate_details")}
          </div>
        ) : (
          previewData && (
            <ApplicationForm
              previewData={previewData}
              normalizedMasters={masters}
              candidateId={candidateId}
              positionId={positionId}
              positionIds={positionss}
              applicationId={applicationId}
              requisitionId={requisitionId}
              interviewScheduleId={interviewScheduleId}
              requisitionTitle={requisitionTitle}
              positionName={positionName}
              selectedDate={selectedDate}
              zonalVerificationStatus={candidate?.zonalVerificationStatus}
              zonalSubmitBeforeDate={candidate?.zonalSubmitBeforeDate}
              zonalHrComments={candidate?.zonalHrComments}
              isLocationWise={isLocationWise}
              candidateStatus={candidate?.status}
              examQualificationStatus={candidate?.examQualificationStatus}
              isFromInterview={isFromInterview}
              isFromCompensationPool={isFromCompensationPool}
              page={state.page}
              pageSize={state.pageSize}
              dynamicFormData={dynamicFormData}
              dynamicFields={dynamicFields || []}
              isCandidateWorkflow={isCandidateWorkflow}
            />
          )
        )}
      </div>
    </div>
  );
};

export default CandidatePreviewPage;
