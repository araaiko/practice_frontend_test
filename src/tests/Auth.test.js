/** 外部import */
import React from "react";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
// ユーザーによるボタンクリックやタイピングといった動作をシミュレーションするためのもの
import userEvent from "@testing-library/user-event";
// apiをモッキングするモジュール（REST API専用はrest）
import { rest } from "msw";
// サーバーをセットアップする
import { setupServer } from "msw/node";
// reduxのstoreを動かしながらインテグレーションテスト（結合テスト）を行うため、以下も必要
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

/** 内部import */
// authSlice.reducerをauthReducerという名でimport
import authReducer from "../features/authSlice";
// testを行うコンポーネント
import { Auth } from "../components/Auth";

// react-routerのuseNavigateのモック関数
const mockedNavigator = jest.fn();

// Authコンポーネント内のuseNavigateによるページ遷移先を上書き
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedNavigator,
}));

// mswを使った、擬似的なAPIのエンドポイントの作成
const handlers = [
  rest.post("http://localhost:8000/api/auth/", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ token: "abc123" }));
  }),
  rest.post("http://localhost:8000/api/create/", (req, res, ctx) => {
    return res(ctx.status(201));
  }),
];

// サーバーの作成
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

describe("Auth Component Test Cases", () => {
  // reduxのstoreをテスト用に新しく作り、それを実際に動かしながら各コンポーネントの結合テストを行っていく
  // テスト用のstoreを定義する
  let store;
  // 各テストケースの最初に、reduxのconfigureStoreを使って、テスト用のstoreを毎回新たに作るようにする
  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });
  });

  /** Authコンポーネントの要素表示 */
  it("1 :Should render all the elements correctly", async () => {
    // testing-libraryのrenderを使って、Authコンポーネントの要素を取得
    render(
      <Provider store={store}>
        <Auth />
      </Provider>
    );
    // 上記のテスト結果はtesting-libraryのscreenに入っている。実際に確認するためにはscreen.debug()
    //eslint-disable-next-line
    // screen.debug();
    expect(screen.getByTestId("label-username")).toBeTruthy();
    expect(screen.getByTestId("label-password")).toBeTruthy();
    expect(screen.getByTestId("input-username")).toBeTruthy();
    expect(screen.getByTestId("input-password")).toBeTruthy();
    expect(screen.getByRole("button")).toBeTruthy();
    expect(screen.getByTestId("toggle-icon")).toBeTruthy();
  });

  /** Mode トグルボタンの表記切り替え */
  it("2 :Should change button name by icon click", async () => {
    // userEventのsetup
    const user = userEvent.setup();
    // testing-libraryのrenderを使って、Authコンポーネントの要素を取得
    render(
      <Provider store={store}>
        <Auth />
      </Provider>
    );

    // buttonのテキストがLoginだったらテストをパスする
    expect(screen.getByRole("button")).toHaveTextContent("Login");
    // getByTestIdで取得した要素に対し、クリックイベントを走らせる
    user.click(screen.getByTestId("toggle-icon"));
    // buttonのテキストがRegisterだったらテストをパスする
    await waitFor(() =>
      expect(screen.getByRole("button")).toHaveTextContent("Register")
    );
  });

  /** MainPageへの遷移（認証成功時）*/
  it("3 :Should route to MainPage when login is successful", async () => {
    // userEventのsetup
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <Auth />
      </Provider>
    );

    // Loginボタンを押して、Auth.js内に記述したauthUser関数を走らせる
    // login時にはモックサーバーのエンドポイントにアクセスし、成功したら再度authUser関数の処理の続きに戻ってくる
    await user.click(screen.getByText("Login"));
    // ログインに成功したらstateを更新してテキストを表示させる処理を書いていたので、そのテストを記述
    expect(
      await screen.findByText("Successfully logged in!")
    ).toBeInTheDocument();
    // stateでテキスト更新後にページ遷移するよう記述していたので、そのテストを記述
    // mockedNavigator：ページ遷移先をモックしたもの
    // toBeCalledWith()：()内で指定したリンク先が呼び出されたら左記を実行する
    // mockedNavigatorが"/vehicle"で呼び出されたらテストをパスする
    expect(mockedNavigator).toBeCalledWith("/vehicle");
    // 上記の呼び出しがうまくいけば1回だけ呼び出されるはずなので、それを確認する
    expect(mockedNavigator).toHaveBeenCalledTimes(1);
  });

  /** MainPageへ遷移されないことを確認する（認証失敗時）*/
  it("4 :Should not route to MainPage when login is failed", async () => {
    // ログイン用モックサーバーのresを失敗時用に書き換え(対象のitの中だけ有効)
    server.use(
      rest.post("http://localhost:8000/api/auth/", (req, res, ctx) => {
        // 400：bad request
        return res(ctx.status(400));
      })
    );
    // userEventのsetup
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <Auth />
      </Provider>
    );

    await user.click(screen.getByText("Login"));
    // ログインに失敗したらstateを更新してテキストを表示させる処理を書いていたので、そのテストを記述
    expect(await screen.findByText("Login error!")).toBeInTheDocument();
    // mockedNavigatorは呼び出されないはずなので、それを確認する
    expect(mockedNavigator).toHaveBeenCalledTimes(0);
  });

  /** ユーザーの新規登録に成功したとき */
  it("5 :Should output success msg when registration succeeded", async () => {
    // userEventのsetup
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <Auth />
      </Provider>
    );

    // ログインと新規登録を切り替える
    user.click(screen.getByTestId("toggle-icon"));
    // ボタン表記がRegisterに変わるはずなので確認
    await waitFor(() =>
      expect(screen.getByRole("button")).toHaveTextContent("Register")
    );
    // Register表記の要素を取得してクリックイベントを実行
    user.click(screen.getByText("Register"));
    // 登録に成功するとログイン処理が走り、ログインも成功するとSuccessfully logged in!が表示されるはずなので確認
    expect(
      await screen.findByText("Successfully logged in!")
    ).toBeInTheDocument();
    // mockedNavigatorが"/vehicle"で呼び出されたらテストをパスする
    expect(mockedNavigator).toBeCalledWith("/vehicle");
    // 上記の呼び出しがうまくいけば1回だけ呼び出されるはずなので、それを確認する
    expect(mockedNavigator).toHaveBeenCalledTimes(1);
  });

  /** ユーザーの新規登録に失敗したとき */
  it("6 :Should output error msg when registration failed", async () => {
    // ユーザー登録用モックサーバーのresを失敗時用に書き換え
    server.use(
      rest.post("http://localhost:8000/api/create/", (req, res, ctx) => {
        return res(ctx.status(400));
      })
    );
    // userEventのsetup
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <Auth />
      </Provider>
    );

    // ログインと新規登録を切り替える
    user.click(screen.getByTestId("toggle-icon"));
    // ボタン表記がRegisterに変わるはずなので確認
    await waitFor(() =>
      expect(screen.getByRole("button")).toHaveTextContent("Register")
    );
    // Register表記の要素を取得してクリックイベントを実行
    user.click(screen.getByText("Register"));
    // 登録に失敗するとRegistration error!が表示されるはずなので確認
    expect(await screen.findByText("Registration error!")).toBeInTheDocument();
    // mockedNavigatorは呼び出されないはずなので、それを確認する
    expect(mockedNavigator).toHaveBeenCalledTimes(0);
  });

  /** ユーザーの新規登録は成功したが、ログイン処理に失敗したとき */
  it("7 :Should output login error msg when registration success but login failed", async () => {
    // ログイン用モックサーバーのresを失敗時用に書き換え(対象のitの中だけ有効)
    server.use(
      rest.post("http://localhost:8000/api/auth/", (req, res, ctx) => {
        // 400：bad request
        return res(ctx.status(400));
      })
    );
    // userEventのsetup
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <Auth />
      </Provider>
    );

    // ログインと新規登録を切り替える
    user.click(screen.getByTestId("toggle-icon"));
    // ボタン表記がRegisterに変わるはずなので確認
    await waitFor(() =>
      expect(screen.getByRole("button")).toHaveTextContent("Register")
    );
    // Register表記の要素を取得してクリックイベントを実行
    user.click(screen.getByText("Register"));
    // 登録に成功するとログイン処理が走る。しかしログインに失敗した場合Login error!が表示されるはずなので確認
    expect(await screen.findByText("Login error!")).toBeInTheDocument();
    // mockedNavigatorは呼び出されないはずなので、それを確認する
    expect(mockedNavigator).toHaveBeenCalledTimes(0);
  });
});
