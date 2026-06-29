// src/App.js
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../App.css";

import Header from "../app/layouts/Header";
import Footer from "./layouts/Footer";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "@fontsource/poppins/300.css"; //Light
import "@fontsource/poppins/400.css"; //Regular
import "@fontsource/poppins/500.css"; // Medium
import "@fontsource/poppins/600.css"; //Semi-Bold
import "@fontsource/poppins/700.css"; //Bold

import AppRoutes from "./AppRoutes";

function AppWrapper() {
  const location = useLocation();
  const organizationTheme = useSelector(
    (state) => state.user?.organizationTheme
  );
  const hideHeaderFor = ["/login", "/forgot-password", "/verify-otp"];
  const shouldHideHeader = hideHeaderFor.some((p) =>
    location.pathname.toLowerCase().startsWith(p)
  );

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(
      "--app-primary-color",
      organizationTheme?.primaryColor || "#ff6a00"
    );
    root.style.setProperty(
      "--app-secondary-color",
      organizationTheme?.secondaryColor || "#162b75"
    );
    root.style.setProperty(
      "--app-link-color",
      organizationTheme?.linkColor || "#ff6a00"
    );
    root.style.setProperty(
      "--app-focus-color",
      organizationTheme?.focusColor || "rgba(255, 106, 0, 0.12)"
    );
  }, [organizationTheme]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={1500} />
      <div className="app-container">
        {!shouldHideHeader && <Header />}
        <main className="main-content">
          <AppRoutes />
          <Footer />
        </main>
      </div>
    </>
  );
}

export default function App() {
  return <AppWrapper />;
}
