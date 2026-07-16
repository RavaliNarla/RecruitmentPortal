import React from "react";
import { Form, Row, Col } from "react-bootstrap";

const DynamicFieldRenderer = ({ schema, values, onChange }) => {
  if (!schema?.fields?.length) return null;

  return (
    <Row className="gy-3">
      {schema.fields.map((field) => (
        <Col md={6} key={field.id}>
          <Form.Group>
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
                onChange={(e) => onChange(field.id, e.target.value)}
              />
            )}

            {field.type === "dropdown" && (
              <Form.Select
                value={values[field.id] ?? ""}
                required={field.required}
                onChange={(e) => onChange(field.id, e.target.value)}
              >
                <option value="">Select...</option>
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Form.Select>
            )}

            {field.type === "date" && (
              <Form.Control
                type="date"
                value={values[field.id] ?? ""}
                required={field.required}
                onChange={(e) => onChange(field.id, e.target.value)}
              />
            )}

            {field.type === "checkbox" && (
              <Form.Check
                type="checkbox"
                checked={values[field.id] ?? false}
                required={field.required}
                onChange={(e) => onChange(field.id, e.target.checked)}
              />
            )}
          </Form.Group>
        </Col>
      ))}
    </Row>
  );
};

export default DynamicFieldRenderer;
