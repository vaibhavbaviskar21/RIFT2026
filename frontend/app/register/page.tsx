import AuthLayout from "@/components/AuthLayout";
import Link from "next/link";
import { ArrowRight, Lock, Mail, User, ShieldCheck } from "lucide-react";

export default function Register() {
    return (
        <AuthLayout>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Create Account</h1>
                <p className="text-gray-400 text-sm">Join the Precision Medicine Ecosystem</p>
            </div>

            <form className="space-y-4">
                <div className="space-y-2">
                    <label className="text-md font-medium text-gray-300 ml-1">Full Name</label>
                    <div className="relative group">
                        <input
                            type="text"
                            className="w-full glass-input pl-10 focus:ring-1 ring-primary/50"
                            placeholder="Dr. John Doe"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-md font-medium text-gray-300 ml-1">Email</label>
                    <div className="relative group">
                        <input
                            type="email"
                            className="w-full glass-input pl-10 focus:ring-1 ring-primary/50"
                            placeholder="doctor@hospital.com"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-md font-medium text-gray-300 ml-1">Password</label>
                    <div className="relative group">
                        <input
                            type="password"
                            className="w-full glass-input pl-10 focus:ring-1 ring-primary/50"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <div className="flex items-start gap-3 mt-4">
                    <div className="relative flex items-center">
                        <input type="checkbox" className="peer w-5 h-5 appearance-none border border-white/20 rounded-md bg-white/5 checked:bg-primary checked:border-primary transition-colors" />
                        <ShieldCheck className="w-3.5 h-3.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 pointer-events-none" />
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        I agree to the <Link href="#" className="text-primary hover:underline">Terms of Service</Link> and <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>, and consent to processing genetic data.
                    </p>
                </div>

                <button className="w-full btn-glow py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 group mt-6">
                    Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-400">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:text-white font-medium transition-colors">
                    Sign In
                </Link>
            </p>
        </AuthLayout>
    );
}
