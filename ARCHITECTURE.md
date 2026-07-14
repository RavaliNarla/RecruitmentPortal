# RecruitmentPortal — Architecture Reference

> Purpose: a from-scratch architecture doc for this repo, written by reading the codebase directly (no prior doc existed here besides the CRA-boilerplate `README.md`). Covers tech stack, bootstrap, the multi-organization login system, state/API layers, module inventory, the privilege model, and the org-level dynamic-fields feature added most recently.

## 1. Tech Stack

- **React 19.2.1**, **Create React App** (`react-scripts 5.0.1`) — no Vite/Next, no TypeScript.
- **react-router-dom 7.10.1** — routing, with every protected route nested under a `/:orgSlug` path segment (see §2).
- **@reduxjs/toolkit 2.11.1** + **redux-persist 6** — state, persisted to `localStorage` under key `"root"`.
- **@azure/msal-browser 5.9 / @azure/msal-react 5.0.6** — Azure AD (Entra ID) SSO login.
- **axios 1.13.2** — HTTP client, seven instances (see §5).
- **i18next 22 / react-i18next 12** — i18n, English + Hindi (~34 namespaces), all statically imported.
- **react-bootstrap 2.10**, **bootstrap 5.3** — UI framework. **recharts 3.8**, **react-select**, **react-toastify**, **react-datepicker**, **crypto-js**.
- This checkout's `package.json` has plain `start`/`build`/`test`/`eject`/`format` scripts and only one `.env` (with `.env.stage`/`.env.uat`/`.env.local` blocks commented out, only `dev` active) — no `env-cmd` multi-environment build setup. A sibling checkout (`Recruitment_Azure/New_Recruitment_BOB`) has the fuller `env-cmd`-based `start:<env>`/`build:<env>` setup if that's needed as reference.
- No devDependencies besides `prettier` — no test-related tooling beyond CRA's bundled Jest/RTL.

## 2. App Bootstrap & Routing — the multi-organization system

This is the most distinctive part of this repo: **a real, working multi-tenant login system keyed by a URL slug**, not just a single-tenant app.

**`src/index.js`** — `PublicClientApplication` is created and `handleRedirectPromise()` resolves *before* React renders (async IIFE). Provider nesting: `MsalProvider` → Redux `Provider` → `PersistGate` → `Router` → `LanguageSync` → `SessionManager` → `App`. Contains a large disabled/commented-out block for per-organization favicon swapping.

**`src/modules/auth/config/loginOrganizations.json`** — a static (frontend-only, no backend call) config keyed by organization slug. Currently defines **`default`/`sagarsoft`, `bob` (Bank of Baroda), `pnb` (Punjab National Bank)**, each with `organizationName`, `appTitle`, `logo`/`headerlogo` (base64), `loginType` (`"entra"` or `"password"`), `primaryColor`/`secondaryColor`/`linkColor`/`focusColor`/`dashboardbgcolor`, `logoAlt`, `allowedPrivileges`. This file is large (embeds base64 images).

**`src/modules/auth/services/organizationContextService.js`** — the routing core for multi-org:
- `normalizeOrganizationKey(orgSlug)` — lowercases and validates against `loginOrganizations.json`, falling back to `"sagarsoft"` (`DEFAULT_ORG`).
- `getOrganizationConfig(orgSlug)`, `saveLoginOrganization(orgSlug)` (writes to `sessionStorage` under `"loginOrganization"`), `getSavedLoginOrganization()` (reads it back), `getLoginPath(orgSlug)` → `/${orgSlug}/login`, `getOrganizationPath(path, orgSlug)` → prefixes any app path with `/${orgSlug}` (special-cases `/unauthorized` to stay unprefixed).

**`src/modules/auth/services/organizationThemeService.js`** — `getOrganizationTheme(orgSlug)`, currently just returns the static config from `loginOrganizations.json` (comment marks it as temporary, to be replaced by a real `GET /organizations/{orgSlug}/login-theme` call later).

