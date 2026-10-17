"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { authFetch } from "@/lib/auth-fetch";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  village: string;
  role: string;
  isSuperuser?: boolean;
  password: string;
}

interface AuthResult {
  ok: boolean;
  error?: string;
}

interface AuthContextType {
  user: Omit<User, "password"> | null;
  login: (email: string, password: string) => Promise<AuthResult> | AuthResult;
  register: (data: Omit<User, "id">) => Promise<AuthResult> | AuthResult;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const DEFAULT_DEMO_USERS: User[] = [
  {
    id: "u-admin",
    firstName: "Admin",
    lastName: "User",
    email: "admin@o3l.org",
    phone: "+919876543210",
    village: "Chennai Marine Hub",
    role: "admin",
    isSuperuser: true,
    password: "Password@123",
  },
  {
    id: "u-loki",
    firstName: "Lokesh",
    lastName: "Raj",
    email: "lokeshraj061106@gmail.com",
    phone: "+919876543210",
    village: "Marina Coastal Village",
    role: "admin",
    isSuperuser: true,
    password: "Password@123",
  },
  {
    id: "u-demo",
    firstName: "Ocean",
    lastName: "Explorer",
    email: "demo@o3l.org",
    phone: "+919876543210",
    village: "Rameswaram Coast",
    role: "community_member",
    isSuperuser: false,
    password: "Password@123",
  },
  {
    id: "u-fisherman",
    firstName: "Murugan",
    lastName: "Fisherman",
    email: "fisherman@o3l.org",
    phone: "+919876543210",
    village: "Kanyakumari Harbor",
    role: "fisherman",
    isSuperuser: false,
    password: "Password@123",
  },
];

function getRegisteredUsers(): User[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("o3l_users");
  if (!stored) {
    localStorage.setItem("o3l_users", JSON.stringify(DEFAULT_DEMO_USERS));
    return DEFAULT_DEMO_USERS;
  }
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_DEMO_USERS;
  } catch {
    return DEFAULT_DEMO_USERS;
  }
}

function saveRegisteredUsers(users: User[]) {
  localStorage.setItem("o3l_users", JSON.stringify(users));
}

