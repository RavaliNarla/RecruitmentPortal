import React, { useEffect, useState } from "react";
import { Button, Card, Form, Row, Col } from "react-bootstrap";
import DynamicField from "./DynamicField";
import "../../../../style/css/EducationModal.css";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

const FormBuilder = ({
  initialSchema,
  onSave,
  isViewMode = false,
  registerSave,
}) => {
  const { t } = useTranslation();

  const FIELD_TYPES = [
    { label: t("jobPostingsList:text"), value: "text" },
    { label: t("jobPostingsList:dropdown"), value: "dropdown" },
    { label: t("jobPostingsList:date"), value: "date" },
  ];
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState([]);
  const [generatedJson, setGeneratedJson] = useState(null);

  const addField = (type) => {
    const field = {
      id: crypto.randomUUID(),
      type,
      label: "",
      required: false,
      error: "",
    };

    if (type === "text") {
      field.placeholder = "";
      field.maxLength = 100;
    }

    if (type === "dropdown") {
      field.options = [""];
    }

    setFields((prev) => [...prev, field]);
  };

  const updateField = (id, key, value) => {
    setFields((prev) =>
      prev.map((field) => {
        if (field.id !== id) return field;

        return {
          ...field,
          [key]: value,
          ...(key === "label" && {
            error: value.trim() ? "" : t("jobPostingsList:label_required"),
          }),
        };
      })
    );
  };
  const removeField = (id) => {
    setFields((prev) => prev.filter((field) => field.id !== id));
  };

  const addOption = (fieldId) => {
    setFields((prev) =>
      prev.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              options: [...field.options, ""],
            }
          : field
      )
    );
  };

  const updateOption = (fieldId, index, value) => {
    setFields((prev) =>
      prev.map((field) => {
        if (field.id !== fieldId) return field;

        const options = [...field.options];
        options[index] = value;

        return {
          ...field,
          options,
        };
      })
    );
  };

  const removeOption = (fieldId, index) => {
    setFields((prev) =>
      prev.map((field) => {
        if (field.id !== fieldId) return field;

        return {
          ...field,
          options: field.options.filter((_, i) => i !== index),
        };
      })
    );
  };

  const handleSave = () => {
    if (fields.length === 0) {
      toast.error("Please add at least one field.");
      return;
    }
    let hasError = false;

    const validatedFields = fields.map((field) => {
      if (!field.label.trim()) {
        hasError = true;
        return {
          ...field,
          error: t("jobPostingsList:label_required"),
        };
      }

      return {
        ...field,
        error: "",
      };
    });

    setFields(validatedFields);

    if (hasError) return;

    const schema = {
      formId: crypto.randomUUID(),
      title,
      fields: validatedFields,
    };

    console.log("Generated Form JSON:", schema);

    onSave(schema);
  };
  useEffect(() => {
    if (initialSchema) {
      setTitle(initialSchema.title || "");
      setFields(initialSchema.fields || []);
    }
  }, [initialSchema]);
  useEffect(() => {
    if (registerSave) {
      registerSave(() => handleSave);
    }
  }, [fields, title]);
  return (
    <>
      <div className="d-flex gap-2 mb-3 mandedu">
        {FIELD_TYPES.map((field) => (
          <Button
            key={field.value}
            onClick={() => addField(field.value)}
            disabled={isViewMode}
          >
            + {field.label}
          </Button>
        ))}
      </div>

      {fields.map((field) => (
        <DynamicField
          key={field.id}
          field={field}
          updateField={updateField}
          removeField={removeField}
          addOption={addOption}
          updateOption={updateOption}
          removeOption={removeOption}
          isViewMode={isViewMode}
        />
      ))}
    </>
  );
};

export default FormBuilder;
