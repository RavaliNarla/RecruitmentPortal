import React from "react";
import { Form, Row, Col } from "react-bootstrap";
import Select from "react-select";

const DynamicFieldRenderer = ({ schema, values, onChange, isViewMode = false }) => {
  if (!schema?.fields?.length) return null;

  return (
    <Row className="g-4">
      {schema.fields.map((field) => {
        const options = (field.options || []).map((option) => ({
          value: option,
          label: option,
        }));

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
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
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
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
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
                disabled={isViewMode}
                onChange={(e) => onChange(field.id, e.target.checked)}
              />
            )}
          </Col>
        );
      })}
    </Row>
  );
};

export default DynamicFieldRenderer;
