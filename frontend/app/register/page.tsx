"use client";

import AuthLayout from "@/components/AuthLayout";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { signup } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function Register() {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreed) {
            setError("Please agree to the Terms of Service.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await signup(email, password, fullName);
            setSuccess(true);
            // Redirect to analysis page after short delay
            setTimeout(() => router.push("/dashboard/analyze"), 1500);
        } catch (err: any) {
            setError(err.message || "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Create Account</h1>
                <p className="text-gray-400 text-sm">Join the Precision Medicine Ecosystem</p>
            </div>

            {success ? (
                <div className="text-center py-8 animate-[fadeIn_0.5s_ease-out]">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 mx-auto mb-4 flex items-center justify-center">
                        <ShieldCheck className="w-8 h-8 text-green-400" />
                    </div>
                    <h2 className="text-xl font-bold text-green-400 mb-2">Account Created!</h2>
                    <p className="text-gray-400 text-sm">Redirecting to upload...</p>
                </div>
            ) : (
                <form className="space-y-4" onSubmit={handleRegister}>
                    <div className="space-y-2">
                        <label className="text-md font-medium text-gray-300 ml-1">Full Name</label>
                        <div className="relative group">
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full glass-input pl-4 focus:ring-1 ring-primary/50"
                                placeholder="Dr. John Doe"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-md font-medium text-gray-300 ml-1">Email</label>
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
                        <label className="text-md font-medium text-gray-300 ml-1">Password</label>
                        <div className="relative group">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full glass-input pl-4 focus:ring-1 ring-primary/50"
                                placeholder="••••••••"
                                required
                                minLength={8}
                            />
                        </div>
                        <p className="text-xs text-gray-500 ml-1">Minimum 8 characters</p>
                    </div>

                    <div className="flex items-start gap-3 mt-4">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="peer w-5 h-5 appearance-none border border-white/20 rounded-md bg-white/5 checked:bg-primary checked:border-primary transition-colors cursor-pointer"
                            />
                            <ShieldCheck className="w-3.5 h-3.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 pointer-events-none" />
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            I agree to the <Link href="#" className="text-primary hover:underline">Terms of Service</Link> and <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>, and consent to processing genetic data.
                        </p>
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
                                Creating...
                            </span>
                        ) : (
                            <>Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                        )}
                    </button>
                </form>
            )}

            <p className="mt-8 text-center text-sm text-gray-400">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:text-white font-medium transition-colors">
                    Sign In
                </Link>
            </p>
        </AuthLayout>
    );
}
