"use client";

import AuthLayout from "@/components/AuthLayout";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { login } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await login(email, password);
            router.push("/upload");
        } catch (err: any) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
                <p className="text-gray-400 text-sm">Sign in to access your genomic reports</p>
            </div>

            <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 ml-1">Email</label>
                    <div className="relative group">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full glass-input pl-4 focus:ring-1 ring-primary/50"
                            placeholder="doctor@hospital.com"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-sm font-medium text-gray-300">Password</label>
                        <Link href="#" className="text-xs text-primary hover:text-white transition-colors">Forgot?</Link>
                    </div>
                    <div className="relative group">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full glass-input pl-4 focus:ring-1 ring-primary/50"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-[fadeIn_0.3s_ease-out]">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-glow py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 group mt-6 disabled:opacity-50"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Signing In...
                        </span>
                    ) : (
                        <>Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                    )}
                </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-400">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-primary hover:text-white font-medium transition-colors">
                    Create Account
                </Link>
            </p>
        </AuthLayout>
    );
}
