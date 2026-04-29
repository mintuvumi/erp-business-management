export const safeLocalStorage = {
  get: (key) => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key);
  },

  set: (key, value) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, value);
  },
};