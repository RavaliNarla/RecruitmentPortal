import "../../style/css/CandidateScreening.css";
import "../../style/css/CandidateVerification.css";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import { toast } from "react-toastify";
import { addDays, subDays } from "date-fns";
import searchIcon from "../../assets/search-icon.png";
import React, { useEffect, useState, useRef } from "react";
import RequisitionStrip from "../candidatePreview/components/RequisitionStrip";
import masterApiService from "../master/services/masterApiService";
import RequisitionPositionSelector from "../candidatePreview/components/RequisitionPositionSelector";
import CandidateTable from "./components/CandidateTable";
import CandidateVerificationService from "./services/CandidateVerification";

import { mapCandidatesToTableRows } from "./mappers/CandidateVerificationMapper";
import { useLocation } from "react-router-dom";
import PdfViewerModal from "../candidatePreview/components/PdfViewerModal";
import { useTranslation } from "react-i18next";
import { FiCalendar } from "react-icons/fi";

/* ================= STATUS MAP ================= */

// const STAGE_STATUS_MAP = {
//   PENDING: "Pending",
//   VERIFIED: "Verified",
//   REJECTED: "Rejected",
//   PROVISIONALLY_APPROVED: "Provisionally Approved",
//   ZONAL_ABSENT: "Zonal Absent",
//   ZONAL_REJECTED: "Zonal Rejected",
// };

