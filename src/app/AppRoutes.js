// src/routes/AppRoutes.js
import React, { Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

// Public pages
import Login from "../modules/auth/pages/Login";
import ForgotPassword from "../modules/auth/pages/ForgotPassword";
import Tokenexp from "../modules/auth/services/Tokenexp";

// Protected / pages (non-lazy)
import JobGradePage from "../modules/master/pages/JobGrade/JobGradePage";
import LocationPage from "../modules/master/pages/Location/LocationPage";
import PositionPage from "../modules/master/pages/Position/PositionPage";
import CategoryPage from "../modules/master/pages/Category/CategoryPage";
import DocumentPage from "../modules/master/pages/Document/DocumentPage";
import UserPage from "../modules/master/pages/User/UserPage";
import JobPostingsList from "../modules/jobPosting/pages/JobPostingsList";
import CreateRequisition from "../modules/jobPosting/pages/CreateRequisition";
import GenericOrAnnexuresPage from "../modules/master/pages/GenericOrAnnexures/GenericOrAnnexuresPage";
import CertificationPage from "../modules/master/pages/CertificationPage/CertificationPage";
import EducationModal from "../modules/master/pages/EducationQualification/EducationQualificationPage";
import StatesLanguagesPage from "../modules/master/pages/StatesLanguages/StatesLanguagesPage";
import ExaminationCutoffConfiguration from "../modules/ExaminationCutoffConfiguration/ExaminationCutoffConfiguration";

import AddPosition from "../modules/jobPosting/pages/AddPosition";
// Auth & layout helpers
import PrivateRoute from "../modules/auth/services/PrivateRoute";
import DepartmentPage from "../modules/master/pages/Department/DepartmentPage";
import InterviewPanel from "../modules/committeeManagement/InterviewPanelPage";
import CandidatePreviewPage from "../modules/candidatePreview/candidatePreviewPage";
import CandidateVerification from "../modules/Verification/CandidateVerification";
import CandidateScreening from "../modules/candidatePreview/CandidateScreening";
import InterviewerSchedule from "../modules/Interviewer/InterviewerSchedule";
// import CandidateInterview from "../modules/Interview/CandidateInterview";
import ScheduleInterviews from "../modules/interviews/ScheduleInterviews";
import Approvals from "../modules/Approvals/pages/RequisitionRequests";
import ExtensionsRequests from "../modules/Approvals/pages/ExtensionsRequests";
import CommitteeRequests from "../modules/Approvals/pages/CommitteeRequests";
import InterviewRequests from "../modules/Approvals/pages/InterviewRequests";
import OfferLetterRequestApproval from "../modules/Approvals/pages/OfferLetterRequestApproval";
import Messages from "../modules/Messages/messagesScreen";
import DashboardPage from "../modules/Dashboard/DashboardPage";

import UnauthorizedPage from "./UnauthorizedPage";
import PrivilegeRoute from "./PrivilegeRoute";
import AuthCallback from "../modules/auth/pages/AuthCallback";
import { getDefaultRoute } from "../shared/utils/user-validations";
import ExamRequest from "../modules/Approvals/pages/ExamRequest";
import {
  getLoginPath,
  getOrganizationPath,
  getSavedLoginOrganization,
} from "../modules/auth/services/organizationContextService";
// Lazy loaded components
const Layout = React.lazy(() => import("../shared/components/Layout"));

// Loading fallback
const Loading = () => (
  <div
    className="d-flex justify-content-center align-items-center"
    style={{ height: "60vh" }}
  >
    <div className="spinner-border" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

const protectedRoutes = (
   <>
  <Route element={<Tokenexp />}>
    <Route element={<PrivateRoute />}>
      <Route element={<Layout />}>
        <Route
          path="dashboard"
          element={
            <PrivilegeRoute privilege="JobPostings">
              <DashboardPage />
            </PrivilegeRoute>
          }
        />

        <Route
          path="users"
          element={
            <PrivilegeRoute privilege="Admin">
              <UserPage />
            </PrivilegeRoute>
          }
        />

        <Route
          path="department"
          element={
            <PrivilegeRoute privilege="Admin">
              <DepartmentPage />
            </PrivilegeRoute>
          }
        />

        <Route
          path="location"
          element={
            <PrivilegeRoute privilege="Admin">
              <LocationPage />
            </PrivilegeRoute>
          }
        />

        <Route
          path="jobgrade"
          element={
            <PrivilegeRoute privilege="Admin">
              <JobGradePage />
            </PrivilegeRoute>
          }
        />

        <Route
          path="position"
          element={
            <PrivilegeRoute privilege="Admin">
              <PositionPage />
            </PrivilegeRoute>
          }
        />

        <Route
          path="category"
          element={
            <PrivilegeRoute privilege="Admin">
              <CategoryPage />
            </PrivilegeRoute>
          }
        />

        <Route
          path="certification"
          element={
            <PrivilegeRoute privilege="Admin">
              <CertificationPage />
            </PrivilegeRoute>
          }
        />

        <Route
          path="document"
          element={
            <PrivilegeRoute privilege="Admin">
              <DocumentPage />
            </PrivilegeRoute>
          }
        />

        <Route
          path="generic-or-annexures"
          element={
            <PrivilegeRoute privilege="Admin">
              <GenericOrAnnexuresPage />
            </PrivilegeRoute>
          }
        />

        <Route
          path="education-qualification"
          element={
            <PrivilegeRoute privilege="Admin">
              <EducationModal />
            </PrivilegeRoute>
          }
        />
        <Route
          path="state-languages"
          element={
            <PrivilegeRoute privilege="Admin">
              <StatesLanguagesPage />
            </PrivilegeRoute>
          }
        />
        <Route
          path="job-posting"
          element={
            <PrivilegeRoute privilege="JobPostings">
              <JobPostingsList />
            </PrivilegeRoute>
          }
        />

        <Route
          path="job-posting/edit-requisition"
          element={
            <PrivilegeRoute privilege="JobPostings">
              <JobPostingsList />
            </PrivilegeRoute>
          }
        />

        <Route
          path="job-posting/create-requisition"
          element={
            <PrivilegeRoute privilegesRequired={["JobPostings", "View Position"]}>
              <CreateRequisition />
            </PrivilegeRoute>
          }
        />

        <Route
          path="job-posting/:requisitionId/add-position"
          element={
            <PrivilegeRoute privilegesRequired={["JobPostings", "View Position"]}>
              <AddPosition />
            </PrivilegeRoute>
          }
        />

        <Route
          path="candidate-preview"
          element={
            <PrivilegeRoute
              privilegesRequired={[
                "Candidate Pool",
                "Verification",
                "Interview",
                "Compensation Pool",
              ]}
            >
              <CandidatePreviewPage />
            </PrivilegeRoute>
          }
        />

        <Route
          path="candidate-workflow"
          element={
            <PrivilegeRoute
              privilegesRequired={["Candidate Pool", "Compensation Pool"]}
            >
              <CandidateScreening />
            </PrivilegeRoute>
          }
        />

        <Route
          path="candidate-verification"
          element={
            <PrivilegeRoute privilege="Verification">
              <CandidateVerification />
            </PrivilegeRoute>
          }
        />

        <Route
          path="candidate-interviewer"
          element={
            <PrivilegeRoute privilege="Interview">
              <InterviewerSchedule />
            </PrivilegeRoute>
          }
        />

        <Route
          path="ExaminationCutoffConfiguration"
          element={
            <PrivilegeRoute privilegesRequired={["ExaminationCutoffConfiguration"]}>
              <ExaminationCutoffConfiguration />
            </PrivilegeRoute>
          }
        />

        <Route
          path="interviewpanel"
          element={
            <PrivilegeRoute privilege="Committee Management">
              <InterviewPanel />
            </PrivilegeRoute>
          }
        />

        <Route
          path="messages"
          element={
            <PrivilegeRoute privilege="Messages">
              <Messages />
            </PrivilegeRoute>
          }
        />

        <Route
          path="schedule-interviews"
          element={
            <PrivilegeRoute privilege="Interview Pool">
              <ScheduleInterviews />
            </PrivilegeRoute>
          }
        />

        <Route
          path="requisition-requests"
          element={
            <PrivilegeRoute privilegesRequired={["L1 Approval", "L2 Approval"]}>
              <Approvals />
            </PrivilegeRoute>
          }
        />

        <Route
          path="extension-requests"
          element={
            <PrivilegeRoute privilegesRequired={["L1 Approval", "L2 Approval"]}>
              <ExtensionsRequests />
            </PrivilegeRoute>
          }
        />

        <Route
          path="committee-requests"
          element={
            <PrivilegeRoute privilegesRequired={["L1 Approval", "L2 Approval"]}>
              <CommitteeRequests />
            </PrivilegeRoute>
          }
        />
        <Route
          path="interview-requests"
          element={
            <PrivilegeRoute privilegesRequired={["L1 Approval", "L2 Approval"]}>
              <InterviewRequests />
            </PrivilegeRoute>
          }
        />
        <Route
          path="exam-requests"
          element={
            <PrivilegeRoute privilegesRequired={["L1 Approval", "L2 Approval"]}>
              <ExamRequest />
            </PrivilegeRoute>
          }
        />
      </Route>
      <Route
        path="offerletter-requests"
        element={
          <PrivilegeRoute privilegesRequired={["L1 Approval", "L2 Approval"]}>
            <OfferLetterRequestApproval />
          </PrivilegeRoute>
        }
      />
    </Route>
  </Route>
  </>
);

const LegacyOrgRedirect = () => {
  const location = useLocation();
  return (
    <Navigate
      to={getOrganizationPath(
        `${location.pathname}${location.search}`,
        getSavedLoginOrganization()
      )}
      replace
    />
  );
};

const AppRoutes = () => {
  // Check if user is authenticated from Redux
  const authUser = useSelector((state) => state.user?.authUser);
  const savedLoginPath = getLoginPath(getSavedLoginOrganization());
  const organizationRoute = (path) =>
    getOrganizationPath(path, getSavedLoginOrganization());

  const privileges = useSelector((state) => state.user?.privileges);
  // const location = useLocation();

  // Component to catch unmatched routes
  // const NotFound = () => {
  //   console.error("🔴 Route not matched:", location.pathname, location.search);
  //   return <Navigate to="/login" />;
  // };

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/:orgSlug/login" element={<Login />} />
        <Route path="/login" element={<Navigate to={savedLoginPath} replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route
          path="/"
          element={
            authUser ? (
              <Navigate
                to={organizationRoute(getDefaultRoute(privileges))}
                replace
              />
            ) : (
              <Navigate to={savedLoginPath} replace />
            )
          }
        />
        {/* Protected routes */}
        <Route path="/:orgSlug">
          {protectedRoutes}
        </Route>
        <Route path="/*" element={<LegacyOrgRedirect />} />

        {/* Catch-all → login */}
        {/* <Route path="*" element={<NotFound />} /> */}
        <Route path="*" element={<Navigate to={savedLoginPath} replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
 
