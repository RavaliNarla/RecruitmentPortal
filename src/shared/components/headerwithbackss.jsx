import React from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { getOrganizationPath } from "../../modules/auth/services/organizationContextService";

const HeaderWithBackss = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orgSlug } = useParams();
  const { t } = useTranslation("common");

  const state = location.state || {};

  //  Hooks must be here
  const privileges = useSelector((state) => state.user.privileges);

  const handleBack = () => {
    sessionStorage.setItem("fromPreviewBack", "true");

    const payload = {
      requisition: state.requisition,
      position: state.position,
      requisitionId: state.requisitionId,
      positionIds:
        Array.isArray(state.positionIds) && state.positionIds.length > 0
          ? state.positionIds
          : Array.isArray(state.position)
          ? state.position.map((p) => p.positionId)
          : state.position?.positionId
          ? [state.position.positionId]
          : [],
      activeTab: state.activeTab,
      preloadedCandidates: state.preloadedCandidates || state.candidates || [],
      selectedDate: state.selectedDate,
      page: state.page,
      pageSize: state.pageSize,
    };

    if (state.from) {
      navigate(getOrganizationPath(state.from, orgSlug), {
        state: {
          ...payload,
          from: state.from,
        },
      });
      return;
    }

    if (privileges?.Interview) {
      navigate(getOrganizationPath("/candidate-interviewer", orgSlug), {
        state: payload,
      });
      return;
    }

    if (privileges?.Verification) {
      navigate(getOrganizationPath("/candidate-verification", orgSlug), {
        state: payload,
      });
      return;
    }

    if (privileges?.["Candidate Pool"]) {
      navigate(getOrganizationPath("/candidate-workflow", orgSlug), {
        state: payload,
      });
      return;
    }

    navigate(-1);
  };

  return (
    <div className="d-flex align-items-start" style={{ marginBottom: 12 }}>
      <div
        className="d-flex align-items-center gap-1"
        style={{
          cursor: "pointer",
          color: "#6c757d",
          fontSize: 14,
          marginRight: 25,
          marginTop: 2,
        }}
        onClick={handleBack}
      >
        <i className="bi bi-arrow-left"></i>
        <span>{t("back")}</span>
      </div>

      <div>
        <div style={{ fontSize: 18, fontWeight: 600, color: "#162B75" }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: "#6c757d" }}>{subtitle}</div>
      </div>
    </div>
  );
};

export default HeaderWithBackss;
