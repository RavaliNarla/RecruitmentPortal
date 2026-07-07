import React from "react";
import { Container } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation("common");
  const organizationTheme = useSelector((state) => state.user?.organizationTheme);
  const organizationName =
    organizationTheme?.organizationName || "Bank of Baroda";

  return (
    <footer className="app-footer py-2">
      <Container fluid>
        <div className="text-center">
          <p className="mb-0 fs-12">
            {" "}
            {t("footer_text", {
              year: new Date().getFullYear(),
              organizationName,
            })}
          </p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
