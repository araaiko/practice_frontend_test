/** 外部import */
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

/** 内部import */
import styles from "./App.module.css";
import { Auth } from "./components/Auth";
import { MainPage } from "./components/MainPage";

const App = () => {
  return (
    <div className={styles.app__root}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/vehicle" element={<MainPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
