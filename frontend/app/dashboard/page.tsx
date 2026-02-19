"use client";

import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { Activity, Pill, Calendar, Download, ChevronDown, ChevronUp } from "lucide-react";
import { isLoggedIn, authFetch, getUser } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface Analysis {
    drug: string;
    gene: string;
    risk_label: string;
    severity: string;
    phenotype: string;
    diplotype: string;
    created_at: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [analyses, setAnalyses] = useState<Analysis[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<number | null>(null);

    useEffect(() => {
        if (!isLoggedIn()) {
            router.push("/login");
            return;
        }

        const fetchAnalyses = async () => {
            try {
                const res = await authFetch("/my-analyses");
                if (!res.ok) throw new Error("Failed to fetch analyses");
                const data = await res.json();
                setAnalyses(data.analyses || []);
            } catch (err: any) {
                setError(err.message || "Failed to load history");
            } finally {
                setLoading(false);
            }
        };

        fetchAnalyses();
    }, [router]);

    const user = getUser();

    const getRiskColor = (risk: string) => {
        const r = risk.toLowerCase();
        if (r.includes("toxic") || r.includes("high")) return "text-red-400 bg-red-500/10 border-red-500/20";
        if (r.includes("ineffective")) return "text-orange-400 bg-orange-500/10 border-orange-500/20";
        if (r.includes("moderate")) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
        return "text-green-400 bg-green-500/10 border-green-500/20";
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white relative overflow-x-hidden">
            <Navbar />
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full h-[400px] bg-primary/10 blur-[150px] pointer-events-none -z-10"></div>

            <div className="container mx-auto px-6 pt-32 pb-20">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-10">
                        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
                        <p className="text-gray-400">
                            Welcome back{user?.name ? `, ${user.name}` : ""}. Here are your past analyses.
                        </p>
                    </div>

                    {loading && (
                        <div className="flex items-center justify-center py-20">
                            <span className="w-8 h-8 border-2 border-white/20 border-t-primary rounded-full animate-spin"></span>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {!loading && !error && analyses.length === 0 && (
                        <div className="text-center py-20">
                            <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-gray-400 mb-2">No analyses yet</h2>
                            <p className="text-gray-500 text-sm mb-6">Upload a VCF file and analyze a drug to get started.</p>
                            <button
                                onClick={() => router.push("/analyze")}
                                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-violet-600 text-white font-bold text-sm transition-colors"
                            >
                                Start Analysis
                            </button>
                        </div>
                    )}

                    {!loading && analyses.length > 0 && (
                        <div className="space-y-4">
                            {analyses.map((a, i) => (
                                <div
                                    key={i}
                                    className="glass-card rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-all"
                                >
                                    <button
                                        onClick={() => setExpanded(expanded === i ? null : i)}
                                        className="w-full p-5 flex items-center justify-between text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-xl bg-primary/10">
                                                <Pill className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">{a.drug}</h3>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(a.created_at).toLocaleDateString("en-US", {
                                                        year: "numeric", month: "short", day: "numeric"
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(a.risk_label)}`}>
                                                {a.risk_label}
                                            </span>
                                            {expanded === i
                                                ? <ChevronUp className="w-5 h-5 text-gray-400" />
                                                : <ChevronDown className="w-5 h-5 text-gray-400" />
                                            }
                                        </div>
                                    </button>

                                    {expanded === i && (
                                        <div className="px-5 pb-5 pt-0 border-t border-white/5 animate-[fadeIn_0.2s_ease-out]">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                                <div className="bg-white/[0.03] rounded-xl p-3">
                                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Gene</p>
                                                    <p className="text-sm font-mono font-bold mt-1">{a.gene}</p>
                                                </div>
                                                <div className="bg-white/[0.03] rounded-xl p-3">
                                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Diplotype</p>
                                                    <p className="text-sm font-mono font-bold mt-1">{a.diplotype}</p>
                                                </div>
                                                <div className="bg-white/[0.03] rounded-xl p-3">
                                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Phenotype</p>
                                                    <p className="text-sm font-mono font-bold mt-1">{a.phenotype}</p>
                                                </div>
                                                <div className="bg-white/[0.03] rounded-xl p-3">
                                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Severity</p>
                                                    <p className="text-sm font-mono font-bold mt-1 capitalize">{a.severity}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
