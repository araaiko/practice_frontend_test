/** 外部import */
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

/** 内部import */
import styles from "./Brand.module.css";
import {
  fetchAsyncGetBrands,
  fetchAsyncCreateBrand,
  fetchAsyncUpdateBrand,
  fetchAsyncDeleteBrand,
  editBrand,
  selectBrands,
  selectEditedBrand,
} from "../features/vehicleSlice";

export const Brand = () => {
  const dispatch = useDispatch();
  const [successMsg, setSuccessMeg] = useState("");
  // reduxのstateを参照できるようにする
  const brands = useSelector(selectBrands);
  const editedBrand = useSelector(selectEditedBrand);

  // brandの入力欄のstate管理
  const onChangeToInput = async (e) => {
    await dispatch(
      editBrand({
        ...editedBrand,
        brand_name: e.target.value,
      })
    );
  };

  // brandの作成・更新ボタン
  const onClickToCreateOrUpdate = async () => {
    if (editedBrand.id === 0) {
      // 新規作成
      await dispatch(
        fetchAsyncCreateBrand({
          brand_name: editedBrand.brand_name,
        })
      );
      await dispatch(
        editBrand({
          id: 0,
          brand_name: "",
        })
      );
    } else {
      // 更新
      const result = await dispatch(fetchAsyncUpdateBrand(editedBrand));
      await dispatch(
        editBrand({
          id: 0,
          brand_name: "",
        })
      );
      if (fetchAsyncUpdateBrand.fulfilled.match(result)) {
        setSuccessMeg("Updated in brand!");
      }
    }
  };

  // brandの削除ボタン
  const onClickToDelete = async (brandId) => {
    const result = await dispatch(fetchAsyncDeleteBrand(brandId));
    if (fetchAsyncDeleteBrand.fulfilled.match(result)) {
      setSuccessMeg("Deleted in brand!");
    }
  };

  useEffect(() => {
    // brands一覧の取得
    const fetchBootLoader = async () => {
      const result = await dispatch(fetchAsyncGetBrands());
      if (fetchAsyncGetBrands.rejected.match(result)) {
        setSuccessMeg("Get error!");
      }
    };

    fetchBootLoader();

    // 初回だけ実行（eslintでwarningが出るため、[]ではなく[dispatch]にしている）
  }, [dispatch]);

  return (
    <>
      {/* contents title */}
      <h3 data-testid="h3-brand">Brand</h3>

      {/* status */}
      <span className={styles.brand__status}>{successMsg}</span>

      {/* create & update input */}
      <div>
        <input
          type="text"
          placeholder="new brand name"
          value={editedBrand.brand_name}
          onChange={(e) => onChangeToInput(e)}
        />
        <button
          data-testid="btn-post"
          disabled={!editedBrand.brand_name}
          onClick={onClickToCreateOrUpdate}
        >
          {editedBrand.id === 0 ? "Create" : "Update"}
        </button>
      </div>

      {/* brands list */}
      <ul>
        {brands.map((brand) => (
          <li className={styles.brand__item} key={brand.id}>
            {/* brand name */}
            <span data-testid={`list-${brand.id}`}>{brand.brand_name}</span>
            <div>
              {/* delete button */}
              <button
                data-testid={`delete-brand-${brand.id}`}
                onClick={() => onClickToDelete(brand.id)}
              >
                delete
              </button>
              {/* edit button */}
              <button
                data-testid={`edit-brand-${brand.id}`}
                onClick={async () => {
                  await dispatch(editBrand(brand));
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
