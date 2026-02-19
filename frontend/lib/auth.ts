/**
 * Auth utility — communicates with the FastAPI backend's custom /auth/* endpoints.
 * Stores the JWT access_token in localStorage.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface AuthUser {
    user_id: string;
    email: string;
    full_name: string | null;
    access_token: string;
}

/** Signup via POST /auth/signup */
export async function signup(email: string, password: string, full_name?: string): Promise<AuthUser> {
    const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: full_name || null }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Signup failed" }));
        throw new Error(err.detail || "Signup failed");
    }

    const data = await res.json();
    // Store token + user info
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("user_email", data.email);
    localStorage.setItem("user_id", data.user_id);
    localStorage.setItem("user_name", data.full_name || "");
    return data;
}

/** Login via POST /auth/login */
export async function login(email: string, password: string): Promise<AuthUser> {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Invalid email or password" }));
        throw new Error(err.detail || "Invalid email or password");
    }

    const data = await res.json();
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("user_email", data.email);
    localStorage.setItem("user_id", data.user_id);
    localStorage.setItem("user_name", data.full_name || "");
    return data;
}

/** Logout — clears stored auth data */
export function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
}

/** Get stored access token (or null if not logged in) */
export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
}

/** Check if user is currently logged in */
export function isLoggedIn(): boolean {
    return !!getToken();
}

/** Get stored user info */
export function getUser(): { email: string; name: string; id: string } | null {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    return {
        email: localStorage.getItem("user_email") || "",
        name: localStorage.getItem("user_name") || "",
        id: localStorage.getItem("user_id") || "",
    };
}

/** Helper: make an authenticated fetch call to the backend */
export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const token = getToken();
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    return fetch(`${API_URL}${path}`, {
        ...options,
        headers,
    });
}
