import React from "react";
import { FiUsers } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import "../../../style/css/Dashboard/CategoryWiseDistribution.css";

const colorClasses = ["blue", "red", "green", "orange", "purple"];

const CategoryWiseDistribution = ({ categories = [] }) => {

  const { t } = useTranslation("dashboard");
  return (
    <div className="category-distribution-card mb-4">
      <div className="category-header">
        <div className="category-header-icon">
          <FiUsers />
        </div>

        <div>
          <h2>{t("category_wise_distribution")}</h2>

<p>{t("vacancy_distribution_by_category")}</p>
        </div>
      </div>

      <div className="category-grid">
        {categories.length === 0 ? (
         <div className="no-data">{t("no_data_available")}</div>
        ) : (
          categories.map((item, index) => (
            <div
              key={item.code}
              className={`category-stat-card ${
                colorClasses[index % colorClasses.length]
              }`}
            >
              <div className="category-card-top">
                <span className="category-name">{item.code}</span>
                <span className="category-dot"></span>
              </div>

              <div className="category-card-content">
                <div className="category-count">{item.count}</div>

                <div className="category-icon">
                  <FiUsers />
                </div>
              </div>

             <div className="category-details-hover">
  {t("vacancies")}
</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryWiseDistribution;
