// ================= LOGIN =================
export const login = async (identifier, password) => {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        identifier,
        password,
      }),
    });

    const data = await res.json();

    return {
      success: res.ok && data.success,
      ...data,
    };
  } catch (error) {
    console.error("LOGIN_API_ERROR:", error);
    return {
      success: false,
      message: "Server error",
    };
  }
};

// ================= REGISTER =================
export const register = async (name, email, phone, password) => {
  try {
    const identifier = email || phone;

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        name,
        identifier,
        email,
        phone,
        password,
      }),
    });

    const data = await res.json();

    return {
      success: res.ok && data.success,
      ...data,
    };
  } catch (error) {
    console.error("REGISTER_API_ERROR:", error);
    return {
      success: false,
      message: "Server error",
    };
  }
};

// ================= LOGOUT =================
export const logoutApi = async () => {
  try {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    const data = await res.json();

    return {
      success: res.ok && data.success,
      ...data,
    };
  } catch (error) {
    console.error("LOGOUT_API_ERROR:", error);
    return {
      success: false,
      message: "Logout failed",
    };
  }
};