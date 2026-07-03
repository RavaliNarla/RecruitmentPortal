import React from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { getOrganizationPath } from "../../modules/auth/services/organizationContextService";

const PageHeaderWithBacks = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orgSlug } = useParams();
  const { t } = useTranslation("common");

  const state = location.state || {};

  const user = useSelector((s) => s.user.user);
  const role = user?.role?.toLowerCase();
  const isZonalHr = role === "zonal_hr";

  const handleBack = () => {
    // allow one-time restore
    sessionStorage.setItem("fromPreviewBack", "true");

    const targetRoute = isZonalHr
      ? "/candidate-verification"
      : "/candidate-workflow";

    navigate(getOrganizationPath(targetRoute, orgSlug), {
      state: {
        requisition: state.requisition,
        position: state.position,
        preloadedCandidates:
          state.preloadedCandidates || state.candidates || [],
        selectedDate: state.selectedDate,

        // 🔥 ADD THESE
        activeTab: state.activeTab,
        requisitionId: state.requisitionId,
        positionId: state.positionId,

        page: state.page,
        pageSize: state.pageSize,

        // 🔥 INTERVIEW FIX (VERY IMPORTANT)
        interviewPage: state.interviewPage,
        interviewPageSize: state.interviewPageSize,

        filters: state.filters,
        searchText: state.searchText,
        activeStage: state.activeStage,
      },
    });
  };

  return (
    <div className="d-flex align-items-start" style={{ marginBottom: "12px" }}>
      {/* BACK BUTTON */}
      <div
        className="d-flex align-items-center gap-1"
        style={{
          cursor: "pointer",
          color: "#6c757d",
          fontSize: "14px",
          marginRight: "25px",
          marginTop: "2px",
        }}
        onClick={handleBack}
      >
        <i className="bi bi-arrow-left"></i>
        <span>{t("back")}</span>
      </div>

      {/* TITLE */}
      <div>
        <div
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: "#162B75",
            lineHeight: "1.2",
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: "13px",
            color: "#6c757d",
            marginTop: "2px",
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
};

export default PageHeaderWithBacks;