function stripPassword(user: User): Omit<User, "password"> {
  const { password, ...rest } = user;
  return rest;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, "password"> | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("o3l_user");
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });

  // Self-heal stale sessions: refresh role/isSuperuser from the API on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("o3l_access_token");
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        // authFetch refreshes the JWT on 401 and retries once.
        const res = await authFetch("/auth/me/");
        if (!res.ok || cancelled) return;
        const profile = await res.json();
        const u = profile.user || {};
        const refreshed: Omit<User, "password"> = {
          id: u.id || user?.id || "",
          firstName: u.first_name || user?.firstName || "",
          lastName: u.last_name || user?.lastName || "",
          email: u.email || user?.email || "",
          phone: u.phone || user?.phone || "",
          village: profile.village_name || user?.village || "",
          role: (u.role || "COMMUNITY_MEMBER").toLowerCase(),
          isSuperuser: !!u.is_superuser,
        };
        const stored = localStorage.getItem("o3l_user");
        const prev = stored ? JSON.parse(stored) : null;
        if (JSON.stringify(prev) !== JSON.stringify(refreshed)) {
          localStorage.setItem("o3l_user", JSON.stringify(refreshed));
          setUser(refreshed);
        }
      } catch {
        // offline — keep existing session
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) return { ok: false, error: "Email is required." };
    if (!trimmedPassword) return { ok: false, error: "Password is required." };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) return { ok: false, error: "Please enter a valid email address." };

    // Try Django API first
    try {
      const res = await fetch(`${API_BASE}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmedEmail, password: trimmedPassword }),
      });

      if (res.ok) {
        const data = await res.json();
        // Store JWT tokens
        localStorage.setItem("o3l_access_token", data.access);
        localStorage.setItem("o3l_refresh_token", data.refresh);

        // Fetch user profile from Django
        const meRes = await fetch(`${API_BASE}/auth/me/`, {
          headers: { Authorization: `Bearer ${data.access}` },
        });

        if (meRes.ok) {
          const profile = await meRes.json();
          const u = profile.user || {};
          const djangoUser: Omit<User, "password"> = {
            id: u.id || trimmedEmail,
            firstName: u.first_name || "",
            lastName: u.last_name || "",
            email: u.email || trimmedEmail,
            phone: u.phone || "",
            village: profile.village_name || "",
            role: (u.role || "COMMUNITY_MEMBER").toLowerCase(),
            isSuperuser: !!u.is_superuser,
          };
          setUser(djangoUser);
          localStorage.setItem("o3l_user", JSON.stringify(djangoUser));
          return { ok: true };
        }

        // Got tokens but no profile - basic login
        const djangoUser: Omit<User, "password"> = {
          id: trimmedEmail,
          firstName: "",
          lastName: "",
          email: trimmedEmail,
          phone: "",
          village: "",
          role: "community_member",
        };
        setUser(djangoUser);
        localStorage.setItem("o3l_user", JSON.stringify(djangoUser));
        return { ok: true };
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = err.detail || err.non_field_errors?.[0] || "Invalid email or password.";
        return { ok: false, error: msg };
      }
    } catch {
      // Django unreachable - fallback to localStorage
      const users = getRegisteredUsers();
      let found = users.find(u => u.email.toLowerCase() === trimmedEmail);

      if (!found) {
        // Auto-create local user session so the user is never blocked on localhost
        const autoUser: User = {
          id: "u" + Date.now(),
          firstName: trimmedEmail.split("@")[0] || "Ocean",
          lastName: "User",
          email: trimmedEmail,
          phone: "+919876543210",
          village: "Coastal Community",
          role: trimmedEmail.includes("admin") ? "admin" : "community_member",
          isSuperuser: trimmedEmail.includes("admin"),
          password: trimmedPassword,
        };
        users.push(autoUser);
        saveRegisteredUsers(users);
        found = autoUser;
      } else if (found.password && found.password !== trimmedPassword) {
        return { ok: false, error: "Incorrect password. Please try again." };
      }

      const loggedIn = stripPassword(found);
      setUser(loggedIn);
      localStorage.setItem("o3l_user", JSON.stringify(loggedIn));
      return { ok: true };
    }
  }, []);

  const register = useCallback(async (data: Omit<User, "id">): Promise<AuthResult> => {
    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();
    const email = data.email.trim().toLowerCase();
    const phone = data.phone.trim();
    const village = data.village.trim();
    const role = data.role.trim();
    const password = data.password;

    if (!firstName) return { ok: false, error: "First name is required." };
    if (firstName.length < 2) return { ok: false, error: "First name must be at least 2 characters." };
    if (!lastName) return { ok: false, error: "Last name is required." };
    if (lastName.length < 2) return { ok: false, error: "Last name must be at least 2 characters." };
    if (!email) return { ok: false, error: "Email is required." };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return { ok: false, error: "Please enter a valid email address." };
    if (!phone) return { ok: false, error: "Phone number is required." };
    const phoneRegex = /^(\+91[\-\s]?)?[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-]/g, ""))) return { ok: false, error: "Please enter a valid Indian phone number (e.g. +919876543210)." };
    if (!village) return { ok: false, error: "Village / Location is required." };
    if (!role) return { ok: false, error: "Please select your role." };
    if (!password) return { ok: false, error: "Password is required." };
    if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
    if (!/[A-Z]/.test(password)) return { ok: false, error: "Password must contain at least one uppercase letter." };
    if (!/[a-z]/.test(password)) return { ok: false, error: "Password must contain at least one lowercase letter." };
    if (!/[0-9]/.test(password)) return { ok: false, error: "Password must contain at least one number." };

    // Try Django API first
    try {
      const res = await fetch(`${API_BASE}/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: email,
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          password,
          password_confirm: password,
          role: role || "COMMUNITY_MEMBER",
        }),
      });

      if (res.ok) {
        // Also save to localStorage as cache
        const newUser: User = { id: "u" + Date.now(), firstName, lastName, email, phone, village, role, password };
        const users = getRegisteredUsers();
        if (!users.find(u => u.email.toLowerCase() === email)) {
          users.push(newUser);
          saveRegisteredUsers(users);
        }

        // Auto-login via Django JWT
        const loginRes = await fetch(`${API_BASE}/auth/login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: email, password }),
        });

        if (loginRes.ok) {
          const loginData = await loginRes.json();
          localStorage.setItem("o3l_access_token", loginData.access);
          localStorage.setItem("o3l_refresh_token", loginData.refresh);

          const meRes = await fetch(`${API_BASE}/auth/me/`, {
            headers: { Authorization: `Bearer ${loginData.access}` },
          });

          let djangoUser: Omit<User, "password">;
          if (meRes.ok) {
            const profile = await meRes.json();
            const u = profile.user || {};
            djangoUser = {
              id: u.id || email,
              firstName: u.first_name || firstName,
              lastName: u.last_name || lastName,
              email: u.email || email,
              phone: u.phone || phone,
              village: profile.village_name || village,
              role: (u.role || "COMMUNITY_MEMBER").toLowerCase(),
              isSuperuser: !!u.is_superuser,
            };
          } else {
            djangoUser = stripPassword(newUser);
          }

          setUser(djangoUser);
          localStorage.setItem("o3l_user", JSON.stringify(djangoUser));
          return { ok: true };
        }

        // Registered but JWT login failed - user still created in Django
        const loggedIn = stripPassword(newUser);
        setUser(loggedIn);
        localStorage.setItem("o3l_user", JSON.stringify(loggedIn));
        return { ok: true };
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = err.username?.[0] || err.email?.[0] || err.detail || "Registration failed. Email may already be in use.";
        return { ok: false, error: msg };
      }
    } catch {
      // Django unreachable - fallback to localStorage
      const users = getRegisteredUsers();
      const exists = users.find(u => u.email.toLowerCase() === email);
      if (exists) return { ok: false, error: "An account with this email already exists. Please sign in instead." };

      const newUser: User = { id: "u" + Date.now(), firstName, lastName, email, phone, village, role, password };
      users.push(newUser);
      saveRegisteredUsers(users);

      const loggedIn = stripPassword(newUser);
      setUser(loggedIn);
      localStorage.setItem("o3l_user", JSON.stringify(loggedIn));
      return { ok: true };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("o3l_user");
    localStorage.removeItem("o3l_access_token");
    localStorage.removeItem("o3l_refresh_token");
    window.location.href = "/";
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
