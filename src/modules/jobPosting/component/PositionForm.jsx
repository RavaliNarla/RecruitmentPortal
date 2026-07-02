import { useRef, useMemo, useEffect } from "react";
import { Row, Col, Form, Button, Tooltip } from "react-bootstrap";
import ErrorMessage from "../../../shared/components/ErrorMessage";
import upload_icon from "../../../assets/upload_Icon.png";
import edit_icon from "../../../assets/edit_icon.png";
import view_icon from "../../../assets/view_icon.png";
import file_icon from "../../../assets/file_icon.png";
import {
  normalizeTitle,
  validateTitleOnType,
  validateApprovedOn,
} from "../validations/validateAddPosition";
import useViewIndent from "../hooks/useViewIndent";
import { OverlayTrigger, Popover } from "react-bootstrap";
import I_icon from "../../../assets/I_icon.png";
import { useTranslation } from "react-i18next";
import Select from "react-select";
import delete_icon from "../../../assets/delete_icon.png";

const PositionForm = ({
  isViewMode = false,
  isControlledEdit = false,
  isFieldDisabled = () => false,
  formData,
  errors,
  handleInputChange,
  indentFile,
  existingIndentPath,
  existingIndentName,
  setIndentFile,
  setErrors,
  setFormData,
  approvedBy,
  setApprovedBy,
  indentOthers,
  setIndentOthers,
  approvedOn,
  setApprovedOn,
  masterData: {
    positions,
    departments,
    employmentTypes,
    jobGrades,
    approvingAuthorities,
    educationTypes,
    qualifications,
    documentTypes,
  },
  onPositionSelect,
  onEducationClick,
  educationData,
  YEAR_OPTIONS,
  MONTH_OPTIONS,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_MB,
}) => {
  const { t } = useTranslation(["addPosition", "common", "validation"]);

  // Sync form data when parent formData changes (for edit mode)
  useEffect(() => {
    if (formData) {
      setFormData(formData);
    }
  }, [formData]);

  const renderError = (e) => {
    if (!e) return "";
    if (typeof e === "string") return t(e);
    if (typeof e === "object" && e.key) return t(e.key, e.params);
    return "";
  };
  const othersOption = useMemo(
    () => approvingAuthorities.find((a) => a.name?.toLowerCase() === "others"),
    [approvingAuthorities]
  );
  const withSelectOption = (options, label = t("common:select")) => [
    { value: "", label },
    ...options,
  ];

  const isOthersSelected = othersOption && approvedBy === othersOption.id;

  const selectedGrade = jobGrades.find(
    (g) => String(g.id) === String(formData.grade)
  );
  const formatNumber = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      Number(value) === 0
    ) {
      return "-";
    }

    return new Intl.NumberFormat("en-IN").format(Number(value));
  };

  const salaryPopover = (
    <Popover id="salary-popover">
      <Popover.Header as="h6">{t("addPosition:salary_range")}</Popover.Header>
      <Popover.Body>
        <div>
          <strong>{t("addPosition:min_salary")}:</strong>{" "}
          {formatNumber(selectedGrade?.minSalary)}
        </div>
        <div>
          <strong>{t("addPosition:max_salary")}:</strong>{" "}
          {formatNumber(selectedGrade?.maxSalary)}
        </div>
      </Popover.Body>
    </Popover>
  );

  const viewIndent = useViewIndent(existingIndentPath, existingIndentName);
  const isContractEmployment = employmentTypes.some(
    (t) =>
      String(t.id) === String(formData.employmentType) &&
      t.label?.toLowerCase().includes("contract")
  );

  const indentInputRef = useRef(null);

  const handleReplaceIndent = () => {
    if (isViewMode) return;

    setFormData((prev) => ({
      ...prev,
      indentPath: null,
    }));

    setIndentFile(null);

    setErrors((prev) => {
      const { indentFile, ...rest } = prev;
      return rest;
    });

    const input = indentInputRef.current;

    if (input) {
      input.value = "";
      input.click();
    }
  };
  const yearOptions = withSelectOption(
    YEAR_OPTIONS.map((y) => ({ value: y, label: y })),
    ` ${t("addPosition:select_year")} `
  );

  const monthOptions = withSelectOption(
    MONTH_OPTIONS.map((m) => ({ value: m, label: m })),
    ` ${t("addPosition:select_month")} `
  );
  const approvedByOptions = withSelectOption(
    approvingAuthorities.map((a) => ({
      value: a.id,
      label: a.name,
    }))
  );
  const filteredPositions = positions.filter(
    (p) => String(p.deptId) === String(formData.department)
  );

  const positionOptions = withSelectOption(
    filteredPositions.map((p) => ({
      value: p.id,
      label: p.name,
    }))
  );

  const departmentOptions = withSelectOption(
    departments.map((d) => ({
      value: d.id,
      label: d.label,
    }))
  );

  const employmentTypeOptions = withSelectOption(
    employmentTypes.map((t) => ({
      value: t.id,
      label: t.label,
    }))
  );

  const gradeOptions = withSelectOption(
    jobGrades.map((g) => ({
      value: g.id,
      label: `${g.code} ${g.scale ? `- ${g.scale}` : ""}`,
    }))
  );
  const educationDocuments =
    documentTypes?.filter((doc) => doc.docType === "educationdocs") || [];

  return (
    <>
      <div className={`position-form ${isViewMode ? "view-mode" : ""}`}>
        <Row className="g-4 mb-4 upload-indent-section">
          <Col md={8} className="mt-3">
            <Form.Group>
              <Form.Label>
                {t("addPosition:upload_indent")}{" "}
                <span className="text-danger">*</span>
              </Form.Label>
              <div
                className={`upload-indent-box ${isViewMode ? "disabled" : ""}`}
                onClick={() => {
                  if (isViewMode) return;

                  if (!existingIndentPath || indentFile) {
                    indentInputRef.current?.click();
                  }
                }}
              >
                {indentFile ? (
                  <div className="d-flex align-items-center justify-content-between w-100">
                    {/* LEFT: file icon + name */}
                    <div className="d-flex align-items-center gap-3">
                      <span className="file-icon">
                        <img
                          src={file_icon}
                          alt="file_icon"
                          className="icon-16"
                        />
                      </span>
                      <div className="fw-semibold">{indentFile.name}</div>
                    </div>

                    {/* RIGHT: edit icon */}
                    <div className="indent-actions">
                      <OverlayTrigger
                        placement="bottom"
                        overlay={
                          <Tooltip id={`tooltip-edit-${indentFile.name}`}>
                            {t("addPosition:replace_indent")}
                          </Tooltip>
                        }
                      >
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReplaceIndent();
                          }}
                        >
                          <img
                            src={edit_icon}
                            alt="edit_indent"
                            className="icon-16"
                          />
                        </button>
                      </OverlayTrigger>
                    </div>
                  </div>
                ) : existingIndentPath ? (
                  <div className="d-flex align-items-center gap-3">
                    <span className="file-icon">
                      <img
                        src={file_icon}
                        alt="file_icon"
                        className="icon-16"
                      />
                    </span>
                    <div>
                      <div
                        className="fw-semibold text-truncate"
                        title={existingIndentName}
                      >
                        {existingIndentName}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted">
                    <img
                      src={upload_icon}
                      alt="upload_icon"
                      className="icon-40"
                    />
                    <div>{t("addPosition:click_to_browse")}</div>
                    <span className="support">
                      {t("addPosition:supported_formats")}
                    </span>
                  </div>
                )}
                {!indentFile && existingIndentPath && (
                  <div className="indent-actions">
                    {/* View */}
                    <OverlayTrigger
                      placement="bottom"
                      overlay={
                        <Tooltip id={`tooltip-view-${existingIndentName}`}>
                          {t("addPosition:view_indent")}
                        </Tooltip>
                      }
                    >
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation(); // UI concern stays in component
                          viewIndent();
                        }}
                      >
                        <img
                          src={view_icon}
                          alt="view_icon"
                          className="icon-16"
                        />
                      </button>
                    </OverlayTrigger>
                    {/* Edit */}
                    {!isViewMode && (
                      <OverlayTrigger
                        placement="bottom"
                        overlay={
                          <Tooltip id={`tooltip-edit-${existingIndentName}`}>
                            {t("addPosition:replace_indent")}
                          </Tooltip>
                        }
                      >
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReplaceIndent();
                          }}
                        >
                          <img
                            src={edit_icon}
                            alt="edit_icon"
                            className="icon-16"
                          />
                        </button>
                      </OverlayTrigger>
                    )}
                  </div>
                )}
              </div>
              <input
                id="indentFileInput"
                ref={indentInputRef}
                type="file"
                hidden
                disabled={isViewMode}
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  if (file.size === 0) {
                    setErrors((prev) => ({
                      ...prev,
                      indentFile: "validation:file_empty",
                    }));

                    e.target.value = "";
                    return;
                  }

                  const extension =
                    "." + file.name.split(".").pop().toLowerCase();
                  if (!ALLOWED_EXTENSIONS.includes(extension)) {
                    setErrors((prev) => ({
                      ...prev,
                      indentFile: "validation:file_invalid_type",
                    }));
                    e.target.value = "";
                    return;
                  }
                  if (file.size / (1024 * 1024) > MAX_FILE_SIZE_MB) {
                    setErrors((prev) => ({
                      ...prev,
                      indentFile: {
                        key: "validation:file_too_large",
                        params: { size: 2 },
                      },
                    }));
                    e.target.value = "";
                    return;
                  }
                  setIndentFile(file);
                  setFormData((prev) => ({
                    ...prev,
                    indentName: file.name,
                  }));
                  setErrors((prev) => {
                    const { indentFile, ...rest } = prev;
                    return rest;
                  });
                }}
              />
              <ErrorMessage>{renderError(errors.indentFile)}</ErrorMessage>
            </Form.Group>
          </Col>

          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>
                {t("addPosition:approved_by")}{" "}
                <span className="text-danger">*</span>
              </Form.Label>
              <Select
                isDisabled={isViewMode}
                classNamePrefix="react-select"
                value={approvedByOptions.find(
                  (option) => String(option.value) === String(approvedBy)
                )}
                onChange={(selected) => {
                  setApprovedBy(selected ? selected.value : "");
                  setErrors((prev) => ({ ...prev, approvedBy: "" }));
                }}
                options={approvedByOptions}
              />
              {isOthersSelected && (
                <Form.Group className="mt-2">
                  <Form.Control
                    type="text"
                    placeholder="Enter approving authority"
                    value={indentOthers}
                    maxLength={200}
                    onChange={(e) => {
                      let value = e.target.value;

                      // ❌ Block leading space
                      if (value.length === 1 && value === " ") return;

                      // collapse multiple spaces inside
                      value = value.replace(/[ \t]+/g, " ");

                      setIndentOthers(value);
                    }}
                    onBlur={() => {
                      // remove trailing space only
                      //setIndentOthers((prev) => prev.replace(/\s+$/, ""));
                      setIndentOthers((prev) => prev.replace(/[ \t]+$/, ""));
                    }}
                  />
                  {!indentOthers.trim() && (
                    <div className="error-message">This feild is required</div>
                  )}
                </Form.Group>
              )}
              <ErrorMessage>{renderError(errors.approvedBy)}</ErrorMessage>
            </Form.Group>
            <Form.Group>
              <Form.Label>
                {t("addPosition:approved_on")}{" "}
                <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="date"
                value={approvedOn}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  const value = e.target.value;
                  setApprovedOn(value);

                  setErrors((prev) => ({
                    ...prev,
                    approvedOn: validateApprovedOn(value),
                  }));
                }}
                disabled={isViewMode}
              />

              <ErrorMessage>{renderError(errors.approvedOn)}</ErrorMessage>
            </Form.Group>
          </Col>
        </Row>

        <Row className="g-4">
          <Col md={4}>
            <Form.Label>
              {t("addPosition:department")}{" "}
              <span className="text-danger">*</span>
            </Form.Label>
            <Select
              className="react-select-fixed"
              classNamePrefix="react-select"
              // isDisabled={isViewMode}
              isDisabled={isViewMode || isFieldDisabled("department")}
              value={departmentOptions.find(
                (option) => String(option.value) === String(formData.department)
              )}
              onChange={(selected) =>
                handleInputChange({
                  target: {
                    name: "department",
                    value: selected ? selected.value : "",
                  },
                })
              }
              options={departmentOptions}
            />
            <ErrorMessage>{renderError(errors.department)}</ErrorMessage>
          </Col>

          <Col md={4}>
            <Form.Label>
              {t("addPosition:position")} <span className="text-danger">*</span>
            </Form.Label>
            <Select
              className="react-select-fixed"
              classNamePrefix="react-select"
              // isDisabled={isViewMode}
              isDisabled={isViewMode || isFieldDisabled("position")}
              value={positionOptions.find(
                (option) => String(option.value) === String(formData.position)
              )}
              onChange={(selected) =>
                onPositionSelect(selected ? selected.value : "")
              }
              options={positionOptions}
            />
            <ErrorMessage>{renderError(errors.position)}</ErrorMessage>
          </Col>

          <Col md={4}>
            <Form.Label>
              {t("addPosition:total_vacancies")}{" "}
              <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              name="vacancies"
              maxLength={10}
              placeholder={t("addPosition:enter_vacancies")}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.vacancies}
              onChange={handleInputChange}
              disabled={isViewMode}
            />
            <ErrorMessage>{renderError(errors.vacancies)}</ErrorMessage>
          </Col>

          <Col md={4}>
            <Form.Label>
              {t("addPosition:min_age")} <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              name="minAge"
              type="text"
              placeholder={t("addPosition:min_age")}
              inputMode="numeric"
              value={formData.minAge}
              disabled={isViewMode}
              onChange={(e) => {
                let value = e.target.value;

                // allow only digits
                value = value.replace(/\D/g, "");

                // limit to 2 digits
                if (value.length > 2) return;

                handleInputChange({
                  target: { name: "minAge", value },
                });
              }}
            />
            <ErrorMessage>{renderError(errors.minAge)}</ErrorMessage>
          </Col>
          <Col md={4}>
            <Form.Label>
              {t("addPosition:max_age")}
              <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              name="maxAge"
              type="text"
              placeholder={t("addPosition:max_age")}
              inputMode="numeric"
              disabled={isViewMode}
              value={formData.maxAge}
              onChange={(e) => {
                let value = e.target.value;

                value = value.replace(/\D/g, "");
                if (value.length > 2) return;

                handleInputChange({
                  target: { name: "maxAge", value },
                });
              }}
            />
            <ErrorMessage>{renderError(errors.maxAge)}</ErrorMessage>
          </Col>

          <Col md={4}>
            <Form.Label>
              {t("addPosition:employment_type")}{" "}
              <span className="text-danger">*</span>
            </Form.Label>
            <Select
              classNamePrefix="react-select"
              isDisabled={isViewMode || isFieldDisabled("employmentType")}
              value={employmentTypeOptions.find(
                (option) =>
                  String(option.value) === String(formData.employmentType)
              )}
              onChange={(selected) =>
                handleInputChange({
                  target: {
                    name: "employmentType",
                    value: selected ? selected.value : "",
                  },
                })
              }
              options={employmentTypeOptions}
            />
            <ErrorMessage>{renderError(errors.employmentType)}</ErrorMessage>
          </Col>

          <Col md={4}>
            <Form.Label>
              {t("addPosition:contractual_period")}
              {isContractEmployment && <span className="text-danger">*</span>}
            </Form.Label>
            <Form.Control
              name="contractualPeriod"
              placeholder={
                isContractEmployment
                  ? t("addPosition:enter_contractual_period")
                  : ""
              }
              type="text"
              inputMode="numeric"
              value={isContractEmployment ? formData.contractualPeriod : ""}
              onChange={handleInputChange}
              disabled={
                !isContractEmployment ||
                isViewMode ||
                isFieldDisabled("contractualPeriod")
              }
            />
            <ErrorMessage>{renderError(errors.contractualPeriod)}</ErrorMessage>
          </Col>
          <Col md={4}>
            <Form.Label className="d-flex align-items-center gap-2">
              {t("addPosition:grade_scale")}{" "}
              <span className="text-danger">*</span>
              {selectedGrade && (
                <OverlayTrigger
                  trigger="click"
                  placement="right"
                  overlay={salaryPopover}
                  rootClose
                >
                  <span
                    style={{ cursor: "pointer", color: "#0d6efd" }}
                    title={t("addPosition:view_salary_range")}
                  >
                    <img src={I_icon} alt="info_icon" className="icon-18" />
                  </span>
                </OverlayTrigger>
              )}
            </Form.Label>

            <Select
              className="react-select-fixed"
              classNamePrefix="react-select"
              isDisabled={isViewMode || isFieldDisabled("grade")}
              value={gradeOptions.find(
                (option) => String(option.value) === String(formData.grade)
              )}
              onChange={(selected) =>
                handleInputChange({
                  target: {
                    name: "grade",
                    value: selected ? selected.value : "",
                  },
                })
              }
              options={gradeOptions}
            />
            <ErrorMessage>{renderError(errors.grade)}</ErrorMessage>
          </Col>

          <Col md={4}>
            <Form.Label>{t("addPosition:enable_location_pref")}</Form.Label>
            <Form.Check
              type="switch"
              id="enable-location"
              checked={formData.enableLocation}
              onChange={handleInputChange}
              name="enableLocation"
              disabled={isViewMode}
            />
          </Col>

          <Col md={6}>
            <div className="d-flex justify-content-between align-items-center mb-1 mandedu">
              <Form.Label className="mb-0">
                {t("addPosition:mandatory_education")}{" "}
                <span className="text-danger">*</span>
              </Form.Label>
              <div className="d-flex align-items-center gap-3">
                <Form.Check
                  type="checkbox"
                  className="mancheck"
                  id="hide-school-degrees"
                  label={t("addPosition:is_intermediate_required")}
                  checked={formData.isIntermediateRequired || false}
                  disabled={isViewMode}
                  onChange={(e) => {
                    handleInputChange({
                      target: {
                        name: "isIntermediateRequired",
                        value: e.target.checked,
                      },
                    });
                  }}
                />
                <Button
                  size="sm"
                  disabled={isViewMode}
                  onClick={() => onEducationClick("mandatory")}
                  style={{ borderRadius: "10px" }}
                >
                  {t("addPosition:add")}
                </Button>
              </div>
            </div>
            <Form.Control
              as="textarea"
              placeholder={t("addPosition:enter_mandatory_education")}
              rows={4}
              readOnly
              value={educationData.mandatory.text || ""}
              disabled={isViewMode}
            />
            <ErrorMessage>
              {renderError(errors.mandatoryEducation)}
            </ErrorMessage>
          </Col>

          <Col md={6}>
            <div className="d-flex justify-content-between align-items-center mb-1 mandedu">
              <Form.Label className="mb-0">
                {t("addPosition:preferred_education")}
              </Form.Label>
              <Button
                size="sm"
                disabled={isViewMode}
                onClick={() => onEducationClick("preferred")}
                style={{ borderRadius: "10px" }}
              >
                {t("addPosition:add")}
              </Button>
            </div>
            <Form.Control
              as="textarea"
              placeholder={t("addPosition:enter_preferred_education")}
              rows={4}
              readOnly
              value={educationData.preferred.text || ""}
              disabled={isViewMode}
            />
            <ErrorMessage>
              {renderError(errors.preferredEducation)}
            </ErrorMessage>
          </Col>

          {/* Experience Row logic */}
          {["mandatoryExperience", "preferredExperience"].map((expType) => {
            const isMandatory = expType === "mandatoryExperience";
            const isEducationMode = isMandatory
              ? formData.useMandatoryEducationLevelExperience
              : formData.usePreferredEducationLevelExperience;

            return (
              <Col md={6} key={expType}>
                {/* Header + Toggle */}
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <Form.Label className="mb-0">
                    {isMandatory
                      ? t("addPosition:mandatory_experience")
                      : t("addPosition:preferred_experience")}
                    {isMandatory && <span className="text-danger">*</span>}
                  </Form.Label>

                  <Form.Check
                    type="switch"
                    disabled={isViewMode}
                    label={
                      <span style={{ fontSize: "12px", marginLeft: "6px" }}>
                        {isMandatory
                          ? t(
                              "addPosition:use_mandatory_education_level_experience"
                            )
                          : t(
                              "addPosition:use_preferred_education_level_experience"
                            )}
                      </span>
                    }
                    checked={isEducationMode || false}
                    onChange={(e) => {
                      const isOn = e.target.checked;

                      const toggleField = isMandatory
                        ? "useMandatoryEducationLevelExperience"
                        : "usePreferredEducationLevelExperience";

                      handleInputChange({
                        target: {
                          name: toggleField,
                          value: isOn,
                        },
                      });

                      if (!isOn) {
                        const existing =
                          formData[expType]?.educationLevelExperiences || [];

                        // ✅ KEEP ONLY SAVED (EDIT DATA)
                        const filtered = existing.filter((e) => e.isSaved);

                        handleInputChange({
                          target: {
                            name: `${expType}.educationLevelExperiences`,
                            value: filtered,
                          },
                        });

                        handleInputChange({
                          target: { name: `${expType}.years`, value: "" },
                        });

                        handleInputChange({
                          target: { name: `${expType}.months`, value: "" },
                        });
                      }

                      if (isOn) {
                        const existing =
                          formData[expType]?.educationLevelExperiences;

                        handleInputChange({
                          target: {
                            name: `${expType}.educationLevelExperiences`,
                            value:
                              existing && existing.length > 0
                                ? existing
                                : [
                                    {
                                      educationLevel: "",
                                      years: "",
                                      months: "",
                                      isSaved: false,
                                    },
                                  ],
                          },
                        });
                      }
                    }}
                  />
                </div>

                {/* Toggle Content */}
                {!isEducationMode ? (
                  <>
                    <Row className="g-2 mb-2">
                      <Col md={6}>
                        <Select
                          classNamePrefix="react-select"
                          menuPortalTarget={document.body}
                          menuPosition="fixed"
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          }}
                          value={yearOptions.find(
                            (o) =>
                              String(o.value) ===
                              String(formData[expType].years)
                          )}
                          onChange={(s) =>
                            handleInputChange({
                              target: {
                                name: `${expType}.years`,
                                value: s?.value ?? "",
                              },
                            })
                          }
                          options={yearOptions}
                          isDisabled={isViewMode}
                        />
                      </Col>

                      <Col md={6}>
                        <Select
                          classNamePrefix="react-select"
                          menuPortalTarget={document.body}
                          menuPosition="fixed"
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          }}
                          value={monthOptions.find(
                            (o) =>
                              String(o.value) ===
                              String(formData[expType].months)
                          )}
                          onChange={(s) =>
                            handleInputChange({
                              target: {
                                name: `${expType}.months`,
                                value: s?.value ?? "",
                              },
                            })
                          }
                          options={monthOptions}
                          isDisabled={isViewMode}
                        />
                      </Col>
                    </Row>
                  </>
                ) : (
                  <>
                    <div className="education-level-experience-section">
                      {/* ✅ SINGLE CONTAINER (FIXED) */}
                      <div className="p-1">
                        {/* ✅ ADD BUTTON (UNCHANGED) */}
                        {!isViewMode && (
                          <Button
                            size="sm"
                            variant="none"
                            className="edu-btn"
                            onClick={() => {
                              const current =
                                formData[expType]?.educationLevelExperiences ||
                                [];

                              handleInputChange({
                                target: {
                                  name: `${expType}.educationLevelExperiences`,
                                  value: [
                                    ...current,
                                    {
                                      educationLevel: "",
                                      years: "",
                                      months: "",
                                      isSaved: false,
                                    },
                                  ],
                                },
                              });
                            }}
                          >
                            {t("addPosition:add_education_level_experience")}
                          </Button>
                        )}

                        {(formData[expType]?.educationLevelExperiences?.length >
                        0
                          ? formData[expType].educationLevelExperiences
                          : [
                              {
                                educationLevel: "",
                                years: "",
                                months: "",
                                isSaved: false,
                              },
                            ]
                        ).map((eduExp, index) => {
                          const selected = (
                            formData[expType]?.educationLevelExperiences || []
                          )
                            .map((e) => e.educationLevel)
                            .filter(Boolean);

                          const options = withSelectOption(
                            educationDocuments
                              .filter((doc) => {
                                if (doc.id === eduExp.educationLevel)
                                  return true;
                                return !selected.includes(doc.id);
                              })
                              .map((doc) => ({
                                value: doc.id,
                                label: doc.name,
                              })),
                            t("addPosition:select_qualification")
                          );

                          return (
                            <Row
                              className="g-2 mt-1 align-items-center"
                              key={index}
                            >
                              {/* Qualification */}
                              <Col md={4}>
                                <Select
                                  classNamePrefix="react-select"
                                  menuPortalTarget={document.body}
                                  menuPosition="fixed"
                                  styles={{
                                    menuPortal: (base) => ({
                                      ...base,
                                      zIndex: 9999,
                                    }),
                                  }}
                                  value={options.find(
                                    (o) =>
                                      String(o.value) ===
                                      String(eduExp.educationLevel)
                                  )}
                                  options={options}
                                  isDisabled={isViewMode}
                                  onChange={(s) => {
                                    const updated = [
                                      ...formData[expType]
                                        .educationLevelExperiences,
                                    ];
                                    updated[index].educationLevel =
                                      s?.value || "";

                                    handleInputChange({
                                      target: {
                                        name: `${expType}.educationLevelExperiences`,
                                        value: updated,
                                      },
                                    });
                                  }}
                                />
                              </Col>

                              {/* Years */}
                              <Col md={3}>
                                <Select
                                  classNamePrefix="react-select"
                                  menuPortalTarget={document.body}
                                  menuPosition="fixed"
                                  styles={{
                                    menuPortal: (base) => ({
                                      ...base,
                                      zIndex: 9999,
                                    }),
                                  }}
                                  value={yearOptions.find(
                                    (o) =>
                                      String(o.value) === String(eduExp.years)
                                  )}
                                  options={yearOptions}
                                  isDisabled={isViewMode}
                                  onChange={(s) => {
                                    const updated = [
                                      ...formData[expType]
                                        .educationLevelExperiences,
                                    ];
                                    updated[index].years = s?.value ?? "";

                                    handleInputChange({
                                      target: {
                                        name: `${expType}.educationLevelExperiences`,
                                        value: updated,
                                      },
                                    });
                                  }}
                                />
                              </Col>

                              {/* Months */}
                              <Col md={3}>
                                <Select
                                  classNamePrefix="react-select"
                                  menuPortalTarget={document.body}
                                  menuPosition="fixed"
                                  placeholder={t("addPosition:select_months")}
                                  styles={{
                                    menuPortal: (base) => ({
                                      ...base,
                                      zIndex: 9999,
                                    }),
                                  }}
                                  value={
                                    eduExp.months === "" ||
                                    eduExp.months === null ||
                                    eduExp.months === undefined
                                      ? null
                                      : monthOptions.find(
                                          (o) =>
                                            String(o.value) ===
                                            String(eduExp.months)
                                        )
                                  }
                                  options={monthOptions}
                                  isDisabled={isViewMode}
                                  onChange={(s) => {
                                    const updated = [
                                      ...formData[expType]
                                        .educationLevelExperiences,
                                    ];
                                    updated[index].months = s?.value || "";

                                    handleInputChange({
                                      target: {
                                        name: `${expType}.educationLevelExperiences`,
                                        value: updated,
                                      },
                                    });
                                  }}
                                />
                              </Col>

                              {/* Remove Button */}
                              <Col md={1} className="text-end">
                                {formData[expType].educationLevelExperiences
                                  .length > 1 &&
                                  !isViewMode && (
                                    <Button
                                      size="sm"
                                      variant="none"
                                      onClick={() => {
                                        const updated = [
                                          ...formData[expType]
                                            .educationLevelExperiences,
                                        ];
                                        updated.splice(index, 1);

                                        handleInputChange({
                                          target: {
                                            name: `${expType}.educationLevelExperiences`,
                                            value: updated,
                                          },
                                        });
                                      }}
                                    >
                                      <img
                                        src={delete_icon}
                                        alt="delete_icon"
                                        className="icon-16"
                                      />
                                    </Button>
                                  )}
                              </Col>
                            </Row>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* ✅ ALWAYS SHOW DESCRIPTION */}
                <Form.Control
                  as="textarea"
                  rows={3}
                  className="mt-1"
                  value={formData[expType].description}
                  disabled={isViewMode}
                  placeholder={
                    isMandatory
                      ? t("addPosition:enter_mandatory_experience")
                      : t("addPosition:enter_preferred_experience")
                  }
                  onChange={(e) => {
                    const { valid, value } = validateTitleOnType(
                      e.target.value
                    );

                    if (!valid) {
                      setErrors((prev) => ({
                        ...prev,
                        [expType]: "validation:title_invalid_chars_extended",
                      }));
                      return;
                    }

                    setFormData((prev) => ({
                      ...prev,
                      [expType]: {
                        ...prev[expType],
                        description: value,
                      },
                    }));

                    setErrors((prev) => ({
                      ...prev,
                      [expType]: "",
                    }));
                  }}
                  onBlur={() => {
                    setFormData((prev) => ({
                      ...prev,
                      [expType]: {
                        ...prev[expType],
                        description: normalizeTitle(prev[expType].description),
                      },
                    }));
                  }}
                />

                <ErrorMessage>{renderError(errors[expType])}</ErrorMessage>
              </Col>
            );
          })}

          <Col md={6}>
            <Form.Label>
              {t("addPosition:roles_responsibilities")}{" "}
              <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              disabled={isViewMode}
              rows={5}
              maxLength={2000}
              name="responsibilities"
              placeholder={t("addPosition:enter_roles")}
              value={formData.responsibilities}
              onChange={(e) => {
                const { valid, value, message } = validateTitleOnType(
                  e.target.value
                );

                if (!valid) {
                  setErrors((prev) => ({
                    ...prev,
                    responsibilities: message,
                  }));
                  return;
                }

                setFormData((prev) => ({
                  ...prev,
                  responsibilities: value,
                }));

                setErrors((prev) => ({
                  ...prev,
                  responsibilities: "",
                }));
              }}
              onBlur={() => {
                setFormData((prev) => ({
                  ...prev,
                  responsibilities: normalizeTitle(prev.responsibilities),
                }));
              }}
            />
            <ErrorMessage>{renderError(errors.responsibilities)}</ErrorMessage>
          </Col>
          <Col md={3}>
            <Form.Label>
              {t("addPosition:medical_required")}{" "}
              <span className="text-danger"></span>
            </Form.Label>
            <Select
              classNamePrefix="react-select"
              isDisabled={true}
              value={[
                { value: "yes", label: t("common:yes") },
                { value: "no", label: t("common:no") },
              ].find((option) => option.value === formData.medicalRequired)}
              options={[
                { value: "yes", label: t("common:yes") },
                { value: "no", label: t("common:no") },
              ]}
            />
            <ErrorMessage>{renderError(errors.medicalRequired)}</ErrorMessage>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default PositionForm;
