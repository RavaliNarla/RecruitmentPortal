import React, { useState, useEffect, useRef } from "react";
import { Container, Form, Button, Card } from "react-bootstrap";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../../../style/css/AddPosition.css";
import import_Icon from "../../../assets/import_Icon.png";
import ImportModal from "../component/ImportModal";
import masterApiService from "../../master/services/masterApiService";
import EducationModal from "../component/EducationModal";
import {
  validateAddPosition,
  validateStateDistribution,
  validateApprovedOn,
} from "../validations/validateAddPosition";
import { useCreateJobPosition } from "../hooks/useCreateJobPosition";
import { useRequisitionDetails } from "../hooks/useRequisitionDetails";
import { useMasterData } from "../hooks/useMasterData";
import ConfirmUsePositionModal from "../component/ConfirmUsePositionModal";
import { useJobPositionById } from "../hooks/useJobPositionById";
import { useUpdateJobPosition } from "../hooks/useUpdateJobPosition";
import PositionForm from "../component/PositionForm";
import { mapEduRulesToModalData } from "../mappers/mapEduRulesToModalData";
import { useLocation } from "react-router-dom";
import { useJobPositionsByRequisition } from "../hooks/useJobPositionsByRequisition";
import { toast } from "react-toastify";
import ReservationSection from "../component/ReservationSection";
import { useTranslation } from "react-i18next";
import SelectIndentModal from "../component/SelectIndentModal";
import jobPositionApiService from "../services/jobPositionApiService";
import FormBuilderModal from "../component/DynamicForm/FormBuilderModal";
const AddPosition = () => {
  const { t } = useTranslation(["addPosition", "common", "validation"]);
  const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];
  const MAX_FILE_SIZE_MB = 2;
  const YEAR_OPTIONS = Array.from({ length: 31 }, (_, i) => i);
  const MONTH_OPTIONS = Array.from({ length: 11 }, (_, i) => i + 1);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const { requisitionId } = useParams();
  const positionId = searchParams.get("positionId");
  const mode = location.state?.mode; // "view" | "edit" | undefined

  const isInEditMode = location.state?.isInEditMode === false;
  const [exclusions, setExclusions] = useState([]);

  console.log("Exclusions@@@@@@@@@@@@@@@@@@:", exclusions);
  const [selectedExclusions, setSelectedExclusions] = useState([]);

  const isViewMode = !!positionId && mode === "view";
  const isEditMode = !!positionId && mode !== "view";
  const isDraft = location.state?.isDraft === true;
  // const isControlledEdit = isEditMode && isInEditMode;
  const isControlledEdit = isDraft && isEditMode && isInEditMode;
  const isImportDisabled = isViewMode || isEditMode;
  const parentRequisitionId = location.state?.parentRequisitionId;
  const { positionsByReq, fetchPositions } = useJobPositionsByRequisition();
  const [showFormBuilder, setShowFormBuilder] = useState(false);

  const [additionalForm, setAdditionalForm] = useState(null);

  useEffect(() => {
    if (requisitionId) {
      fetchPositions(isDraft ? parentRequisitionId : requisitionId, isDraft);
    }
  }, [requisitionId, isDraft, parentRequisitionId]);

  const shouldFetchPosition = !!positionId && (isEditMode || isViewMode);

  // const { data: existingPosition } = useJobPositionById(shouldFetchPosition ? positionId : null);
  const effectiveRequisitionId = isDraft ? parentRequisitionId : requisitionId;
  const { requisition, loading: requisitionLoading } = useRequisitionDetails(
    effectiveRequisitionId
  );

  const { data: existingPosition } = useJobPositionById(
    shouldFetchPosition ? positionId : null,
    { isDraft, parentRequisitionId }
  );

  const { createPosition, loading } = useCreateJobPosition();
  const { updatePosition, loading: updateLoading } = useUpdateJobPosition();
  const masterData = useMasterData();
  const {
    positions,
    employmentTypes,
    reservationCategories,
    disabilityCategories,
    educationTypes,
    qualifications,
    specializations,
    certifications,
    states,
    languages,
    stateLanguages,
    cities,
  } = masterData;

  const [errors, setErrors] = useState({});
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEduModal, setShowEduModal] = useState(false);
  const [eduMode, setEduMode] = useState("mandatory");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPosition, setPendingPosition] = useState(null);
  const [indentFile, setIndentFile] = useState(null);
  const [existingIndentPath, setExistingIndentPath] = useState(null);
  const [existingIndentName, setExistingIndentName] = useState(null);
  const [approvedBy, setApprovedBy] = useState("");
  const [approvedOn, setApprovedOn] = useState("");
  const [stateDistributions, setStateDistributions] = useState([]);
  const [indentOthers, setIndentOthers] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [nationalCategories, setNationalCategories] = useState({});
  const [nationalDisabilities, setNationalDisabilities] = useState({});
  const [isProficientInLocalLanguage, setIsProficientInLocalLanguage] =
    useState(false);
  const [currentState, setCurrentState] = useState({
    state: "",
    vacancies: "",
    language: "",
    categories: {},
    disabilities: {},
  });
  const [formData, setFormData] = useState({
    department: "",
    position: "",
    vacancies: "",
    minAge: "",
    maxAge: "",
    employmentType: "",
    contractualPeriod: "",
    grade: "",
    enableLocation: false,
    mandatoryEducation: "",
    preferredEducation: "",
    mandatoryExperience: { years: "", months: "", description: "" },
    preferredExperience: { years: "", months: "", description: "" },
    responsibilities: "",
    medicalRequired: "yes",
    enableStateDistribution: false,
    useMandatoryEducationLevelExperience: false,
    usePreferredEducationLevelExperience: false,
    isIntermediateRequired: true,
  });
  const [isAgeRelRiotVictimFamily, setIsAgeRelRiotVictimFamily] =
    useState(false);
  const [isAgeRelWdsWomen, setIsAgeRelWdsWomen] = useState(false);

  const [indentCandidates, setIndentCandidates] = useState([]);
  const [showIndentModal, setShowIndentModal] = useState(false);
  const [selectedIndent, setSelectedIndent] = useState(null);
  const [originalCategories, setOriginalCategories] = useState({});
  const [originalDisabilities, setOriginalDisabilities] = useState({});

  const isFieldDisabled = (field) => {
    if (isViewMode) return true;

    if (isControlledEdit) {
      const restrictedFields = [
        "department",
        "position",
        "enableStateDistribution",
        "grade",
        "employmentType",
        "contractualPeriod",
        // add more based on business rules
      ];

      return restrictedFields.includes(field);
    }

    return false;
  };

  // Initialize isProficientInLocalLanguage from existingPosition ROOT LEVEL
  useEffect(() => {
    if (existingPosition?.isProficientInLocalLanguage !== undefined) {
      const value = existingPosition.isProficientInLocalLanguage;
      setIsProficientInLocalLanguage(
        value === true || value === "true" || value === 1 || value === "1"
      );
    } else {
      setIsProficientInLocalLanguage(false);
    }

    setIsAgeRelRiotVictimFamily(
      existingPosition?.isAgeRelRiotVictimFamily === true ||
        existingPosition?.isAgeRelRiotVictimFamily === "true" ||
        existingPosition?.isAgeRelRiotVictimFamily === 1
    );

    setIsAgeRelWdsWomen(
      existingPosition?.isAgeRelWdsWomen === true ||
        existingPosition?.isAgeRelWdsWomen === "true" ||
        existingPosition?.isAgeRelWdsWomen === 1
    );
  }, [existingPosition]);

  useEffect(() => {
    if (existingPosition?.jobPositionExclusion?.length) {
      setSelectedExclusions(
        existingPosition.jobPositionExclusion
          .filter((e) => e.isExcluded)
          .map((e) => e.exclusionId)
      );
    }
  }, [existingPosition]);

  useEffect(() => {
    const loadExclusions = async () => {
      try {
        const res = await masterApiService.getExclusions();

        console.log("FULL RESPONSE", res);
        console.log("RESPONSE DATA", res.data);

        if (res?.success) {
          setExclusions(res.data || []);
        }
      } catch (err) {
        console.error("Failed to load exclusions", err);
      }
    };

    loadExclusions();
  }, []);

  useEffect(() => {
    const reqKey = `${isDraft ? parentRequisitionId : requisitionId}_${isDraft}`;

    if (existingPosition && positionsByReq[reqKey]) {
      const match = positionsByReq[reqKey].find(
        (p) => p.indentName === existingPosition.indentName
      );

      if (match) {
        setSelectedIndent(match);
      } else if (existingPosition.indentName) {
        // fallback → custom indent
        setSelectedIndent("CUSTOM");
      }
    }
  }, [existingPosition, positionsByReq]);

  const [educationData, setEducationData] = useState({
    mandatory: { educations: [], certificationIds: [], text: "" },
    preferred: { educations: [], certificationIds: [], text: "" },
  });
  const eduInitializedRef = useRef(false);
  const submitRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset eduInitializedRef when mode changes to allow re-initialization
  useEffect(() => {
    eduInitializedRef.current = false;
  }, [mode]);

  // --- EFFECTS ---
  useEffect(() => {
    if (!existingPosition || !employmentTypes.length) return;
    const isContract =
      employmentTypes.find(
        (t) =>
          String(t.id) === String(existingPosition.employmentType) &&
          t.label?.toLowerCase().includes("contract")
      ) !== undefined;

    setFormData({
      department: String(existingPosition.deptId),
      position: String(existingPosition.masterPositionId),
      vacancies: existingPosition.totalVacancies,
      minAge: existingPosition.eligibilityAgeMin,
      maxAge: existingPosition.eligibilityAgeMax,
      employmentType: existingPosition.employmentType,

      grade: existingPosition.gradeId,
      enableLocation: existingPosition.isLocationPreferenceEnabled,
      responsibilities: existingPosition.rolesResponsibilities,
      medicalRequired: existingPosition.isMedicalRequired ? "yes" : "no",
      enableStateDistribution: existingPosition.isLocationWise,
      mandatoryExperience: {
        years: Math.floor(existingPosition.mandatoryExperienceMonths / 12),
        months: existingPosition.mandatoryExperienceMonths % 12,
        description: existingPosition.mandatoryExperience,
        educationLevelExperiences: Object.entries(
          existingPosition.mandatoryExpMonthsEduWise || {}
        ).map(([educationLevel, months]) => ({
          educationLevel,
          years: Math.floor(months / 12),
          months: months % 12,
          isSaved: true,
        })),
      },
      preferredExperience: {
        years: Math.floor(existingPosition.preferredExperienceMonths / 12),
        months: existingPosition.preferredExperienceMonths % 12,
        description: existingPosition.preferredExperience,
        educationLevelExperiences: Object.entries(
          existingPosition.preferredExpMonthsEduWise || {}
        ).map(([educationLevel, months]) => ({
          educationLevel,
          years: Math.floor(months / 12),
          months: months % 12,
          isSaved: true,
        })),
      },
      contractualPeriod: isContract
        ? String(existingPosition.contractYears ?? "")
        : "",
      useMandatoryEducationLevelExperience:
        existingPosition.isMandatoryExpMonthsEduWise || false,
      usePreferredEducationLevelExperience:
        existingPosition.isPreferredExpMonthsEduWise || false,
      isIntermediateRequired: existingPosition.isIntermediateRequired,
      dynamicFields: existingPosition.dynamicFields || {},
    });
    if (existingPosition?.dynamicFields) {
      setAdditionalForm(existingPosition.dynamicFields);
    }
    setApprovedBy(existingPosition.approvedBy || "");
    setIndentOthers(existingPosition.indentOthers || "");
    setApprovedOn(existingPosition.approvedOn || "");
    if (existingPosition.indentPath)
      setExistingIndentPath(existingPosition.indentPath);
    setExistingIndentName(existingPosition.indentName);
  }, [existingPosition, employmentTypes]);

  useEffect(() => {
    if (!employmentTypes.length) return;

    const isContract =
      employmentTypes.find(
        (t) =>
          String(t.id) === String(formData.employmentType) &&
          t.label?.toLowerCase().includes("contract")
      ) !== undefined;

    // 🔥 if user switches away from contract, clear it
    if (!isContract && formData.contractualPeriod !== "") {
      setFormData((prev) => ({
        ...prev,
        contractualPeriod: "",
      }));
    }
  }, [formData.employmentType, employmentTypes]);

  useEffect(() => {
    if (!existingPosition) return;

    if (
      !educationTypes.length ||
      !qualifications.length ||
      !specializations.length ||
      !certifications.length
    ) {
      return;
    }

    if (eduInitializedRef.current) {
      return;
    }

    const mandatory = mapEduRulesToModalData(
      existingPosition.mandatoryEduRulesJson,
      educationTypes,
      qualifications,
      specializations,
      certifications
    );

    const preferred = mapEduRulesToModalData(
      existingPosition.preferredEduRulesJson,
      educationTypes,
      qualifications,
      specializations,
      certifications
    );

    setEducationData({
      mandatory: {
        ...mandatory,
        //  USE BACKEND TEXT — DO NOT REBUILD
        text: existingPosition.mandatoryEducation || "",
      },
      preferred: {
        ...preferred,
        //  USE BACKEND TEXT — DO NOT REBUILD
        text: existingPosition.preferredEducation || "",
      },
    });

    eduInitializedRef.current = true;
  }, [
    existingPosition,
    educationTypes,
    qualifications,
    specializations,
    certifications,
  ]);

  // Handle National Distribution mapping
  useEffect(() => {
    if (
      !existingPosition ||
      existingPosition.isLocationWise ||
      !reservationCategories.length ||
      !disabilityCategories.length
    )
      return;
    const natCat = {};
    const natDis = {};
    reservationCategories.forEach((c) => (natCat[c.code] = 0));
    disabilityCategories.forEach((d) => (natDis[d.disabilityCode] = 0));
    existingPosition.positionCategoryNationalDistributions.forEach((d) => {
      if (d.isDisability) {
        const dis = disabilityCategories.find(
          (x) => x.id === d.disabilityCategoryId
        );
        if (dis) natDis[dis.disabilityCode] = d.vacancyCount;
      } else {
        const cat = reservationCategories.find(
          (x) => x.id === d.reservationCategoryId
        );
        if (cat) natCat[cat.code] = d.vacancyCount;
      }
    });
    setNationalCategories(natCat);
    setNationalDisabilities(natDis);
  }, [existingPosition, reservationCategories, disabilityCategories]);

  // Handle State Distribution mapping
  useEffect(() => {
    const mapStates = async () => {
      if (
        !existingPosition ||
        !existingPosition.isLocationWise ||
        !reservationCategories.length ||
        !disabilityCategories.length
      )
        return;

      const mappedStates = await Promise.all(
        existingPosition.positionStateDistributions.map(async (sd) => {
          const categories = {};
          const disabilities = {};

          reservationCategories.forEach((c) => (categories[c.code] = 0));
          disabilityCategories.forEach(
            (d) => (disabilities[d.disabilityCode] = 0)
          );

          sd.positionCategoryDistributions.forEach((d) => {
            if (d.isDisability) {
              const dis = disabilityCategories.find(
                (x) => x.id === d.disabilityCategoryId
              );
              if (dis) disabilities[dis.disabilityCode] = d.vacancyCount;
            } else {
              const cat = reservationCategories.find(
                (x) => x.id === d.reservationCategoryId
              );
              if (cat) categories[cat.code] = d.vacancyCount;
            }
          });

          return {
            positionStateDistributionId: sd.positionStateDistributionId,
            state: sd.stateId,
            city: sd.cityId,

            vacancies: sd.totalVacancies,
            language: sd.localLanguage,
            // 🔵 DO NOT store isProficientInLocalLanguage per-state - it's a root-level field
            // isProficientInLocalLanguage will be managed at AddPosition root level only
            categories,
            disabilities,
            categoryDistributions: sd.positionCategoryDistributions.map(
              (cd) => ({
                positionCategoryDistributionId:
                  cd.positionCategoryDistributionId,
                reservationCategoryId: cd.reservationCategoryId,
                disabilityCategoryId: cd.disabilityCategoryId,
                isDisability: cd.isDisability,
              })
            ),
          };
        })
      );

      setStateDistributions(mappedStates);

      // Set root-level isProficientInLocalLanguage from ROOT LEVEL of existingPosition
      if (existingPosition?.isProficientInLocalLanguage !== undefined) {
        const value = existingPosition.isProficientInLocalLanguage;
        setIsProficientInLocalLanguage(
          value === true || value === "true" || value === 1 || value === "1"
        );
      } else {
        setIsProficientInLocalLanguage(false);
      }
    };

    mapStates();
  }, [existingPosition, reservationCategories, disabilityCategories]);

  // --- HANDLERS ---
  const numericFields = ["vacancies", "minAge", "maxAge", "contractualPeriod"];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // handle nested fields
    if (name.includes(".")) {
      const [parent, child] = name.split(".");

      setFormData((prev) => {
        const updated = {
          ...prev[parent],
          [child]: value,
        };

        return {
          ...prev,
          [parent]: updated,
        };
      });

      setErrors((prev) => ({ ...prev, [parent]: "" }));
      return;
    }

    let finalValue = value;

    if (numericFields.includes(name)) {
      finalValue = value.replace(/\D/g, "");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : finalValue,
    }));

    //  SPECIAL CASE: department change clears position error
    if (name === "department") {
      const reqKey = `${isDraft ? parentRequisitionId : requisitionId}_${isDraft}`;

      const matches =
        positionsByReq[reqKey]?.filter(
          (p) => String(p.deptId) === String(value)
        ) || [];

      const uniqueMatches = Array.from(
        new Map(matches.map((p) => [p.indentPath || p.indentName, p])).values()
      );

      setIndentCandidates(uniqueMatches);

      if (uniqueMatches.length > 0) {
        setShowIndentModal(true);
      }

      // clear position when department changes
      setFormData((prev) => ({
        ...prev,
        position: "",
        minAge: "",
        maxAge: "",
        grade: "",
        responsibilities: "",
        mandatoryExperience: { years: "", months: "", description: "" },
        preferredExperience: { years: "", months: "", description: "" },
        useMandatoryEducationLevelExperience: false,
        usePreferredEducationLevelExperience: false,
      }));

      setPendingPosition(null);
      setShowConfirmModal(false);
      setShowIndentModal(false);

      setErrors((prev) => ({
        ...prev,
        department: "",
        position: "",
      }));

      if (uniqueMatches.length > 0) {
        setShowIndentModal(true);
      }
      return;
    } else {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    if (name === "vacancies") {
      setErrors((prev) => ({
        ...prev,
        vacancies: "",
        nationalDistribution: "",
      }));
    }
    if (name === "employmentType") {
      setFormData((prev) => ({
        ...prev,
        employmentType: finalValue,
        contractualPeriod: "",
      }));

      setErrors((prev) => ({
        ...prev,
        employmentType: "",
        contractualPeriod: "",
      }));

      return;
    }
  };
  const handleUseIndent = (pos) => {
    if (pos === "CUSTOM") {
      setSelectedIndent(null);
      setFormData((prev) => ({
        ...prev,
        indentName: "",
      }));
      setExistingIndentPath(null);
      setExistingIndentName(null);
      setIndentFile(null);
      setApprovedBy("");
      setApprovedOn("");
      setShowIndentModal(false);
      return;
    }

    if (!pos) return;

    setSelectedIndent(pos);

    setFormData((prev) => ({
      ...prev,
      indentName: pos.indentName ?? prev.indentName,
      // minAge: pos.minAge ?? prev.minAge,
      // maxAge: pos.maxAge ?? prev.maxAge,
      grade: pos.gradeId ?? prev.grade,
      responsibilities: pos.rolesResponsibilities ?? prev.responsibilities,
    }));

    setApprovedBy(pos.approvedBy ?? approvedBy);
    setApprovedOn(pos.approvedOn ?? approvedOn);

    setExistingIndentPath(pos.indentPath ?? existingIndentPath);
    setExistingIndentName(pos.indentName ?? existingIndentName);

    setShowIndentModal(false);
  };
  const resetPositionDerivedFields = {
    minAge: "",
    maxAge: "",
    grade: "",
    responsibilities: "",
    mandatoryExperience: { years: "", months: "", description: "" },
    preferredExperience: { years: "", months: "", description: "" },
    useMandatoryEducationLevelExperience: false,
    usePreferredEducationLevelExperience: false,
  };

  const handleRejectPositionData = () => {
    setFormData((prev) => ({
      ...prev,
      ...resetPositionDerivedFields,
    }));

    // clear related errors
    setErrors((prev) => {
      const {
        minAge,
        maxAge,
        grade,
        responsibilities,
        mandatoryExperience,
        preferredExperience,
        mandatoryEducation,
        preferredEducation,
        ...rest
      } = prev;
      return rest;
    });

    setPendingPosition(null);
    setShowConfirmModal(false);
  };

  const onPositionSelect = (id) => {
    // If user selects "Select"
    if (!id) {
      setFormData((prev) => ({
        ...prev,
        position: "",
        ...resetPositionDerivedFields,
      }));

      setErrors((prev) => ({
        ...prev,
        position: "",
      }));

      setPendingPosition(null);
      setShowConfirmModal(false);
      return;
    }

    const selected = positions.find((p) => String(p.id) === String(id));
    if (!selected) return;

    setFormData((prev) => ({
      ...prev,
      position: id,
    }));

    setErrors((prev) => ({
      ...prev,
      position: "",
      department: "",
    }));

    setPendingPosition(selected);
    setShowConfirmModal(true);
  };

  const handleUsePositionData = () => {
    if (!pendingPosition) return;
    setFormData((prev) => ({
      ...prev,
      minAge: pendingPosition.minAge ?? "",
      maxAge: pendingPosition.maxAge ?? "",
      grade: String(pendingPosition.gradeId ?? ""),
      responsibilities: pendingPosition.rolesResponsibilities ?? "",
      mandatoryExperience: {
        ...prev.mandatoryExperience,
        description: pendingPosition.mandatoryExperience ?? "",
      },
      preferredExperience: {
        ...prev.preferredExperience,
        description: pendingPosition.preferredExperience ?? "",
      },
    }));
    setErrors((prev) => ({
      ...prev,
      minAge: "",
      maxAge: "",
      grade: "",
      responsibilities: "",
      mandatoryExperience: "",
      preferredExperience: "",
      mandatoryEducation: "",
      preferredEducation: "",
    }));
    setPendingPosition(null);
    setShowConfirmModal(false);
  };

  const handleAddOrUpdateState = () => {
    const isExistingRow = !!currentState.positionStateDistributionId;

    if (isControlledEdit && isExistingRow) {
      // 🚨 check categories
      for (const key in currentState.categories || {}) {
        const originalValue = Number(originalCategories?.[key] || 0);
        const newValue = Number(currentState.categories[key] || 0);

        if (originalValue > 0 && newValue === 0) {
          setErrors((prev) => ({
            ...prev,
            stateDistribution: "Cannot reduce existing category to zero",
          }));
          return;
        }
      }

      // 🚨 check disabilities
      for (const key in currentState.disabilities || {}) {
        const originalValue = Number(originalDisabilities?.[key] || 0);
        const newValue = Number(currentState.disabilities[key] || 0);

        if (originalValue > 0 && newValue === 0) {
          setErrors((prev) => ({
            ...prev,
            stateDistribution: "Cannot reduce existing disability to zero",
          }));
          return;
        }
      }
    }

    const newErrors = validateStateDistribution({
      currentState,
      stateDistributions,
      editingIndex,
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return;
    }
    const deletedIndex = stateDistributions.findIndex(
      (s) => s.state === currentState.state && s.__deleted
    );

    if (deletedIndex !== -1) {
      const revived = [...stateDistributions];
      revived[deletedIndex] = {
        ...revived[deletedIndex], // keeps positionStateDistributionId
        ...currentState,
        __deleted: false,
      };

      setStateDistributions(revived);
      setCurrentState({
        state: "",
        vacancies: "",
        language: "",
        categories: {},
        disabilities: {},
      });
      setErrors((prev) => ({
        ...prev,
        state: "",
        city: "",
        stateDistribution: "",
      }));
      setEditingIndex(null);
      return;
    }
    const updated = [...stateDistributions];
    if (editingIndex !== null)
      updated[editingIndex] = { ...updated[editingIndex], ...currentState };
    else updated.push({ ...currentState });

    setStateDistributions(updated);

    //  CLEAR NATIONAL DISTRIBUTION ERROR
    setErrors((prev) => {
      const { nationalDistribution, ...rest } = prev;
      return rest;
    });

    setCurrentState({
      state: "",
      vacancies: "",
      language: "",
      categories: {},
      disabilities: {},
    });
    setEditingIndex(null);
  };
  const isContractEmployment = employmentTypes.some(
    (t) =>
      String(t.id) === String(formData.employmentType) &&
      t.label?.toLowerCase().includes("contract")
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitRef.current) return;
    submitRef.current = true;
    setSubmitting(true);
    const reqKey = `${isDraft ? parentRequisitionId : requisitionId}_${isDraft}`;
    const validationErrors = validateAddPosition({
      isEditMode,
      formData,
      educationData,
      indentFile,
      approvedBy,
      approvedOn,
      existingIndentPath,
      existingIndentName,
      nationalCategories,
      nationalDisabilities,
      stateDistributions,
      // existingPositions: positionsByReq[requisitionId] || [],
      existingPositions: positionsByReq[reqKey] || [],
      positionId,
      isContractEmployment,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      submitRef.current = false;
      setSubmitting(false);
      return;
    }
    if (!errors.vacancies && Number(formData.vacancies) <= 0) {
      errors.vacancies = "validation:vacancies_must_be_greater_than_zero";
    }

    console.log("Selected Exclusions:", selectedExclusions);
    console.log(
      "existingPosition exclusions",
      existingPosition?.jobPositionExclusions
    );

    console.log("positionId from URL =", positionId);
    console.log("existingPosition =", existingPosition);
    console.log("existingPosition.positionId =", existingPosition?.positionId);

    const currentPositionId =
      existingPosition?.positionId || positionId || null;

    const payload = {
      formData,
      educationData,
      requisitionId,
      indentFile,
      indentPath: existingIndentPath,
      indentName: existingIndentName,
      approvedBy,
      approvedOn,
      reservationCategories,
      disabilityCategories,
      nationalCategories,
      nationalDisabilities,
      qualifications,
      certifications,
      indentOthers,
      isProficientInLocalLanguage,
      stateDistributions: stateDistributions.filter((s) => !s.__deleted),
      isAgeRelRiotVictimFamily,
      isAgeRelWdsWomen,
       dynamicFields: additionalForm,

      jobPositionExclusion: exclusions.map((item) => {
        const existingExclusion = existingPosition?.jobPositionExclusions?.find(
          (e) => e.exclusionId === item.exclusionId
        );

        return {
          jobPositionId: currentPositionId,
          exclusionId: item.exclusionId,
          isExcluded: selectedExclusions.includes(item.exclusionId),
          id: existingExclusion?.id || null,
        };
      }),
    };
    console.log("Payload to be submitted:", payload);
    try {
      if (isEditMode) {
        // await updatePosition({ ...payload, positionId, existingPosition });
        await updatePosition({
          ...payload, // 🔥 THIS IS THE REAL DATA
          ...(isDraft ? {} : { positionId }),
          isDraft,
          parentRequisitionId,
          existingPosition,
        });

        toast.success(t("position_updated_success"));
      } else {
        await createPosition(payload);
        toast.success(t("position_added_success"));
      }

      navigate(-1);
    } catch (err) {
      toast.error(err.message || t("operation_failed"));
    } finally {
      submitRef.current = false;
      setSubmitting(false);
    }
  };

  const nationalCategoryTotal = Object.values(nationalCategories).reduce(
    (a, b) => a + Number(b || 0),
    0
  );
  const stateCategoryTotal = Object.values(
    currentState.categories || {}
  ).reduce((a, b) => a + Number(b || 0), 0);
  const filteredLanguages = currentState.state
    ? stateLanguages
        .filter((sl) => String(sl.stateId) === String(currentState.state))
        .map((sl) => {
          const lang = languages.find(
            (l) => String(l.id) === String(sl.languageId)
          );

          return lang ? { id: lang.id, name: lang.name } : null;
        })
        .filter(Boolean)
    : [];

  return (
    <Container fluid className="add-position-page">
      <div className="req_top-bar">
        <div className="d-flex align-items-center gap-3">
          <Button
            variant="link"
            className="back-btn"
            onClick={() => navigate(-1)}
          >
            ← {t("back")}
          </Button>
          <div>
            <span className="req-id">
              {requisitionLoading
                ? t("loading")
                : requisition?.requisitionCode || "—"}
            </span>
            <div className="req-code wrap">
              {requisition?.requisitionTitle || "—"}
            </div>
          </div>
        </div>
        <Button
          className="imprcls"
          variant="none"
          disabled={isImportDisabled}
          onClick={() => setShowImportModal(true)}
        >
          <img src={import_Icon} alt="import_Icon" className="icon-14" />
          &nbsp;{t("import_positions")}
        </Button>
      </div>

      <Card className="position-card">
        <Card.Body>
          <div className="section-title">
            <span className="indicator"></span>
            <h6>
              {" "}
              {isViewMode
                ? t("view_position")
                : isEditMode
                  ? t("edit_position")
                  : t("add_position")}
            </h6>
          </div>
          <Form onSubmit={handleSubmit}>
            <PositionForm
              isViewMode={isViewMode}
              formData={formData}
              errors={errors}
              handleInputChange={handleInputChange}
              indentFile={indentFile}
              setFormData={setFormData}
              existingIndentPath={existingIndentPath}
              existingIndentName={existingIndentName}
              setIndentFile={setIndentFile}
              setErrors={setErrors}
              approvedBy={approvedBy}
              setApprovedBy={setApprovedBy}
              approvedOn={approvedOn}
              setApprovedOn={setApprovedOn}
              validateApprovedOn={validateApprovedOn}
              masterData={masterData}
              indentOthers={indentOthers}
              setIndentOthers={setIndentOthers}
              onPositionSelect={onPositionSelect}
              educationData={educationData}
              
              onEducationClick={(m) => {
                if (isViewMode) return;

                setEduMode(m);
                setShowEduModal(true);

                if (m === "preferred") {
                  setErrors((prev) => {
                    const { mandatoryEducation, ...rest } = prev;
                    return rest;
                  });
                }
              }}
              YEAR_OPTIONS={YEAR_OPTIONS}
              MONTH_OPTIONS={MONTH_OPTIONS}
              ALLOWED_EXTENSIONS={ALLOWED_EXTENSIONS}
              MAX_FILE_SIZE_MB={MAX_FILE_SIZE_MB}
              isControlledEdit={isControlledEdit}
              isFieldDisabled={isFieldDisabled}
            />
            <ReservationSection
              isViewMode={isViewMode}
              formData={formData}
              errors={errors}
              setErrors={setErrors}
              reservationCategories={reservationCategories}
              disabilityCategories={disabilityCategories}
              states={states}
              languages={languages}
              stateLanguages={stateLanguages}
              cities={cities}
              nationalCategories={nationalCategories}
              setNationalCategories={setNationalCategories}
              nationalDisabilities={nationalDisabilities}
              setNationalDisabilities={setNationalDisabilities}
              nationalCategoryTotal={nationalCategoryTotal}
              currentState={currentState}
              setCurrentState={setCurrentState}
              stateCategoryTotal={stateCategoryTotal}
              filteredLanguages={filteredLanguages}
              stateDistributions={stateDistributions}
              setStateDistributions={setStateDistributions}
              editingIndex={editingIndex}
              setEditingIndex={setEditingIndex}
              handleInputChange={handleInputChange}
              handleAddOrUpdateState={handleAddOrUpdateState}
              isProficientInLocalLanguage={isProficientInLocalLanguage}
              setIsProficientInLocalLanguage={setIsProficientInLocalLanguage}
              isAgeRelRiotVictimFamily={isAgeRelRiotVictimFamily}
              setIsAgeRelRiotVictimFamily={setIsAgeRelRiotVictimFamily}
              isAgeRelWdsWomen={isAgeRelWdsWomen}
              setIsAgeRelWdsWomen={setIsAgeRelWdsWomen}
              isControlledEdit={isControlledEdit}
              isFieldDisabled={isFieldDisabled}
              originalCategories={originalCategories}
              originalDisabilities={originalDisabilities}
              setOriginalCategories={setOriginalCategories}
              setOriginalDisabilities={setOriginalDisabilities}
              exclusions={exclusions}
              selectedExclusions={selectedExclusions}
              setSelectedExclusions={setSelectedExclusions}
              onOpenDynamicForm={() => setShowFormBuilder(true)}
            />

            <div className="form-footer mt-4 mb-4">
              <Button
                variant="outline-secondary"
                className="cancelbtn"
                onClick={() => navigate(-1)}
              >
                {t("common:cancel")}
              </Button>
              {!isViewMode && (
                <Button
                  type="submit"
                  className="ms-2 save-btn"
                  disabled={loading || updateLoading || submitting}
                >
                  {isEditMode ? t("common:update") : t("common:save")}
                </Button>
              )}
            </div>
          </Form>
        </Card.Body>
      </Card>

      <ImportModal
        show={showImportModal}
        onHide={() => setShowImportModal(false)}
        requisitionId={requisitionId}
        onSuccess={() => fetchPositions(requisitionId)} // optional but correct
      />
      <EducationModal
        key={`${eduMode}-${showEduModal}`}
        show={showEduModal}
        mode={eduMode}
        isIntermediateRequired={formData.isIntermediateRequired}
        initialData={educationData[eduMode]}
        educationTypes={educationTypes}
        qualifications={qualifications}
        specializations={specializations}
        certifications={certifications}
        onHide={() => setShowEduModal(false)}
        onSave={({ groups, certGroups, text }) => {
          setEducationData((prev) => ({
            ...prev,
            [eduMode]: { groups, certGroups, text },
          }));
          setErrors((prev) => {
            const upd = { ...prev };
            delete upd[`${eduMode}Education`];
            return upd;
          });
        }}
      />
      <ConfirmUsePositionModal
        show={showConfirmModal}
        onYes={handleUsePositionData}
        onNo={handleRejectPositionData}
      />

      <SelectIndentModal
        show={showIndentModal}
        onClose={() => setShowIndentModal(false)}
        data={indentCandidates}
        onSelect={handleUseIndent}
        selectedIndent={selectedIndent}
      />
       <FormBuilderModal
        show={showFormBuilder}
        onHide={() => setShowFormBuilder(false)}
        value={additionalForm}
        onSave={(schema) => {
          setAdditionalForm(schema);
        }}
         isViewMode={isViewMode}
      />
     
    </Container>
  );
};

export default AddPosition;
