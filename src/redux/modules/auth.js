// src/redux/modules/auth.js

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: null,
  isAuthenticated: false,
  userData: {}, // 사용자 정보를 저장할 상태 추가
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload.token;
      // state.user = action.payload.user; // 사용자 정보 저장
      state.isAuthenticated = true;
    },
    setUserData: (state, action) => {
      state.userData = action.payload; // 사용자 정보 저장
    },
    clearToken: (state) => {
      state.token = null;
      state.user = null; // 사용자 정보 초기화
      state.isAuthenticated = false;
    },
  },
});

export const { setToken, setUserData, clearToken } = authSlice.actions;

export default authSlice.reducer;
