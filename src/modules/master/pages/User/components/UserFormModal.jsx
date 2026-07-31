import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import ErrorMessage from "../../../../../shared/components/ErrorMessage";
import { validateUserForm } from "../../../../../shared/utils/user-validations";
import UserImportModal from "./UserImportModal";

import {
  handleValidatedInput,
  INPUT_PATTERNS,
} from "../../../../../shared/utils/inputHandlers";

const EMPTY_FORM = {
  role: "",
  fullName: "",
  email: "",
  interviewCenterId: "",
  password: "",
};

const UserFormModal = ({
  show,
  onHide,
  onSave,
  mode,
  selectedUser,
  existingUsers = [],
  interviewCentres = [],
  fetchUsers,
  bulkAddUsers,
  downloadUserTemplate,
  loading,
  // Only orgs configured with defaultLoginMethod = EMAIL_PASSWORD need this;
  // Entra orgs keep working exactly as before (no password field/requirement).
  requirePassword = false,
}) => {
  const { t } = useTranslation(["user", "validation"]);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("manual");
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (!show) return;

    setErrors({});
    setActiveTab("manual");

    if (mode === "edit" || mode === "view") {
      setFormData({
        role: selectedUser?.role || "",
        fullName: selectedUser?.name || "",
        email: selectedUser?.email || "",
        interviewCenterId: selectedUser?.interviewCenterId || "",
        password: "",
      });
    } else {
      setFormData(EMPTY_FORM);
    }
  }, [show, mode, selectedUser]);
  /* ========================= INPUT HANDLER ========================= */
  const handleInputChange = (e) => {
    let { name, value } = e.target;

    if (name === "email") {
      value = value.toLowerCase().trim();
    }

    setErrors((prev) => {
      const copy = { ...prev };
      if (copy[name]) delete copy[name];
      return copy;
    });

    setFormData((prev) => {
      let updated = { ...prev, [name]: value };

      // ✅ CLEAR centre when role changes
      if (name === "role") {
        if (value !== "Zonal_HR") {
          updated.interviewCenterId = "";
        }
      }

      return updated;
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
     if (isSubmitting) return;

    const { valid, errors: vErrors } = validateUserForm(formData, {
      existing: existingUsers,
      currentId: selectedUser?.userId,
      skipEmailCheck: mode === "edit",
      requirePassword: requirePassword && mode === "add",
    });

    if (!valid) {
      setErrors(vErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
    } catch (err) {
      // keep behavior same: let caller handle errors
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      className="user-modal"
    >
      <Modal.Header closeButton className="modal-header-custom">
        <Modal.Title>
          {mode === "view"
            ? t("viewUser")
            : mode === "edit"
              ? t("editUser")
              : t("addUser")}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        {/* Manual / Import Tabs */}
        {mode === "add" && (
          <div className="tab-buttons mb-4">
            <Button
              className={`tab-button ${activeTab === "manual" ? "active" : ""}`}
              variant={activeTab === "manual" ? "light" : "outline-light"}
              onClick={() => setActiveTab("manual")}
            >
              {t("manual_entry")}
            </Button>

            <Button
              className={`tab-button ${activeTab === "import" ? "active" : ""}`}
              variant={activeTab === "import" ? "light" : "outline-light"}
              onClick={() => setActiveTab("import")}
            >
              {t("import_file")}
            </Button>
          </div>
        )}
        {activeTab === "manual" ? (
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label>
                  {t("role")} <span className="text-danger">*</span>
                </Form.Label>

                <Form.Select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  disabled={mode === "view"}
                >
                  <option value="">{t("select_role")}</option>
                  <option value="Admin">{t("admin")}</option>
                  <option value="Zonal_HR">{t("zonal Hr")}</option>
                  <option value="Recruiter">{t("recruiter")}</option>
                  <option value="Committee_Member">
                    {t("Committee Member")}
                  </option>
                </Form.Select>
                <ErrorMessage>{errors.role}</ErrorMessage>
              </Col>

              

              <Col md={6}>
                <Form.Label>
                  {t("fullName")} <span className="text-danger">*</span>
                </Form.Label>

                <Form.Control
                  name="fullName"
                  value={formData.fullName}
                  disabled={mode === "view"}
                  onChange={(e) =>
                    handleValidatedInput({
                      e,
                      fieldName: "fullName",
                      setErrors,
                      pattern: INPUT_PATTERNS.ALPHA_SPACE,
                      errorMessage: t("validation:no_special_chars"),
                      onValidChange: (value) =>
                        handleInputChange({
                          target: { name: "fullName", value },
                        }),
                    })
                  }
                />
                <ErrorMessage>{errors.fullName}</ErrorMessage>
              </Col>

              <Col md={6}>
                <Form.Label>
                  {t("email")} <span className="text-danger">*</span>
                </Form.Label>

                <Form.Control
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={mode === "view" || mode === "edit"}
                />
                <ErrorMessage>{errors.email}</ErrorMessage>
              </Col>

              {requirePassword && mode === "add" && (
                <Col md={6}>
                  <Form.Label>
                    {t("password")} <span className="text-danger">*</span>
                  </Form.Label>

                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    autoComplete="new-password"
                    onChange={handleInputChange}
                  />
                  <ErrorMessage>{errors.password}</ErrorMessage>
                </Col>
              )}

              {formData.role === "Zonal_HR" && (
                <Col md={6}>
                  <Form.Label>
                    {t("interview_centre")} <span className="text-danger">*</span>
                  </Form.Label>

                  <Form.Select
                    name="interviewCenterId"
                    value={formData.interviewCenterId}
                    onChange={handleInputChange}
                  >
                  <option value="">{t("select_interview_centre")}</option>
                    {interviewCentres.map((centre) => (
                      <option
                        key={centre.interviewCentreId}
                        value={centre.interviewCentreId}
                      >
                        {centre.interviewCentre}
                      </option>
                    ))}
                  </Form.Select>

                  <ErrorMessage>{errors.interviewCenterId}</ErrorMessage>
                </Col>
              )}

              
            </Row>

            <Modal.Footer className="modal-footer-custom px-0 pt-3 pb-0">
              {/* View Mode */}
              {mode === "view" ? (
                <Button variant="outline-secondary" onClick={onHide}>
                  {t("close")}
                </Button>
              ) : (
                <>
                  <Button variant="outline-secondary" onClick={onHide}>
                    {t("cancel")}
                  </Button>

                  <Button variant="primary" type="submit" disabled={isSubmitting}>
                    {mode === "edit" ? t("update") : t("save")}
                  </Button>
                </>
              )}
            </Modal.Footer>
          </Form>
        ) : (
          <UserImportModal
            onClose={onHide}
            bulkAddUsers={bulkAddUsers}
            downloadUserTemplate={downloadUserTemplate}
            loading={loading}
            t={t}
          />
        )}
      </Modal.Body>
    </Modal>
  );
};

export default UserFormModal;
