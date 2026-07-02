import React from "react";
import { Modal } from "react-bootstrap";
import fileIcon from "../../../assets/upload-filled-file.png";
import deleteIcon from "../../../assets/delete_icon.png";
import { toast } from "react-toastify";
import jobPositionApiService from "../../jobPosting/services/jobPositionApiService";
import Loader from "../../../shared/components/Loader";
import { useTranslation } from "react-i18next";

const DigitalSignatureModal = ({
  showDigitalSignatureModal,
  setShowDigitalSignatureModal,
  onUploadSuccess,
  selectedIds,
  setSelectedIds,
  positionId,
  offerData,
}) => {
  const { t } = useTranslation(["candidateWorkflow", "common"]);
  const [loading, setLoading] = React.useState(false);
  const [file, setFile] = React.useState(null);
  const [validationErrors, setValidationErrors] = React.useState([]);
  const fileInputRef = React.useRef(null);

  /* ---------------- FILE SELECT ---------------- */

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith(".zip")) {
      toast.error("Only ZIP files are allowed.");
      e.target.value = "";
      return;
    }

    setFile(selectedFile);
    setValidationErrors([]);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setValidationErrors([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownloadTemplate = async () => {
    if (!selectedIds?.length) {
      toast.error("Please select at least one offer.");
      return;
    }

    const selectedOffers = offerData.filter((offer) =>
      selectedIds.includes(offer.id)
    );

    const invalidOffers = selectedOffers.filter(
      (offer) => offer.status !== "OFFER_GENERATED"
    );

    if (invalidOffers.length > 0) {
      toast.error(
        "Only Offer Generated candidates can be downloaded for digital signature."
      );
      return;
    }

    try {
      setLoading(true);

      const response =
        await jobPositionApiService.downloadOffersZip(selectedIds);

      const url = window.URL.createObjectURL(response.data);

      const link = document.createElement("a");
      link.href = url;
      link.download = "candidate_offers.zip";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success("Offers downloaded successfully.");
    } catch (err) {
      console.error(err);

      toast.error(err?.response?.data?.message || "Failed to download offers.");
    } finally {
      setLoading(false);
    }
  };
  /* ---------------- BULK UPLOAD ---------------- */

  const handleDigitalSignatureUpload = async () => {
    if (!file) {
      toast.error("Please upload a ZIP file.");
      return;
    }

    try {
      setLoading(true);
      setValidationErrors([]);

      const res = await jobPositionApiService.uploadSignedOffers(file);

      if (res?.success === true) {
        const { successCount = 0, failureCount = 0 } = res.data || {};

        if (failureCount > 0 && successCount === 0) {
          toast.error("Failed to upload signed offers.");
          return;
        }

        toast.success(res?.message || "Signed offers uploaded successfully.");

        if (typeof onUploadSuccess === "function") {
          await onUploadSuccess();
        }

        closeModal();
        setSelectedIds([]);
      } else {
        toast.error(res?.message || "Failed to upload signed offers.");

        const errors = Array.isArray(res?.data) ? res.data : [];
        setValidationErrors(errors);
      }
    } catch (err) {
      console.error("UPLOAD ERROR =>", err);

      const errorData = err?.response?.data;

      toast.error(
        errorData?.message || err?.message || "Digital signature upload failed."
      );

      const errors = Array.isArray(errorData?.data) ? errorData.data : [];

      setValidationErrors(errors);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- CLOSE ---------------- */

  const closeModal = () => {
    setShowDigitalSignatureModal(false);
    setFile(null);
    setValidationErrors([]);
  };

  return (
    <Modal
      show={showDigitalSignatureModal}
      onHide={closeModal}
      centered
      backdrop="static"
    >
      <Modal.Header closeButton className="modalhead">
        <div className="d-grid">
          <h5 className="mb-1 blue-color fs-15"> Upload Digital Signature </h5>
          <p className="text-muted fs-14 mb-0">
            Download the generated offers, digitally sign them, and upload the
            signed files.{" "}
          </p>
        </div>
      </Modal.Header>

      <Modal.Body>
        <div
          className="text-center px-3 pt-3 pb-2 rounded"
          style={{ backgroundColor: "#FFF1E8" }}
        >
          <img src={fileIcon} width={60} className="mb-2" alt="file" />
          <p className="mb-1 fw-600 fs-15">Upload Signed Files</p>
          <small className="text-muted fs-13">Supports ZIP format</small>

          <div className="d-grid justify-content-center gap-2 mt-3">
            <button
              className="btn orange-bg text-white fs-13 rounded shadow px-3"
              onClick={() => fileInputRef.current.click()}
            >
              Upload ZIP
            </button>
          </div>

          {file && (
            <div className="form-control blue-border mt-4 d-flex align-items-center justify-content-between p-3">
              <input
                type="text"
                className="fs-13 border-0 w-100"
                value={file.name}
                readOnly
              />
              <img
                src={deleteIcon}
                alt="Remove file"
                width={22}
                className="cursor-pointer"
                onClick={handleRemoveFile}
              />
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="mt-3">
              {validationErrors.map((err, idx) => (
                <p key={idx} className="text-danger fs-13 mb-1 text-center">
                  {err}
                </p>
              ))}
            </div>
          )}

          <div className="d-flex justify-content-center gap-1 mt-4">
            <small className="text-muted fs-12">
              Download Generated Offers:
            </small>

            <span
              className="blue-color fw-500 cursor-pointer fs-14"
              onClick={handleDownloadTemplate}
            >
              ZIP
            </span>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />

        {loading && <Loader />}
      </Modal.Body>

      <Modal.Footer className="modalfoot">
        <button
          className="btn btn-light-grey shadow border fs-13 px-3"
          onClick={closeModal}
        >
          {t("common:cancel")}
        </button>

        <button
          className="btn orange-bg text-white shadow fs-13 px-4"
          onClick={handleDigitalSignatureUpload}
          disabled={!file}
        >
          Upload{" "}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default DigitalSignatureModal;
