import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import React, { useState, useEffect } from "react";
import "../../../style/css/EducationModal.css";
import {
  validateEducationModal,
  validateCertificationGroups,
} from "../validations/validateEducationModal";
import masterApiService from "../../master/services/masterApiService";
import ErrorMessage from "../../../shared/components/ErrorMessage";
import delete_icon from "../../../assets/delete_icon.png";
import { useTranslation } from "react-i18next";
import Select from "react-select";

const createRow = () => ({
  educationTypeId: "",
  educationQualificationsId: "",
  specializationId: "",
   group: "",   
  duration: "",
  percentage: "",
});

const createGroup = () => ({
  educations: [createRow()],
});

const createCertRow = () => ({
  certificationId: "",
});

const createCertGroup = () => ({
  certifications: [createCertRow()],
});

const percentagePattern = /^\d{0,3}(?:\.\d{0,2})?$/;

export default function EducationModal({
  show,
  mode,
  initialData,
  onHide,
  onSave,
  educationTypes = [],
  qualifications = [],
  specializations = [],
  certifications = [],
  isIntermediateRequired = false,
}) {
  const { t } = useTranslation(["addPosition", "common", "validation"]);
  const [errors, setErrors] = useState({});
  const [groups, setGroups] = useState([createGroup()]);
  const [certGroups, setCertGroups] = useState([createCertGroup()]);
   const [educationGroups, setEducationGroups] = useState([]);


  useEffect(() => {
    if (!show) return;

    // The groups from mapEduRulesToModalData have educations property
    setGroups(
      initialData?.groups?.length
        ? JSON.parse(JSON.stringify(initialData.groups))
        : [createGroup()]
    );

    setCertGroups(
      initialData?.certGroups?.length
        ? JSON.parse(JSON.stringify(initialData.certGroups))
        : [createCertGroup()]
    );
  }, [show, initialData, mode]);
  useEffect(() => {
    console.log(
      "EducationModal isIntermediateRequired:",
      isIntermediateRequired
    );
  }, [isIntermediateRequired]);

  
  useEffect(() => {
  const fetchEducationGroups = async () => {
    try {
      const res = await masterApiService.getEducationGroupes();

      setEducationGroups(
        (res.data || []).map((g) => ({
          id: g.educationGroupId,
          label: g.groupName,
        }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  fetchEducationGroups();
}, []);

  const getLabel = (list, id, key = "label") =>
    list.find((i) => i.id === id)?.[key] || "";

const getSpecializationsForDegree = (degreeId) => {
  if (!degreeId) return [];

  const degree = qualifications.find(
    (q) => String(q.id) === String(degreeId)
  );

  const degreeName = degree?.name?.trim().toLowerCase();

  // Use Education Groups API for Any Graduation / Any Post-Graduation
  if (
    degreeName === "any graduation" ||
    degreeName === "any post-graduation"
  ) {
    return educationGroups;
  }

  // Existing logic
  return specializations
    .filter(
      (s) =>
        s.educationQualificationsId === degreeId &&
        s.label?.toLowerCase() !== "others"
    )
    .sort((a, b) =>
      a.label.localeCompare(b.label, undefined, {
        sensitivity: "base",
      })
    );
};

const degreeText = groups
  .map((group) => {
    if (!group || !Array.isArray(group.educations)) return null;

    const groupText = group.educations
      .filter((r) => r.educationTypeId && r.educationQualificationsId)
      .map((r) => {
        const type = getLabel(educationTypes, r.educationTypeId);
        const degree = getLabel(
          qualifications,
          r.educationQualificationsId,
          "name"
        );

        const degreeObj = qualifications.find(
          (q) => String(q.id) === String(r.educationQualificationsId)
        );

        const degreeName = degreeObj?.name?.trim().toLowerCase();

        const isAnyDegree =
          degreeName === "any graduation" ||
          degreeName === "any post-graduation";

        const validSpecs = getSpecializationsForDegree(
          r.educationQualificationsId
        );

        const spec = isAnyDegree
          ? validSpecs.find((s) => String(s.id) === String(r.group))?.label || ""
          : validSpecs.find(
              (s) => String(s.id) === String(r.specializationId)
            )?.label || "";



 

        let extra = [];

        if (r.duration) extra.push(`Duration: ${r.duration} Year(s)`);
        if (r.percentage) extra.push(`Percentage: ${r.percentage}%`);

        const extraText = extra.length ? ` - ${extra.join(", ")}` : "";

        return `${type} ${degree}${spec ? ` in ${spec}` : ""}${extraText}`;
      })
      .join(" AND ");

    return groupText || null;
  })
  .filter(Boolean)
  .join("\nOR\n");

  // const addRow = () => {
  //     setRows([...rows, createRow(false)]);
  // };
  const addGroup = () => {
    setGroups([...groups, createGroup()]);
  };

  const addRow = (groupIndex) => {
    const copy = [...groups];
    copy[groupIndex].educations.push(createRow());
    setGroups(copy);
  };

  const updateRow = (gIdx, rIdx, field, value) => {
    const copy = [...groups];
    copy[gIdx].educations[rIdx][field] = value;

    if (field === "educationQualificationsId") {
      copy[gIdx].educations[rIdx].specializationId = "";
    }

    setGroups(copy);

    // ✅ CLEAR ERROR HERE
    const flatIndex =
      groups.slice(0, gIdx).reduce((acc, g) => acc + g.educations.length, 0) +
      rIdx;

    setErrors((prev) => {
      const updated = { ...prev };

      // CLEAR ROW ERROR
      if (updated.rows?.[flatIndex]) {
        updated.rows = [...updated.rows];

        updated.rows[flatIndex] = {
          ...updated.rows[flatIndex],
          [field]: "",
        };
      }

      // CLEAR GROUP ERROR
      if (updated.groupErrors?.[gIdx]) {
        updated.groupErrors = {
          ...updated.groupErrors,
        };

        delete updated.groupErrors[gIdx];

        // REMOVE EMPTY OBJECT
        if (Object.keys(updated.groupErrors).length === 0) {
          delete updated.groupErrors;
        }
      }

      return updated;
    });
  };

  const removeRow = (gIdx, rIdx) => {
    const copy = [...groups];

    if (copy[gIdx].educations.length === 1) return;

    copy[gIdx].educations.splice(rIdx, 1);
    setGroups(copy);

    // ✅ CLEAR ERRORS PROPERLY
    setErrors((prev) => {
      if (!prev.rows) return prev;

      const updatedRows = [...prev.rows];

      // remove the same index error
      updatedRows.splice(rIdx, 1);

      return {
        ...prev,
        rows: updatedRows,
      };
    });
  };
  const removeGroup = (gIdx) => {
    if (groups.length === 1) return;

    setGroups(groups.filter((_, i) => i !== gIdx));
  };

  // Certification group functions
  const addCertGroup = () => {
    setCertGroups([...certGroups, createCertGroup()]);
  };

  const addCertRow = (certGroupIndex) => {
    const copy = [...certGroups];
    // Initialize certifications if it doesn't exist
    if (!copy[certGroupIndex].certifications) {
      copy[certGroupIndex].certifications = [];
    }
    copy[certGroupIndex].certifications.push(createCertRow());
    setCertGroups(copy);
  };

  const updateCertRow = (cgIdx, crIdx, field, value) => {
    const copy = [...certGroups];

    if (!copy[cgIdx].certifications) {
      copy[cgIdx].certifications = [];
    }

    copy[cgIdx].certifications[crIdx][field] = value;

    setCertGroups(copy);

    // ✅ CLEAR CERT GROUP ERRORS
    setErrors((prev) => {
      const updated = { ...prev };

      if (updated.certGroupErrors?.[cgIdx]) {
        updated.certGroupErrors = {
          ...updated.certGroupErrors,
        };

        delete updated.certGroupErrors[cgIdx];

        // REMOVE EMPTY OBJECT
        if (Object.keys(updated.certGroupErrors).length === 0) {
          delete updated.certGroupErrors;
        }
      }

      return updated;
    });
  };
  const removeCertRow = (cgIdx, crIdx) => {
    const copy = [...certGroups];

    // Initialize certifications if it doesn't exist
    if (!copy[cgIdx].certifications) {
      copy[cgIdx].certifications = [];
    }

    if (copy[cgIdx].certifications.length === 1) {
      // reset instead of delete
      copy[cgIdx].certifications[0] = createCertRow();
    } else {
      copy[cgIdx].certifications.splice(crIdx, 1);
    }

    setCertGroups(copy);
  };

  const removeCertGroup = (cgIdx) => {
    if (certGroups.length === 1) return;

    setCertGroups(certGroups.filter((_, i) => i !== cgIdx));
  };

  const certText = certGroups
    .map((certGroup) => {
      // Check if certGroup has certifications property and it's an array
      if (!certGroup || !Array.isArray(certGroup.certifications)) {
        return null;
      }

      const groupText = certGroup.certifications
        .filter((cr) => cr.certificationId)
        .map((cr) => {
          const cert = certifications.find((c) => c.id === cr.certificationId);
          return cert ? cert.name : "";
        })
        .filter(Boolean)
        .join(" AND ");

      return groupText ? groupText : null;
    })
    .filter(Boolean)
    .join("\nOR\n");

  let finalText = "";

  if (degreeText) {
    finalText += `Education Requirements: \n${degreeText}\n`;
    finalText += `Certifications: ${certText || "None"}`;
  } else if (certText) {
    finalText += `Certifications: ${certText}`;
  }

  const filteredCertifications = (certGroup, crIdx) => {
    return certifications
      .filter((c) => c.name?.toLowerCase() !== "other")
      .filter((c) => {
        // Filter out certifications already selected in other rows within the same group
        const alreadySelected = (certGroup.certifications || []).some(
          (certRow, index) =>
            index !== crIdx && certRow.certificationId === c.id
        );
        return !alreadySelected;
      })
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
  };
  // const filteredQualifications = qualifications
  //   .filter((q) => q.name?.toLowerCase() !== "others")
  //   .sort((a, b) =>
  //     a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  //   );

  const filteredQualifications = qualifications
    .filter((q) => q.name?.toLowerCase() !== "others")
    .filter((q) => {
      const name = q.name?.trim().toLowerCase();

      if (isIntermediateRequired) {
        return !(
          name === "intermediate board" ||
          name === "icse (+2)" ||
          name === "cbse (+2)" ||
          name.startsWith("diploma")
        );
      }

      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleClose = () => {
    setErrors({});
    setGroups([createGroup()]);
    setCertGroups([createCertGroup()]);
    onHide();
  };



  

  const validateModalData = () => {
    const allRows = groups.flatMap((g) => g.educations);

    const validationErrors = validateEducationModal({
      rows: allRows,
      mode,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return false;
    }

    const filledRows = allRows.filter((r) => r.educationTypeId && r.educationQualificationsId);

    if (mode === "mandatory" && filledRows.length === 0) {
      setErrors({
        rows: { _error: "validation:degree_required" },
      });
      return false;
    }

    return true;
  };
  const buildEducations = (group) => {
    const hasValid = group.educations.some((r) => r.educationTypeId && r.educationQualificationsId);

    if (!hasValid) return [createRow()];

    return group.educations
      .filter((r) => r.educationTypeId && r.educationQualificationsId)
.map((r) => {
  const validSpecs = getSpecializationsForDegree(r.educationQualificationsId);

  const degree = qualifications.find(
    (q) => String(q.id) === String(r.educationQualificationsId)
  );

  const degreeName = degree?.name?.trim().toLowerCase();

  const isAnyDegree =
    degreeName === "any graduation" ||
    degreeName === "any post-graduation";

  return {
    educationTypeId: r.educationTypeId,
    educationQualificationsId: r.educationQualificationsId,

    specializationId: isAnyDegree
      ? ""
      : (validSpecs.some((s) => s.id === r.specializationId)
          ? r.specializationId
          : null),

    group: isAnyDegree ? (r.group || "") : "",

    duration: r.duration,
    percentage: r.percentage,
  };
});
      
  };
  const buildCertifications = (group) => {
    const hasValid = (group.certifications || []).some((c) => c.certificationId);

    if (!hasValid) return [createCertRow()];

    return group.certifications
      .filter((c) => c.certificationId)
      .map((c) => ({
        certificationId: c.certificationId,
      }));
  };
  const buildFinalText = () => {
    return [
      degreeText ? `Education Requirements: ${degreeText}` : "",
      certText ? `Certifications: ${certText}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  };
  const buildEducationPayload = () => {
    return {
      groups: groups.map((group) => ({
        educations: buildEducations(group),
      })),
      certGroups: certGroups.map((group) => ({
        certifications: buildCertifications(group),
      })),
      text: buildFinalText(),
    };
  };










  const isValidPercentage = (value) => {
    if (typeof value !== "string" || value.length > 6) return false; // DoS protection
    return percentagePattern.test(value);
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="xl"
      scrollable
      centered
      className="edu-modal"
    >
      <Modal.Header closeButton className="edu-modal-header">
        <Modal.Title className="f16 bluecol">
          {mode === "mandatory"
            ? t("addPosition:add_mandatory_education")
            : t("addPosition:add_preferred_education")}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {groups.map((group, gIdx) => (
          <React.Fragment key={gIdx}>
            <div className="group-box">
              <div className="group-header edugrp-header">
                <strong>
                  {t("addPosition:education_group")} {gIdx + 1}
                </strong>
                {groups.length > 1 && (
                  <Button
                    onClick={() => removeGroup(gIdx)}
                    disabled={groups.length === 1}
                    variant="none"
                  >
                    {/* Delete Group */}
                    <img
                      src={delete_icon}
                      alt="delete_icon"
                      className="icon-16"
                    />
                  </Button>
                )}
              </div>

              {(group && Array.isArray(group.educations)
                ? group.educations
                : []
              ).map((row, rIdx) => {
                // ✅ ADD THIS (VERY IMPORTANT)
                const flatIndex =
                  groups
                    .slice(0, gIdx)
                    .reduce(
                      (acc, g) =>
                        acc +
                        (g && Array.isArray(g.educations)
                          ? g.educations.length
                          : 0),
                      0
                    ) + rIdx;

                return (
                  <Row key={rIdx} className="mb-3 align-items-center">
                    {/* ✅ Education Type */}
                    <Col md={2}>
                      <Select
                        classNamePrefix="react-select"
                        value={
                          [
                            { value: "", label: t("addPosition:select_type") }, // ✅ ADD THIS
                            ...educationTypes.map((t) => ({
                              value: t.id,
                              label: t.label,
                            })),
                          ].find(
                            (opt) =>
                              String(opt.value) === String(row.educationTypeId)
                          ) || null
                        }
                        onChange={(selected) =>
                          updateRow(
                            gIdx,
                            rIdx,
                            "educationTypeId",
                            selected?.value ?? ""
                          )
                        }
                        options={[
                          { value: "", label: t("addPosition:select_type") }, // ✅ ADD THIS
                          ...educationTypes.map((t) => ({
                            value: t.id,
                            label: t.label,
                          })),
                        ]}
                        placeholder="Select Type"
                      />
                      <div className="error-space">
                        <ErrorMessage>
                          {errors.rows?.[flatIndex]?.educationTypeId &&
                            t(errors.rows[flatIndex].educationTypeId)}
                        </ErrorMessage>
                      </div>
                    </Col>

                    {/* ✅ Qualification */}
                    <Col md={2}>
                      <Select
                        classNamePrefix="react-select"
                        styles={{
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                        }}
                        value={
                          [
                            {
                              value: "",
                              label: t("addPosition:select_degree"),
                            },
                            ...filteredQualifications.map((q) => ({
                              value: q.id,
                              label: q.name,
                            })),
                          ].find(
                            (opt) =>
                              String(opt.value) ===
                              String(row.educationQualificationsId)
                          ) || null
                        }
                        onChange={(selected) =>
                          updateRow(
                            gIdx,
                            rIdx,
                            "educationQualificationsId",
                            selected?.value ?? ""
                          )
                        }
                        options={[
                          { value: "", label: t("addPosition:select_degree") },
                          ...filteredQualifications.map((q) => ({
                            value: q.id,
                            label: q.name,
                          })),
                        ]}
                        placeholder="Select Degree"
                      />
                      <div className="error-space">
                        <ErrorMessage>
                          {errors.rows?.[flatIndex]
                            ?.educationQualificationsId &&
                            t(errors.rows[flatIndex].educationQualificationsId)}
                        </ErrorMessage>
                      </div>
                    </Col>


                      {/* ✅ Specialization */}
                      <Col md={3}>
                        <Select
                          classNamePrefix="react-select"
                          key={row.educationQualificationsId}
                     value={(() => {
  const degree = qualifications.find(
    (q) => String(q.id) === String(row.educationQualificationsId)
  );

  const degreeName = degree?.name?.trim().toLowerCase();

  const isAnyDegree =
    degreeName === "any graduation" ||
    degreeName === "any post-graduation";

  const selectedValue = isAnyDegree
    ? row.group
    : row.specializationId;

  return (
    [
    {
  value: "",
  label: isAnyDegree
    ? t("addPosition:select_group")
    : t("addPosition:select_specialization"),
},
      ...getSpecializationsForDegree(row.educationQualificationsId).map((s) => ({
        value: s.id,
        label: s.label,
      })),
    ].find((opt) => String(opt.value) === String(selectedValue)) || null
  );
})()}
                          // onChange={(selected) =>
                          //   updateRow(gIdx, rIdx, "specializationId", selected?.value ?? "")
                          // }
                          onChange={(selected) => {
  const degree = qualifications.find(
    (q) => String(q.id) === String(row.educationQualificationsId)
  );

  const degreeName = degree?.name?.trim().toLowerCase();

  const isAnyDegree =
    degreeName === "any graduation" ||
    degreeName === "any post-graduation";

  if (isAnyDegree) {
    updateRow(gIdx, rIdx, "group", selected?.value ?? "");
    updateRow(gIdx, rIdx, "specializationId", "");
  } else {
    updateRow(gIdx, rIdx, "specializationId", selected?.value ?? "");
    updateRow(gIdx, rIdx, "group", "");
  }
}}
                     options={[
  {
    value: "",
    label:
      (() => {
        const degree = qualifications.find(
          (q) => String(q.id) === String(row.educationQualificationsId)
        );

        const degreeName = degree?.name?.trim().toLowerCase();

        return degreeName === "any graduation" ||
          degreeName === "any post-graduation"
          ? t("addPosition:select_group")
          : t("addPosition:select_specialization");
      })(),
  },
  ...getSpecializationsForDegree(row.educationQualificationsId).map((s) => ({
    value: s.id,
    label: s.label,
  })),
]}
                        placeholder={
  (() => {
    const degree = qualifications.find(
      (q) => String(q.id) === String(row.educationQualificationsId)
    );

    const degreeName = degree?.name?.trim().toLowerCase();

    return degreeName === "any graduation" ||
      degreeName === "any post-graduation"
      ? t("addPosition:select_group")
      : t("addPosition:select_specialization");
  })()
}
       />
                      <div className="error-space">
                        <ErrorMessage>
                          {errors.rows?.[flatIndex]?.specializationId &&
                            t(errors.rows[flatIndex].specializationId)}
                        </ErrorMessage>
                      </div>
                    </Col>

                    {/* ✅ Duration */}
                    <Col md={2}>
                      <Form.Control
                        type="number"
                        placeholder={t("addPosition:duration_placeholder")}
                        value={row.duration}
                        min="0"
                        step="1"
                        onKeyDown={(e) => {
                          if (["e", "E", "+", "-", "."].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        onInput={(e) => {
                          e.target.value = e.target.value.replace(
                            /[^0-9]/g,
                            ""
                          );
                        }}
                        onChange={(e) =>
                          updateRow(gIdx, rIdx, "duration", e.target.value)
                        }
                      />
                      <div className="error-space">
                        <ErrorMessage>
                          {errors.rows?.[flatIndex]?.duration &&
                            t(errors.rows[flatIndex].duration)}
                        </ErrorMessage>
                      </div>
                    </Col>

                    {/* ✅ Percentage */}
                    <Col md={2}>
                      <Form.Control
                        type="text"
                        inputMode="decimal"
                        placeholder="%"
                        value={row.percentage}
                        onChange={(e) => {
                          let value = e.target.value;

                          //if (!/^[0-9]*\.?[0-9]*$/.test(value)) return;
                          if (!isValidPercentage(value)) return;

                          const parts = value.split(".");
                          if (parts[1]?.length > 2) return;

                          updateRow(gIdx, rIdx, "percentage", value);
                        }}
                      />
                      <div className="error-space">
                        <ErrorMessage>
                          {errors.rows?.[flatIndex]?.percentage &&
                            t(errors.rows[flatIndex].percentage)}
                        </ErrorMessage>
                      </div>
                    </Col>

                    {/* ✅ Delete */}
                    <Col md={1}>
                      {group.educations.length > 1 && (
                        <Button
                          variant="none"
                          className="delbtn"
                          onClick={() => removeRow(gIdx, rIdx)}
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
              {errors.groupErrors?.[gIdx] && (
                <div className="mt-2">
                  <ErrorMessage>{t(errors.groupErrors[gIdx])}</ErrorMessage>
                </div>
              )}
              <Button
                variant="none"
                size="sm"
                onClick={() => addRow(gIdx)}
                className="edu-btn"
              >
                {t("addPosition:add_degree")}
              </Button>
            </div>
            {gIdx < groups.length - 1 && (
              <div className="or-divider">( {t("addPosition:or")} )</div>
            )}
          </React.Fragment>
        ))}

        <Button className="btn-header" variant="none" onClick={addGroup}>
          {" "}
          {t("addPosition:add_group")}
        </Button>
        {errors.rows?._error && (
          <div className="mt-2">
            <ErrorMessage>{t(errors.rows._error)}</ErrorMessage>
          </div>
        )}

        {/* <Button variant="none" onClick={addRow} className="edu-btn">
                    {t("addPosition:add_degree")}
                </Button>  */}

        <Col md={12} className="mt-4">
          <h6 className="f14 bluecol">
            {t("addPosition:certifications_optional")}
          </h6>

          {certGroups.map((certGroup, cgIdx) => (
            <React.Fragment key={cgIdx}>
              <div className="group-box">
                <div className="group-header edugrp-header">
                  <strong>
                    {t("addPosition:certification_group")} {cgIdx + 1}
                  </strong>
                  {certGroups.length > 1 && (
                    <Button
                      onClick={() => removeCertGroup(cgIdx)}
                      disabled={certGroups.length === 1}
                      variant="none"
                    >
                      {/* Delete Group */}
                      <img
                        src={delete_icon}
                        alt="delete_icon"
                        className="icon-16"
                      />
                    </Button>
                  )}
                </div>

                {(certGroup && Array.isArray(certGroup.certifications)
                  ? certGroup.certifications
                  : []
                ).map((certRow, crIdx) => (
                  <Row key={crIdx} className="mb-2 align-items-center">
                    <Col md={11}>
                      <Select
                        classNamePrefix="react-select"
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        styles={{
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                        }}
                        value={[
                          {
                            value: "",
                            label: t("common:select_certification"),
                          },
                          ...filteredCertifications(certGroup, crIdx).map(
                            (c) => ({
                              value: c.id,
                              label: c.name,
                            })
                          ),
                        ].find(
                          (option) =>
                            String(option.value) ===
                            String(certRow.certificationId)
                        )}
                        onChange={(selected) => {
                          updateCertRow(
                            cgIdx,
                            crIdx,
                            "certificationId",
                            selected ? selected.value : ""
                          );
                        }}
                        options={[
                          {
                            value: "",
                            label: t("common:select_certification"),
                          },
                          ...filteredCertifications(certGroup, crIdx).map(
                            (c) => ({
                              value: c.id,
                              label: c.name,
                            })
                          ),
                        ]}
                      />
                    </Col>

                    <Col md={1} className="">
                      {certGroup.certifications.length > 1 && (
                        <Button
                          variant="link"
                          className="p-0 text-danger"
                          onClick={() => removeCertRow(cgIdx, crIdx)}
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
                ))}
                {errors.certGroupErrors?.[cgIdx] && (
                  <div className="mt-2">
                    <ErrorMessage>
                      {t(errors.certGroupErrors[cgIdx])}
                    </ErrorMessage>
                  </div>
                )}
                <Button
                  variant="none"
                  size="sm"
                  onClick={() => addCertRow(cgIdx)}
                  className="mb-3 edu-btn"
                >
                  {t("addPosition:add_certification")}
                </Button>
              </div>
              {cgIdx < certGroups.length - 1 && (
                <div className="or-divider">( {t("addPosition:or")} )</div>
              )}
            </React.Fragment>
          ))}
        </Col>

        <Button className="btn-header" variant="none" onClick={addCertGroup}>
          {t("addPosition:add_certification_group")}
        </Button>

        <div className="mt-4 p-3 bg-light border rounded result">
          <span className="f14">{t("addPosition:result_preview")}</span>
          <pre className="mt-2 mb-0">{finalText}</pre>
        </div>
      </Modal.Body>

      <Modal.Footer className="edu-modal-footer">
        <Button
          variant="outline-secondary"
          className="cancelbtn"
          onClick={onHide}
        >
          {t("common:cancel")}
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            const validationErrors = validateEducationModal({
              groups,
              mode,
            });
            const certValidationErrors =
              validateCertificationGroups(certGroups);

            const mergedErrors = {
              ...validationErrors,
              ...certValidationErrors,
            };

            if (Object.keys(mergedErrors).length > 0) {
              setErrors(mergedErrors);
              return;
            }
            const filledRows = groups
              .flatMap((g) => g.educations)
              .filter((r) => r.educationTypeId && r.educationQualificationsId);

            // 🚨 Only enforce required rule in mandatory mode
            if (mode === "mandatory" && filledRows.length === 0) {
              setErrors({
                rows: { _error: "validation:degree_required" },
              });
              return;
            }

            setErrors({});

            const cleanText = [
              degreeText ? `Education Requirements: ${degreeText}` : "",
              certText ? `Certifications: ${certText}` : "",
            ]
              .filter(Boolean)
              .join("\n");

            const payload = {
              groups: groups.map((group) => ({
                educations: group.educations.some(
                  (r) => r.educationTypeId || r.educationQualificationsId
                )
                  ? group.educations
                      .filter(
                        (r) => r.educationTypeId && r.educationQualificationsId
                      )
                      .map((r) => {
                         const validSpecs = getSpecializationsForDegree(r.educationQualificationsId);
                        const isValidSpec = validSpecs.some((s) => s.id === r.specializationId);
const degree = qualifications.find(
  (q) => String(q.id) === String(r.educationQualificationsId)
);

const degreeName = degree?.name?.trim().toLowerCase();

const isAnyDegree =
  degreeName === "any graduation" ||
  degreeName === "any post-graduation";
                      return {
  educationTypeId: r.educationTypeId,
  educationQualificationsId: r.educationQualificationsId,

  specializationId: isAnyDegree
    ? ""
    : (isValidSpec ? r.specializationId : null),

  group: isAnyDegree ? (r.group || "") : "",

  duration: r.duration,
  percentage: r.percentage,
};
                      })
                  : [createRow()], // 👈 THIS LINE FIXES YOUR ISSUE
              })),
              certGroups: certGroups.map((certGroup) => ({
                certifications: (certGroup.certifications || []).some(
                  (cr) => cr.certificationId
                )
                  ? certGroup.certifications
                      .filter((cr) => cr.certificationId)
                      .map((cr) => ({
                        certificationId: cr.certificationId,
                      }))
                  : [createCertRow()],
              })),

              text: cleanText,
            };

            onSave(payload);
            onHide();
          }}
        >
          {t("common:save")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
