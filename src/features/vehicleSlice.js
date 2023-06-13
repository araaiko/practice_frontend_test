/** 外部import */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const apiUrl = "http://localhost:8000/";

/** segments */
// segment一覧を取得する(read)
export const fetchAsyncGetSegments = createAsyncThunk(
  "segment/get",
  async () => {
    const res = await axios.get(`${apiUrl}api/segments/`, {
      headers: {
        Authorization: `token ${localStorage.token}`,
      },
    });
    return res.data;
  }
);

// segmentを新規作成する(create)
export const fetchAsyncCreateSegment = createAsyncThunk(
  "segment/post",
  async (segment) => {
    const res = await axios.post(`${apiUrl}api/segments/`, segment, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${localStorage.token}`,
      },
    });
    return res.data;
  }
);

// segmentを更新する（update）※要id指定
export const fetchAsyncUpdateSegment = createAsyncThunk(
  "segment/put",
  async (segment) => {
    const res = await axios.put(
      `${apiUrl}api/segments/${segment.id}/`,
      segment,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${localStorage.token}`,
        },
      }
    );
    return res.data;
  }
);

// segmentを削除する(delete) ※要id指定
export const fetchAsyncDeleteSegment = createAsyncThunk(
  "segment/delete",
  async (id) => {
    await axios.delete(`${apiUrl}api/segments/${id}/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${localStorage.token}`,
      },
    });
    return id;
  }
);

/** brand */
// brand一覧を取得する(read)
export const fetchAsyncGetBrands = createAsyncThunk("brand/get", async () => {
  const res = await axios.get(`${apiUrl}api/brands/`, {
    headers: {
      Authorization: `token ${localStorage.token}`,
    },
  });
  return res.data;
});

// brandを新規作成する(create)
export const fetchAsyncCreateBrand = createAsyncThunk(
  "brand/post",
  async (brand) => {
    const res = await axios.post(`${apiUrl}api/brands/`, brand, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${localStorage.token}`,
      },
    });
    return res.data;
  }
);

// brandを更新する(update)
export const fetchAsyncUpdateBrand = createAsyncThunk(
  "brand/put",
  async (brand) => {
    const res = await axios.put(`${apiUrl}api/brands/${brand.id}/`, brand, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${localStorage.token}`,
      },
    });
    return res.data;
  }
);

// brandを削除する(delete)
export const fetchAsyncDeleteBrand = createAsyncThunk(
  "brand/delete",
  async (id) => {
    await axios.delete(`${apiUrl}api/brands/${id}/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${localStorage.token}`,
      },
    });
    return id;
  }
);

/** vehicle */
// brand一覧を取得する(read)
export const fetchAsyncGetVehicles = createAsyncThunk(
  "vehicle/get",
  async () => {
    const res = await axios.get(`${apiUrl}api/vehicles/`, {
      headers: {
        Authorization: `token ${localStorage.token}`,
      },
    });
    return res.data;
  }
);

// vehicleを新規作成する(create)
export const fetchAsyncCreateVehicle = createAsyncThunk(
  "vehicle/post",
  async (vehicle) => {
    const res = await axios.post(`${apiUrl}api/vehicles/`, vehicle, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${localStorage.token}`,
      },
    });
    return res.data;
  }
);

// vehicleを更新する(update)
export const fetchAsyncUpdateVehicle = createAsyncThunk(
  "vehicle/put",
  async (vehicle) => {
    const res = await axios.put(
      `${apiUrl}api/vehicles/${vehicle.id}/`,
      vehicle,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${localStorage.token}`,
        },
      }
    );
    return res.data;
  }
);

// vehicleを削除する(delete)
export const fetchAsyncDeleteVehicle = createAsyncThunk(
  "vehicle/delete",
  async (id) => {
    await axios.delete(`${apiUrl}api/vehicles/${id}/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${localStorage.token}`,
      },
    });
    return id;
  }
);

