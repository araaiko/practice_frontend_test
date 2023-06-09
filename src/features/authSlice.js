import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const apiUrl = "http://localhost:8000/";

// 非同期関数を使う場合は、createAsyncThunkメソッドを使う
// "login/post"はアクション名で、任意の名前をつけることが可能。※他のアクション名と重複しないようにすること
// ユーザーのトークンを取得してくれるエンドポイントにアクセスするための非同期関数
// （APIのAuthのエンドポイントにアクセスして、ユーザーネームとパスワードを渡すことで、トークンを取得する）
// 引数のauthには、ユーザーネームとパスワードが入るよう後ほど設定する
export const fetchAsyncLogin = createAsyncThunk("login/post", async (auth) => {
  const res = await axios.post(`${apiUrl}api/auth/`, auth, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return res.data;
});

// ユーザーを新規作成するための非同期関数
export const fetchAsyncRegister = createAsyncThunk(
  "register/post",
  async (auth) => {
    const res = await axios.post(`${apiUrl}api/create/`, auth, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    // 新規作成されたユーザー情報がres.dataに格納される
    return res.data;
  }
);

// ログインしているユーザーのユーザー情報を取得する非同期関数
export const fetchAsyncGetProfile = createAsyncThunk(
  "profile/get",
  async () => {
    const res = await axios.get(`${apiUrl}api/profile/`, {
      headers: {
        // トークン認証が通っているユーザーしか上記エンドポイントにアクセスできないため、Authorizationにトークンをセットしている
        Authorization: `token ${localStorage.token}`,
      },
    });
    return res.data;
  }
);

export const authSlice = createSlice({
  name: "auth",
  initialState: {
    profile: {
      id: 0,
      username: "",
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    // fetchAsyncLoginで取得したtokenをlocalStorageにセットする
    builder.addCase(fetchAsyncLogin.fulfilled, (state, action) => {
      // 3つstateが存在する（fulfilled, rejected, pending）
      // 成功の場合はfulfilledが返ってくる。失敗時はrejected、実行中はpendingのstateが返ってくる
      localStorage.setItem("token", action.payload.token);
    });
    
    // fetchAsyncGetProfileで取得したユーザー情報でprofileを上書きする
    builder.addCase(fetchAsyncGetProfile.fulfilled, (state, action) => {
      return {
        ...state,
        profile: action.payload, // fetchAsyncGetProfileの戻り値（res.data）がaction.payloadに入っている
      };
    });
  },
});

export const selectProfile = (state) => state.auth.profile;

export default authSlice.reducer;
