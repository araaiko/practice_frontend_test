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
import { Segment } from "../components/Segment";

const handlers = [
  // 一覧取得
  rest.get("http://localhost:8000/api/segments/", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: 1, segment_name: "K-CAR" },
        { id: 2, segment_name: "EV" },
      ])
    );
  }),
  // 新規作成
  rest.post("http://localhost:8000/api/segments/", (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ id: 3, segment_name: "Large SUV" }));
  }),
  // 更新
  rest.put("http://localhost:8000/api/segments/1/", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ id: 1, segment_name: "new K-CAR" }));
  }),
  rest.put("http://localhost:8000/api/segments/2/", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ id: 2, segment_name: "new EV" }));
  }),
  // 削除
  rest.delete("http://localhost:8000/api/segments/1/", (req, res, ctx) => {
    return res(ctx.status(200));
  }),
  rest.delete("http://localhost:8000/api/segments/2/", (req, res, ctx) => {
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

describe("Segment Component Test Cases", () => {
  // テスト用のstoreを定義する
  let store;
  beforeEach(() => {
    store = configureStore({
      reducer: {
        vehicle: vehicleReducer,
      },
    });
  });

  /** Segmentコンポーネントの表示 */
  it("1 :Should render all the elements correctly", async () => {
    render(
      <Provider store={store}>
        <Segment />
      </Provider>
    );

    expect(screen.getByTestId("h3-segment")).toBeTruthy();
    expect(screen.getByRole("textbox")).toBeTruthy();
    expect(screen.getByTestId("btn-post")).toBeTruthy();
    // 非同期処理の完了を確認
    expect(await screen.findByText("K-CAR")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")[0]).toBeTruthy();
    expect(screen.getAllByRole("listitem")[1]).toBeTruthy();
    expect(screen.getByTestId("delete-seg-1")).toBeTruthy();
    expect(screen.getByTestId("delete-seg-2")).toBeTruthy();
    expect(screen.getByTestId("edit-seg-1")).toBeTruthy();
    expect(screen.getByTestId("edit-seg-2")).toBeTruthy();
  });

  /** Segment一覧の表示 */
  it("2 :Should render list of segments from REST API", async () => {
    render(
      <Provider store={store}>
        <Segment />
      </Provider>
    );

    expect(screen.queryByText("K-CAR")).toBeNull();
    expect(screen.queryByText("EV")).toBeNull();
    // 非同期処理の完了を確認
    expect(await screen.findByText("K-CAR")).toBeInTheDocument();
    expect(screen.getByTestId("list-1").textContent).toBe("K-CAR");
    expect(screen.getByTestId("list-2").textContent).toBe("EV");
  });

  /** Segment一覧の取得に失敗したとき */
  it("3 :Should not render list of segments from REST API when rejected", async () => {
    server.use(
      rest.get("http://localhost:8000/api/segments/", (req, res, ctx) => {
        return res(ctx.status(400));
      })
    );

    render(
      <Provider store={store}>
        <Segment />
      </Provider>
    );

    expect(screen.queryByText("K-CAR")).toBeNull();
    expect(screen.queryByText("EV")).toBeNull();
    // 取得に失敗した場合、エラーメッセージを表示するよう実装していたため、それが表示されるか確認
    expect(await screen.findByText("Get error!")).toBeInTheDocument();
    expect(screen.queryByText("K-CAR")).toBeNull();
    expect(screen.queryByText("EV")).toBeNull();
  });

  /** 新規Segment作成（ユーザー入力） */
  it("4 :Should add new segment and also to the list", async () => {
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <Segment />
      </Provider>
    );

    expect(screen.queryByText("Large SUV")).toBeNull();
    const inputValue = screen.getByPlaceholderText("new segment name");
    await act(() => user.type(inputValue, "Large SUV"));
    user.click(screen.getByTestId("btn-post"));
    expect(await screen.findByText("Large SUV")).toBeInTheDocument();
    expect(screen.getByDisplayValue("")).toBeInTheDocument();
  });

  /** 選択Segmentの削除 */
  // id 1 のリストアイテム(K-CAR)の削除テスト
  it("5 :Should delete segment(id 1) and also from list", async () => {
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <Segment />
      </Provider>
    );

    expect(screen.queryByText("K-CAR")).toBeNull();
    expect(screen.queryByText("EV")).toBeNull();
    expect(await screen.findByText("K-CAR")).toBeInTheDocument();
    expect(screen.getByTestId("list-2").textContent).toBe("EV");
    user.click(screen.getByTestId("delete-seg-1"));
    // 削除に成功した場合、メッセージを表示するよう実装していたため、それが表示されるか確認（非同期処理の完了確認も込めて）
    expect(await screen.findByText("Deleted in segment!")).toBeInTheDocument();
    expect(screen.queryByText("K-CAR")).toBeNull();
  });
  // id 2 のリストアイテム(EV)の削除テスト
  it("6 :Should delete segment(id 2) and also from list", async () => {
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <Segment />
      </Provider>
    );

    expect(screen.queryByText("K-CAR")).toBeNull();
    expect(screen.queryByText("EV")).toBeNull();
    expect(await screen.findByText("K-CAR")).toBeInTheDocument();
    expect(screen.getByTestId("list-2").textContent).toBe("EV");
    user.click(screen.getByTestId("delete-seg-2"));
    // 削除に成功した場合、メッセージを表示するよう実装していたため、それが表示されるか確認（非同期処理の完了確認も込めて）
    expect(await screen.findByText("Deleted in segment!")).toBeInTheDocument();
    expect(screen.queryByText("EV")).toBeNull();
  });

  /** 選択Segmentの更新 */
  // id 1 のリストアイテム(K-CAR)の更新テスト
  it("7 :Should update segment(id 1) and also in the list", async () => {
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <Segment />
      </Provider>
    );

    expect(screen.queryByText("K-CAR")).toBeNull();
    expect(screen.queryByText("EV")).toBeNull();
    expect(await screen.findByText("K-CAR")).toBeInTheDocument();
    expect(screen.getByTestId("list-2").textContent).toBe("EV");
    user.click(screen.getByTestId("edit-seg-1"));
    // 入力欄に、編集したいデータが表記されたか確認
    // これをしないとeditedSegmentが更新される前にtypeイベントが走ってしまい、更新処理がうまくいかなくなる
    expect(await screen.findByDisplayValue("K-CAR")).toBeInTheDocument();
    const inputValue = screen.getByPlaceholderText("new segment name");
    await act(() => user.type(inputValue, "new K-CAR"));
    user.click(screen.getByTestId("btn-post"));
    expect(await screen.findByText("Updated in segment!")).toBeInTheDocument();
    expect(screen.getByTestId("list-1").textContent).toBe("new K-CAR");
    expect(screen.getByDisplayValue("")).toBeInTheDocument();
  });
  // id 2 のリストアイテム(EV)の更新テスト
  it("8 :Should update segment(id 2) and also in the list", async () => {
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <Segment />
      </Provider>
    );

    expect(screen.queryByText("K-CAR")).toBeNull();
    expect(screen.queryByText("EV")).toBeNull();
    expect(await screen.findByText("K-CAR")).toBeInTheDocument();
    expect(screen.getByTestId("list-2").textContent).toBe("EV");
    user.click(screen.getByTestId("edit-seg-2"));
    // 入力欄に、編集したいデータが表記されたか確認
    // これをしないとeditedSegmentが更新される前にtypeイベントが走ってしまい、更新処理がうまくいかなくなる
    expect(await screen.findByDisplayValue("EV")).toBeInTheDocument();
    const inputValue = screen.getByPlaceholderText("new segment name");
    await act(() => user.type(inputValue, "new EV"));
    user.click(screen.getByTestId("btn-post"));
    expect(await screen.findByText("Updated in segment!")).toBeInTheDocument();
    expect(screen.getByTestId("list-2").textContent).toBe("new EV");
    expect(screen.getByDisplayValue("")).toBeInTheDocument();
  });
});
