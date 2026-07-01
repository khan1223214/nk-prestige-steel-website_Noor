import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const token = localStorage.getItem("nk_admin_token");
    const email = localStorage.getItem("nk_admin_email");
    return token && email ? { email } : null;
  });
  const [checking, setChecking] = useState(!!localStorage.getItem("nk_admin_token"));

  useEffect(() => {
    if (!admin) {
      setChecking(false);
      return;
    }
    api
      .get("/auth/me")
      .then((r) => setAdmin({ email: r.data.email }))
      .catch(() => {
        localStorage.removeItem("nk_admin_token");
        localStorage.removeItem("nk_admin_email");
        setAdmin(null);
      })
      .finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("nk_admin_token", data.access_token);
    localStorage.setItem("nk_admin_email", data.email);
    setAdmin({ email: data.email });
    return data;
  };

  const logout = () => {
    localStorage.removeItem("nk_admin_token");
    localStorage.removeItem("nk_admin_email");
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