/** slice */
export const vehicleSlice = createSlice({
  name: "vehicle",
  initialState: {
    segments: [
      {
        id: 0,
        segment_name: "",
      },
    ],
    brands: [
      {
        id: 0,
        brand_name: "",
      },
    ],
    vehicles: [
      {
        id: 0,
        vehicle_name: "",
        release_year: 2020,
        price: 0.0,
        segment: 0,
        brand: 0,
        segment_name: "",
        brand_name: "",
      },
    ],
    editedSegment: {
      id: 0,
      segment_name: "",
    },
    editedBrand: {
      id: 0,
      brand_name: "",
    },
    editedVehicle: {
      id: 0,
      vehicle_name: "",
      release_year: 2020,
      price: 0.0,
      segment: 0,
      brand: 0,
    },
  },
  reducers: {
    // reactのコンポーネントからsegmentのオブジェクトを受け取り、editedSegmentに代入する
    editSegment(state, action) {
      state.editedSegment = action.payload;
    },
    editBrand(state, action) {
      state.editedBrand = action.payload;
    },
    editVehicle(state, action) {
      state.editedVehicle = action.payload;
    },
  },
  // 各非同期処理の後処理を記述する
  extraReducers: (builder) => {
    /** segment */
    // 取得したsegment一覧をstateのsegmentsに代入する
    builder.addCase(fetchAsyncGetSegments.fulfilled, (state, action) => {
      return {
        ...state,
        segments: action.payload,
      };
    });
    // segmentを新規作成後、stateのsegmentsに追加する
    builder.addCase(fetchAsyncCreateSegment.fulfilled, (state, action) => {
      return {
        ...state,
        segments: [...state.segments, action.payload],
      };
    });
    // segment更新後、stateのsegmentsを最新に更新する
    builder.addCase(fetchAsyncUpdateSegment.fulfilled, (state, action) => {
      return {
        ...state,
        segments: state.segments.map((segment) =>
          segment.id === action.payload.id ? action.payload : segment
        ),
      };
    });
    // segment削除後、stateのsegmentsとvehiclesを最新に更新する
    builder.addCase(fetchAsyncDeleteSegment.fulfilled, (state, action) => {
      return {
        ...state,
        segments: state.segments.filter(
          (segment) => segment.id !== action.payload
        ),
        vehicles: state.vehicles.filter(
          (vehicle) => vehicle.segment !== action.payload
        ),
      };
    });

    /** brand */
    // 取得したbrands一覧をstateのbrandsに代入する
    builder.addCase(fetchAsyncGetBrands.fulfilled, (state, action) => {
      return {
        ...state,
        brands: action.payload,
      };
    });
    // brandを新規作成後、stateのbrandsに追加する
    builder.addCase(fetchAsyncCreateBrand.fulfilled, (state, action) => {
      return {
        ...state,
        brands: [...state.brands, action.payload],
      };
    });
    // brand更新後、stateのbrandsを最新に更新する
    builder.addCase(fetchAsyncUpdateBrand.fulfilled, (state, action) => {
      return {
        ...state,
        brands: state.brands.map((brand) =>
          brand.id === action.payload.id ? action.payload : brand
        ),
      };
    });
    // brand削除後、stateのbrandsとvehiclesを最新に更新する
    builder.addCase(fetchAsyncDeleteBrand.fulfilled, (state, action) => {
      return {
        ...state,
        brands: state.brands.filter((brand) => brand.id !== action.payload),
        vehicles: state.vehicles.filter(
          (vehicle) => vehicle.brand !== action.payload
        ),
      };
    });

    /** vehicle */
    // 取得したvehicles一覧をstateのvehiclesに代入する
    builder.addCase(fetchAsyncGetVehicles.fulfilled, (state, action) => {
      return {
        ...state,
        vehicles: action.payload,
      };
    });
    // vehicleを新規作成後、stateのvehiclesに追加する
    builder.addCase(fetchAsyncCreateVehicle.fulfilled, (state, action) => {
      return {
        ...state,
        vehicles: [...state.vehicles, action.payload],
      };
    });
    // vehicle更新後、stateのvehiclesを最新に更新する
    builder.addCase(fetchAsyncUpdateVehicle.fulfilled, (state, action) => {
      return {
        ...state,
        vehicles: state.vehicles.map((vehicle) =>
          vehicle.id === action.payload.id ? action.payload : vehicle
        ),
      };
    });
    // vehicle削除後、stateのvehiclesを最新に更新する
    builder.addCase(fetchAsyncDeleteVehicle.fulfilled, (state, action) => {
      return {
        ...state,
        vehicles: state.vehicles.filter(
          (vehicle) => vehicle.id !== action.payload
        ),
      };
    });
  },
});

// reducers内に記述した各アクションをReactコンポーネントで呼び出せるようexportする
export const { editSegment, editBrand, editVehicle } = vehicleSlice.actions;

// ReactコンポーネントからReduxのstateを参照できるようにする
export const selectSegments = (state) => state.vehicle.segments;
export const selectEditedSegment = (state) => state.vehicle.editedSegment;
export const selectBrands = (state) => state.vehicle.brands;
export const selectEditedBrand = (state) => state.vehicle.editedBrand;
export const selectVehicles = (state) => state.vehicle.vehicles;
export const selectEditedVehicle = (state) => state.vehicle.editedVehicle;

export default vehicleSlice.reducer;
