import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useTranslation } from "react-i18next";
import { FiTrendingUp } from "react-icons/fi";
import "../../../style/css/Dashboard/MonthlyRecruitmentTrends.css";

const CustomTooltip = ({ active, payload, label }) => {
  const { t } = useTranslation("dashboard");

  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="monthly-tooltip">
      <div className="tooltip-month">{label}</div>

      {payload.map((entry, index) => (
        <div key={index} className="tooltip-row">
          <div className="tooltip-left">
            <span
              className="tooltip-dot"
              style={{
                background: entry.color,
              }}
            />

            <span className="tooltip-text">{entry.name}:</span>
          </div>

          <span className="tooltip-value">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const MonthlyRecruitmentTrends = ({ monthlyTrends = [] }) => {
  const { t } = useTranslation("dashboard");
  return (
    <div className="monthly-trends-card mb-4">
      <div className="monthly-trends-header">
        <div className="monthly-trends-icon">
          <FiTrendingUp />
        </div>

        <div>
          <h2>{t("monthly_recruitment_trends")}</h2>

          <p>{t("monthly_performance_overview")}</p>
        </div>
      </div>
      <div className="monthly-trends-legend">
        <div className="legend-item">
          <span className="legend-line" style={{ background: "#0D3B94" }} />
          <span className="legend-text">{t("candidate_registrations")}</span>
        </div>

        <div className="legend-item">
          <span className="legend-line" style={{ background: "#1482BE" }} />
          <span className="legend-text">{t("interviews_completed")}</span>
        </div>

        <div className="legend-item">
          <span className="legend-line" style={{ background: "#D90429" }} />
          <span className="legend-text">{t("requisitions_created")}</span>
        </div>

        <div className="legend-item">
          <span className="legend-line" style={{ background: "#0F9D58" }} />
          <span className="legend-text">{t("offers_sent")}</span>
        </div>
      </div>

      <div className="monthly-chart-wrapper">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={monthlyTrends}>
            <CartesianGrid strokeDasharray="4 4" />

            <XAxis dataKey="month" axisLine={false} tickLine={false} />

            <YAxis axisLine={false} tickLine={false} />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "#94a3b8",
                strokeDasharray: "4 4",
                strokeWidth: 1,
              }}
            />

            <Line
              name={t("candidate_registrations")}
              type="monotone"
              dataKey="registrations"
              stroke="#0D3B94"
              strokeWidth={2}
              dot={{
                r: 3,
                fill: "#0D3B94",
                stroke: "#0D3B94",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 5,
                fill: "#0D3B94",
                stroke: "#0D3B94",
                strokeWidth: 2,
              }}
            />

            <Line
              name={t("interviews_completed")}
              type="monotone"
              dataKey="interviews"
              stroke="#1482BE"
              strokeWidth={2}
              dot={{
                r: 3,
                fill: "#1482BE",
                stroke: "#1482BE",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 5,
                fill: "#1482BE",
                stroke: "#1482BE",
                strokeWidth: 2,
              }}
            />

            <Line
              name={t("requisitions_created")}
              type="monotone"
              dataKey="requisitions"
              stroke="#D90429"
              strokeWidth={2}
              dot={{
                r: 3,
                fill: "#D90429",
                stroke: "#D90429",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 5,
                fill: "#D90429",
                stroke: "#D90429",
                strokeWidth: 2,
              }}
            />

            <Line
              name={t("offers_sent")}
              type="monotone"
              dataKey="offers"
              stroke="#0F9D58"
              strokeWidth={2}
              dot={{
                r: 3,
                fill: "#0F9D58",
                stroke: "#0F9D58",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 5,
                fill: "#0F9D58",
                stroke: "#0F9D58",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyRecruitmentTrends;
