import React from "react";
import { Card, Row, Col, Form, Button } from "react-bootstrap";
import deleteIcon from "../../../../assets/delete_icon.png";
import { useTranslation } from "react-i18next";
const DynamicField = ({
  field,
  updateField,
  removeField,
  addOption,
  updateOption,
  removeOption,
  isViewMode = false,
}) => {
  const { t } = useTranslation("jobPostingsList");
  return (
    <Card className="mb-3 shadow-sm">
      <Card.Body>
        <Row className="align-items-center">
          <Col md={5}>
            <Form.Group>
              <Form.Label>
                {t("jobPostingsList:label")} <span className="text-danger">*</span>
              </Form.Label>

              <Form.Control
                value={field.label}
                placeholder={t("jobPostingsList:enter_label")}
                disabled={isViewMode}
                onChange={(e) => updateField(field.id, "label", e.target.value)}
              />

              {field.error && <div className="text-danger mt-1 fs-12">{field.error}</div>}
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group>
              <Form.Label>{t("jobPostingsList:required")}</Form.Label>

              <Form.Check
                type="switch"
                checked={field.required}
                disabled={isViewMode}
                className="tglswt"
                onChange={(e) => updateField(field.id, "required", e.target.checked)}
              />
            </Form.Group>
          </Col>

          <Col md={4} className="text-end">
            {!isViewMode && (
              <img
                src={deleteIcon}
                alt="Delete"
                className="me-2"
                style={{ width: "32px", height: "32px" }}
                onClick={() => removeField(field.id)}
              />
            )}
          </Col>
        </Row>

        {/* TEXTBOX */}

        {field.type === "text" && (
          <Row className="mt-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>{t("jobPostingsList:placeholder")}</Form.Label>

                <Form.Control
                  value={field.placeholder}
                  placeholder={t("jobPostingsList:enter_placeholder")}
                  disabled={isViewMode}
                  onChange={(e) => updateField(field.id, "placeholder", e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>{t("jobPostingsList:character_limit")}</Form.Label>

                <Form.Control
                  type="number"
                  min={1}
                  value={field.maxLength}
                  disabled={isViewMode}
                  onChange={(e) => updateField(field.id, "maxLength", Number(e.target.value))}
                />
              </Form.Group>
            </Col>
          </Row>
        )}

        {/* DROPDOWN */}

        {field.type === "dropdown" && (
          <div className="mt-3">
            <Form.Label>{t("jobPostingsList:dropdown_options")}</Form.Label>

            {field.options.map((option, index) => (
              <Row key={index} className="mb-2">
                <Col md={10}>
                  <Form.Control
                    value={option}
                    placeholder={t("jobPostingsList:option", { index: index + 1 })}
                    disabled={isViewMode}
                    onChange={(e) => updateOption(field.id, index, e.target.value)}
                  />
                </Col>

                <Col md={2}>
                  {!isViewMode && (
                    <img
                      src={deleteIcon}
                      alt="Delete"
                      style={{ width: "30px", height: "30px" }}
                      onClick={() => removeOption(field.id, index)}
                    />
                  )}
                </Col>
              </Row>
            ))}

            {!isViewMode && (
              <Button size="sm" variant="primary" onClick={() => addOption(field.id)}>
                + {t("jobPostingsList:add_option")}
              </Button>
            )}
          </div>
        )}

        {/* DATE */}

        {field.type === "date" && (
          <div className="mt-3">
            <Form.Text className="text-muted">
              {t("jobPostingsList:date_field_description")}
            </Form.Text>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default DynamicField;