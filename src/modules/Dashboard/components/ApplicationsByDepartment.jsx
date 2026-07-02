import React from "react";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Tooltip,
} from "recharts";

import { FiBarChart2 } from "react-icons/fi";
import "../../../style/css/Dashboard/ApplicationsByDepartment.css";


const ApplicationsByDepartment = ({ applicationsByDepartment = [] }) => {

  const { t } = useTranslation("dashboard");


  
const CustomTooltip = ({ active, payload }) => {
  const { t } = useTranslation("dashboard");

  if (active && payload && payload.length) {
    const item = payload[0].payload;

    return (
      <div className="applications-tooltip">
        <div className="tooltip-title">{item.department}</div>

        <div className="tooltip-value">
          {item.value} {t("applications")}
        </div>
      </div>
    );
  }

  return null;
};
  return (
    <div className="applications-card mb-4">
      <div className="applications-header">
        <div className="applications-icon">
          <FiBarChart2 />
        </div>

        <div>
         <h2>{t("applications_by_department")}</h2>

<p>{t("current_recruitment_cycle")}</p>
        </div>
      </div>

      <div className="applications-chart">
        {applicationsByDepartment.length === 0 ? (
          <div className="chart-no-data">
  <FiBarChart2 className="no-data-icon" />
  {t("no_data_found")}
</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={applicationsByDepartment}>
              <CartesianGrid strokeDasharray="4 4" vertical />

              {/* <XAxis
              dataKey="department"
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={120}
            /> */}

              <YAxis tickLine={false} axisLine={false} />

              <Tooltip
                cursor={{
                  fill: "rgba(0,0,0,0.08)",
                }}
                content={<CustomTooltip />}
              />

              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={10}>
                {applicationsByDepartment.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default ApplicationsByDepartment;
