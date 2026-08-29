import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchMe, login as loginRequest, signup as signupRequest } from "../services/authService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      localStorage.removeItem("user");
      return null;
    }
  });
  const [booting, setBooting] = useState(Boolean(localStorage.getItem("accessToken")));

  useEffect(() => {
    if (!localStorage.getItem("accessToken")) return;
    fetchMe()
      .then((freshUser) => {
        setUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));
      })
      .catch(() => {
        localStorage.clear();
        setUser(null);
      })
      .finally(() => setBooting(false));
  }, []);

  async function commitAuth(request, payload) {
    const data = await request(payload);
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  const value = useMemo(
    () => ({
      user,
      booting,
      isAdmin: user?.role === "admin",
      login: (payload) => commitAuth(loginRequest, payload),
      signup: (payload) => commitAuth(signupRequest, payload),
      setUser: (nextUser) => {
        setUser(nextUser);
        localStorage.setItem("user", JSON.stringify(nextUser));
      },
      logout: () => {
        localStorage.clear();
        setUser(null);
      }
    }),
    [user, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
