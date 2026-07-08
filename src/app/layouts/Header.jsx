import React, { useState, useEffect, useRef } from "react";
import { Navbar, Nav, Container, NavDropdown, Image } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import logo from "../../assets/logo.png";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../providers/userSlice";
import { setLanguage } from "../../i18n/store/languageSlice";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n/i18n";
import { persistor } from "../../store";
import { NavLink } from "react-router-dom";
import "../../style/css/header-pill.css";
import { setRankEnabled } from "../providers/rankSlice";
import { useMsal } from "@azure/msal-react";
import {
  getLoginPath,
  getOrganizationPath,
  getSavedLoginOrganization,
} from "../../modules/auth/services/organizationContextService";

const Header = () => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const dispatch = useDispatch();
  const [langOpen, setLangOpen] = useState(false);

  const { instance } = useMsal();

  /* ===================== USER FROM REDUX ===================== */
  const userSlice = useSelector((state) => state.user);
  const organizationTheme = useSelector(
    (state) => state.user.organizationTheme
  );

  const currentLogo = organizationTheme?.headerlogo
    ? organizationTheme.headerlogo.startsWith("data:")
      ? organizationTheme.headerlogo
      : `data:image/png;base64,${organizationTheme.headerlogo}`
    : logo;
  const user = userSlice?.user;

  /* ===================== USER DROPDOWN STATE ===================== */
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showApprovalsMenu, setShowApprovalsMenu] = useState(false);

  const dropdownRef = useRef(null);

  const closeMenu = () => setExpanded(false);

  /* ===================== INITIALS LOGIC ===================== */
  const getInitials = (fullName = "") => {
    if (!fullName.trim()) return "";
    const parts = fullName.trim().split(" ").filter(Boolean);
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (parts[0][0] + parts[1][0]).toUpperCase();
  };

  /* ===================== DISPLAY NAME (ADDED – NO REMOVALS) ===================== */
  const displayName =
    user?.name ||
    (user?.email
      ? user.email
          .split("@")[0]
          .replace(/[._]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : "");

  /* ===================== LOGOUT ===================== */
  const handleLogout = async () => {
    dispatch(clearUser());
    dispatch(setRankEnabled(false));
    dispatch(setLanguage("en"));
    i18n.changeLanguage("en");
    await persistor.purge();

    const activeAccount =
      instance.getActiveAccount() || instance.getAllAccounts()[0];
    await instance.logoutRedirect({
      account: activeAccount,
      postLogoutRedirectUri: `${window.location.origin}${getLoginPath(
        getSavedLoginOrganization()
      )}`,
    });
  };
  //Privileges
  const privileges = useSelector((state) => state.user.privileges);

  const canDashboard = privileges?.Dashboard;
  const canJobPost = privileges?.JobPostings;
  const canCandidateWorkflow =
    privileges?.["Candidate Pool"] || privileges?.["Compensation Pool"];
  const canCommittee = privileges?.["Committee Management"];
  const canVerification = privileges?.Verification;
  const canAdmin = privileges?.Admin;
  const canInterview = privileges?.["Interview"];
  const canApprovals =
    privileges?.["L1 Approval"] || privileges?.["L2 Approval"];
  const canL2 = privileges?.["L2 Approval"];
  const canMessages = privileges?.["Messages"];
  const canExaminationCutoffConfiguration =
    privileges?.["ExaminationCutoffConfiguration"];

  /* ===================== OUTSIDE CLICK ===================== */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const closeLangMenu = () => setLangOpen(false);
    document.addEventListener("click", closeLangMenu);
    return () => document.removeEventListener("click", closeLangMenu);
  }, []);

  const location = useLocation();
  const orgRoute = (path) =>
    getOrganizationPath(path, getSavedLoginOrganization());

  const formatRole = (role) => {
    if (!role) return "-";

    return role
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const isAdminRoute =
    location.pathname.startsWith("/users") ||
    location.pathname.startsWith("/department") ||
    location.pathname.startsWith("/jobgrade") ||
    location.pathname.startsWith("/position") ||
    location.pathname.startsWith("/category") ||
    location.pathname.startsWith("/certification") ||
    location.pathname.startsWith("/document") ||
    location.pathname.startsWith("/generic-or-annexures") ||
    location.pathname.startsWith("/education-qualification");

  return (
    <header className="fixed-top">
      {/* ===================== TOP BAR ===================== */}
      <div
        className="background-header py-2"
        style={{ position: "sticky", top: 0, zIndex: 1030 }}
      >
        <Container
          fluid
          className="d-flex justify-content-between align-items-center"
        >
          {/* Logo */}
          <div className="d-flex align-items-center">
            <Image
              src={currentLogo}
              alt={organizationTheme?.logoAlt || "Logo"}
              width="auto"
              height={45}
              className="me-2 imgbob"
            />
          </div>

          {/* Right Section */}
          <div className="d-flex align-items-center fonnav gap-3">
            {/* LANGUAGE PILL — CUSTOM */}
            <div
              className="lang-pill"
              onClick={(e) => {
                e.stopPropagation();
                setLangOpen((v) => !v);
              }}
            >
              <span className="lang-globe">🌐</span>

              <span className="lang-label">
                {i18n.language === "hi" ? t("hindi") : t("english_us")}
              </span>

              <FontAwesomeIcon icon={faChevronDown} className="lang-caret" />

              {langOpen && (
                <div className="lang-menu">
                  <div
                    className="lang-item"
                    onClick={(e) => {
                      e.stopPropagation(); // ✅ important
                      dispatch(setLanguage("en"));
                      i18n.changeLanguage("en");
                      setLangOpen(false);
                    }}
                  >
                    {t("english_us")}
                  </div>

                  <div
                    className="lang-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(setLanguage("hi"));
                      i18n.changeLanguage("hi");
                      setLangOpen(false);
                    }}
                  >
                    {t("hindi")}
                  </div>
                </div>
              )}
            </div>

            {/* ===================== USER DROPDOWN ===================== */}
            <div className="position-relative" ref={dropdownRef}>
              <div
                className="d-flex align-items-center gap-2"
                style={{ cursor: "pointer" }}
                onClick={() => setShowDropdown((prev) => !prev)}
              >
                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "50%",
                    width: "28px",
                    height: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    color: "#42579f",
                  }}
                >
                  {getInitials(displayName)}
                </div>

                <div className="d-flex flex-column">
                  <div className="d-flex align-items-center">
                    <span className="text-white fonnav">{displayName}</span>
                    <FontAwesomeIcon
                      icon={showDropdown ? faChevronUp : faChevronDown}
                      className="ms-1 text-white"
                    />
                  </div>

                  <small className="text-white">{formatRole(user?.role)}</small>
                </div>
              </div>

              {showDropdown && (
                <div
                  className="position-absolute end-0 mt-2 bg-white border rounded shadow"
                  style={{ minWidth: "220px", zIndex: 1050 }}
                >
                  <div
                    className="px-3 py-2 text-danger"
                    style={{ cursor: "pointer" }}
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right me-2"></i>
                    {t("logout")}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Container>
      </div>

      {/* ===================== NAVBAR ===================== */}
      <Navbar
        bg="white"
        expand="lg"
        className="border-bottom py-0"
        expanded={expanded}
      >
        <Container fluid>
          <Navbar.Toggle
            aria-controls="main-navbar-nav"
            onClick={() => setExpanded(expanded ? false : true)}
          />

          <Navbar.Collapse id="main-navbar-nav">
            <Nav className="me-auto">
              {canDashboard && (
                <Nav.Link as={NavLink} to={orgRoute("/dashboard")} onClick={closeMenu}>
                  {t("dashboard")}
                </Nav.Link>
              )}

              {canJobPost && (
                <Nav.Link as={NavLink} to={orgRoute("/job-posting")} onClick={closeMenu}>
                  {t("job_postings")}
                </Nav.Link>
              )}

              {canCandidateWorkflow && (
                <Nav.Link
                  as={NavLink}
                  to={orgRoute("/candidate-workflow")}
                  onClick={closeMenu}
                >
                  {t("candidate_workflow")}
                </Nav.Link>
              )}

              {canExaminationCutoffConfiguration && (
                <Nav.Link
                  as={NavLink}
                  to={orgRoute("/ExaminationCutoffConfiguration")}
                  onClick={closeMenu}
                >
                  {t("ExaminationCutoffConfiguration")}
                </Nav.Link>
              )}

              {canInterview && (
                <Nav.Link
                  as={NavLink}
                  to={orgRoute("/candidate-interviewer")}
                  onClick={closeMenu}
                >
                  {t("interview")}
                </Nav.Link>
              )}

              {canVerification && (
                <Nav.Link
                  as={NavLink}
                  to={orgRoute("/candidate-verification")}
                  onClick={closeMenu}
                >
                  {t("verification")}
                </Nav.Link>
              )}

              {canCommittee && (
                <Nav.Link as={NavLink} to={orgRoute("/interviewpanel")} onClick={closeMenu}>
                  {t("committee_management")}
                </Nav.Link>
              )}
              {canMessages && (
                <Nav.Link as={NavLink} to={orgRoute("/messages")} onClick={closeMenu}>
                  {t("messages")}
                </Nav.Link>
              )}

              {canApprovals && (
                <NavDropdown
                  id="approvals-dropdown"
                  show={showApprovalsMenu}
                  onMouseEnter={() => setShowApprovalsMenu(true)}
                  onMouseLeave={() => setShowApprovalsMenu(false)}
                  className={`approvals-dropdown ${
                    location.pathname.startsWith("/requisition-requests") ||
                    location.pathname.startsWith("/extension-requests") ||
                    location.pathname.startsWith("/committee-requests") ||
                    location.pathname.startsWith("/interview-requests") ||
                    location.pathname.startsWith("/exam-requests") ||
                    location.pathname.startsWith("offerletter-requests")
                      ? "active-admin"
                      : ""
                  }`}
                  title={
                    <>
                      {t("approvals")}{" "}
                      <FontAwesomeIcon icon={faChevronDown} className="ms-1" />
                    </>
                  }
                >
                  <NavDropdown.Item
                    as={NavLink}
                    to={orgRoute("/requisition-requests")}
                    onClick={closeMenu}
                  >
                    {t("requisition_requests")}
                  </NavDropdown.Item>

                  <NavDropdown.Item
                    as={NavLink}
                    to={orgRoute("/extension-requests")}
                    onClick={closeMenu}
                  >
                    {canL2
                      ? t("extension_requests")
                      : t("extension_requests_zone")}
                  </NavDropdown.Item>

                  <NavDropdown.Item
                    as={NavLink}
                    to={orgRoute("/committee-requests")}
                    onClick={closeMenu}
                  >
                    {t("committee_requests")}
                  </NavDropdown.Item>

                  <NavDropdown.Item
                    as={NavLink}
                    to={orgRoute("/exam-requests")}
                    
                    onClick={closeMenu}
                  >
                    {t("exam_requests")}
                  </NavDropdown.Item>

                  {!canL2 && (
                    <NavDropdown.Item
                      as={NavLink}
                      to={orgRoute("/interview-requests")}
                      onClick={closeMenu}
                    >
                      {t("interview_requests")}
                    </NavDropdown.Item>
                  )}
                  <NavDropdown.Item
                    as={NavLink}
                    to={orgRoute("/offerletter-requests")}
                    onClick={closeMenu}
                  >
                 {t("offer_letter_request")}
                  </NavDropdown.Item>
                </NavDropdown>
              )}

              {/* Admin Menu */}
              {canAdmin && (
                <NavDropdown
                  id="admin-dropdown"
                  show={showAdminMenu}
                  onMouseEnter={() => setShowAdminMenu(true)}
                  onMouseLeave={() => setShowAdminMenu(false)}
                  className={isAdminRoute ? "active-admin" : ""}
                  title={
                    <>
                      {t("admin")}{" "}
                      <FontAwesomeIcon icon={faChevronDown} className="ms-1" />
                    </>
                  }
                >
                  <NavDropdown.Item as={Link} to={orgRoute("/users")} onClick={closeMenu}>
                    {t("users")}
                  </NavDropdown.Item>

                  <NavDropdown.Item
                    as={Link}
                    to={orgRoute("/department")}
                    onClick={closeMenu}
                  >
                    {t("department")}
                  </NavDropdown.Item>

                  <NavDropdown.Item
                    as={Link}
                    to={orgRoute("/jobgrade")}
                    onClick={closeMenu}
                  >
                    {t("job_grade")}
                  </NavDropdown.Item>

                  <NavDropdown.Item
                    as={Link}
                    to={orgRoute("/position")}
                    onClick={closeMenu}
                  >
                    {t("position")}
                  </NavDropdown.Item>

                  <NavDropdown.Item
                    as={Link}
                    to={orgRoute("/category")}
                    onClick={closeMenu}
                  >
                    {t("category")}
                  </NavDropdown.Item>

                  <NavDropdown.Item
                    as={Link}
                    to={orgRoute("/certification")}
                    onClick={closeMenu}
                  >
                    {t("certification")}
                  </NavDropdown.Item>

                  <NavDropdown.Item
                    as={Link}
                    to={orgRoute("/document")}
                    onClick={closeMenu}
                  >
                    {t("document")}
                  </NavDropdown.Item>

                  <NavDropdown.Item
                    as={Link}
                    to={orgRoute("/generic-or-annexures")}
                    onClick={closeMenu}
                  >
                    {t("generic_or_annexures")}
                  </NavDropdown.Item>

                  <NavDropdown.Item
                    as={Link}
                    to={orgRoute("/education-qualification")}
                    onClick={closeMenu}
                  >
                    {t("education_qualification")}
                  </NavDropdown.Item>

                  <NavDropdown.Item
                    as={Link}
                    to={orgRoute("/state-languages")}
                    onClick={closeMenu}
                  >
                    {t("stateLanguages")}
                  </NavDropdown.Item>
                </NavDropdown>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;
