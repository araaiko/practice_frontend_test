/** 外部import */
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

/** 内部import */
import styles from "./Vehicle.module.css";
import {
  fetchAsyncGetVehicles,
  fetchAsyncCreateVehicle,
  fetchAsyncUpdateVehicle,
  fetchAsyncDeleteVehicle,
  editVehicle,
  selectSegments,
  selectBrands,
  selectVehicles,
  selectEditedVehicle,
} from "../features/vehicleSlice";

export const Vehicle = () => {
  const dispatch = useDispatch();
  const [successMsg, setSuccessMeg] = useState("");
  // reduxのstateを参照できるようにする
  const segments = useSelector(selectSegments);
  const brands = useSelector(selectBrands);
  const vehicles = useSelector(selectVehicles);
  const editedVehicle = useSelector(selectEditedVehicle);

  /** vehicle入力欄のstate管理 */
  // input name
  const onChangeToInputName = async (e) => {
    await dispatch(
      editVehicle({
        ...editedVehicle,
        vehicle_name: e.target.value,
      })
    );
  };
  // input year
  const onChangeToInputYear = async (e) => {
    await dispatch(
      editVehicle({
        ...editedVehicle,
        release_year: e.target.value,
      })
    );
  };
  // input price
  const onChangeToInputPrice = async (e) => {
    await dispatch(
      editVehicle({
        ...editedVehicle,
        price: e.target.value,
      })
    );
  };

  /** selectタグ内のstate管理とoptions生成 */
  // segment
  const onChangeToSelectSegment = async (e) => {
    await dispatch(
      editVehicle({
        ...editedVehicle,
        segment: e.target.value,
      })
    );
  };
  const segmentOptions = segments?.map((seg) => (
    <option key={seg.id} value={seg.id}>
      {seg.segment_name}
    </option>
  ));
  // brand
  const onChangeToSelectBrand = async (e) => {
    await dispatch(
      editVehicle({
        ...editedVehicle,
        brand: e.target.value,
      })
    );
  };
  const brandOptions = brands?.map((brand) => (
    <option key={brand.id} value={brand.id}>
      {brand.brand_name}
    </option>
  ));

  // vehicleの作成・更新ボタン
  const onClickToCreateOrUpdate = async () => {
    if (editedVehicle.id === 0) {
      // 新規作成
      await dispatch(fetchAsyncCreateVehicle(editedVehicle));
      await dispatch(
        editVehicle({
          id: 0,
          vehicle_name: "",
          release_year: 2020,
          price: 0.0,
          segment: 0,
          brand: 0,
        })
      );
    } else {
      // 更新
      const result = await dispatch(fetchAsyncUpdateVehicle(editedVehicle));
      await dispatch(
        editVehicle({
          id: 0,
          vehicle_name: "",
          release_year: 2020,
          price: 0.0,
          segment: 0,
          brand: 0,
        })
      );
      if (fetchAsyncUpdateVehicle.fulfilled.match(result)) {
        setSuccessMeg("Updated in vehicle!");
      }
    }
  };

  // vehicle削除ボタン
  const onClickToDelete = async (vehicleId) => {
    const result = await dispatch(fetchAsyncDeleteVehicle(vehicleId));
    if (fetchAsyncDeleteVehicle.fulfilled.match(result)) {
      setSuccessMeg("Deleted in vehicle!");
    }
  };

  useEffect(() => {
    // vehicles一覧の取得
    const fetchBootLoader = async () => {
      const result = await dispatch(fetchAsyncGetVehicles());
      if (fetchAsyncGetVehicles.rejected.match(result)) {
        setSuccessMeg("Get error!");
      }
    };

    fetchBootLoader();

    // 初回だけ実行（eslintでwarningが出るため、[]ではなく[dispatch]にしている）
  }, [dispatch]);

  return (
    <>
      {/* contents title */}
      <h3 data-testid="h3-vehicle">Vehicle</h3>

      {/* status */}
      <span className={styles.vehicle__status}>{successMsg}</span>

      {/* create & update input */}
      <div>
        {/* vehicle name */}
        <input
          type="text"
          placeholder="new vehicle name"
          value={editedVehicle.vehicle_name}
          onChange={(e) => onChangeToInputName(e)}
        />
        {/* release year */}
        <input
          type="number"
          placeholder="year of release"
          min={0}
          value={editedVehicle.release_year}
          onChange={(e) => onChangeToInputYear(e)}
        />
        {/* price */}
        <input
          type="number"
          placeholder="price"
          min={0}
          step={0.01}
          value={editedVehicle.price}
          onChange={(e) => onChangeToInputPrice(e)}
        />
      </div>
      {/* select (segment) */}
      <select
        data-testid="select-segment"
        value={editedVehicle.segment}
        onChange={(e) => onChangeToSelectSegment(e)}
      >
        <option value={0}>Segment</option>
        {segmentOptions}
      </select>
      {/* select (brand) */}
      <select
        data-testid="select-brand"
        value={editedVehicle.brand}
        onChange={(e) => onChangeToSelectBrand(e)}
      >
        <option value={0}>Brand</option>
        {brandOptions}
      </select>
      {/* create & update button */}
      <button
        data-testid="btn-vehicle-post"
        disabled={
          !editedVehicle.vehicle_name |
          !editedVehicle.segment |
          !editedVehicle.brand
        }
        onClick={onClickToCreateOrUpdate}
      >
        {editedVehicle.id === 0 ? "Create" : "Update"}
      </button>

      {/* vehicles list */}
      <ul>
        {vehicles.map((vehicle) => (
          <li className={styles.vehicle__item} key={vehicle.id}>
            {/* vehicle name */}
            <span data-testid={`list-${vehicle.id}`}>
              <strong data-testid={`name-${vehicle.id}`}>
                {vehicle.vehicle_name}
              </strong>
              --{vehicle.release_year}--- ¥{vehicle.price}[M] ---
              {vehicle.segment_name} {vehicle.brand_name}---
            </span>
            <div>
              {/* delete button */}
              <button
                data-testid={`delete-veh-${vehicle.id}`}
                onClick={() => onClickToDelete(vehicle.id)}
              >
                delete
              </button>
              {/* edit button */}
              <button
                data-testid={`edit-veh-${vehicle.id}`}
                onClick={async () => {
                  await dispatch(editVehicle(vehicle));
                }}
              >
                edit
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
};
