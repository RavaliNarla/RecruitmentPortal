// src/index.js

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./modules/auth/services/msalConfig";

import { store, persistor } from "./store";
import "./index.css";

import App from "./app/App";
import LanguageSync from "./i18n/LanguageSync";
import SessionManager from "./modules/auth/services/SessionManager";
import {
  normalizeOrganizationKey,
  getOrganizationConfig,
  getSavedLoginOrganization,
} from "./modules/auth/services/organizationContextService";

// Log redirect debugging

// Create MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

const root = ReactDOM.createRoot(document.getElementById("root"));

(async () => {
  try {
    // Set favicon based on orgSlug in URL or saved login org
    const pathname = window.location.pathname || "/";
    const parts = pathname.split('/').filter(Boolean);
    const urlOrg = parts.length > 0 ? parts[0] : null;
    const orgKey = normalizeOrganizationKey(urlOrg || getSavedLoginOrganization());
    const orgConfig = getOrganizationConfig(orgKey);

    const setIcon = (href) => {
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/png';
      link.rel = 'icon';
      link.href = href;
      document.getElementsByTagName('head')[0].appendChild(link);

      const apple = document.querySelector("link[rel='apple-touch-icon']") || document.createElement('link');
      apple.rel = 'apple-touch-icon';
      apple.href = href;
      document.getElementsByTagName('head')[0].appendChild(apple);
    };

    if (orgConfig?.logo) {
      const logo = orgConfig.logo;
      const trimmed = String(logo).trim();

      if (trimmed.startsWith("data:")) {
        setIcon(trimmed);
      } else if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
        // Absolute or relative URL
        setIcon(trimmed);
      } else {
        // Likely base64 without data prefix - try to detect type
        const isPng = trimmed.startsWith('iVBOR');
        const isJpeg = trimmed.startsWith('/9j') || trimmed.startsWith('ffd8');
        const mime = isJpeg ? 'image/jpeg' : isPng ? 'image/png' : 'image/png';
        setIcon(`data:${mime};base64,${trimmed}`);
      }
    }
    // Initialize MSAL
    await msalInstance.initialize();

    // ✅ CRITICAL: Handle redirect BEFORE rendering
    // This only processes if URL has auth code (?code=...)
    const response = await msalInstance.handleRedirectPromise();

    if (response) {
      window.history.replaceState({}, document.title, "/auth/callback");
    }
    root.render(
      <MsalProvider instance={msalInstance}>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <Router>
              <LanguageSync />
              <SessionManager>
                <App />
              </SessionManager>
            </Router>
          </PersistGate>
        </Provider>
      </MsalProvider>
    );
  } catch (error) {
    console.error("❌ Initialization error:", error);
    root.render(<div>Error initializing app. Check console.</div>);
  }
})();
