/** 外部import */
import React, { useState } from "react";
import FlipCameraAndroidIcon from "@material-ui/icons/FlipCameraAndroid";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

/** 内部import */
import styles from "./Auth.module.css";
import { fetchAsyncLogin, fetchAsyncRegister } from "../features/authSlice";

export const Auth = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [successMsg, setSuccessMeg] = useState("");

  // ログイン処理
  const login = async () => {
    const result = await dispatch(
      fetchAsyncLogin({ username: username, password: password })
      // resultにはfulfilled, rejected, pendingのどれかが格納される
    );

    if (fetchAsyncLogin.fulfilled.match(result)) {
      setSuccessMeg("Successfully logged in!");
      navigate("/vehicle");
    } else {
      setSuccessMeg("Login error!");
    }
  };

  // submitボタンが押されたとき
  const authUser = async (e) => {
    // デフォルトで起きるページリフレッシュを阻止
    e.preventDefault();

    if (isLogin) {
      login();
    } else {
      // ユーザー新規登録
      const result = await dispatch(
        fetchAsyncRegister({ username: username, password: password })
      );

      if (fetchAsyncRegister.fulfilled.match(result)) {
        // 新規作成が成功したらそのままログイン処理を走らせる
        login();
      } else {
        setSuccessMeg("Registration error!");
      }
    }
  };

  return (
    <div className={styles.auth__root}>
      {/* メッセージ */}
      <span className={styles.auth__status}>{successMsg}</span>
      {/* フォーム */}
      <form onSubmit={authUser}>
        {/* username */}
        <div className={styles.auth__input}>
          {/* 後ほどテストで要素を特定する必要があるため、data-testidで各要素にidを割り当てている */}
          <label data-testid="label-username">Username: </label>
          <input
            data-testid="input-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        {/* password */}
        <div className={styles.auth__input}>
          <label data-testid="label-password">Password: </label>
          <input
            data-testid="input-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* 送信ボタン */}
        <button type="submit">{isLogin ? "Login" : "Register"}</button>

        {/* ログイン/新規作成切り替え */}
        <div>
          <FlipCameraAndroidIcon
            data-testid="toggle-icon"
            className={styles.auth__toggle}
            onClick={() => setIsLogin(!isLogin)}
          />
        </div>
      </form>
    </div>
  );
};
