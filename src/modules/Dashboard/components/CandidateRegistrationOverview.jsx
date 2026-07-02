import React from "react";
import {
  FiUsers,
  FiUserCheck,
  FiCheckCircle,
  FiBriefcase,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import "../../../style/css/Dashboard/CandidateRegistrationOverview.css";

const CandidateRegistrationOverview = ({ data }) => {
  const { t } = useTranslation("dashboard");
const steps = [
  {
    value: data?.totalCandidates ?? 0,
    label: t("total_candidates"),
    color: "#0f3b96",
    border: "#bfd7ff",
    bg: "#eef4ff",
    icon: <FiUsers />,
  },
  {
    value: data?.registeredOnly ?? 0,
    label: t("registered_only"),
    color: "#7c3aed",
    border: "#e7d8ff",
    bg: "#f5f0ff",
    icon: <FiUserCheck />,
  },
  {
    value: data?.profileCompleted ?? 0,
    label: t("profile_completed"),
    color: "#059669",
    border: "#c7f0dd",
    bg: "#edfdf5",
    icon: <FiCheckCircle />,
  },
  {
    value: data?.appliedCandidates ?? 0,
    label: t("applied_candidates"),
    color: "#d90429",
    border: "#ffd1d8",
    bg: "#fff1f3",
    icon: <FiBriefcase />,
  },
];

  return (
    <div className="candidate-overview-card">
      <div className="candidate-header">
        <div className="candidate-header-icon">
          <FiUsers />
        </div>

        <div>
         <h3>{t("candidate_registration_overview")}</h3>

<p>{t("candidate_funnel")}</p>
        </div>
      </div>

      <div className="candidate-flow">
        {steps.map((step, index) => (
          <React.Fragment key={step.label}>
            <div
              className="candidate-step"
              style={{
                borderColor: step.border,
              }}
            >
              <div
                className="step-icon"
                style={{
                  background: step.bg,
                  color: step.color,
                }}
              >
                {step.icon}
              </div>

              <div
                className="step-value"
                style={{
                  color: step.color,
                }}
              >
                {step.value.toLocaleString()}
              </div>

              <div className="step-label">{step.label}</div>
            </div>

            {index !== steps.length - 1 && (
              <div className="flow-arrow">→</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default CandidateRegistrationOverview;