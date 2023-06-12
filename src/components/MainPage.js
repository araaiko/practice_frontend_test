/** 外部import */
import React from "react";
import { useNavigate } from "react-router-dom";

/** 内部import */

export const MainPage = () => {
  const navigate = useNavigate();

  // ログアウト
  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div>
      <button data-testid="btn-logout" onClick={logout}>
        Logout
      </button>
    </div>
  );
};
