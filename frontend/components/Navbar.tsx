"use client";

import Link from "next/link";
import { Dna, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { isLoggedIn, logout, getUser } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function Navbar() {
    const router = useRouter();
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(() => {
        // Check on mount and whenever localStorage changes
        setLoggedIn(isLoggedIn());

        const handleStorage = () => setLoggedIn(isLoggedIn());
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const handleLogout = () => {
        logout();
        setLoggedIn(false);
        router.push("/login");
    };

    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-black transition-all duration-300">
            <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="p-2 rounded-lg bg-white/5 group-hover:bg-primary/20 transition-colors">
                        <Dna className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">PharmaGuard</span>
                </Link>

                {/* Center Links */}
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
                    <Link href="/analyze" className="hover:text-white transition-colors">Analyze</Link>
                    {loggedIn && (
                        <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                    )}
                    <Link href="#" className="hover:text-white transition-colors">About</Link>
                </div>

                {/* Auth Buttons */}
                <div className="flex items-center gap-4">
                    {loggedIn ? (
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white hidden sm:block">
                                Log In
                            </Link>
                            <Link
                                href="/register"
                                className="px-6 py-2.5 rounded-full text-sm font-semibold bg-white/10 border border-white/10 hover:bg-white/20 hover:border-white/20 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(168,85,247,0.3)]"
                            >
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
