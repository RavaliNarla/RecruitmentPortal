import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { Search, Plus } from "react-bootstrap-icons";
import { useTranslation } from "react-i18next";

import { useExperience } from "./hooks/useExperience";
import ExperienceModal from "../EducationQualification/components/ExperienceModalUI";
import EducationTable from "../EducationQualification/components/ExperienceTableUI";
import DeleteConfirmModal from "../EducationQualification/components/DeleteConfirmModal";

const ExperienceDetails = () => {
  const { t } = useTranslation(["education", "common"]);

  const {
    experienceList,
    showModal,
    searchTerm,
    formData,
    errors,
    currentPage,
    pageSize,
    educationOptions,
    groupOptions,

    setSearchTerm,
    setCurrentPage,
    setPageSize,

    handleAddClick,
    handleCloseModal,
    saveExperience,
    handleDelete,
    handleEditClick,

    handleFieldChange,
    handleAddSpec,
    handleRemoveSpec,
  } = useExperience();

  const [isViewing, setIsViewing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleViewClick = (item, index) => {
    setIsViewing(true);
    setIsEditing(false); // ✅ ADD THIS
    handleEditClick(item, index);
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);

  return (
    <div className="px-4 py-3 border rounded bg-white">
      <div className="user-header d-flex justify-content-between align-items-center mb-3">
        {/* ✅ TRANSLATED TITLE */}
        <h2>{t("education:education_details", "Education Details")}</h2>

        <div className="d-flex align-items-center gap-3">
          <div className="position-relative">
            <Search
              size={16}
              style={{
                position: "absolute",
                top: "50%",
                left: "10px",
                transform: "translateY(-50%)",
              }}
            />

            {/* ✅ TRANSLATED PLACEHOLDER */}
            <Form.Control
              placeholder={t(
                "education:search_placeholder",
                "Search Education"
              )}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{ paddingLeft: "30px", width: "220px" }}
            />
          </div>

          {/* ✅ TRANSLATED BUTTON */}
          <Button
            className="add-button"
            onClick={() => {
              setIsEditing(false);
              setIsViewing(false);
              handleAddClick();
            }}
          >
            <Plus size={18} /> {t("common:add", "Add")}
          </Button>
        </div>
      </div>

      <EducationTable
        data={experienceList}
        educationOptions={educationOptions}
        searchTerm={searchTerm}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
        onEdit={(item, index) => {
          setIsViewing(false);
          setIsEditing(true);
          handleEditClick(item, index);
        }}
        onView={(item, index) => handleViewClick(item, index)} // ✅ ADD THIS
        onDelete={(index) => {
          setDeleteIndex(index);
          setShowDeleteModal(true);
        }}
      />

      <ExperienceModal
        show={showModal}
        handleCloseModal={handleCloseModal}
        formData={formData}
        saveExperience={saveExperience}
        errors={errors}
        onChange={handleFieldChange}
        onAddSpec={handleAddSpec}
        onRemoveSpec={handleRemoveSpec}
        isViewing={isViewing}
        isEditing={isEditing}
        educationOptions={educationOptions}
          groupOptions={groupOptions}
      />

      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        target={experienceList[deleteIndex]}
        onConfirm={() => {
          handleDelete(deleteIndex);
          setShowDeleteModal(false);
        }}
      />
    </div>
  );
};

export default ExperienceDetails;
