const API = "http://localhost:5000/api/auth";

// ================= LOGIN =================
export const login = async (identifier, password) => {
  try {
    const isEmail = identifier.includes("@");

    const body = {
      password,
      ...(isEmail ? { email: identifier } : { phone: identifier }),
    };

    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    return {
      success: res.ok,
      ...data,
    };
  } catch {
    return { success: false, msg: "Server error" };
  }
};

// ================= REGISTER =================
export const register = async (name, email, phone, password) => {
  try {
    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password }),
    });

    const data = await res.json();

    return {
      success: res.ok,
      ...data,
    };
  } catch {
    return { success: false, msg: "Server error" };
  }
};
