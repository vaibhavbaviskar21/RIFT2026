"use client";

import {
    CheckCircle, AlertTriangle, XCircle, Pill, Activity,
    Download, Copy, ChevronDown, ChevronUp, Search, Dna,
    Shield, Beaker, FileText, Brain
} from "lucide-react";
import { useState } from "react";

export interface VariantResult {
    variants_saved: number;
    genes_analyzed: { gene: string; diplotype: string; phenotype: string }[];
    drug_analyses: {
        drug: string;
        risk_label: string;
        severity: string;
        recommendation: { recommended_action: string; dose_adjustment: string; guideline_reference: string };
        llm_explanation: { summary: string; mechanism_of_action: string; variant_citations?: string[]; confidence_statement?: string };
    }[];
}

// Maps risk_label → Tailwind styles
function getRiskStyles(riskLabel: string) {
    const r = riskLabel.toLowerCase();
    if (r === "safe") return {
        border: "border-emerald-500/30",
        bg: "bg-emerald-500/8",
        text: "text-emerald-400",
        badge: "bg-emerald-500/15 border-emerald-500/25 text-emerald-400",
        icon: <CheckCircle className="w-4 h-4" />,
        glow: "shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]"
    };
    if (r === "adjust dosage") return {
        border: "border-amber-500/30",
        bg: "bg-amber-500/8",
        text: "text-amber-400",
        badge: "bg-amber-500/15 border-amber-500/25 text-amber-400",
        icon: <AlertTriangle className="w-4 h-4" />,
        glow: "shadow-[0_0_20px_-5px_rgba(245,158,11,0.2)]"
    };
    if (r === "toxic" || r === "ineffective") return {
        border: "border-red-500/30",
        bg: "bg-red-500/8",
        text: "text-red-400",
        badge: "bg-red-500/15 border-red-500/25 text-red-400",
        icon: <XCircle className="w-4 h-4" />,
        glow: "shadow-[0_0_20px_-5px_rgba(239,68,68,0.2)]"
    };
    return {
        border: "border-slate-500/30",
        bg: "bg-slate-500/8",
        text: "text-slate-400",
        badge: "bg-slate-500/15 border-slate-500/25 text-slate-400",
        icon: <Shield className="w-4 h-4" />,
        glow: ""
    };
}

function getSeverityLabel(severity: string) {
    switch (severity) {
        case "critical": return { label: "CRITICAL", color: "text-red-500" };
        case "high": return { label: "HIGH", color: "text-red-400" };
        case "moderate": return { label: "MODERATE", color: "text-amber-400" };
        case "low": return { label: "LOW", color: "text-yellow-400" };
        case "none": return { label: "NONE", color: "text-emerald-400" };
        default: return { label: severity.toUpperCase(), color: "text-gray-400" };
    }
}

