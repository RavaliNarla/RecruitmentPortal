import React, { useEffect, useState } from "react";
import {
  FiFilter,
  FiSearch,
  FiX,
  FiBriefcase,
  FiMapPin,
  FiUsers,
  FiCalendar,
  FiChevronDown,
  FiGitBranch,
} from "react-icons/fi";
import { BsBag } from "react-icons/bs";
import { useTranslation } from "react-i18next";
import Select from "react-select";
import "../../../style/css/Dashboard/DashboardFilters.css";

const DashboardFilters = ({ filters, loading, onApply }) => {
  const [employmentType, setEmploymentType] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedRecruiter, setSelectedRecruiter] = useState("");
  const [initiationType, setInitiationType] = useState("");
  const [periodType, setPeriodType] = useState("FINANCIAL_YEAR");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { t } = useTranslation("dashboard");
  const formatDate = (date) => {
    if (!date) return "";

    const [year, month, day] = date.split("-");

    return `${day}-${month}-${year}`;
  };
  const currentYear = new Date().getFullYear();

  const cyOptions = Array.from(
    { length: 5 },
    (_, index) => currentYear - index
  );

  const fyOptions = Array.from({ length: 5 }, (_, index) => {
    const startYear = currentYear - index;
    return `FY ${startYear}-${String(startYear + 1).slice(-2)}`;
  });
  const quarterOptions = [
    { value: "Q1", label: "Q1 (Jan-Mar)" },
    { value: "Q2", label: "Q2 (Apr-Jun)" },
    { value: "Q3", label: "Q3 (Jul-Sep)" },
    { value: "Q4", label: "Q4 (Oct-Dec)" },
  ];

  const currentMonth = new Date().getMonth() + 1;

  const currentQuarter =
    currentMonth <= 3
      ? "Q1"
      : currentMonth <= 6
        ? "Q2"
        : currentMonth <= 9
          ? "Q3"
          : "Q4";
  const [fyValue, setFyValue] = useState(fyOptions[0]);
  const [cyValue, setCyValue] = useState(String(cyOptions[0]));
  const [quarterYear, setQuarterYear] = useState(String(cyOptions[0]));
  const [quarterValue, setQuarterValue] = useState(currentQuarter);

  const handleApply = () => {
    const payload = {
      dateRangePreset: periodType,

      fyYear:
        periodType === "FINANCIAL_YEAR"
          ? parseInt(fyValue.match(/\d{4}/)?.[0] || 0, 10)
          : null,

      cyYear:
        periodType === "CALENDAR_YEAR"
          ? parseInt(cyValue, 10)
          : periodType === "QUARTER"
            ? parseInt(quarterYear, 10)
            : null,

      quarter:
        periodType === "QUARTER"
          ? parseInt(quarterValue.match(/Q(\d)/)?.[1] || 1, 10)
          : null,

      fromDate: fromDate || null,
      toDate: toDate || null,

      departmentId: selectedDepartment || null,
      positionId: selectedPosition || null,
      zone: selectedZone || null,
      stateId: null,
      cityId: null,
      recruiterId: selectedRecruiter || null,
      employmentTypeId: employmentType || null,
      isReinitialized: initiationType === "" ? null : initiationType,
    };
    onApply(payload);
  };
  const handleReset = () => {
    setSelectedDepartment("");
    setSelectedPosition("");
    setSelectedZone("");
    setSelectedRecruiter("");

    setFromDate("");
    setToDate("");

    setPeriodType("FINANCIAL_YEAR");
    setFyValue("");
    setCyValue("");
    setQuarterYear("");
    setQuarterValue("");

    // Reset to default Employment (Regular)
    setEmploymentType(filters?.employmentTypes?.[0]?.value || "");

    // Reset to default Initiation
    setInitiationType(filters?.reinitialized?.[0]?.value ?? "");
  };
  const renderPeriodContent = () => {
    switch (periodType) {
      case "FINANCIAL_YEAR":
        return (
          <div className="period-content">
            <FiCalendar className="period-calendar" />
            <select
              value={fyValue}
              onChange={(e) => setFyValue(e.target.value)}
            >
              <option value="">{t("select_fy")}</option>

              {fyOptions.map((fy) => (
                <option key={fy} value={fy}>
                  {fy}
                </option>
              ))}
            </select>
          </div>
        );

      case "CALENDAR_YEAR":
        return (
          <div className="period-content">
            <FiCalendar className="period-calendar" />

            <select
              value={cyValue}
              onChange={(e) => setCyValue(e.target.value)}
            >
              <option value="">{t("select_cy")}</option>

              {cyOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        );

      case "QUARTER":
        return (
          <div className="period-content">
            <FiCalendar className="period-calendar" />

            <div className="quarter-row">
              <select
                value={quarterYear}
                onChange={(e) => setQuarterYear(e.target.value)}
              >
                <option value="">{t("select_cy")}</option>

                {cyOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              <select
                value={quarterValue}
                onChange={(e) => setQuarterValue(e.target.value)}
              >
                {quarterOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case "CUSTOM":
        return (
          <div className="period-content">
            <FiCalendar className="period-calendar" />

            <div className="custom-date-row">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />

              <span className="date-arrow">→</span>

              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };
  const filteredPositions = selectedDepartment
    ? filters?.positions?.filter(
        (position) =>
          String(position.departmentId) === String(selectedDepartment)
      )
    : filters?.positions || [];

  useEffect(() => {
    if (!employmentType && filters?.employmentTypes?.length) {
      setEmploymentType(filters.employmentTypes[0].value);
    }
  }, [filters, employmentType]);

  useEffect(() => {
    if (initiationType === "" && filters?.reinitialized?.length) {
      setInitiationType(filters.reinitialized[0].value);
    }
  }, [filters, initiationType]);

  const departmentOptions = [
    { value: "", label: t("all_departments") },
    ...filters.departments,
  ];
  const positionOptions = [
    {
      value: "",
      label: t("all_positions"),
    },
    ...filteredPositions,
  ];
  const zoneOptions = [
    {
      value: "",
      label: t("all_zones"),
    },
    ...(filters?.zones || []),
  ];
  const recruiterOptions = [
    {
      value: "",
      label: t("all_recruiters"),
    },
    ...(filters?.recruiters || []),
  ];
  return (
    <div className="dashboard-filters">
      {/* HEADER */}
      <div className="filters-header">
        <div className="header-title">
          <FiFilter />
          <span>{t("dashboard_filters")}</span>
        </div>

        <div className="active-period">
          <span>{t("active_period")}</span>

          <span className="period-pill">
            {periodType === "FINANCIAL_YEAR"
              ? fyValue || t("select_fy")
              : periodType === "CALENDAR_YEAR"
                ? cyValue || t("select_cy")
                : periodType === "QUARTER"
                  ? quarterYear && quarterValue
                    ? `${quarterYear} - ${quarterValue}`
                    : t("select_quarter")
                  : periodType === "CUSTOM"
                    ? fromDate && toDate
                      ? `${formatDate(fromDate)} → ${formatDate(toDate)}`
                      : t("select_date_range")
                    : ""}
          </span>
        </div>
      </div>

      {/* BODY */}
      <div className="filters-body">
        {/* TOP ROW */}
        <div className="top-section">
          <div className="filter-group">
            <label>
              <FiBriefcase /> {t("employment")}
            </label>

            <div className="segmented-control">
              {filters?.employmentTypes?.map((item) => (
                <button
                  key={item.value}
                  className={employmentType === item.value ? "active" : ""}
                  onClick={() => setEmploymentType(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="section-divider" />

          <div className="filter-group">
            <label>
              {" "}
              <FiGitBranch className="text-danger" /> {t("initiation")}
            </label>

            <div className="segmented-control">
              {filters?.reinitialized?.map((item) => (
                <button
                  key={item.label}
                  className={
                    initiationType === item.value
                      ? `active ${item.value === false ? "active" : ""}`
                      : ""
                  }
                  onClick={() => setInitiationType(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="horizontal-divider" />

        {/* BOTTOM ROW */}
        <div className="bottom-section">
          {/* PERIOD CARD */}
          <div className="period-card">
            <div className="period-tabs">
              {filters?.dateRangePresets?.map((item) => (
                <button
                  key={item.value}
                  className={periodType === item.value ? "active" : ""}
                  onClick={() => {
                    setPeriodType(item.value);

                    // Clear everything first
                    setFyValue("");
                    setCyValue("");
                    setQuarterYear("");
                    setQuarterValue("");
                    setFromDate("");
                    setToDate("");

                    // Set default values
                    if (item.value === "FINANCIAL_YEAR") {
                      setFyValue(fyOptions[0]);
                    }

                    if (item.value === "CALENDAR_YEAR") {
                      setCyValue(String(cyOptions[0]));
                    }

                    if (item.value === "QUARTER") {
                      setQuarterYear(String(cyOptions[0]));
                      setQuarterValue(currentQuarter);
                    }

                    // CUSTOM remains empty
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {renderPeriodContent()}
          </div>

          <div className="vertical-divider" />

          {/* FILTERS */}
          <div className="filters-middle">
            <div className="filter-pill">
              <div className="pill-icon">
                <BsBag />
              </div>

              <Select
                classNamePrefix="dashboard-select"
                options={departmentOptions}
                menuPosition="fixed"
                styles={{
                  menu: (base) => ({
                    ...base,
                    width: "calc(100% + 75px)",
                    marginLeft: "-32px",
                  }),
                }}
                value={
                  departmentOptions.find(
                    (item) => item.value === selectedDepartment
                  ) ?? departmentOptions[0]
                }
                onChange={(option) => {
                  setSelectedDepartment(option?.value || "");
                  setSelectedPosition("");
                }}
                isSearchable={false}
              />
            </div>

            <div className="filter-pill">
              <div className="pill-icon">
                <FiBriefcase />
              </div>
              <Select
                className="dashboard-select"
                classNamePrefix="dashboard-select"
                styles={{
                  menu: (base) => ({
                    ...base,
                    width: "calc(100% + 75px)",
                    marginLeft: "-32px",
                  }),
                }}
                menuPosition="fixed"
                options={positionOptions}
                value={
                  positionOptions.find(
                    (item) => item.value === selectedPosition
                  ) ?? positionOptions[0]
                }
                onChange={(option) => {
                  setSelectedPosition(option?.value || "");
                }}
                isSearchable={false}
              />
            </div>

            <div className="filter-pill">
              <div className="pill-icon">
                <FiMapPin />
              </div>

              <Select
                className="dashboard-select"
                classNamePrefix="dashboard-select"
                menuPosition="fixed"
                styles={{
                  menu: (base) => ({
                    ...base,
                    width: "calc(100% + 75px)",
                    marginLeft: "-32px",
                  }),
                }}
                options={zoneOptions}
                value={
                  zoneOptions.find((item) => item.value === selectedZone) ??
                  zoneOptions[0]
                }
                onChange={(option) => {
                  setSelectedZone(option?.value || "");
                }}
                isSearchable={false}
              />
            </div>

            <div className="filter-pill">
              <div className="pill-icon">
                <FiUsers />
              </div>

              <Select
                className="dashboard-select"
                classNamePrefix="dashboard-select"
                options={recruiterOptions}
                menuPosition="fixed"
                styles={{
                  menu: (base) => ({
                    ...base,
                    width: "calc(100% + 75px)",
                    marginLeft: "-32px",
                  }),
                }}
                value={
                  recruiterOptions.find(
                    (item) => item.value === selectedRecruiter
                  ) ?? recruiterOptions[0]
                }
                onChange={(option) => {
                  setSelectedRecruiter(option?.value || "");
                }}
                isSearchable={false}
              />
            </div>
          </div>

          <div className="vertical-divider" />

          {/* ACTIONS */}
          <div className="actions-section">
            <button className="reset-btn" onClick={handleReset}>
              <FiX />
              {t("reset")}
            </button>

            <button className="apply-btn" onClick={handleApply}>
              <FiSearch />
              {t("apply")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardFilters;
