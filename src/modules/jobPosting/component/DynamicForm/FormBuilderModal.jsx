import React from "react";
import { Modal, Button } from "react-bootstrap";
import FormBuilder from "./FormBuilder";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const FormBuilderModal = ({ show, onHide, value, onSave, isViewMode = false }) => {
  const [saveForm, setSaveForm] = useState(null);
  const { t } = useTranslation("jobPostingsList");

  const handleSave = (schema) => {
    if (isViewMode) return;

    onSave(schema);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title className="f16 bluecol">{t("jobPostingsList:configure_additional")}</Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
        <FormBuilder
          initialSchema={value}
          onSave={handleSave}
          isViewMode={isViewMode}
          registerSave={setSaveForm}
        />
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          {t("jobPostingsList:close")}
        </Button>

        {!isViewMode && (
          <Button variant="primary" onClick={() => saveForm && saveForm()}>
            {t("jobPostingsList:save_form")}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default FormBuilderModal;