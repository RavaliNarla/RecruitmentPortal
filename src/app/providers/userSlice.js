import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  authUser: null,
  candidateId: null,
  privileges: {},
  organizationTheme: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
    },
    setAuthUser(state, action) {
      state.authUser = action.payload;
    },
    setCandidate(state, action) {
      state.candidateId = action.payload; // Step 2: Handle candidateId
    },
    setPrivileges(state, action) {
      state.privileges = action.payload || {};
    },
    setOrganizationTheme(state, action) {
      state.organizationTheme = action.payload || null;
    },
    clearUser(state) {
      state.user = null;
      state.authUser = null;
      state.privileges = {};
      state.organizationTheme = null;
    },
  },
});

export const {
  setUser,
  setAuthUser,
  clearUser,
  setCandidate,
  setPrivileges,
  setOrganizationTheme,
} = userSlice.actions;
export default userSlice.reducer;
