/** 外部import */
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

/** 内部import */
import styles from "./Segment.module.css";
import {
  fetchAsyncGetSegments,
  fetchAsyncCreateSegment,
  fetchAsyncUpdateSegment,
  fetchAsyncDeleteSegment,
  editSegment,
  selectSegments,
  selectEditedSegment,
} from "../features/vehicleSlice";

export const Segment = () => {
  const dispatch = useDispatch();
  const [successMsg, setSuccessMeg] = useState("");
  // reduxのstateを参照できるようにする
  const segments = useSelector(selectSegments);
  const editedSegment = useSelector(selectEditedSegment);

  // segmentの入力欄のstate管理
  const onChangeToInput = async (e) => {
    await dispatch(
      editSegment({ ...editedSegment, segment_name: e.target.value })
    );
  };

  // segmentの作成・更新ボタン
  const onClickToCreateOrUpdate = async () => {
    if (editedSegment.id === 0) {
      // 新規作成
      await dispatch(
        fetchAsyncCreateSegment({
          segment_name: editedSegment.segment_name,
        })
      );
      await dispatch(
        editSegment({
          id: 0,
          segment_name: "",
        })
      );
    } else {
      // 更新
      const result = await dispatch(fetchAsyncUpdateSegment(editedSegment));
      await dispatch(
        editSegment({
          id: 0,
          segment_name: "",
        })
      );
      if (fetchAsyncUpdateSegment.fulfilled.match(result)) {
        setSuccessMeg("Updated in segment!");
      }
    }
  };

  // segment削除ボタン
  const onClickToDelete = async (segId) => {
    const result = await dispatch(fetchAsyncDeleteSegment(segId));
    if (fetchAsyncDeleteSegment.fulfilled.match(result)) {
      setSuccessMeg("Deleted in segment!");
    }
  };

  useEffect(() => {
    // segments一覧の取得
    const fetchBootLoader = async () => {
      const result = await dispatch(fetchAsyncGetSegments());
      if (fetchAsyncGetSegments.rejected.match(result)) {
        setSuccessMeg("Get error!");
      }
    };

    fetchBootLoader();

    // 初回だけ実行（eslintでwarningが出るため、[]ではなく[dispatch]にしている）
  }, [dispatch]);

  return (
    <>
      {/* contents title */}
      <h3 data-testid="h3-segment">Segment</h3>

      {/* status */}
      <span className={styles.segment__status}>{successMsg}</span>

      {/* create & update input */}
      <div>
        <input
          type="text"
          placeholder="new segment name"
          value={editedSegment.segment_name}
          onChange={(e) => onChangeToInput(e)}
        />
        <button
          data-testid="btn-post"
          disabled={!editedSegment.segment_name}
          onClick={onClickToCreateOrUpdate}
        >
          {editedSegment.id === 0 ? "Create" : "Update"}
        </button>
      </div>

      {/* segments list */}
      <ul>
        {segments.map((seg) => (
          <li className={styles.segment__item} key={seg.id}>
            {/* segment name */}
            <span data-testid={`list-${seg.id}`}>{seg.segment_name}</span>
            <div>
              {/* delete button */}
              <button
                data-testid={`delete-seg-${seg.id}`}
                onClick={() => onClickToDelete(seg.id)}
              >
                delete
              </button>
              {/* edit button */}
              <button
                data-testid={`edit-seg-${seg.id}`}
                onClick={async () => {
                  await dispatch(editSegment(seg));
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
