/** 外部import */
import React, { useEffect } from "react";
import { Grid } from "@material-ui/core";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

/** 内部import */
import styles from "./MainPage.module.css";
import { fetchAsyncGetProfile, selectProfile } from "../features/authSlice";
import { Brand } from "./Brand";
import { Segment } from "./Segment";
import { Vehicle } from "./Vehicle";

export const MainPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // authSliceで設定したstate(profile)を参照
  const profile = useSelector(selectProfile);

  // ログアウト
  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  useEffect(() => {
    // ログイン中のユーザー情報を取得＆state(profile)に上書き
    const fetchBootLoader = async () => {
      await dispatch(fetchAsyncGetProfile());
    };

    fetchBootLoader();

    // 初回だけ実行（eslintでwarningが出るため、[]ではなく[dispatch]にしている）
  }, [dispatch]);

  return (
    <div className={styles.mainPage__root}>
      {/* page header */}
      <Grid container>
        {/* username */}
        <Grid item xs>
          {profile.username}
        </Grid>
        {/* title */}
        <Grid item xs>
          <span data-testid="span-title" className={styles.mainPage__title}>
            Vehicle register system
          </span>
        </Grid>
        {/* logout button */}
        <Grid item xs>
          <button data-testid="btn-logout" onClick={logout}>
            Logout
          </button>
        </Grid>
      </Grid>

      {/* main contents */}
      <Grid container>
        {/* segment */}
        <Grid item xs={3}>
          <Segment />
        </Grid>
        {/* brand */}
        <Grid item xs={3}>
          <Brand />
        </Grid>
        {/* vehicle */}
        <Grid item xs={6}>
          <Vehicle />
        </Grid>
      </Grid>
    </div>
  );
};
