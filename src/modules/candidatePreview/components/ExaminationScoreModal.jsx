import React from "react";
import { Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import jobPositionApiService from "../../jobPosting/services/jobPositionApiService";

import { toast } from "react-toastify";

const TableSection = ({
  reservationCategories = [],
  summaryData = {},
  totalAppearedCount = 0,
  totalVacancyCount = 0,
  totalQualifiedCount = 0,
}) => {
  const categoryMap = {};
  

  summaryData?.categorySummaries?.forEach((cat) => {
    categoryMap[cat.categoryId] = cat;
  });

  const { t } = useTranslation("candidateWorkflow");

  const tableHeaders = reservationCategories
    ?.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    ?.map((item) => ({
      code: item.categoryCode,
      type: item.reservationType,
      categoryId: item.reservationCategoriesId,
    }));

  const rows = [
    "Appeared",
    "Vacancies",
    "Qualified"
    // "Qualified Without Relaxation",
    // "Qualified With Relaxation"
  ];




  return (
    <div className="rank-summary-table">
      <table
        className="table mb-0"
        style={{
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr
            style={{
              background: "#F9FAFB",
            }}
          >
            <th
              style={{
                minWidth: "220px",
                padding: "12px",
                border: "1px solid #E5E7EB",
                fontSize: "13px",
                fontWeight: "700",
              }}
            >
             {t("metric")}
            </th>

            {tableHeaders.map((head) => (
              <th
                key={head.code}
                style={{
                  textAlign: "center",
                  padding: "12px",
                  border: "1px solid #E5E7EB",
                  fontSize: "13px",
                  fontWeight: "700",
                }}
              >
                <div>{head.code}</div>
              </th>
            ))}

            <th
              style={{
                textAlign: "center",
                padding: "12px",
                border: "1px solid #E5E7EB",
                fontSize: "13px",
                fontWeight: "700",
              }}
            >
             {t("total")}
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((rowLabel) => (
            <tr key={rowLabel}>
              <td>{rowLabel}</td>

              {tableHeaders.map((head) => {
                const category = categoryMap[head.categoryId];

                let value = 0;

           if (rowLabel === "Appeared") {
  value = category?.appeared || 0;
} else if (rowLabel === "Vacancies") {
  value = category?.vacancy || 0;
} else if (rowLabel === "Qualified") {
  value =
    category?.qualifiedWithoutRelaxation ??
    category?.qualified ??
    0;
}

                return (
                  <td
                    key={head.code}
                    style={{
                      textAlign: "center",
                      padding: "12px",
                      border: "1px solid #E5E7EB",
                      fontSize: "13px",
                    }}
                  >
                    {value}
                  </td>
                );
              })}

              <td
                style={{
                  textAlign: "center",
                  padding: "12px",
                  border: "1px solid #E5E7EB",
                  fontWeight: "700",
                  fontSize: "13px",
                }}
              >
                {rowLabel === "Appeared"
                  ? totalAppearedCount
                  : rowLabel === "Vacancies"
                    ? totalVacancyCount
                    : rowLabel === "Qualified"
                      ? totalQualifiedCount
                      : 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ExaminationScoreModal = ({
  show,
  onHide,
  examinationScoreData = [],
  setExaminationScoreData,
  handleEditExaminationScore,
  reservationCategories = [],
  examConfigMap = {},
}) => {

  const { t } = useTranslation("candidateWorkflow");
  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="xl"
      backdrop="static"
      dialogClassName="rank-summary-modal"
    >
      <Modal.Header
        closeButton
        className="border-0 pb-2"
        style={{
          padding: "20px 24px 10px",
        }}
      >
        <div>
          <h2
            className="fw-bold mb-1"
            style={{
              fontSize: "18px",
              color: "#1F2937",
            }}
          >
            {t("rankPositionsSummary")}
          </h2>

          <p
            className="mb-0"
            style={{
              fontSize: "13px",
              color: "#6B7280",
            }}
          >
            {t("viewAndManagePositionRankings")}
          </p>
        </div>
      </Modal.Header>

      <Modal.Body
        style={{
          padding: "8px 24px 20px",
          maxHeight: "72vh",
          overflowY: "auto",
        }}
      >
        {examinationScoreData.map((item, index) => {
          const hasConfig = examConfigMap?.[item.positionId || item.id];

          const hasQualifiedWithoutRelaxation =
            Number(
              item?.totalQualifiedWithoutRelaxation ??
              item?.totalQualifiedCount ??
              0
            ) > 0;

          const config = examConfigMap?.[item.positionId || item.id];

          const isRejected = config?.isRejected === true;

          const isFinalized = item?.isFinalized === true;


          const formatDate = (date) => {
            if (!date) return "-";

            const d = new Date(date);

            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const year = d.getFullYear();

            return `${day}-${month}-${year}`;
          };



            const getStatusClass = (status) => {
  switch (status) {
    case "APPROVED":
      return "approved";

    case "FINALIZED":
      return "finalized";

    case "L1_REJECTED":
    case "L2_REJECTED":
      return "rejected";

    case "PENDING":
    case "L1_PENDING":
    case "L2_PENDING":
    default:
      return "pending";
  }
};




const getStatusLabel = (status) => {
  switch (status) {
    case "PENDING":
      return "Pending";

    case "L1_PENDING":
      return "L1 Pending";

    case "L2_PENDING":
      return "L2 Pending";

    case "L1_REJECTED":
      return "L1 Rejected";

    case "L2_REJECTED":
      return "L2 Rejected";

    case "APPROVED":
      return "Approved";

    case "FINALIZED":
      return "Finalized";

    default:
      return status || "-";
  }
};


          return (
            <div key={index} className="mb-3 rank-position-card">
              {/* HEADER */}

              <div
                onClick={() => {
                  setExaminationScoreData((prev) =>
                    prev.map((p, i) => ({
                      ...p,

                      expanded: i === index ? !p.expanded : false,
                    }))
                  );
                }}
                className="rank-position-header"
              >
                {/* LEFT */}

                <div>
                  <h5 className="rank-position-title mb-0">
                    {item.positionName}
                  </h5>
                </div>

                {/* RIGHT */}

                <div className="d-flex align-items-center gap-2">
                  <div className="rank-date-badge">
                    {t("start")}: {formatDate(item.startDate)}
                  </div>

                  <div className="rank-date-badge">
                  {t("end")}: {formatDate(item.endDate)}
                  </div>


                 {/* <div className={`rank-status-badge ${getStatusClass(item.examStatus)}`}>
  {getStatusLabel(item.examStatus)}
</div> */}

                  {/* EDIT BUTTON */}

                  {hasConfig && !isFinalized && (
                    <button
                      className="btn btn-sm"
                      style={{
                        border: "1px solid #F97316",
                        color: "#F97316",
                        background: "#FFF7ED",
                        fontSize: "12px",
                        fontWeight: "600",
                        padding: "4px 12px",
                        borderRadius: "6px",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();

                        handleEditExaminationScore(item, index);
                      }}
                    >
                      <i className="bi bi-pencil-square me-1" />
                    {t("edit")}
                    </button>
                  )}
                  {hasConfig &&
                    hasQualifiedWithoutRelaxation &&
                    !isRejected &&
                    !isFinalized && (
                      <button
                        className="btn rank-finalize-btn"
                        onClick={async (e) => {
                          e.stopPropagation();

                          try {
                            const payload = [item.positionId || item.id];

                            const res =
                              await jobPositionApiService.finalizeExamConfiguration(
                                payload
                              );

                            if (res?.success) {
                              toast.success(
                                res?.message ||
                                "Position finalized successfully"
                              );

                              // OPTIONAL UI UPDATE
                              setExaminationScoreData((prev) =>
                                prev.map((p) =>
                                  (p.positionId || p.id) ===
                                    (item.positionId || item.id)
                                    ? {
                                      ...p,
                                      isFinalized: true,
                                    }
                                    : p
                                )
                              );
                            } else {
                              toast.error(res?.message || "Failed to finalize");
                            }
                          } catch (err) {
                            console.error("FINALIZE ERROR", err);

                            toast.error(
                              err?.response?.data?.message ||
                              "Failed to finalize"
                            );
                          }
                        }}
                      >
                       {t("finalize")}
                      </button>
                    )}

                  {/* CHEVRON */}

                  <i
                    className={`bi bi-chevron-${item.expanded ? "up" : "down"}`}
                    style={{
                      fontSize: "14px",
                      color: "#6B7280",
                      fontWeight: "700",
                    }}
                  />
                </div>
              </div>

              {/* BODY */}

              {item.expanded && (
                <div
                  style={{
                    padding: "14px 18px 18px",
                    background: "#FFFFFF",
                  }}
                >
                  {item.isStateWise || item.isLocationWise ? (
                    item.states?.length > 0 ? (
                      [
                        ...new Map(
                          item.states.map((state) => [
                            state.stateId || state.stateName,
                            state,
                          ])
                        ).values(),
                      ].map((state, stateIndex) => {
                        const isExpanded = state?.expanded ?? false;

                        return (
                          <div
                            key={state.stateId || stateIndex}
                            className="rank-state-card"
                          >
                            {/* STATE HEADER */}

                            <div
                              className="rank-state-header"
                              onClick={() => {
                                setExaminationScoreData((prev) =>
                                  prev.map((p, pIndex) => {
                                    if (pIndex !== index) {
                                      return p;
                                    }

                                    return {
                                      ...p,

                                      states: p.states.map((s, sIndex) => ({
                                        ...s,

                                        expanded:
                                          sIndex === stateIndex
                                            ? !s.expanded
                                            : false,
                                      })),
                                    };
                                  })
                                );
                              }}
                            >
                              <div className="d-flex align-items-center justify-content-between w-100">
                                <div className="d-flex align-items-center gap-3">
                                  <div
                                    className="rank-state-icon"
                                    style={{
                                      width: "30px",
                                      height: "30px",
                                      borderRadius: "50%",
                                      border: "1px solid #F97316",
                                      color: "#F97316",
                                    }}
                                  >
                                    <i
                                      className={`bi bi-chevron-${isExpanded ? "up" : "down"
                                        }`}
                                    />
                                  </div>

                                  <h6 className="rank-state-title mb-0">
                                    {state?.stateName || "-"}
                                  </h6>
                                </div>

                                <div className="rank-state-subtitle">
                                  Category Wise Reservation (State-wise)
                                </div>
                              </div>
                            </div>

                            {/* TABLE */}

                            {isExpanded && (
                              <div
                                style={{
                                  padding: "14px",
                                }}
                              >
                                <TableSection
                                  reservationCategories={reservationCategories}
                                  summaryData={state.summaryData}
                                  totalAppearedCount={state.totalAppearedCount}
                                  totalVacancyCount={state.totalVacancyCount}
                                  totalQualifiedCount={
                                    state.totalQualifiedCount
                                  }
                                  
                                />
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div
                        style={{
                          padding: "20px",
                          textAlign: "center",
                          color: "#6B7280",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        No state-wise summary found
                      </div>
                    )
                  ) : (
                    /* NATIONAL WISE */
                    <TableSection
                      reservationCategories={reservationCategories}
                      summaryData={item.overallMarksSummary?.[0]}
                      totalAppearedCount={item.totalAppearedCount}
                      totalVacancyCount={item.totalVacancyCount}
                      totalQualifiedCount={item.totalQualifiedCount}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </Modal.Body>
    </Modal>
  );
};

export default ExaminationScoreModal;
