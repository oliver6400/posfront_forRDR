import { useState, useEffect } from "react";
import {
  login as apiLogin,
  requestPasswordReset as apiRequestPasswordReset,
  resetPassword as apiResetPassword,
  logout as apiLogout,
} from "../services/api/auth.api";
import { useNavigate } from "react-router-dom";

export function useAuth() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ NUEVO: Verificar token al cargar
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");

    if (!token && storedUser) {
      // Si no hay token pero sí usuario, limpiar todo
      localStorage.removeItem("user");
      setUser(null);
    }
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null); // ✅ Limpiar error previo
    try {
      const response = await apiLogin({ username, password });
      localStorage.setItem("authToken", response.access);
      localStorage.setItem("user", JSON.stringify(response.user));
      setUser(response.user);

      // ✅ MEJORADO: Redirigir según el rol
      if (response.user.role === "Admin" || response.user.role === "SuperAdmin") {
        navigate("/admin");
      } else {
        navigate("/menu");
      }

      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Login failed";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiRequestPasswordReset({ email });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Request failed";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiResetPassword({ token, newPassword });
      navigate("/login");
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Password reset failed";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    apiLogout();
    setUser(null);
    navigate("/login");
  };

  // ✅ NUEVO: Función para verificar si el usuario es admin
  const isAdmin = () => (user?.role === "Admin" || user?.role === "SuperAdmin");

  return {
    user,
    error,
    loading,
    login,
    logout,
    requestPasswordReset,
    resetPassword,
    isAuthenticated: !!user,
    isAdmin,
    setError,
  };
}
