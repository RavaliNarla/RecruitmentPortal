export const mapUserApiToState = (api = {}) => ({
  id: api.id,
  firstName: api.first_name,
  lastName: api.last_name,
  email: api.email ?? "",
  role: api.role ?? "",
  mobile: api.mobile ?? "",
  name: api.name ?? "",
  // The user's own real org code - used to detect URL org != actual org
  // (see PrivateRoute.js). Never trust anything else for this comparison.
  orgCode: api.orgCode ?? null,
});
