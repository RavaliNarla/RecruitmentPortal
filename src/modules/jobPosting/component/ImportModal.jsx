import React, { useState, useRef } from "react";
import { Button, Alert, Modal } from "react-bootstrap";
import { Upload as UploadIcon } from "react-bootstrap-icons";
import { useTranslation } from "react-i18next";
import { usePositionsImport } from "../hooks/usePositionsImport";
import "../../../style/css/modalimport.css";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import { getOrganizationPath } from "../../auth/services/organizationContextService";

const ImportModal = ({ show, onHide, requisitionId, onSuccess = () => {} }) => {
  if (!requisitionId) {
    throw new Error("ImportModal requires requisitionId");
  }
  const { t } = useTranslation(["importModal", "common"]);
  const navigate = useNavigate();
  const { orgSlug } = useParams();
  const { bulkImport, downloadPositionTemplate, loading } =
    usePositionsImport();

  const [selectedFile, setSelectedFile] = useState(null);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const isExcel =
      file &&
      (file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel");

    if (isExcel) {
      setSelectedFile(file);
      setErrors([]);
    } else {
      setErrors([t("importModal:invalid_excel")]);
    }
  };
  const resetModalState = () => {
    setSelectedFile(null);
    setErrors([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  const handleUpload = async () => {
    if (!selectedFile) {
      setErrors([t("importModal:no_file_selected")]);
      return;
    }

    const result = await bulkImport(requisitionId, selectedFile);

    if (result.success) {
      toast.success(t("importModal:import_success"));

      resetModalState();
      onHide();

      //  REDIRECT TO JOB LISTING PAGE
      navigate(getOrganizationPath("/job-posting", orgSlug));
    } else {
      const errorMsg =
        Array.isArray(result.details) && result.details.length > 0
          ? t("importModal:import_failed")
          : result.error || t("importModal:import_failed");

      toast.error(errorMsg);

      if (Array.isArray(result.details)) {
        setErrors(result.details);
      } else {
        setErrors([errorMsg]);
      }
    }
  };

  return (
    <Modal
      show={show}
      onHide={() => {
        resetModalState();
        onHide();
      }}
      centered
      className="modalimport"
    >
      <Modal.Header closeButton>
        <Modal.Title className="f16 bluecol">
          {t("importModal:import_positions")}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div
          className="import-area p-4 rounded"
          style={{ background: "#fceee9" }}
        >
          <div className="text-center mb-3">
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 12,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#fff",
                marginBottom: "1rem",
              }}
            >
              <UploadIcon size={32} />
            </div>

            <h5 className="mb-2 uploadfile">{t("importModal:upload_file")}</h5>

            <p className="text-muted small">{t("importModal:support_xlsx")}</p>
          </div>

          {errors.length > 0 && (
            <Alert variant="danger" className="alertoverlay">
              <ul className="mb-0 ps-3">
                {errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </Alert>
          )}
          <input
            ref={fileInputRef}
            id="upload-xlsx"
            type="file"
            accept=".xlsx,.xls"
            hidden
            disabled={loading}
            onChange={handleFileChange}
          />

          <div className="text-center mb-3">
            <label htmlFor="upload-xlsx">
              <Button
                variant="primary"
                as="span"
                className="btnupload"
                disabled={loading}
              >
                {selectedFile
                  ? t("importModal:reupload_xlsx")
                  : t("importModal:upload_xlsx")}
              </Button>
            </label>

            {selectedFile && (
              <div className="mt-2">
                <small className="text-muted d-block">
                  {selectedFile.name}
                </small>
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="mt-2"
                  onClick={resetModalState}
                  disabled={loading}
                >
                  {t("importModal:remove")}
                </Button>
              </div>
            )}
          </div>

          <div className="text-center m-0 import-area small">
            {t("importModal:download_template")}{" "}
            <button
              type="button"
              onClick={downloadPositionTemplate}
              className="btn btn-link p-0 text-primary text-decoration-none btnfont"
              style={{ cursor: "pointer" }}
              disabled={loading}
            >
              {" "}
              XLSX
            </button>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="outline-secondary"
          onClick={() => {
            resetModalState();
            onHide();
          }}
          disabled={loading}
        >
          {t("common:cancel")}
        </Button>

        <Button variant="primary" onClick={handleUpload} disabled={loading}>
          {loading ? t("importModal:importing") : t("importModal:import")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImportModal;