**`src/app/AppRoutes.js`** — route table:
- Public: `/unauthorized`, `/:orgSlug/login` (→ `Login`), `/login` (→ redirect to saved org's login), `/forgot-password`, `/auth/callback`.
- **All protected routes are nested under `<Route path="/:orgSlug">`** — meaning every authenticated page (job postings, master data, dashboards, etc.) is reachable at `/bob/job-posting`, `/pnb/dashboard`, etc., and `useParams().orgSlug` is available in every one of them.
- `/*` catch-all → a `LegacyOrgRedirect` component (handles old un-prefixed URLs), final catch-all → saved org's login.
- Grepped every `navigate(...)` call in the codebase: they consistently route through `getOrganizationPath(...)`, not hardcoded paths — no un-prefixed internal navigation bugs found.

**`src/pages/.../Login.js`** (`src/modules/auth/pages/Login.js`) — reads `:orgSlug` from the URL, loads that org's theme/config, and offers either an Entra (Azure AD) login button or a password login form depending on `organizationConfig.loginType`. Before redirecting to Azure AD, it calls `saveLoginOrganization(organizationKey)` so the org slug survives the round-trip through Microsoft's login page.

**`src/modules/auth/pages/AuthCallback.js`** — after the Azure AD redirect returns: reads back `getSavedLoginOrganization()`, dispatches `setOrganizationTheme(getOrganizationConfig(organizationKey))`, resolves the MSAL account, acquires a token, calls `loginApi.getAzureUserDetails(accessToken)` → `dispatch(setUser({userId, name, email, role}))` and `dispatch(setPrivileges(...))`, then navigates to `getOrganizationPath(getDefaultRoute(privileges), organizationKey)`.

**Implication**: the org slug is authoritative and always derivable from the URL on any authenticated page — this is why the newer dynamic-fields feature (§7, §11) reads it via `useParams()` rather than needing it threaded through Redux/login payloads.

## 3. Authentication (Azure AD / MSAL)

Same shape as the sibling `New_Recruitment_BOB` repo (see that repo's `SUPERADMIN_PORTAL_CONTEXT.md` §3 for the generic MSAL mechanics), with the org-slug layer described above added on top. `role` (`Admin`/`Zonal_HR`/`Recruiter`/`Committee_Member`) is still on the user object but **display-only** today (Header.jsx, a few workflow screens) — no route gates on `role` (see §9). Two dead legacy guard files, `src/app/AdminRouteold.js` / `NonAdminRouteold.js`, still check `role` but aren't imported by `AppRoutes.js` or `App.js`.

## 4. State Management (Redux Toolkit + redux-persist)

**`src/store/index.js`** — `combineReducers({ user, language, rank })`. `persistConfig`: key `"root"`, default `localStorage`, `blacklist: ["resume"]` — stale, no `resume` reducer exists (comment references a non-existent `job` slice too). `serializableCheck` disabled globally.

- **`userSlice`** (`src/app/providers/userSlice.js`): `{ user, authUser, candidateId, privileges, organizationTheme }`. Actions: `setUser`, `setAuthUser`, `setCandidate`, `setPrivileges`, `setOrganizationTheme`, `clearUser` (clears user/authUser/privileges/organizationTheme).
- **`languageSlice`** (`src/i18n/store/languageSlice.js`): current UI language, synced via `LanguageSync.jsx`.
- **`rankSlice`** (`src/app/providers/rankSlice.js`): `{ isRankEnabled, isScoreEnabled }` feature flags.

## 5. API Layer (`src/core/service/apiService.js`)

Seven axios instances, sharing one interceptor factory (`attachInterceptors`, applied to all but `masterDropdownApi`):

| Instance | Base URL env var | Notes |
|---|---|---|
| `api` | `REACT_APP_API_BASE_URL` | main API, JSON |
| `formDataApi` | same | multipart/form-data |
| `apis` | `REACT_APP_API_BASE_URLS` | used by master + most modules |
| `candidateApi` | `REACT_APP_CANDIDATE_API_URL` | candidate-facing |
| `nodeApi` | `REACT_APP_NODE_API_URL` | Node auth backend, `withCredentials: true` |
| `publicNodeApi` | `REACT_APP_NODE_API_URL` | same host, no credentials |
| `masterDropdownApi` | `REACT_APP_MASTER_DROPDOWN_URL` | lighter interceptor |

- **Auth header injection**: `acquireTokenSilent` → `Authorization: Bearer` + `X-Client: AzureAD`; falls back to `loginRedirect` on failure.
- **401 handling**: single-flight refresh (`isRefreshing`/`refreshSubscribers` queue) against `/recruiter-auth/recruiter-refresh-token`; on failure → `clearUser()` + `logoutRedirect()`.
- **Response unwrapping**: returns `response.data` directly (except `blob`).
- **Errors < 500 are swallowed** — the interceptor resolves with `error.response.data` instead of rejecting; only ≥500 or network-level errors actually throw/reject. **This matters for any code (including the dynamic-fields fetch, §11) that tries to detect "this endpoint doesn't exist yet" via a thrown error — a plain 404 will not throw here.**

## 6. Internationalization (i18n)

`src/i18n/i18n.js` — plain i18next + react-i18next, **all translation JSON statically imported** (no lazy-loading). 2 languages (`en`, `hi`), ~34 namespaces across ~20 inconsistently-named folders (`jobPostingJson/`, `ExamconfigurationJson/`, plain `json/`, mixed dot/underscore file-naming conventions, mixed casing). `LanguageSync.jsx` keeps `state.language` and i18next's active language in sync, mounted at app root.

## 7. Module Pattern

```
src/modules/<Module>/
  pages/ | component/     — route-mounted screens + UI pieces
  hooks/                   — local state + service calls
  mappers/                 — API shape <-> UI shape
  services/                — thin axios wrappers
  validations/             — field/form validation
```

### 7.1 `master` module

12 entity sub-pages (`Category`, `CertificationPage`, `Department`, `Document`, `EducationQualification`, `GenericOrAnnexures`, `JobGrade`, `Location`, `Position`, `SpecialCategory`, `StatesLanguages`, `User`), all hitting one shared `masterApiService.js` (~359 lines, ~55-60 methods — get/add/update/delete/bulk-add/download-template per entity). Contains a near-duplicate pair (`getEducationGroups` / `getEducationGroupes`) hitting the same endpoint — likely a typo'd leftover.

### 7.2 `jobPosting` module — requisitions, positions, and dynamic fields

`component/` (incl. `DynamicForm/`), `config/requisitionConfig.js`, `hooks/`, `mappers/`, `pages/` (`JobPostingsList`, `CreateRequisition`, `AddPosition`), `services/`, `validations/`.

- **`component/DynamicForm/FormBuilder.jsx` + `DynamicField.jsx` + `FormBuilderModal.jsx`** — the original, per-position ad-hoc field builder: a recruiter can add `text`/`dropdown`/`date` fields while creating one specific position (`AddPosition.jsx`), saved as a JSON schema (`{formId, title, fields}`) into that position's `dynamicFields`. This only ever *defines field labels*, it doesn't separately collect entered values against a saved schema.
- **`component/DynamicForm/DynamicFieldRenderer.jsx`** *(new)* — a distinct, simpler **value-collecting** renderer (not a builder): given a schema and a `values`/`onChange` pair, renders bound `text`/`dropdown`/`date` inputs. This is the piece added for the org-level dynamic-fields feature — see §11.
- `requisitionApiService.js` — requisition workflow REST surface (create/update/delete/list/submit-for-approval/draft-edit/publish/reinitialize/approval-history).

## 8. Shared Layer (`src/shared/`)

- **Three near-duplicate page-header components**: `HeaderWithBack.jsx` (`PageHeaderWithBack`, no Redux), `headerwithbacks.jsx` (`PageHeaderWithBacks`, uses `useSelector`), `headerwithbackss.jsx` (`HeaderWithBackss`, uses `useSelector`) — filenames differ only by casing/trailing `s`, a real risk of importing the wrong one.
- `Layout.jsx` — thin `<Outlet/>` wrapper with `Suspense`/spinner; no header/sidebar logic (that lives in `src/app/layouts/Header.jsx`, rendered globally by `App.js`, hidden on login pages).
- `Loader.js`, `ErrorMessage.jsx` — small presentational helpers.
- `utils/`: one `*-validations.js` per master entity (13 files), `masterHelpers.js` (~15 domain getters, e.g. `getDepartment`, `getCity`, `getGender` — **inconsistent id-key naming**: some snake_case like `department_id`/`city_id`, others camelCase like `genderId`/`religionId`), `masterLookup.js` (generic `getMasterById` helper it's built on), `inputHandlers.js`, `dateUtils.js` (minimal, 19 lines).

## 9. Role/Privilege Model

Two overlapping concepts, same as the sibling repo:

- **`role`** (`state.user.user.role`) — display-only today (`Header.jsx` `formatRole`, `candidatePreviewPage.jsx`, `interviewMembersMapper.js`, `UserFormModal.jsx`). No route gates on it. Two dead legacy guards (`AdminRouteold.js`/`NonAdminRouteold.js`) still check it but aren't wired into routing.
- **`privileges`** (`state.user.privileges`, flat boolean map) — the real authorization mechanism, checked by **`PrivilegeRoute.js`** (single `privilege` prop, or `privilegesRequired` array with OR semantics), gating every route in `AppRoutes.js`. Distinct privilege strings in use: `JobPostings`, `Admin`, `View Position`, `Candidate Pool`, `Verification`, `Interview`, `Compensation Pool`, `ExaminationCutoffConfiguration`, `Committee Management`, `Messages`, `Interview Pool`, `L1 Approval`, `L2 Approval`.
- **`Header.jsx` independently re-derives** its own `canDashboard`/`canJobPost`/`canAdmin`/etc. booleans from the same `privileges` object rather than sharing logic with `AppRoutes.js`/`PrivilegeRoute.js` — a second place encoding the same gates, and it includes a `Dashboard` privilege check that `AppRoutes.js` doesn't actually use (that route is gated on `JobPostings` instead) — a latent mismatch worth resolving if privileges are ever reworked.

## 10. Org-Level Dynamic Form Fields (added on top of this architecture)

A feature was added to let a SuperAdmin (in the separate `SuperAdminPortal` app) define extra fields per organization for two forms here, without a code change/redeploy on this side:

- **`Requisition` form** (`CreateRequisition.jsx`) and **`Job Posting` form** (`AddPosition.jsx`, i.e. the "Add Position" screen) each independently fetch an org-scoped field schema and render it via `DynamicFieldRenderer.jsx`, appended below their existing static fields.
- **`src/modules/jobPosting/hooks/useOrgFormSchema.js`** — reads the org key from `useParams().orgSlug` (per §2's routing model — no Redux/login-payload plumbing needed, unlike the equivalent feature built in the sibling `New_Recruitment_BOB` repo, which lacks this URL-based org system and had to add a placeholder field to its login flow instead).
- **`src/modules/jobPosting/services/orgFormSchemaService.js`** — calls a not-yet-implemented backend endpoint (`GET /organizations/{orgSlug}/form-schema/{formKey}`); until that exists, falls back to a small hardcoded `DEMO_SCHEMAS` object keyed by the `"bob"` org slug (clearly marked `TEMPORARY`, to be deleted once the real endpoint is live). Because of the <500-swallowing interceptor behavior noted in §5, the fallback logic checks the *shape* of the response (a non-empty `fields` array) rather than relying on a thrown error alone.
- Captured values are added to each form's submit payload as `dynamicFieldValues` (Requisition) / `orgDynamicFieldValues` (Add Position) — new, additive keys alongside the existing `dynamicFields` key (the older, unrelated per-position ad-hoc builder from §7.2), which are passed through untouched in `createRequisitionMapper.js`, `jobPositionCreateMapper.js`, and `positionUpdate.mapper.js`.
- On the SuperAdminPortal side, organizations were given a new **`slug`** field (e.g. `"bob"`) specifically so its schema storage key matches this repo's real `orgSlug` — the org named "Public Sector Banking Consortium" there is currently mapped to slug `"bob"` for end-to-end testability.

## 11. Summary — Notable Things to Know

1. **The `/:orgSlug` multi-org system is real and load-bearing** — it's not a stub, and it's the correct source of "current organization" for any new org-scoped feature in this repo (unlike the sibling `New_Recruitment_BOB` repo, which has no equivalent and no organization concept at all).
2. **`persistConfig.blacklist: ["resume"]`** and the `rootReducer` comment referencing a `job` slice are both stale/dead — no such reducers exist.
3. **The <500-swallowing axios interceptor** means any new code trying to detect "endpoint not implemented yet" via try/catch alone will be fooled by a plain 404 — check response shape instead (see §5, §10).
4. **Three near-identical `HeaderWithBack*` components** and a **`Header.jsx` that re-implements privilege gating separately from `PrivilegeRoute.js`** are both copy-paste-drift risks worth cleaning up before adding more nav items or shared headers.
5. **`role` vs `privileges`**: only `privileges` gate anything; `role` is legacy/display-only. Two dead route-guard files still reference `role` but are unused.
6. This checkout currently has only a `dev` env active (single `.env`, others commented out) and no `env-cmd` multi-environment build scripts — confirm with the team whether that's intentional for this checkout or whether it should match the `New_Recruitment_BOB` repo's fuller `start:<env>`/`build:<env>` setup.
