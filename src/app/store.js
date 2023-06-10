/** 外部import */
import { configureStore } from "@reduxjs/toolkit";

/** 内部import */
import authReducer from "../features/authSlice";
import vehicleReducer from "../features/vehicleSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    vehicle: vehicleReducer,
  },
});
