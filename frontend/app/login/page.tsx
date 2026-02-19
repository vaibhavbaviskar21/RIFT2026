import AuthLayout from "@/components/AuthLayout";
import Link from "next/link";
import { ArrowRight, Lock, Mail } from "lucide-react";

export default function Login() {
    return (
        <AuthLayout>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
                <p className="text-gray-400 text-sm">Sign in to access your genomic reports</p>
            </div>

            <form className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 ml-1">Email</label>
                    <div className="relative group">
                        <input
                            type="email"
                            className="w-full glass-input pl-10 focus:ring-1 ring-primary/50"
                            placeholder="doctor@hospital.com"
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
                            className="w-full glass-input pl-10 focus:ring-1 ring-primary/50"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button className="w-full btn-glow py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 group mt-6">
                    Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-400">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary hover:text-white font-medium transition-colors">
                    Create Account
                </Link>
            </p>
        </AuthLayout>
    );
}
