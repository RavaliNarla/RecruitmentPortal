import React, { useState } from "react";
import { FiMapPin, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import "../../../style/css/Dashboard/ZonalRecruitmentHeatmap.css";

const ZonalRecruitmentHeatmap = ({ zonalHeatmap = [] }) => {

  const { t } = useTranslation("dashboard");

  const cardsPerView = 6;

  const [startIndex, setStartIndex] = useState(0);

  const visibleZones = zonalHeatmap.slice(
    startIndex,
    startIndex + cardsPerView
  );

  const showLeftArrow = startIndex > 0;

  const showRightArrow = startIndex + cardsPerView < zonalHeatmap.length;

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(prev - cardsPerView, 0));
  };

  const handleNext = () => {
    setStartIndex((prev) =>
      Math.min(prev + cardsPerView, zonalHeatmap.length - cardsPerView)
    );
  };
  const totalCandidates = zonalHeatmap.reduce(
    (sum, zone) => sum + zone.candidates,
    0
  );

  const totalOffered = zonalHeatmap.reduce(
    (sum, zone) => sum + zone.offered,
    0
  );

  const totalRejected = zonalHeatmap.reduce(
    (sum, zone) => sum + zone.rejected,
    0
  );
  return (
    <div className="zonal-heatmap mb-4">
      <div className="heatmap-header">
        <div className="heatmap-icon">
          <FiMapPin />
        </div>

        <div>
        <h3>{t("zonal_heatmap")}</h3>
<p>{t("recruitment_activity_by_zone")}</p>
        </div>
      </div>

      <div className="zone-carousel">
        {showLeftArrow && (
          <button className="zone-nav-btn left" onClick={handlePrev}>
            <FiChevronLeft />
          </button>
        )}

        <div className="zone-grid">
          {visibleZones.length === 0 ? (
          <div className="no-data">{t("no_data_found")}</div>
          ) : (
            visibleZones.map((zone) => (
              <div
                key={zone.city}
                className="zone-card"
                style={{ borderTopColor: zone.color }}
              >
                <div
                  className="zone-icon"
                  style={{
                    background: `${zone.color}12`,
                    color: zone.color,
                  }}
                >
                  <FiMapPin />
                </div>

                <h4>{zone.city}</h4>
                <span>{zone.state}</span>

                <div className="zone-stats">
                  <div>
                    <span>{t("candidates")}</span>
                    <strong>{zone.candidates}</strong>
                  </div>

                  <div>
                  <span>{t("offered")}</span>
                    <strong>{zone.offered}</strong>
                  </div>

                  <div>
                   <span>{t("rejected")}</span>
                    <strong>{zone.rejected}</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {showRightArrow && (
          <button className="zone-nav-btn right" onClick={handleNext}>
            <FiChevronRight />
          </button>
        )}
      </div>

      <div className="heatmap-summary">
        <div>
          <h2>{zonalHeatmap.length}</h2>
         <p>{t("total_zones")}</p>
        </div>

        <div>
          <h2 className="candidate">{totalCandidates}</h2>
        <p>{t("total_candidates")}</p>
        </div>

        <div>
          <h2 className="offered">{totalOffered}</h2>
         <p>{t("total_offered")}</p>
        </div>

        <div>
          <h2 className="rejected">{totalRejected}</h2>
          <p>{t("total_rejected")}</p>
        </div>
      </div>
    </div>
  );
};

export default ZonalRecruitmentHeatmap;
