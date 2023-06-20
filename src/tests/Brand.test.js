/** 外部import */
import React from "react";
import { render, screen, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

/** 内部import */
// vehicleSlice.reducerをvehicleReducerという名でimport
import vehicleReducer from "../features/vehicleSlice";
// testを行うコンポーネント
import { Brand } from "../components/Brand";

const handlers = [
  // 一覧取得
  rest.get("http://localhost:8000/api/brands/", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: 1, brand_name: "Toyota" },
        { id: 2, brand_name: "Tesla" },
      ])
    );
  }),
  // 新規作成
  rest.post("http://localhost:8000/api/brands/", (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ id: 3, brand_name: "Audi" }));
  }),
  // 更新
  rest.put("http://localhost:8000/api/brands/1/", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ id: 1, brand_name: "new Toyota" }));
  }),
  rest.put("http://localhost:8000/api/brands/2/", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ id: 2, brand_name: "new Tesla" }));
  }),
  // 削除
  rest.delete("http://localhost:8000/api/brands/1/", (req, res, ctx) => {
    return res(ctx.status(200));
  }),
  rest.delete("http://localhost:8000/api/brands/2/", (req, res, ctx) => {
    return res(ctx.status(200));
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

describe("Brand Component Test Cases", () => {
  // テスト用のstoreを定義する
  let store;
  beforeEach(() => {
    store = configureStore({
      reducer: {
        vehicle: vehicleReducer,
      },
    });
  });

  /** Brandコンポーネント要素の表示 */
  it("1 :Should render all the elements correctly", async () => {
    // testing-libraryのrenderを使って、Brandコンポーネントの要素を取得
    render(
      <Provider store={store}>
        <Brand />
      </Provider>
    );
    // 上記のテスト結果はtesting-libraryのscreenに入っている。実際に確認するためにはscreen.debug()
    //eslint-disable-next-line
    // screen.debug();
    expect(screen.getByTestId("h3-brand")).toBeTruthy();
    // 入力欄（input type=text）が表示されているかどうか
    expect(screen.getByRole("textbox")).toBeTruthy();
    expect(screen.getByTestId("btn-post")).toBeTruthy();
    // 非同期処理が完了したか確認するための要素チェック（非同期処理で取得したデータの一部をfindByTextでチェックしている）
    expect(await screen.findByText("Toyota")).toBeInTheDocument();
    // getAllByRole("hoge")[Num]：複数ある同じタグ要素から該当要素をチェックする
    expect(screen.getAllByRole("listitem")[0]).toBeTruthy();
    expect(screen.getAllByRole("listitem")[1]).toBeTruthy();
    // 表示されている2つのリストアイテムにそれぞれidが割り当てられたボタンが存在するかどうか
    expect(screen.getByTestId("delete-brand-1")).toBeTruthy();
    expect(screen.getByTestId("delete-brand-2")).toBeTruthy();
    expect(screen.getByTestId("edit-brand-1")).toBeTruthy();
    expect(screen.getByTestId("edit-brand-2")).toBeTruthy();
  });

  /** Brand一覧の表示 */
  it("2 :Should render list of segments from REST API", async () => {
    // testing-libraryのrenderを使って、Brandコンポーネントの要素を取得
    render(
      <Provider store={store}>
        <Brand />
      </Provider>
    );

    // データが存在していないことを確認（非同期処理が完了する前）
    expect(screen.queryByText("Toyota")).toBeNull();
    expect(screen.queryByText("Tesla")).toBeNull();
    // 非同期処理が完了したかを確認する＆Brand一覧のうちの1アイテムが表示されているかも併せて確認する
    expect(await screen.findByText("Toyota")).toBeInTheDocument();
    // 非同期処理で取得・表示させるBrand名にはdata-testid属性を付与しているので、
    // getByTestIdで取得した要素のテキストに期待したものが表示されているか確認する
    expect(screen.getByTestId("list-2").textContent).toBe("Tesla");
  });

  /** Brand一覧を取得できなかったとき */
  it("3 :Should not render list of brands from REST API when rejected", async () => {
    // server.useを使って、getメソッドのモックのstatusを400に書き換え
    server.use(
      rest.get("http://localhost:8000/api/brands/", (req, res, ctx) => {
        return res(ctx.status(400));
      })
    );
    // testing-libraryのrenderを使って、Brandコンポーネントの要素を取得
    render(
      <Provider store={store}>
        <Brand />
      </Provider>
    );

    // データが存在していないことを確認（非同期処理が完了する前）
    expect(screen.queryByText("Toyota")).toBeNull();
    expect(screen.queryByText("Tesla")).toBeNull();
    // 非同期処理が完了し、データが取得できなかったことを確認する
    // （取得失敗時には、エラーメッセージをuseStateを使って表示するよう実装していたので）
    expect(await screen.findByText("Get error!")).toBeInTheDocument();
    // "Toyota", "Tesla" はブラウザ上に表示されていないはずなので、改めて存在していないことを確認する
    expect(screen.queryByText("Toyota")).toBeNull();
    expect(screen.queryByText("Tesla")).toBeNull();
  });

  /** 新規Brand作成(ユーザー入力) */
  it("4 :Should add new segment and also to the list", async () => {
    // userEventのsetup
    const user = userEvent.setup();
    // testing-libraryのrenderを使って、Brandコンポーネントの要素を取得
    render(
      <Provider store={store}>
        <Brand />
      </Provider>
    );

    // 新規作成する前に、ブラウザに表示されるリストにダミーデータが存在しないことを確認する
    expect(screen.queryByText("Audi")).toBeNull();
    // 入力欄（input要素）をplaceholder経由で取得する
    const inputValue = screen.getByPlaceholderText("new brand name");
    // ユーザーの入力操作をシミュレーション
    //（今回の場合、未入力のままだとCreateボタンは無効化されたままになるため、余計にこの操作は必要）
    // typeイベントの場合、入力される度にstateのvalueがonChangeによって変更されるため、await act(() =>)でラップする必要あり
    // 単にawaitだけだとstate更新に耐えられないからactで囲めって警告文が出る
    await act(() => user.type(inputValue, "Audi"));
    user.click(screen.getByTestId("btn-post"));
    // 作成されたテキストがブラウザ上に表示されるのを確認する
    //（新規作成の処理が走り、非同期処理でダミーデータがpost＆state経由で一覧に追加・ブラウザ表示されるのを確認する）
    expect(await screen.findByText("Audi")).toBeInTheDocument();
    // 入力欄が空欄になったか確認
    expect(screen.getByDisplayValue("")).toBeInTheDocument();
  });

  /** 選択Brandの削除 */
  // id 1 のリストアイテム（Toyota）の削除テスト
  it("5 :Should delete segment(id 1) and also from list", async () => {
    // userEventのsetup
    const user = userEvent.setup();
    // testing-libraryのrenderを使って、Brandコンポーネントの要素を取得
    render(
      <Provider store={store}>
        <Brand />
      </Provider>
    );

    // データが存在していないことを確認（非同期処理が完了する前）
    expect(screen.queryByText("Toyota")).toBeNull();
    expect(screen.queryByText("Tesla")).toBeNull();
    // 非同期処理が完了したかを確認する＆Brand一覧のうちの1アイテムが表示されているかも併せて確認する
    expect(await screen.findByText("Toyota")).toBeInTheDocument();
    // 非同期処理で取得・表示させるBrand名にはdata-testid属性を付与しているので、
    // getByTestIdで取得した要素のテキストに期待したものが表示されているか確認する
    expect(screen.getByTestId("list-2").textContent).toBe("Tesla");
    // 該当リストアイテムの削除ボタンを指定し、クリックイベントを走らせる
    user.click(screen.getByTestId("delete-brand-1"));
    // 削除に成功した場合、useStateを使ってメッセージを表示するよう実装していたので、表示されているか確認する
    expect(await screen.findByText("Deleted in brand!")).toBeInTheDocument();
    // 削除したものがブラウザ上に存在していないことを確認する
    expect(screen.queryByText("Toyota")).toBeNull();
  });

  // id 2 のリストアイテム（Tesla）の削除テスト
  it("6 :Should delete segment(id 2) and also from list", async () => {
    // userEventのsetup
    const user = userEvent.setup();
    // testing-libraryのrenderを使って、Brandコンポーネントの要素を取得
    render(
      <Provider store={store}>
        <Brand />
      </Provider>
    );

    expect(screen.queryByText("Toyota")).toBeNull();
    expect(screen.queryByText("Tesla")).toBeNull();
    expect(await screen.findByText("Toyota")).toBeInTheDocument();
    expect(screen.getByTestId("list-2").textContent).toBe("Tesla");
    user.click(screen.getByTestId("delete-brand-2"));
    expect(await screen.findByText("Deleted in brand!")).toBeInTheDocument();
    expect(screen.queryByText("Tesla")).toBeNull();
  });

  /** 選択Brandの更新 */
  // id 1 のリストアイテム（Toyota）の更新テスト
  it("7 :Should update segment(id 1) and also in the list", async () => {
    // userEventのsetup
    const user = userEvent.setup();
    // testing-libraryのrenderを使って、Brandコンポーネントの要素を取得
    render(
      <Provider store={store}>
        <Brand />
      </Provider>
    );

    // データが存在していないことを確認（非同期処理が完了する前）
    expect(screen.queryByText("Toyota")).toBeNull();
    expect(screen.queryByText("Tesla")).toBeNull();
    // 非同期処理が完了したかを確認する＆Brand一覧のうちの1アイテムが表示されているかも併せて確認する
    expect(await screen.findByText("Toyota")).toBeInTheDocument();
    // 非同期処理で取得・表示させるBrand名にはdata-testid属性を付与しているので、
    // getByTestIdで取得した要素のテキストに期待したものが表示されているか確認する
    expect(screen.getByTestId("list-2").textContent).toBe("Tesla");
    // userEventのclickで、該当アイテムのeditボタンをクリック
    user.click(screen.getByTestId("edit-brand-1"));
    // 入力欄に編集したいデータが表記されたか確認
    expect(await screen.findByDisplayValue("Toyota")).toBeInTheDocument();
    // 入力欄の要素をplaceholder経由で取得
    const inputValue = screen.getByPlaceholderText("new brand name");
    // ユーザーの入力操作をシミュレーション
    // typeイベントの場合、入力される度にstateのvalueがonChangeによって変更されるため、await act(() =>)でラップする必要あり
    // 単にawaitだけだとstate更新に耐えられないからactで囲めって警告文が出る
    await act(() => user.type(inputValue, "new Toyota"));
    // userEventのclickで、入力欄にあるUpdateボタンをクリック
    await user.click(screen.getByTestId("btn-post"));
    // 更新に成功した場合、useStateを使ってメッセージを表示するよう実装していたので、表示されているか確認する
    expect(await screen.findByText("Updated in brand!")).toBeInTheDocument();
    // 該当リストアイテムのテキストが期待した内容に変更されているか確認する
    expect(screen.getByTestId("list-1").textContent).toBe("new Toyota");
    // 入力欄が空欄になったか確認
    expect(screen.getByDisplayValue("")).toBeInTheDocument();
  });

  // id 2 のリストアイテム（Tesla）の更新テスト
  it("8 :Should update segment(id 2) and also in the list", async () => {
    // userEventのsetup
    const user = userEvent.setup();
    // testing-libraryのrenderを使って、Brandコンポーネントの要素を取得
    render(
      <Provider store={store}>
        <Brand />
      </Provider>
    );

    expect(screen.queryByText("Toyota")).toBeNull();
    expect(screen.queryByText("Tesla")).toBeNull();
    expect(await screen.findByText("Toyota")).toBeInTheDocument();
    expect((await screen.findByTestId("list-2")).textContent).toBe("Tesla");
    // 今回の場合、該当リストアイテムの編集ボタンを押すと、入力欄に編集データが表記＆入力欄横のボタンが
    // 「Create」から「Update」に変わる。（入力欄のstateを更新している）
    // state更新を待ってから次のテストを行わないと終盤のテストに支障をきたすため、await act()でラップしている
    await act(() => user.click(screen.getByTestId("edit-brand-2")));
    const inputValue = screen.getByPlaceholderText("new brand name");
    await act(() => user.type(inputValue, "new Tesla"));
    user.click(screen.getByTestId("btn-post"));
    expect(await screen.findByText("Updated in brand!")).toBeInTheDocument();
    expect(screen.getByTestId("list-2").textContent).toBe("new Tesla");
    expect(screen.getByDisplayValue("")).toBeInTheDocument();
  });
});
