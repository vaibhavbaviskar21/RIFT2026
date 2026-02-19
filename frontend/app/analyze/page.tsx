"use client";

import Navbar from "@/components/Navbar";
import { useState } from "react";
import { Search, AlertTriangle, CheckCircle, HelpCircle, Pill, FileText, Activity } from "lucide-react";

export default function AnalyzePage() {
    const [drug, setDrug] = useState("");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = (e: React.FormEvent) => {
        e.preventDefault();
        if (!drug) return;

        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setResult({
                risk: "High Risk",
                severity: "high",
                gene: "CYP2D6",
                phenotype: "Poor Metabolizer",
                recommendation: "Consider alternative to Codeine due to lack of efficacy. Monitor for adverse effects if prescribed.",
                explanation: "The patient currently carries two non-functional alleles for CYP2D6 (*4/*4). This results in a 'Poor Metabolizer' phenotype. Codeine requires CYP2D6 for conversion to its active metabolite, morphine. Therefore, the patient will experience reduced analgesic efficacy."
            });
            setLoading(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white relative overflow-x-hidden">
            <Navbar />

            {/* Background */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/10 blur-[150px] pointer-events-none -z-10"></div>

            <div className="container mx-auto px-6 pt-32 pb-20">
                <div className="max-w-4xl mx-auto">

                    {/* Search Section */}
                    <div className="text-center mb-12 animate-[slideUp_0.5s_ease-out]">
                        <h1 className="text-4xl font-bold mb-4">Drug Risk Analysis</h1>
                        <p className="text-gray-400 mb-8">Enter a drug name to check pharmacogenomic compatibility.</p>

                        <form onSubmit={handleAnalyze} className="relative max-w-xl mx-auto">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    value={drug}
                                    onChange={(e) => setDrug(e.target.value)}
                                    placeholder="e.g. Codeine, Warfarin, Simvastatin"
                                    className="w-full h-14 pl-12 pr-4 rounded-2xl glass-input border border-white/10 focus:border-primary/50 text-lg shadow-[0_0_20px_-5px_rgba(0,0,0,0.3)] focus:shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="absolute right-2 top-2 h-10 px-6 rounded-xl bg-primary hover:bg-violet-600 text-white font-bold text-sm transition-colors disabled:opacity-50"
                                >
                                    {loading ? "Analyzing..." : "Analyze"}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Result Section */}
                    {result && (
                        <div className="animate-[fadeIn_0.5s_ease-out] space-y-6">

                            {/* Status Card */}
                            <div className={`p-1 rounded-3xl bg-gradient-to-r ${result.severity === 'high' ? 'from-red-500 to-orange-500' : 'from-green-500 to-emerald-500'}`}>
                                <div className="bg-gray-950/90 backdrop-blur-xl rounded-[22px] p-8 relative overflow-hidden">
                                    <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${result.severity === 'high' ? 'from-red-500/20' : 'from-green-500/20'} to-transparent blur-[80px] pointer-events-none`}></div>

                                    <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-4 rounded-2xl ${result.severity === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                                {result.severity === 'high' ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
                                            </div>
                                            <div>
                                                <h2 className={`text-3xl font-bold ${result.severity === 'high' ? 'text-red-400' : 'text-green-400'}`}>{result.risk}</h2>
                                                <p className="text-gray-400 text-sm">Based on patient's genomic profile</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
                                                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Gene</div>
                                                <div className="text-lg font-mono font-bold text-white">{result.gene}</div>
                                            </div>
                                            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
                                                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Phenotype</div>
                                                <div className="text-lg font-mono font-bold text-white">{result.phenotype}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid md:grid-cols-2 gap-6">

                                {/* Recommendation */}
                                <div className="glass-card p-6 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Pill className="w-5 h-5 text-tertiary" />
                                        <h3 className="text-lg font-bold">Recommendation</h3>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed font-medium">
                                        {result.recommendation}
                                    </p>
                                </div>

                                {/* Explanation */}
                                <div className="glass-card p-6 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Activity className="w-5 h-5 text-secondary" />
                                        <h3 className="text-lg font-bold">Clinical Evidence</h3>
                                    </div>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        {result.explanation}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {!result && !loading && (
                        <div className="grid md:grid-cols-3 gap-6 mt-16 opacity-50">
                            <div className="glass-card p-6 rounded-2xl text-center border-dashed border-white/10">
                                <div className="w-12 h-12 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center">
                                    <Search className="w-6 h-6 text-gray-500" />
                                </div>
                                <h3 className="font-bold text-gray-300 mb-2">Search</h3>
                                <p className="text-xs text-gray-500">Look up any medication by name</p>
                            </div>
                            <div className="glass-card p-6 rounded-2xl text-center border-dashed border-white/10">
                                <div className="w-12 h-12 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center">
                                    <Activity className="w-6 h-6 text-gray-500" />
                                </div>
                                <h3 className="font-bold text-gray-300 mb-2">Analyze</h3>
                                <p className="text-xs text-gray-500">Automatic risk stratification</p>
                            </div>
                            <div className="glass-card p-6 rounded-2xl text-center border-dashed border-white/10">
                                <div className="w-12 h-12 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-gray-500" />
                                </div>
                                <h3 className="font-bold text-gray-300 mb-2">Report</h3>
                                <p className="text-xs text-gray-500">Get detailed clinical reports</p>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
