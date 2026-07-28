import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { userApi } from "../api/client";

const AuthContext = createContext(null);

function decodePayload(token) {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("access_token"));
  const [email, setEmail] = useState(() => localStorage.getItem("user_email"));

  const userId = useMemo(() => {
    if (!token) return null;
    const payload = decodePayload(token);
    return payload?.sub ?? null;
  }, [token]);

  const login = useCallback(async (emailInput, password) => {
    const { access_token } = await userApi.login(emailInput, password);
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("user_email", emailInput);
    setToken(access_token);
    setEmail(emailInput);
  }, []);

  const signup = useCallback(async (emailInput, password) => {
    const { access_token } = await userApi.signup(emailInput, password);
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("user_email", emailInput);
    setToken(access_token);
    setEmail(emailInput);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_email");
    setToken(null);
    setEmail(null);
  }, []);

  const value = { token, userId, email, isAuthenticated: !!token, login, signup, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}