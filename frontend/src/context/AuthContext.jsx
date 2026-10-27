import { createContext, useContext, useEffect } from "react";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const {
    user,
    loading,
    init,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
  } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  const login = async (credentials) => {
    const nextUser = await storeLogin(credentials);
    if (nextUser?.firstName)
      toast.success(`Welcome back, ${nextUser.firstName}!`);
    return nextUser;
  };

  const register = async (data) => {
    const nextUser = await storeRegister(data);
    toast.success("Account created!");
    return nextUser;
  };

  const logout = async () => {
    await storeLogout();
    toast.success("Logged out");
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    hasRole: (...roles) => roles.includes(user?.role),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