export default function ResultsComponent({ data }: { data: VariantResult }) {
    const [expandedDrug, setExpandedDrug] = useState<number | null>(null);
    const [expandedGenomics, setExpandedGenomics] = useState(false);
    const [filter, setFilter] = useState("");
    const [copied, setCopied] = useState(false);

    if (!data) return null;

    const filteredDrugs = data.drug_analyses.filter(d =>
        d.drug.toLowerCase().includes(filter.toLowerCase())
    );

    const downloadReport = () => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `PharmaGuard_Report_${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <div className="animate-[fadeIn_0.5s_ease-out] space-y-8">
            {/* Header */}
            <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-bold">Analysis Complete</span>
                </div>
                <h2 className="text-3xl font-bold mb-2">Pharmacogenomic Report</h2>
                <p className="text-gray-400">
                    Analyzed {data.variants_saved} variants across {data.genes_analyzed.length} pharmacogenes
                </p>
            </div>

            {/* Export Buttons — Prominent */}
            <div className="flex flex-col sm:flex-row justify-center gap-3" id="export-actions">
                <button
                    onClick={downloadReport}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-sm shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all"
                >
                    <Download className="w-4 h-4" />
                    Download JSON Report
                </button>
                <button
                    onClick={copyToClipboard}
                    className={`flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl border text-sm font-bold transition-all ${copied
                        ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400"
                        : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
                        }`}
                >
                    {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copied ? "Copied to Clipboard!" : "Copy JSON to Clipboard"}
                </button>
            </div>

            {/* Genomic Profile — Expandable Accordion */}
            <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
                <button
                    onClick={() => setExpandedGenomics(!expandedGenomics)}
                    className="w-full p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors text-left"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10">
                            <Dna className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Pharmacogenomic Profile</h3>
                            <p className="text-xs text-gray-500">{data.genes_analyzed.length} genes • Click to {expandedGenomics ? "collapse" : "expand"}</p>
                        </div>
                    </div>
                    {expandedGenomics ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>

                {expandedGenomics && (
                    <div className="px-5 pb-5 animate-[fadeIn_0.2s_ease-out]">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {data.genes_analyzed.map((gene, idx) => (
                                <div key={idx} className="rounded-xl p-4 bg-white/[0.03] border border-white/5 hover:border-primary/20 transition-colors">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Gene</span>
                                        <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-mono font-bold">
                                            {gene.gene}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Diplotype</span>
                                            <span className="text-white font-mono font-medium">{gene.diplotype}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Phenotype</span>
                                            <span className="text-white font-medium">{gene.phenotype}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Drug Risk Cards */}
            <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
                <div className="p-5 border-b border-white/10 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-xl font-bold flex items-center gap-3">
                        <Pill className="w-5 h-5 text-primary" />
                        Drug Risk Stratification
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Filter drugs..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-all w-full md:w-56"
                        />
                    </div>
                </div>

                <div className="divide-y divide-white/5">
                    {filteredDrugs.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">
                            <Beaker className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p>{filter ? "No matching drugs found." : "No drug interactions found."}</p>
                        </div>
                    ) : (
                        filteredDrugs.map((drug, idx) => {
                            const risk = getRiskStyles(drug.risk_label);
                            const sev = getSeverityLabel(drug.severity);
                            const isOpen = expandedDrug === idx;

                            return (
                                <div key={idx} className={`transition-colors ${isOpen ? risk.bg : ""}`}>
                                    {/* Drug Header Row */}
                                    <button
                                        onClick={() => setExpandedDrug(isOpen ? null : idx)}
                                        className="w-full p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-xl ${risk.bg} border ${risk.border}`}>
                                                {risk.icon}
                                            </div>
                                            <div>
                                                <span className="font-bold text-lg">{drug.drug}</span>
                                                <p className="text-xs text-gray-500 mt-0.5 max-w-xs truncate">
                                                    {drug.llm_explanation?.summary?.slice(0, 60)}...
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${risk.badge}`}>
                                                {risk.icon}
                                                {drug.risk_label}
                                            </span>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${sev.color} hidden sm:block`}>
                                                {sev.label}
                                            </span>
                                            {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                                        </div>
                                    </button>

                                    {/* Expanded Details */}
                                    {isOpen && (
                                        <div className="px-5 pb-5 animate-[fadeIn_0.2s_ease-out]">
                                            <div className={`rounded-xl border ${risk.border} overflow-hidden`}>
                                                {/* AI Explanation */}
                                                <div className="p-5 border-b border-white/5">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Brain className="w-4 h-4 text-primary" />
                                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">AI Clinical Explanation</h4>
                                                    </div>
                                                    <p className="text-sm text-gray-200 leading-relaxed">
                                                        {drug.llm_explanation?.summary || "Automated risk assessment based on CPIC guidelines."}
                                                    </p>
                                                </div>

                                                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
                                                    {/* Clinical Recommendation */}
                                                    <div className="p-5">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <FileText className="w-4 h-4 text-amber-400" />
                                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recommendation</h4>
                                                        </div>
                                                        <p className="text-sm text-gray-200 leading-relaxed mb-3">
                                                            {drug.recommendation?.recommended_action || "No specific recommendation."}
                                                        </p>
                                                        {drug.recommendation?.dose_adjustment && (
                                                            <div className="text-xs text-amber-400/80 bg-amber-500/8 p-2.5 rounded-lg border border-amber-500/15">
                                                                ⚠️ <strong>Dose:</strong> {drug.recommendation.dose_adjustment}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Mechanism */}
                                                    <div className="p-5">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Activity className="w-4 h-4 text-cyan-400" />
                                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mechanism</h4>
                                                        </div>
                                                        <p className="text-sm text-gray-400 leading-relaxed">
                                                            {drug.llm_explanation?.mechanism_of_action || "See clinical guidelines."}
                                                        </p>
                                                        {drug.recommendation?.guideline_reference && (
                                                            <p className="text-[10px] text-gray-600 mt-3 font-mono">
                                                                📖 {drug.recommendation.guideline_reference}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
