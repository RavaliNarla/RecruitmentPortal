import React from "react";
import { Form, Row, Col } from "react-bootstrap";
import Select from "react-select";
import { useTranslation } from "react-i18next";
import ErrorMessage from "../../../../shared/components/ErrorMessage";

const DYNAMIC_ERROR_PREFIX = "dynamic_";

export const dynamicFieldErrorKey = (fieldId) => `${DYNAMIC_ERROR_PREFIX}${fieldId}`;

const isEmptyFieldValue = (field, value) => {
  if (field.type === "multiselect") return !value || value.length === 0;
  if (field.type === "checkbox") return !value;
  return value === undefined || value === null || value === "";
};

// Field configs come from the org's form schema (super-admin-portal), so
// `required` has to be enforced here explicitly — there is no shared Yup/RHF
// schema generated from it, and the native HTML `required` attribute this
// component sets is inert because the parent forms call preventDefault().
export const validateDynamicFieldValues = (schema, values = {}) => {
  const errors = {};
  (schema?.fields || []).forEach((field) => {
    if (field.required && isEmptyFieldValue(field, values[field.id])) {
      errors[dynamicFieldErrorKey(field.id)] = "validation:required";
    }
  });
  return errors;
};

const DynamicFieldRenderer = ({ schema, values, onChange, errors = {}, isViewMode = false }) => {
  const { t } = useTranslation(["validation"]);
  if (!schema?.fields?.length) return null;

  return (
    <>
      {schema.title && <h5 className="mb-3">{schema.title}</h5>}
      <Row className="g-4">
        {schema.fields.map((field) => {
          const options = (field.options || []).map((option) => ({
            value: option,
            label: option,
          }));
          const fieldError = errors[dynamicFieldErrorKey(field.id)];

          return (
            <Col md={4} key={field.id}>
              <Form.Label>
                {field.label}
                {field.required && <span className="text-danger"> *</span>}
              </Form.Label>

              {field.type === "text" && (
                <Form.Control
                  value={values[field.id] ?? ""}
                  placeholder={field.placeholder}
                  maxLength={field.maxLength}
                  required={field.required}
                  isInvalid={!!fieldError}
                  disabled={isViewMode}
                  onChange={(e) => onChange(field.id, e.target.value)}
                />
              )}

              {field.type === "dropdown" && (
                <Select
                  classNamePrefix="react-select"
                  isDisabled={isViewMode}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    control: (base) => ({
                      ...base,
                      borderColor: fieldError ? "#dc3545" : base.borderColor,
                    }),
                  }}
                  value={
                    options.find((option) => option.value === values[field.id]) ||
                    null
                  }
                  options={options}
                  onChange={(selected) =>
                    onChange(field.id, selected ? selected.value : "")
                  }
                />
              )}

              {field.type === "multiselect" && (
                <Select
                  classNamePrefix="react-select"
                  isDisabled={isViewMode}
                  isMulti
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    control: (base) => ({
                      ...base,
                      borderColor: fieldError ? "#dc3545" : base.borderColor,
                    }),
                  }}
                  value={options.filter((option) =>
                    (values[field.id] || []).includes(option.value)
                  )}
                  options={options}
                  onChange={(selected) =>
                    onChange(field.id, (selected || []).map((option) => option.value))
                  }
                />
              )}

              {field.type === "date" && (
                <Form.Control
                  type="date"
                  value={values[field.id] ?? ""}
                  required={field.required}
                  isInvalid={!!fieldError}
                  disabled={isViewMode}
                  onChange={(e) => onChange(field.id, e.target.value)}
                />
              )}

              {field.type === "checkbox" && (
                <Form.Check
                  type="checkbox"
                  className="custom_checkbox"
                  checked={values[field.id] ?? false}
                  required={field.required}
                  isInvalid={!!fieldError}
                  disabled={isViewMode}
                  onChange={(e) => onChange(field.id, e.target.checked)}
                />
              )}

              {fieldError && <ErrorMessage>{t(fieldError)}</ErrorMessage>}
            </Col>
          );
        })}
      </Row>
    </>
  );
};

export default DynamicFieldRenderer;
