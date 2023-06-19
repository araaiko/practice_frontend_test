/** 外部import */
import React from "react";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

/** 内部import */
// authSlice.reducerをauthReducerという名でimport
import authReducer from "../features/authSlice";
// vehicleSlice.reducerをvehicleReducerという名でimport
import vehicleReducer from "../features/vehicleSlice";
// testを行うコンポーネント
import { MainPage } from "../components/MainPage";

// react-routerのuseNavigateのモック関数
const mockedNavigator = jest.fn();

// MainPageコンポーネント内のuseNavigateによるページ遷移先を上書き
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedNavigator,
}));

// mswを使った、擬似的なAPIのエンドポイントの作成
const handlers = [
  rest.get("http://localhost:8000/api/profile/", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ id: 1, username: "test user" }));
  }),
  // segmentコンポーネント内で使うエンドポイント（segments一覧情報の取得）
  // jsonは空の配列を返すように設定
  rest.get("http://localhost:8000/api/segments/", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([]));
  }),
  // brandsコンポーネント内で使うエンドポイント（brands一覧情報の取得）
  rest.get("http://localhost:8000/api/brands/", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([]));
  }),
  // vehiclesコンポーネント内で使うエンドポイント（vehicles一覧情報の取得）
  rest.get("http://localhost:8000/api/vehicles/", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([]));
  }),
];

// サーバーの作成（mock server walkerの作成）
// エンドポイントが複数あるため、...で展開している
const server = setupServer(...handlers);

// テスティングの設定
beforeAll(() => {
  server.listen();
});
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => {
  server.close();
});

describe("MainPage Component Test Cases", () => {
  let store;
  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
        vehicle: vehicleReducer,
      },
    });
  });

  // MainPageコンポーネント要素の表示
  it("1 :Should render all the elements correctly", async () => {
    // testing-libraryのrenderを使って、MainPageコンポーネントの要素を取得
    render(
      <Provider store={store}>
        <MainPage />
      </Provider>
    );
    // 上記のテスト結果はtesting-libraryのscreenに入っている。実際に確認するためにはscreen.debug()
    //eslint-disable-next-line
    // screen.debug();
    expect(screen.getByTestId("span-title")).toBeTruthy();
    expect(screen.getByTestId("btn-logout")).toBeTruthy();
  });

  // Authページへの遷移（ログアウトボタン）
  it("2 :Should route to Auth page when logout button pressed", async () => {
    // userEventのsetup
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <MainPage />
      </Provider>
    );

    user.click(screen.getByTestId("btn-logout"));
    await waitFor(() => expect(mockedNavigator).toBeCalledWith("/"));
    expect(mockedNavigator).toHaveBeenCalledTimes(1);
  });

  // ログインユーザー情報表示（ユーザー名の表示）
  it("3 :Should render logged in user name", async () => {
    render(
      <Provider store={store}>
        <MainPage />
      </Provider>
    );

    // queryByText：ある要素が存在しないことをチェックしたい時に使う。存在しない場合はnullを返してくれる
    // toBeNull()：左記で指定した要素が存在しない（null）だった場合にパスする
    expect(screen.queryByText("test user")).toBeNull();
    // 非同期処理が完了するのを待ち(await)、ドキュメント内に非同期処理で取得したテキスト（要素）があることを確認する（findByText と toBeInTheDocument）
    expect(await screen.findByText("test user")).toBeInTheDocument();
  });
});
