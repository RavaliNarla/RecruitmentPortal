import React from "react";
import StatCard from "./StatCard";
import { useTranslation } from "react-i18next";
import {
  faLayerGroup,
  faClipboardList,
  faBuilding,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

const SummaryCards = ({ summary, onCardClick }) => {
    const { t } = useTranslation("dashboard");

const cards = [
  {
    key: "vacancies",
    title: t("total_vacancies"),
    value: (summary?.totalVacancies ?? 0).toLocaleString("en-IN"),
    color: "#7C3AED",
    bgColor: "#FCFAFF",
    iconBg: "#F3EEFF",
    icon: faLayerGroup,
  },
  {
    key: "requisitions",
    title: t("total_requisitions"),
    value: (summary?.totalRequisitions ?? 0).toLocaleString("en-IN"),
    color: "#003087",
    bgColor: "#FBFDFF",
    iconBg: "#EEF5FF",
    icon: faClipboardList,
  },
  {
    key: "departments",
    title: t("total_departments"),
    value: (summary?.totalDepartments ?? 0).toLocaleString("en-IN"),
    color: "#C8102E",
    bgColor: "#FFF9F9",
    iconBg: "#FFF0F2",
    icon: faBuilding,
  },
  {
    key: "positions",
    title: t("total_positions"),
    value: (summary?.totalPositions ?? 0).toLocaleString("en-IN"),
    color: "#059669",
    bgColor: "#F7FFFB",
    iconBg: "#ECFFF7",
    icon: faUsers,
  },
];


  return (
    <div className="row mt-4">
      {cards.map((card) => (
        <div className="col-lg-3 col-md-6 mb-3" key={card.title}>
          <div
            onClick={() => onCardClick(card.key)}
            style={{ cursor: "pointer" }}
          >
            <StatCard {...card} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
