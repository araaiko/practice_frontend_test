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
import { Vehicle } from "../components/Vehicle";
// Vehicleコンポーネントで使うコンポーネント
import { Brand } from "../components/Brand";
import { Segment } from "../components/Segment";

const handlers = [
  // Segments一覧の取得
  rest.get("http://localhost:8000/api/segments/", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: 1, segment_name: "SUV" },
        { id: 2, segment_name: "EV" },
      ])
    );
  }),
  // Brands一覧の取得
  rest.get("http://localhost:8000/api/brands/", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: 1, brand_name: "Audi" },
        { id: 2, brand_name: "Tesla" },
      ])
    );
  }),
  /** cascade delete（vehicleに紐づいているsegmentまたはbrandを削除したら、vehicleも一緒に削除される） */
  // 選択したsegmentの削除
  rest.delete("http://localhost:8000/api/segments/1/", (req, res, ctx) => {
    return res(ctx.status(200));
  }),
  rest.delete("http://localhost:8000/api/segments/2/", (req, res, ctx) => {
    return res(ctx.status(200));
  }),
  // 選択したbrandの削除
  rest.delete("http://localhost:8000/api/brands/1/", (req, res, ctx) => {
    return res(ctx.status(200));
  }),
  rest.delete("http://localhost:8000/api/brands/2/", (req, res, ctx) => {
    return res(ctx.status(200));
  }),
  /** vehicle */
  // vehicles一覧の取得
  rest.get("http://localhost:8000/api/vehicles/", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          vehicle_name: "SQ7",
          release_year: 2019,
          price: 300.12,
          segment: 1,
          brand: 1,
          segment_name: "SUV",
          brand_name: "Audi",
        },
        {
          id: 2,
          vehicle_name: "MODEL S",
          release_year: 2020,
          price: 400.12,
          segment: 2,
          brand: 2,
          segment_name: "EV",
          brand_name: "Tesla",
        },
      ])
    );
  }),
  // 新規vehicleの作成
  rest.post("http://localhost:8000/api/vehicles/", (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: 3,
        vehicle_name: "MODEL X",
        release_year: 2019,
        price: 350.12,
        segment: 2,
        brand: 2,
        segment_name: "EV",
        brand_name: "Tesla",
      })
    );
  }),
  // 選択したvehicleの更新
  rest.put("http://localhost:8000/api/vehicles/1/", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 1,
        vehicle_name: "new SQ7",
        release_year: 2019,
        price: 300.12,
        segment: 1,
        brand: 1,
        segment_name: "SUV",
        brand_name: "Audi",
      })
    );
  }),
  rest.put("http://localhost:8000/api/vehicles/2/", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 2,
        vehicle_name: "new MODEL S",
        release_year: 2020,
        price: 400.12,
        segment: 2,
        brand: 2,
        segment_name: "EV",
        brand_name: "Tesla",
      })
    );
  }),
  // 選択したvehicleの削除
  rest.delete("http://localhost:8000/api/vehicles/1/", (req, res, ctx) => {
    return res(ctx.status(200));
  }),
  rest.delete("http://localhost:8000/api/vehicles/2/", (req, res, ctx) => {
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

describe("Vehicle Component Test Cases", () => {
  let store;
  beforeEach(() => {
    store = configureStore({
      reducer: {
        vehicle: vehicleReducer,
      },
    });
  });

  // vehicleコンポーネントの要素の表示
  it("1 :Should render all the elements correctly", async () => {
    render(
      <Provider store={store}>
        <Vehicle />
      </Provider>
    );

    expect(screen.getByTestId("h3-vehicle")).toBeTruthy();
    expect(screen.getByPlaceholderText("new vehicle name")).toBeTruthy();
    expect(screen.getByPlaceholderText("year of release")).toBeTruthy();
    expect(screen.getByPlaceholderText("price")).toBeTruthy();
    expect(screen.getByTestId("select-segment")).toBeTruthy();
    expect(screen.getByTestId("select-brand")).toBeTruthy();
    expect(screen.getByTestId("btn-vehicle-post")).toBeTruthy();
    // 非同期処理の完了を待つ
    expect(await screen.findByText("SQ7")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")[0]).toBeTruthy();
    expect(screen.getAllByRole("listitem")[1]).toBeTruthy();
    expect(screen.getByTestId("delete-veh-1")).toBeTruthy();
    expect(screen.getByTestId("delete-veh-2")).toBeTruthy();
    expect(screen.getByTestId("edit-veh-1")).toBeTruthy();
    expect(screen.getByTestId("edit-veh-2")).toBeTruthy();
  });

  /** vehicle一覧の表示 */
  it("2 :Should render list of vehicles from REST API", async () => {
    render(
      <Provider store={store}>
        <Vehicle />
      </Provider>
    );

    expect(screen.queryByText("SQ7")).toBeNull();
    expect(screen.queryByText("MODEL S")).toBeNull();
    // 非同期処理の完了を待つ
    expect(await screen.findByText("SQ7")).toBeInTheDocument();
    expect(screen.getByTestId("name-2").textContent).toBe("MODEL S");
  });

  /** vehicle一覧を取得できなかったとき */
  it("3 :Should not render list of vehicles from REST API when rejected", async () => {
    // エンドポイントのモックを400に書き換え
    server.use(
      rest.get("http://localhost:8000/api/vehicles/", (req, res, ctx) => {
        return res(ctx.status(400));
      })
    );

    render(
      <Provider store={store}>
        <Vehicle />
      </Provider>
    );

    expect(screen.queryByText("SQ7")).toBeNull();
    expect(screen.queryByText("MODEL S")).toBeNull();
    // 非同期処理でデータ取得に失敗した場合、useStateを使ってエラーメッセージを表示するよう実装していたので、
    // それを使って確認
    expect(await screen.findByText("Get error!")).toBeInTheDocument();
    expect(screen.queryByText("SQ7")).toBeNull();
    expect(screen.queryByText("MODEL S")).toBeNull();
  });

  /** 新規Vehicle作成（ユーザー入力） */
  it("4 :Should add new vehicle and also to the list", async () => {
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <Segment />
        <Brand />
        <Vehicle />
      </Provider>
    );

    // postメソッドで作成予定のデータが既にブラウザ上に存在しないことを確認
    expect(screen.queryByText("MODEL X")).toBeNull();
    // ブラウザにリストが表示されるのを待つ（非同期処理の完了を待つ）
    expect(await screen.findByText("SQ7")).toBeInTheDocument();
    // 入力欄の取得＆入力操作（リリース年と価格は初期値が入っていて、それを利用するので、今回は操作しなくてOK）
    const inputValue = screen.getByPlaceholderText("new vehicle name");
    await act(() => user.type(inputValue, "MODEL X"));
    // セレクトボックス要素の取得＆選択肢の指定
    user.selectOptions(screen.getByTestId("select-segment"), "2");
    user.selectOptions(screen.getByTestId("select-brand"), "2");
    // 新規作成ボタンクリック
    user.click(screen.getByTestId("btn-vehicle-post"));
    // ダミーデータが作成されたか確認
    expect(await screen.findByText("MODEL X")).toBeInTheDocument();
  });

  /** 選択Vehicleの削除 */
  // id 1 のリストアイテム（SQ7）の削除テスト
  it("5 :Should delete segment(id 1) and also from list", async () => {
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <Vehicle />
      </Provider>
    );

    expect(screen.queryByText("SQ7")).toBeNull();
    expect(screen.queryByText("MODEL S")).toBeNull();
    expect(await screen.findByText("SQ7")).toBeInTheDocument();
    expect(screen.getByTestId("name-2").textContent).toBe("MODEL S");
    user.click(screen.getByTestId("delete-veh-1"));
    expect(await screen.findByText("Deleted in vehicle!")).toBeInTheDocument();
    expect(screen.queryByText("SQ7")).toBeNull();
  });
  // id 2 のリストアイテム（MODEL S）の削除テスト
  it("6 :Should delete segment(id 2) and also from list", async () => {
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <Vehicle />
      </Provider>
    );

    expect(screen.queryByText("SQ7")).toBeNull();
    expect(screen.queryByText("MODEL S")).toBeNull();
    expect(await screen.findByText("SQ7")).toBeInTheDocument();
    expect(screen.getByTestId("name-2").textContent).toBe("MODEL S");
    user.click(screen.getByTestId("delete-veh-2"));
    expect(await screen.findByText("Deleted in vehicle!")).toBeInTheDocument();
    expect(screen.queryByText("MODEL S")).toBeNull();
  });

  /** 選択Vehicleの更新 */
  // id 1 のリストアイテム（SQ7）の更新テスト
  it("7 :Should update segment(id 1) and also in the list", async () => {
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <Vehicle />
      </Provider>
    );

    expect(screen.queryByText("SQ7")).toBeNull();
    expect(screen.queryByText("MODEL S")).toBeNull();
    expect(await screen.findByText("SQ7")).toBeInTheDocument();
    expect(screen.getByTestId("name-2").textContent).toBe("MODEL S");
    user.click(screen.getByTestId("edit-veh-1"));
    expect(await screen.findByDisplayValue("SQ7")).toBeInTheDocument();
    const inputValue = screen.getByPlaceholderText("new vehicle name");
    await act(() => user.type(inputValue, "new SQ7"));
    user.click(screen.getByTestId("btn-vehicle-post"));
    expect(await screen.findByText("Updated in vehicle!")).toBeInTheDocument();
    expect(screen.getByTestId("name-1").textContent).toBe("new SQ7");
    expect(screen.getByDisplayValue("")).toBeInTheDocument();
  });
  // id 2 のリストアイテム（MODEL S）の更新テスト
  it("8 :Should update segment(id 2) and also in the list", async () => {
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <Vehicle />
      </Provider>
    );

    expect(screen.queryByText("SQ7")).toBeNull();
    expect(screen.queryByText("MODEL S")).toBeNull();
    expect(await screen.findByText("SQ7")).toBeInTheDocument();
    expect(screen.getByTestId("name-2").textContent).toBe("MODEL S");
    user.click(screen.getByTestId("edit-veh-2"));
    expect(await screen.findByDisplayValue("MODEL S")).toBeInTheDocument();
    const inputValue = screen.getByPlaceholderText("new vehicle name");
    await act(() => user.type(inputValue, "new MODEL S"));
    user.click(screen.getByTestId("btn-vehicle-post"));
    expect(await screen.findByText("Updated in vehicle!")).toBeInTheDocument();
    expect(screen.getByTestId("name-2").textContent).toBe("new MODEL S");
    expect(screen.getByDisplayValue("")).toBeInTheDocument();
  });

  /** cascade delete（vehicleに紐づいているsegmentまたはbrandを削除したら、vehicleも一緒に削除される） */
  // Segmentのid 2（EV）を削除した時に、それに紐づいているVehicleアイテム（id 2, MODEL S）も削除されるか
  it("9 :Should MODEL S(id 2) cascade deleted when EV(id 2) seg deleted", async () => {
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <Segment />
        <Brand />
        <Vehicle />
      </Provider>
    );

    // データが存在していないことを確認（非同期処理が完了する前）
    expect(screen.queryByText("SQ7")).toBeNull();
    expect(screen.queryByText("MODEL S")).toBeNull();
    // 非同期処理が完了したか確認＆全てのリストアイテムが表示されているかの確認
    expect(await screen.findByText("SQ7")).toBeInTheDocument();
    expect(screen.getByTestId("name-2").textContent).toBe("MODEL S");
    // Segmentのアイテム(id 2, EV)の削除ボタンをクリック (Segmentコンポーネント)
    user.click(screen.getByTestId("delete-seg-2"));
    // 削除成功後にメッセージを表示するよう実装していたので、それの確認 (Segmentコンポーネント)
    expect(await screen.findByText("Deleted in segment!")).toBeInTheDocument();
    // Segmentのアイテム(id 2, EV)に紐づいていたVehicleアイテム(id 2, MODEL S)も削除されているはずなので、確認
    expect(screen.queryByText("MODEL S")).toBeNull();
    // 残りのVehicleアイテム(id 1, SQ7)は残っているはずなので、確認
    expect(screen.getByTestId("name-1").textContent).toBe("SQ7");
  });

  // Brandのid 2（Tesla）を削除した時に、それに紐づいているVehicleアイテム（id 2, MODEL S）も削除されるか
  it("10 :Should MODEL S(id 2) cascade deleted when Tesla(id 2) brand deleted", async () => {
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <Segment />
        <Brand />
        <Vehicle />
      </Provider>
    );

    expect(screen.queryByText("SQ7")).toBeNull();
    expect(screen.queryByText("MODEL S")).toBeNull();
    expect(await screen.findByText("SQ7")).toBeInTheDocument();
    expect(screen.getByTestId("name-2").textContent).toBe("MODEL S");
    user.click(screen.getByTestId("delete-brand-2"));
    expect(await screen.findByText("Deleted in brand!")).toBeInTheDocument();
    expect(screen.queryByText("MODEL S")).toBeNull();
    expect(screen.getByTestId("name-1").textContent).toBe("SQ7");
  });

  // Segmentのid 1（SUV）を削除した時に、それに紐づいているVehicleアイテム（id 1, SQ7）も削除されるか
  it("11 :Should SQ7(id 1) cascade deleted when SUV(id 1) seg deleted", async () => {
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <Segment />
        <Brand />
        <Vehicle />
      </Provider>
    );

    expect(screen.queryByText("SQ7")).toBeNull();
    expect(screen.queryByText("MODEL S")).toBeNull();
    expect(await screen.findByText("SQ7")).toBeInTheDocument();
    expect(screen.getByTestId("name-2").textContent).toBe("MODEL S");
    user.click(screen.getByTestId("delete-seg-1"));
    expect(await screen.findByText("Deleted in segment!")).toBeInTheDocument();
    expect(screen.queryByText("SQ7")).toBeNull();
    expect(screen.getByTestId("name-2").textContent).toBe("MODEL S");
  });

  // Brandのid 1（Audi）を削除した時に、それに紐づいているVehicleアイテム（id 1, SQ7）も削除されるか
  it("12 :Should SQ7(id 1) cascade deleted when Audi(id 1) brand deleted", async () => {
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <Segment />
        <Brand />
        <Vehicle />
      </Provider>
    );

    expect(screen.queryByText("SQ7")).toBeNull();
    expect(screen.queryByText("MODEL S")).toBeNull();
    expect(await screen.findByText("SQ7")).toBeInTheDocument();
    expect(screen.getByTestId("name-2").textContent).toBe("MODEL S");
    user.click(screen.getByTestId("delete-brand-1"));
    expect(await screen.findByText("Deleted in brand!")).toBeInTheDocument();
    expect(screen.queryByText("SQ7")).toBeNull();
    expect(screen.getByTestId("name-2").textContent).toBe("MODEL S");
  });
});
