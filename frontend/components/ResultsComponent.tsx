"use client";

import { CheckCircle, AlertTriangle, Pill, Activity, Download, ChevronDown, ChevronUp, Copy, Search } from "lucide-react";
import { useState } from "react";

export interface VariantResult {
    variants_saved: number;
    genes_analyzed: { gene: string; diplotype: string; phenotype: string }[];
    drug_analyses: {
        drug: string;
        risk_label: string;
        severity: string;
        recommendation: { recommended_action: string; dose_adjustment: string; guideline_reference: string };
        llm_explanation: { summary: string; mechanism_of_action: string };
    }[];
}

export default function ResultsComponent({ data }: { data: VariantResult }) {
    const [expanded, setExpanded] = useState<number | null>(null);
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
        a.download = `PharmaGuard_Result_${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="animate-[fadeIn_0.5s_ease-out] space-y-8">
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 mb-4">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-bold">Analysis Complete</span>
                </div>
                <h2 className="text-3xl font-bold mb-2">Genomic Profile Ready</h2>
                <p className="text-gray-400">
                    Analyzed {data.variants_saved} variants across {data.genes_analyzed.length} pharmacogenes.
                </p>
            </div>

            {/* Gene Summary Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.genes_analyzed.map((gene, idx) => (
                    <div key={idx} className="glass-card p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-gray-400">GENE</span>
                            <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-mono font-bold">
                                {gene.gene}
                            </span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Diplotype</span>
                                <span className="text-white font-mono">{gene.diplotype}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Phenotype</span>
                                <span className="text-white font-medium text-right max-w-[60%] truncate" title={gene.phenotype}>
                                    {gene.phenotype}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Drug Risk Analysis with Search */}
            <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
                <div className="p-6 border-b border-white/10 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-xl font-bold flex items-center gap-3">
                        <Pill className="w-5 h-5 text-primary" />
                        Drug Risk Stratification
                    </h3>

                    {/* Drug Input / Filter */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Filter drugs (e.g. Warfarin)..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-all w-full md:w-64"
                        />
                    </div>
                </div>

                <div className="divide-y divide-white/5">
                    {filteredDrugs.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            {filter ? "No matching drugs found." : "No immediate drug interactions found for analyzed genes."}
                        </div>
                    ) : (
                        filteredDrugs.map((drug, idx) => (
                            <div key={idx} className="group">
                                <button
                                    onClick={() => setExpanded(expanded === idx ? null : idx)}
                                    className="w-full p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors text-left"
                                >
                                    <div className="font-bold text-lg flex items-center gap-3">
                                        {drug.drug}
                                        <span className="text-xs font-normal text-gray-500 hidden sm:inline opacity-0 group-hover:opacity-100 transition-opacity">
                                            Click for details
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 ${drug.severity === 'high'
                                                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                                : drug.severity === 'moderate'
                                                    ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                                                    : 'bg-green-500/10 border-green-500/20 text-green-400'
                                            }`}>
                                            {drug.severity === 'high' && <AlertTriangle className="w-3 h-3" />}
                                            {drug.risk_label}
                                        </div>
                                        {expanded === idx ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                                    </div>
                                </button>

                                {/* Expandable Details */}
                                {expanded === idx && (
                                    <div className="px-5 pb-5 pt-0 bg-white/[0.01]">
                                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-4 animate-[fadeIn_0.2s_ease-out]">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Clinical Recommendation</h4>
                                                    <p className="text-sm text-gray-200 leading-relaxed">
                                                        {drug.recommendation?.recommended_action || "No specific recommendation."}
                                                    </p>
                                                    {drug.recommendation?.dose_adjustment && (
                                                        <div className="mt-2 text-xs text-yellow-400/80 bg-yellow-500/5 p-2 rounded border border-yellow-500/10 inline-block">
                                                            ⚠️ {drug.recommendation.dose_adjustment}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mechanism & Evidence</h4>
                                                    <p className="text-sm text-gray-400 leading-relaxed">
                                                        {drug.llm_explanation?.summary || "Automated risk assessment."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <button
                    onClick={downloadReport}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                >
                    <Download className="w-5 h-5" />
                    Download JSON Report
                </button>
                <button
                    onClick={copyToClipboard}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary/10 border border-primary/20 text-sm font-semibold text-primary hover:bg-primary/20 transition-all"
                >
                    {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copied ? "Copied to Clipboard!" : "Copy JSON to Clipboard"}
                </button>
            </div>
        </div>
    );
}
