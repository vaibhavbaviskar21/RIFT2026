"use client";

import Navbar from "@/components/Navbar";
import ResultsComponent, { VariantResult } from "@/components/ResultsComponent";
import { useState, useEffect } from "react";
import {
    Activity, Pill, Calendar, ChevronDown, ChevronUp,
    AlertCircle, ArrowRight, Loader2, CheckCircle,
    FlaskConical, Clock, Search, FileText, ShieldCheck, Brain
} from "lucide-react";
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

    // Drug query state
    const [drugInput, setDrugInput] = useState("");
    const [queryLoading, setQueryLoading] = useState(false);
    const [queryError, setQueryError] = useState<string | null>(null);
    const [queryResult, setQueryResult] = useState<VariantResult | null>(null);

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
    const hasProfile = analyses.length > 0;

    const handleDrugQuery = async () => {
        if (!drugInput.trim()) return;
        setQueryError(null);
        setQueryResult(null);
        setQueryLoading(true);

        try {
            const res = await authFetch("/query-drug", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ drug_name: drugInput.trim().toUpperCase() }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ detail: `Query failed (${res.status})` }));
                throw new Error(errData.detail || "Drug query failed");
            }

            const data = await res.json();

            const transformed: VariantResult = {
                variants_saved: data.quality_metrics?.variants_analyzed || 0,
                genes_analyzed: [{
                    gene: data.pharmacogenomic_profile?.primary_gene || "",
                    diplotype: data.pharmacogenomic_profile?.diplotype || "",
                    phenotype: data.pharmacogenomic_profile?.phenotype || "",
                }],
                drug_analyses: [{
                    drug: data.drug,
                    risk_label: data.risk_assessment?.risk_label || "",
                    severity: data.risk_assessment?.severity || "",
                    recommendation: data.clinical_recommendation || {},
                    llm_explanation: data.llm_generated_explanation || {},
                }],
            };
            setQueryResult(transformed);

            const refreshRes = await authFetch("/my-analyses");
            if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                setAnalyses(refreshData.analyses || []);
            }
        } catch (err: any) {
            setQueryError(err.message || "An error occurred");
        } finally {
            setQueryLoading(false);
        }
    };

    const getRiskColor = (risk: string) => {
        const r = risk.toLowerCase();
        if (r.includes("toxic")) return "text-red-400 bg-red-500/10 border-red-500/20";
        if (r.includes("ineffective")) return "text-red-400 bg-red-500/10 border-red-500/20";
        if (r.includes("adjust")) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
        if (r.includes("safe")) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    };

    const getRiskDot = (risk: string) => {
        const r = risk.toLowerCase();
        if (r.includes("toxic") || r.includes("ineffective")) return "bg-red-500";
        if (r.includes("adjust")) return "bg-amber-500";
        if (r.includes("safe")) return "bg-emerald-500";
        return "bg-gray-500";
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white relative overflow-x-hidden">
            <Navbar />

            <div className="container mx-auto px-6 pt-24 pb-20">
                <div className="max-w-5xl mx-auto">

                    {/* Page Header */}
                    <div className="mb-8 pt-4">
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-3">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Clinical Workspace
                        </div>
                        <h1 className="text-2xl font-bold mb-1 text-white">
                            {user?.name ? `${user.name}'s Dashboard` : "Patient Dashboard"}
                        </h1>
                        <p className="text-sm text-gray-500">
                            Query drug–gene interactions and review past pharmacogenomic analyses.
                        </p>
                    </div>

                    {/* Profile Status Strip */}
                    <div className="rounded-xl p-4 border border-white/[0.06] bg-white/[0.02] mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${hasProfile ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : "bg-amber-500"}`}></div>
                            <span className="text-sm text-gray-300">
                                {hasProfile
                                    ? <><span className="text-emerald-400 font-medium">Genomic profile active</span> &middot; {analyses.length} {analyses.length === 1 ? "analysis" : "analyses"} on record</>
                                    : <><span className="text-amber-400 font-medium">No genomic profile</span> &middot; Upload a VCF to begin</>
                                }
                            </span>
                        </div>
                        {!hasProfile && (
                            <button
                                onClick={() => router.push("/dashboard/analyze")}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 transition-all shadow-sm whitespace-nowrap"
                            >
                                Upload VCF <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Drug Query — Clinical Input */}
                    <div className="rounded-xl p-5 border border-white/[0.06] bg-white/[0.02] mb-6">
                        <div className="flex items-center gap-2.5 mb-4">
                            <FlaskConical className="w-4 h-4 text-emerald-400" />
                            <h2 className="text-sm font-semibold text-white">Drug Interaction Query</h2>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2.5">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                <input
                                    type="text"
                                    value={drugInput}
                                    onChange={(e) => setDrugInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleDrugQuery()}
                                    placeholder="Enter drug name (e.g. Codeine, Warfarin)"
                                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.04] transition-all placeholder-gray-600"
                                    disabled={queryLoading}
                                    id="drug-query-input"
                                />
                            </div>
                            <button
                                onClick={handleDrugQuery}
                                disabled={queryLoading || !drugInput.trim()}
                                className="px-6 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-all whitespace-nowrap bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-sm shadow-emerald-500/10 hover:shadow-emerald-500/20"
                                id="analyze-risk-btn"
                            >
                                {queryLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Activity className="w-4 h-4" />
                                        Analyze Risk
                                    </>
                                )}
                            </button>
                        </div>

                        {queryError && (
                            <div className="mt-3 p-3 rounded-lg bg-red-500/[0.06] border border-red-500/15 text-red-400 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {queryError}
                            </div>
                        )}
                    </div>

                    {/* Query Loading */}
                    {queryLoading && (
                        <div className="rounded-xl p-8 border border-white/[0.06] bg-white/[0.02] mb-6 animate-pulse">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 rounded-lg bg-white/[0.04]"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-white/[0.04] rounded w-1/4"></div>
                                    <div className="h-3 bg-white/[0.04] rounded w-2/5"></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-16 bg-white/[0.02] rounded-lg"></div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Query Result */}
                    {queryResult && !queryLoading && (
                        <div className="mb-8 animate-[fadeIn_0.5s_ease-out]">
                            {/* AI Clinical Insight Box */}
                            <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 bg-primary/10 blur-[60px] rounded-full -translate-y-12 translate-x-12"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-1.5 rounded-lg bg-primary/20">
                                            <Brain className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white">AI Clinical Insight</h3>
                                            <p className="text-[10px] text-primary/60 uppercase tracking-widest font-mono">Gemini 2.0 Flash • Real-time Analysis</p>
                                        </div>
                                        <div className="ml-auto">
                                            <span className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold">
                                                Active Session
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-200 leading-relaxed italic">
                                            "{queryResult.drug_analyses[0].llm_explanation?.summary || "Analyzing biological pathway correlations..."}"
                                        </p>
                                        <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1 h-1 rounded-full bg-primary/60"></div>
                                                <span className="text-[10px] text-gray-500 font-mono">Mechanism: {queryResult.drug_analyses[0].llm_explanation?.mechanism_of_action?.slice(0, 50)}...</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1 h-1 rounded-full bg-primary/60"></div>
                                                <span className="text-[10px] text-gray-500 font-mono">Confidence: {queryResult.drug_analyses[0].llm_explanation?.confidence_statement}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <ResultsComponent data={queryResult} />
                        </div>
                    )}

                    {/* Analysis History */}
                    <div className="mt-2">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <h2 className="text-sm font-semibold text-gray-300">Analysis History</h2>
                            </div>
                            {analyses.length > 0 && (
                                <span className="text-[11px] text-gray-600 font-mono">
                                    {analyses.length} {analyses.length === 1 ? "record" : "records"}
                                </span>
                            )}
                        </div>

                        {loading && (
                            <div className="flex items-center justify-center py-16">
                                <div className="flex items-center gap-3 text-gray-500 text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Loading records...
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 rounded-lg bg-red-500/[0.06] border border-red-500/15 text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        {!loading && !error && analyses.length === 0 && (
                            <div className="text-center py-14 rounded-xl border border-white/[0.04] bg-white/[0.01]">
                                <FileText className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                                <h3 className="text-sm font-semibold text-gray-400 mb-1">No analysis records</h3>
                                <p className="text-xs text-gray-600 mb-5 max-w-xs mx-auto">
                                    Submit a drug interaction query above or upload a VCF file to generate your first report.
                                </p>
                                <button
                                    onClick={() => router.push("/dashboard/analyze")}
                                    className="px-5 py-2 rounded-lg text-xs font-semibold bg-white/[0.05] border border-white/[0.08] text-gray-300 hover:bg-white/[0.08] hover:text-white transition-all"
                                >
                                    Begin Analysis
                                </button>
                            </div>
                        )}

                        {!loading && analyses.length > 0 && (
                            <div className="space-y-2">
                                {analyses.map((a, i) => (
                                    <div
                                        key={i}
                                        className="rounded-lg overflow-hidden border border-white/[0.05] hover:border-white/[0.08] bg-white/[0.015] transition-all"
                                    >
                                        <button
                                            onClick={() => setExpanded(expanded === i ? null : i)}
                                            className="w-full px-4 py-3.5 flex items-center justify-between text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getRiskDot(a.risk_label)}`}></div>
                                                <div>
                                                    <span className="font-semibold text-sm text-white">{a.drug}</span>
                                                    <span className="text-gray-600 mx-2">·</span>
                                                    <span className="text-xs text-gray-500 font-mono">{a.gene}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] text-gray-600 hidden sm:block">
                                                    {new Date(a.created_at).toLocaleDateString("en-US", {
                                                        month: "short", day: "numeric"
                                                    })}
                                                </span>
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${getRiskColor(a.risk_label)}`}>
                                                    {a.risk_label}
                                                </span>
                                                {expanded === i
                                                    ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                                                    : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                                }
                                            </div>
                                        </button>

                                        {expanded === i && (
                                            <div className="px-4 pb-4 pt-0 border-t border-white/[0.04] animate-[fadeIn_0.2s_ease-out]">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-3">
                                                    {[
                                                        { label: "Gene", value: a.gene },
                                                        { label: "Diplotype", value: a.diplotype },
                                                        { label: "Phenotype", value: a.phenotype },
                                                        { label: "Severity", value: a.severity },
                                                    ].map(item => (
                                                        <div key={item.label} className="bg-white/[0.025] rounded-lg p-3">
                                                            <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">{item.label}</p>
                                                            <p className="text-xs font-mono font-semibold text-gray-200 capitalize">{item.value}</p>
                                                        </div>
                                                    ))}
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
        </div>
    );
}