export default function CandidateVerification() {
  const { t } = useTranslation(["verification", "common"]);


  const STAGE_STATUS_MAP = {
  PENDING: t("pending"),
  VERIFIED: t("verified"),
  REJECTED: t("rejected"),
  PROVISIONALLY_APPROVED: t("provisionally_approved"),
  ZONAL_ABSENT: t("zonal_absent"),
  ZONAL_REJECTED: t("zonal_rejected"),
};

  // const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeStage, setActiveStage] = useState(null);
  const [masterData, setMasterData] = useState(null);
  const [searchText, setSearchText] = useState("");

  const [allCandidates, setAllCandidates] = useState([]);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [allCandidatesRaw, setAllCandidatesRaw] = useState([]);
  const [originalAbsentMap, setOriginalAbsentMap] = useState({});

  const [usedNavData, setUsedNavData] = useState(false);

  const navInitRef = useRef(true);

  const saveAbsentRef = useRef(false);
  const [savingAbsent, setSavingAbsent] = useState(false);

  const location = useLocation();
  const isBackNavigationRef = useRef(
    sessionStorage.getItem("fromPreviewBack") === "true"
  );

  useEffect(() => {
    if (!location.state) return;

    setPage(location.state.page ?? 0);
    setPageSize(location.state.pageSize ?? 10);

    // remove flag AFTER restore
    setTimeout(() => {
      sessionStorage.removeItem("fromPreviewBack");
      isBackNavigationRef.current = false;
    }, 50);
  }, [location.state]);

  const cameFromZonal = sessionStorage.getItem("fromZonalSubmit") === "true";

  const cameFromPreviewBack =
    sessionStorage.getItem("fromPreviewBack") === "true";

  const [pdfUrl, setPdfUrl] = useState(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const handleViewFile = async (candidateRaw) => {
    if (!candidateRaw?.resumeUrl) {
      toast.error(t("verification:no_document_available"));
      return;
    }

    try {
      setLoadingPdf(true);

      const res = await masterApiService.getAzureBlobSasUrl(
        candidateRaw.resumeUrl,
        "candidate"
      );

      const sasUrl = res?.trim();

      if (!sasUrl) throw new Error("Invalid SAS URL");

      setPdfUrl(sasUrl);
      setShowPdfViewer(true);
    } catch (err) {
      console.error(err);
      toast.error(t("verification:failed_open_document"));
    } finally {
      setLoadingPdf(false);
    }
  };

  const navSelectedDate =
    (cameFromZonal || cameFromPreviewBack) && location.state?.selectedDate
      ? new Date(location.state.selectedDate)
      : null;

  const [selectedDate, setSelectedDate] = useState(
    navSelectedDate || new Date()
  );

  useEffect(() => {}, [selectedDate]);

  const navRequisition = location.state?.requisition || null;
  const navPosition = location.state?.position || null;

  /* ================= LOAD MASTER ================= */

  useEffect(() => {
    if (navInitRef.current) {
      navInitRef.current = false;
      return;
    }
  }, []);
  const formatApiDate = (d) => {
    if (!d) return null;

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const loadCandidates = async (dateParam = selectedDate) => {
    try {
      const res = await CandidateVerificationService.getCandidatesByDate(
        formatApiDate(dateParam)
      );

      const apiList = res.data || [];

      //  SHOW BACKEND MESSAGE WHEN EMPTY
      if (apiList.length === 0 && res.message) {
        toast.info(res.message);
      }

      setAllCandidatesRaw(apiList);

      const rows = mapCandidatesToTableRows(apiList);
      setAllCandidates(rows);

      const map = {};
      rows.forEach((r) => {
        map[r.id] = r.absent;
      });
      setOriginalAbsentMap(map);

      /* ✅ RESTORE HERE — AFTER DATA ARRIVES */

      if (
        apiList.length > 0 &&
        (cameFromZonal || cameFromPreviewBack) &&
        !usedNavData &&
        location.state?.preloadedCandidates?.length
      ) {
        if (location.state?.requisition)
          setSelectedRequisition(location.state.requisition);

        if (location.state?.position)
          setSelectedPosition(location.state.position);

        setUsedNavData(true);

        sessionStorage.removeItem("fromZonalSubmit");
        sessionStorage.removeItem("fromPreviewBack");
      }
    } catch (err) {
      setAllCandidatesRaw([]);
      setAllCandidates([]);
      toast.error(t("verification:failed_load_candidates"));
    }
  };

  useEffect(() => {}, [allCandidatesRaw]);
  const navCandidates = location.state?.preloadedCandidates || [];

  useEffect(() => {
    // restore selection from nav
    if (
      (cameFromZonal || cameFromPreviewBack) &&
      !usedNavData &&
      navCandidates.length &&
      navInitRef.current
    ) {
      setAllCandidatesRaw(navCandidates);
      const rows = mapCandidatesToTableRows(navCandidates);
      setAllCandidates(rows);

      const map = {};
      rows.forEach((r) => {
        map[r.id] = r.absent;
      });
      setOriginalAbsentMap(map);

      if (navRequisition) setSelectedRequisition(navRequisition);
      if (navPosition) setSelectedPosition(navPosition);

      setUsedNavData(true);

      sessionStorage.removeItem("fromZonalSubmit");
      sessionStorage.removeItem("fromPreviewBack");
    }

    //  ALWAYS call API
    loadCandidates(selectedDate);
  }, [selectedDate]);

  useEffect(() => {}, [selectedRequisition]);

  useEffect(() => {}, [selectedPosition]);

  useEffect(() => {
    // First render after navigation → keep auto-populated selection
    if (navInitRef.current) {
      navInitRef.current = false;
      return;
    }

    // User changed date manually → reset selection
    setSelectedRequisition(null);
    setSelectedPosition(null);
    setActiveStage(null);
  }, [selectedDate]);

  /* ================= FILTER ================= */

  const baseFiltered = allCandidates.filter((c) => {
    if (!selectedRequisition || !selectedPosition) return false;

    const selectedReqId =
      selectedRequisition?.raw?.requisition_id ||
      selectedRequisition?.requisition_id ||
      selectedRequisition?.value ||
      null;

    const selectedPosId =
      selectedPosition?.raw?.positionId ||
      selectedPosition?.positionId ||
      selectedPosition?.value ||
      null;

    const reqMatch = c.raw.requisitionId === selectedReqId;

    const posMatch = c.raw.positionId === selectedPosId;

    const searchMatch =
      c.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      c.regNo?.includes(searchText);

    return reqMatch && posMatch && searchMatch;
  });

  const filteredCandidates = baseFiltered.filter((c) =>
    activeStage ? c.status === STAGE_STATUS_MAP[activeStage] : true
  );

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const totalElements = filteredCandidates.length;

  const totalPages = Math.ceil(totalElements / pageSize);

  const shouldPreservePage =
    cameFromZonal || cameFromPreviewBack || location.state?.page !== undefined;

  useEffect(() => {
    if (shouldPreservePage) return;

    if (page >= totalPages) {
      setPage(0);
    }
  }, [totalPages, page, shouldPreservePage]);

  const startIndex = page * pageSize;
  const endIndex = startIndex + pageSize;

  const paginatedCandidates = filteredCandidates.slice(startIndex, endIndex);

  const toggleAbsent = (id) => {
    setAllCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, absent: !c.absent } : c))
    );
  };

  const anyAbsentChanged = baseFiltered.some(
    (c) => originalAbsentMap[c.id] !== c.absent
  );

  const isSelectionDone = selectedRequisition && selectedPosition;

  const handleSaveAbsent = async () => {
      if (saveAbsentRef.current) return;

    try {
      saveAbsentRef.current = true;
      setSavingAbsent(true);

      const updates = filteredCandidates
        .filter((c) => originalAbsentMap[c.id] !== c.absent)
        .map((c) => ({
          applicationId: c.raw.applicationId,
          isAbsent: c.absent,
        }));

      if (updates.length === 0) {
        toast.info(t("verification:no_changes_to_save"));
        return;
      }

      const payload = {
        absentStatusUpdates: updates,
      };

      await CandidateVerificationService.updateAbsentStatusBatch(payload);

      await loadCandidates(selectedDate); // refresh table

      toast.success(t("verification:absent_status_updated"));
    } catch (err) {
      console.error("Absent batch update failed", err);
      toast.error(t("verification:save_failed"));
    }
    finally {
      saveAbsentRef.current = false;
      setSavingAbsent(false);
    }
  };

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const res = await masterApiService.getMasterDisplayAll();
        setMasterData(res.data || {});
      } catch (e) {
        console.error("Master load failed", e);
        setMasterData({});
      }
    };

    loadMasters();
  }, []);

  const DatePill = React.forwardRef(({ value, onClick }, ref) => (
    <div className="date-pill" onClick={onClick} ref={ref}>
      {value}
      <span className="calendar-icon">
        <FiCalendar />
      </span>
    </div>
  ));

  /* ================= UI ================= */

  return (
    <div className="container-fluid px-4 py-3 candidate-verification-page">
      {/* ================= DATE + SEARCH ================= */}

      <div className="verification-toolbar">
        <div className="date-nav">
          <span
            className="nav-arrow"
            onClick={() => setSelectedDate((d) => subDays(d, 1))}
          >
            ‹
          </span>

          <DatePicker
            selected={selectedDate}
            onChange={(date) => {
              setSelectedDate(date);
              setIsCalendarOpen(false);

              if (!isBackNavigationRef.current) {
                setPage(0);
              }
            }}
            onClickOutside={() => setIsCalendarOpen(false)}
            open={isCalendarOpen}
            onInputClick={() => setIsCalendarOpen(true)}
            dateFormat="dd MMMM yyyy"
            customInput={<DatePill />}
             maxDate={new Date()}

            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            yearDropdownItemNumber={15}
            scrollableYearDropdown
          />

          <span
            className="nav-arrow"
            onClick={() => {
              const next = addDays(selectedDate, 1);
              if (next <= new Date()) setSelectedDate(next);
            }}
          >
            ›
          </span>
        </div>

        <div className="search-box">
          <img src={searchIcon} width={14} alt="search" />
          <input
            placeholder={t("verification:search_candidates")}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      {/* ================= STAGE FILTER ================= */}

      <div className="stage-filter-row d-flex align-items-center gap-3">
        <span className="fs-14 text-muted">
          {t("verification:filter_by_stage")}:
        </span>

        <button
          className="btn p-0 text-danger fs-14"
          type="button"
          onClick={() => setActiveStage(null)}
        >
          {t("common:clear_all")}
        </button>

        <div style={{ width: 200 }}>
          <select
            className="form-select form-select-sm"
            value={activeStage || ""}
            onChange={(e) => setActiveStage(e.target.value || null)}
          >
            <option value="">{t("verification:all_statuses")}</option>

            {Object.keys(STAGE_STATUS_MAP).map((key) => (
              <option key={key} value={key}>
                {STAGE_STATUS_MAP[key]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ================= SELECTORS ================= */}

      <div className="requisition-selector-row">
        <RequisitionPositionSelector
          apiList={allCandidatesRaw}
          selectedRequisitionRaw={selectedRequisition}
          selectedPositionRaw={selectedPosition}
          onRequisitionChange={(req) => {
            setSelectedRequisition(req);
            setSelectedPosition(null); //  reset position when req changes
            if (!isBackNavigationRef.current) {
              setPage(0);
            }
          }}
          onPositionChange={(pos) => {
            setSelectedPosition(pos);

            if (!isBackNavigationRef.current) {
              setPage(0);
            }
          }}
          closeCalendar={() => setIsCalendarOpen(false)}
        />
      </div>

      {/* ================= STRIP ================= */}

      {isSelectionDone && (
        <div className="requisition-strip">
          <RequisitionStrip
            requisition={selectedRequisition}
            position={selectedPosition}
            isCardBg={false}
            isSaveEnabled={anyAbsentChanged}
            onSave={handleSaveAbsent}
             isSaving={savingAbsent}
            isSaveBtn={true}
          />
        </div>
      )}

      {/* ================= TABLE ================= */}

      <CandidateTable
        requisition={selectedRequisition}
        position={selectedPosition}
        isSelectionDone={isSelectionDone}
        filteredCandidates={paginatedCandidates}
        totalElements={totalElements}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        setPage={setPage}
        setPageSize={setPageSize}
        toggleAbsent={toggleAbsent}
        selectedDate={selectedDate}
        allCandidatesRaw={allCandidatesRaw}
        onViewFile={handleViewFile}
        filter={filteredCandidates}
        searchText={searchText}
        activeStage={activeStage}
      />

      <PdfViewerModal
        show={showPdfViewer}
        onHide={() => {
          setShowPdfViewer(false);
          setPdfUrl(null);
        }}
        fileUrl={pdfUrl}
        loading={loadingPdf}
        title={t("verification:candidate_resume")}
      />
    </div>
  );
}
