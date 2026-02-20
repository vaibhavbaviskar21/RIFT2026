"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isLoggedIn, logout, getUser } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import {
    Dna, LogOut, User, LayoutDashboard, FlaskConical,
    Menu, X, ChevronRight
} from "lucide-react";

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [loggedIn, setLoggedIn] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        setLoggedIn(isLoggedIn());
        const handleStorage = () => setLoggedIn(isLoggedIn());
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const user = getUser();

    const handleLogout = () => {
        logout();
        setLoggedIn(false);
        router.push("/login");
    };

    const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

    const navLinks = [
        ...(loggedIn ? [
            { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { href: "/dashboard/analyze", label: "Analyze", icon: FlaskConical },
        ] : []),
    ];

    return (
        <>
            <nav className="fixed top-0 left-0 w-full z-50 transition-all duration-300"
                style={{
                    background: "rgba(8, 6, 22, 0.85)",
                    backdropFilter: "blur(20px) saturate(180%)",
                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)"
                }}
            >
                <div className="container mx-auto px-6">
                    <div className="flex items-center justify-between h-16">

                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-primary/20 transition-colors border border-white/[0.06]">
                                <Dna className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[15px] font-bold tracking-tight leading-none text-white">
                                    PharmaGuard
                                </span>
                                <span className="text-[9px] font-medium tracking-[0.15em] uppercase text-gray-400 leading-none mt-0.5">
                                    Clinical Decision Support
                                </span>
                            </div>
                        </Link>

                        {/* Center Navigation */}
                        <div className="hidden md:flex items-center">
                            <div className="flex items-center bg-white/[0.03] rounded-lg border border-white/[0.06] p-1">
                                {navLinks.map(link => {
                                    const Icon = link.icon;
                                    const active = isActive(link.href);
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium transition-all duration-200 ${active
                                                ? "bg-white/[0.08] text-white shadow-sm"
                                                : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
                                                }`}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            {link.label}
                                        </Link>
                                    );
                                })}
                                {!loggedIn && (
                                    <span className="px-4 py-2 text-[13px] text-gray-500 font-medium">
                                        Sign in to access tools
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Right Side */}
                        <div className="flex items-center gap-3">
                            {loggedIn ? (
                                <div className="flex items-center gap-3">
                                    {/* User Badge */}
                                    <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                            <User className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-semibold text-white leading-none truncate max-w-[120px]">
                                                {user?.name || user?.email?.split("@")[0] || "Clinician"}
                                            </span>
                                            <span className="text-[9px] text-gray-500 leading-none mt-0.5">Active Session</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all"
                                        title="Sign Out"
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Sign Out</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link
                                        href="/login"
                                        className="px-4 py-2 rounded-lg text-[13px] font-medium text-gray-300 hover:text-white hover:bg-white/[0.05] transition-all"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
                                    >
                                        Create Account
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            )}

                            {/* Mobile Toggle */}
                            <button
                                onClick={() => setMobileOpen(!mobileOpen)}
                                className="md:hidden p-2 rounded-lg hover:bg-white/5 text-gray-400 transition-colors"
                            >
                                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileOpen && (
                    <div className="md:hidden border-t border-white/[0.06] animate-[fadeIn_0.2s_ease-out]"
                        style={{ background: "rgba(8, 6, 22, 0.95)" }}
                    >
                        <div className="container mx-auto px-6 py-4 space-y-1">
                            {navLinks.map(link => {
                                const Icon = link.icon;
                                const active = isActive(link.href);
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setMobileOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active
                                            ? "bg-white/[0.06] text-white"
                                            : "text-gray-400 hover:bg-white/[0.03] hover:text-white"
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </nav>
        </>
    );
}
