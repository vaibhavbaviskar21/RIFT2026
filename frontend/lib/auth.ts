/**
 * Auth utility — communicates with the FastAPI backend's /auth/* endpoints.
 * Stores the JWT access_token in an HttpOnly-like cookie (client-side cookie).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TOKEN_COOKIE = "pg_access_token";
const USER_COOKIE = "pg_user";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

// ─── Cookie Helpers ──────────────────────────────────────────────

function setCookie(name: string, value: string, maxAge: number = COOKIE_MAX_AGE) {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=; path=/; max-age=0`;
}

// ─── Auth Types ──────────────────────────────────────────────────

export interface AuthUser {
    user_id: string;
    email: string;
    full_name: string | null;
    access_token: string;
}

// ─── Auth Functions ──────────────────────────────────────────────

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
    // Store token in cookie
    setCookie(TOKEN_COOKIE, data.access_token);
    setCookie(USER_COOKIE, JSON.stringify({
        id: data.user_id,
        email: data.email,
        name: data.full_name || "",
    }));
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
    setCookie(TOKEN_COOKIE, data.access_token);
    setCookie(USER_COOKIE, JSON.stringify({
        id: data.user_id,
        email: data.email,
        name: data.full_name || "",
    }));
    return data;
}

/** Logout — clears auth cookies */
export function logout() {
    deleteCookie(TOKEN_COOKIE);
    deleteCookie(USER_COOKIE);
}

/** Get stored access token from cookie (or null if not logged in) */
export function getToken(): string | null {
    return getCookie(TOKEN_COOKIE);
}

/** Check if user is currently logged in */
export function isLoggedIn(): boolean {
    return !!getToken();
}

/** Get stored user info from cookie */
export function getUser(): { email: string; name: string; id: string } | null {
    const raw = getCookie(USER_COOKIE);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
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
