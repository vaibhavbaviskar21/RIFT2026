"use client";

import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { Search, AlertTriangle, CheckCircle, Pill, Download, Dna, Activity, FileText, TrendingUp, Shield, Zap, Info, ChevronRight } from "lucide-react";
import { getToken, isLoggedIn, authFetch } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface DrugResponse {
    patient_id: string;
    drug: string;
    timestamp: string;
    risk_assessment: {
        risk_label: string;
        severity: string;
        confidence_score: number;
    };
    pharmacogenomic_profile: {
        primary_gene: string;
        diplotype: string;
        phenotype: string;
        detected_variants: Array<{
            rsid: string;
            gene: string;
            genotype: string;
            star_allele: string;
        }>;
    };
    clinical_recommendation: {
        action: string;
        details: string;
    };
    llm_generated_explanation: string;
    quality_metrics: {
        vcf_parsing_success: boolean;
        total_variants: number;
        pgx_profile_available: boolean;
    };
}

export default function AnalyzePage() {
    const router = useRouter();
    const [drug, setDrug] = useState("");
    const [result, setResult] = useState<DrugResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoggedIn()) {
            router.push("/login");
        }
    }, [router]);

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!drug) return;
        setError(null);
        setResult(null);
        setLoading(true);

        try {
            const res = await authFetch("/query-drug", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ drug_name: drug.trim() }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ detail: `Server error (${res.status})` }));
                throw new Error(err.detail || `Request failed (${res.status})`);
            }

            const data = await res.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message || "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const downloadReport = () => {
        if (!result) return;
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `PharmaGuard_${result.drug}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const getRiskColor = (severity: string) => {
        switch (severity.toLowerCase()) {
            case "high": return { bg: "from-red-500/20 to-orange-500/20", border: "border-red-500/30", text: "text-red-400", icon: "bg-red-500/20" };
            case "medium": return { bg: "from-yellow-500/20 to-orange-500/20", border: "border-yellow-500/30", text: "text-yellow-400", icon: "bg-yellow-500/20" };
            case "low": return { bg: "from-green-500/20 to-emerald-500/20", border: "border-green-500/30", text: "text-green-400", icon: "bg-green-500/20" };
            default: return { bg: "from-blue-500/20 to-cyan-500/20", border: "border-blue-500/30", text: "text-blue-400", icon: "bg-blue-500/20" };
        }
    };

    const uniqueVariants = result?.pharmacogenomic_profile.detected_variants.reduce((acc, variant) => {
        const key = `${variant.rsid}-${variant.gene}`;
        if (!acc.some(v => `${v.rsid}-${v.gene}` === key)) {
            acc.push(variant);
        }
        return acc;
    }, [] as typeof result.pharmacogenomic_profile.detected_variants);

    return (
        <div className="min-h-screen bg-gray-950 text-white relative overflow-x-hidden">
            <Navbar />
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/10 blur-[150px] pointer-events-none -z-10"></div>

            <div className="container mx-auto px-6 pt-32 pb-20">
                <div className="max-w-7xl mx-auto">
                    {/* Search Section */}
                    <div className="text-center mb-12 animate-[fadeIn_0.5s_ease-out]">
                        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                            Drug Risk Analysis
                        </h1>
                        <p className="text-gray-400 mb-8 text-lg">Enter a drug name to analyze pharmacogenomic compatibility</p>

                        <form onSubmit={handleAnalyze} className="relative max-w-2xl mx-auto">
                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    value={drug}
                                    onChange={(e) => setDrug(e.target.value)}
                                    placeholder="e.g. Codeine, Warfarin, Clopidogrel, Aspirin"
                                    className="w-full h-16 pl-14 pr-36 rounded-2xl glass-input border border-white/10 focus:border-primary/50 text-lg shadow-[0_0_20px_-5px_rgba(0,0,0,0.3)] focus:shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] transition-all"
                                />
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    variant="glow"
                                    size="lg"
                                    className="absolute right-2 top-2 h-12"
                                >
                                    {loading ? "Analyzing..." : "Analyze"}
                                </Button>
                            </div>
                        </form>

                        {error && (
                            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 max-w-2xl mx-auto animate-[fadeIn_0.3s_ease-out]">
                                <AlertTriangle className="w-5 h-5 inline mr-2" />
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Results Section */}
                    {result && (
                        <div className="space-y-6 animate-[fadeIn_0.6s_ease-out]">
                            {/* Hero Risk Card */}
                            <Card className={`relative overflow-hidden border-2 ${getRiskColor(result.risk_assessment.severity).border}`}>
                                <div className={`absolute inset-0 bg-gradient-to-br ${getRiskColor(result.risk_assessment.severity).bg} opacity-50`}></div>
                                <CardContent className="relative p-8">
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                        <div className="flex items-start gap-6">
                                            <div className={`p-5 rounded-2xl ${getRiskColor(result.risk_assessment.severity).icon} backdrop-blur-sm`}>
                                                {result.risk_assessment.severity.toLowerCase() === "low" ? 
                                                    <CheckCircle className="w-12 h-12 text-green-400" /> : 
                                                    <AlertTriangle className="w-12 h-12 text-red-400" />
                                                }
                                            </div>
                                            <div>
                                                <h2 className={`text-4xl font-bold mb-2 ${getRiskColor(result.risk_assessment.severity).text}`}>
                                                    {result.risk_assessment.risk_label}
                                                </h2>
                                                <p className="text-gray-400 text-lg mb-3">Drug: <span className="text-white font-semibold">{result.drug}</span></p>
                                                <div className="flex gap-3 flex-wrap">
                                                    <Badge variant={result.risk_assessment.severity.toLowerCase() === "low" ? "success" : "danger"}>
                                                        {result.risk_assessment.severity} Risk
                                                    </Badge>
                                                    <Badge variant="outline">
                                                        Confidence: {(result.risk_assessment.confidence_score * 100).toFixed(0)}%
                                                    </Badge>
                                                    <Badge variant="outline">
                                                        {new Date(result.timestamp).toLocaleDateString()}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <Button onClick={downloadReport} variant="outline" size="lg">
                                            <Download className="w-5 h-5" />
                                            Download Report
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Tabs Section */}
                            <Tabs defaultValue="overview" className="w-full">
                                <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
                                    <TabsTrigger value="overview">Overview</TabsTrigger>
                                    <TabsTrigger value="genetics">Genetics</TabsTrigger>
                                    <TabsTrigger value="clinical">Clinical</TabsTrigger>
                                    <TabsTrigger value="variants">Variants</TabsTrigger>
                                </TabsList>

                                {/* Overview Tab */}
                                <TabsContent value="overview" className="space-y-6">
                                    <div className="grid md:grid-cols-3 gap-6">
                                        <Card className="hover:border-primary/30 transition-all">
                                            <CardHeader>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3 rounded-xl bg-primary/10">
                                                        <Dna className="w-6 h-6 text-primary" />
                                                    </div>
                                                    <CardTitle className="text-lg">Primary Gene</CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-3xl font-bold font-mono text-primary mb-2">
                                                    {result.pharmacogenomic_profile.primary_gene}
                                                </p>
                                                <p className="text-sm text-gray-400">Main metabolizing enzyme</p>
                                            </CardContent>
                                        </Card>

                                        <Card className="hover:border-secondary/30 transition-all">
                                            <CardHeader>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3 rounded-xl bg-secondary/10">
                                                        <Activity className="w-6 h-6 text-secondary" />
                                                    </div>
                                                    <CardTitle className="text-lg">Phenotype</CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-3xl font-bold font-mono text-secondary mb-2">
                                                    {result.pharmacogenomic_profile.phenotype}
                                                </p>
                                                <p className="text-sm text-gray-400">Metabolizer status</p>
                                            </CardContent>
                                        </Card>

                                        <Card className="hover:border-tertiary/30 transition-all">
                                            <CardHeader>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3 rounded-xl bg-tertiary/10">
                                                        <Zap className="w-6 h-6 text-tertiary" />
                                                    </div>
                                                    <CardTitle className="text-lg">Diplotype</CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-3xl font-bold font-mono text-tertiary mb-2">
                                                    {result.pharmacogenomic_profile.diplotype}
                                                </p>
                                                <p className="text-sm text-gray-400">Allele combination</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <Card>
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <Shield className="w-6 h-6 text-primary" />
                                                <CardTitle>Quality Metrics</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                                    <p className="text-sm text-gray-400 mb-1">VCF Parsing</p>
                                                    <p className="text-xl font-bold">
                                                        {result.quality_metrics.vcf_parsing_success ? 
                                                            <span className="text-green-400">✓ Success</span> : 
                                                            <span className="text-red-400">✗ Failed</span>
                                                        }
                                                    </p>
                                                </div>
                                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                                    <p className="text-sm text-gray-400 mb-1">Total Variants</p>
                                                    <p className="text-xl font-bold text-white">{result.quality_metrics.total_variants}</p>
                                                </div>
                                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                                    <p className="text-sm text-gray-400 mb-1">PGx Profile</p>
                                                    <p className="text-xl font-bold">
                                                        {result.quality_metrics.pgx_profile_available ? 
                                                            <span className="text-green-400">Available</span> : 
                                                            <span className="text-gray-400">N/A</span>
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Genetics Tab */}
                                <TabsContent value="genetics" className="space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Dna className="w-6 h-6 text-primary" />
                                                Pharmacogenomic Profile
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20">
                                                        <span className="text-gray-400">Primary Gene</span>
                                                        <span className="font-mono font-bold text-primary text-lg">{result.pharmacogenomic_profile.primary_gene}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-secondary/10 to-transparent border border-secondary/20">
                                                        <span className="text-gray-400">Phenotype</span>
                                                        <span className="font-mono font-bold text-secondary text-lg">{result.pharmacogenomic_profile.phenotype}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-tertiary/10 to-transparent border border-tertiary/20">
                                                        <span className="text-gray-400">Diplotype</span>
                                                        <span className="font-mono font-bold text-tertiary text-lg">{result.pharmacogenomic_profile.diplotype}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20">
                                                        <span className="text-gray-400">Detected Variants</span>
                                                        <span className="font-mono font-bold text-purple-400 text-lg">{uniqueVariants?.length || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Info className="w-6 h-6 text-blue-400" />
                                                Scientific Explanation
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-gray-300 leading-relaxed">{result.llm_generated_explanation}</p>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Clinical Tab */}
                                <TabsContent value="clinical" className="space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Pill className="w-6 h-6 text-primary" />
                                                Clinical Recommendation
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/5 border border-primary/20">
                                                <h3 className="text-xl font-bold mb-3 text-primary">Recommended Action</h3>
                                                <p className="text-lg text-white font-semibold mb-4">{result.clinical_recommendation.action}</p>
                                                <div className="h-px bg-white/10 my-4"></div>
                                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Details</h4>
                                                <p className="text-gray-300 leading-relaxed">{result.clinical_recommendation.details}</p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <TrendingUp className="w-6 h-6 text-green-400" />
                                                Risk Assessment Summary
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                                                    <span className="text-gray-400">Risk Level</span>
                                                    <Badge variant={result.risk_assessment.severity.toLowerCase() === "low" ? "success" : "danger"}>
                                                        {result.risk_assessment.risk_label}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                                                    <span className="text-gray-400">Severity</span>
                                                    <span className={`font-bold ${getRiskColor(result.risk_assessment.severity).text}`}>
                                                        {result.risk_assessment.severity}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                                                    <span className="text-gray-400">Confidence Score</span>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-gradient-to-r from-primary to-secondary"
                                                                style={{ width: `${result.risk_assessment.confidence_score * 100}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="font-bold text-white">{(result.risk_assessment.confidence_score * 100).toFixed(0)}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Variants Tab */}
                                <TabsContent value="variants" className="space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <FileText className="w-6 h-6 text-tertiary" />
                                                Detected Genetic Variants ({uniqueVariants?.length || 0})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <Accordion type="single" collapsible className="w-full">
                                                {uniqueVariants?.map((variant, idx) => (
                                                    <AccordionItem key={idx} value={`item-${idx}`}>
                                                        <AccordionTrigger className="hover:text-primary">
                                                            <div className="flex items-center gap-4">
                                                                <Badge variant="outline">{variant.gene}</Badge>
                                                                <span className="font-mono text-sm">{variant.rsid}</span>
                                                            </div>
                                                        </AccordionTrigger>
                                                        <AccordionContent>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/5 rounded-xl">
                                                                <div>
                                                                    <p className="text-xs text-gray-500 uppercase mb-1">Gene</p>
                                                                    <p className="font-mono font-bold text-primary">{variant.gene}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500 uppercase mb-1">RS ID</p>
                                                                    <p className="font-mono text-sm">{variant.rsid}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500 uppercase mb-1">Genotype</p>
                                                                    <p className="font-mono font-bold text-secondary">{variant.genotype}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500 uppercase mb-1">Star Allele</p>
                                                                    <p className="font-mono font-bold text-tertiary">{variant.star_allele}</p>
                                                                </div>
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                ))}
                                            </Accordion>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}

                    {/* Empty State */}
                    {!result && !loading && !error && (
                        <div className="grid md:grid-cols-3 gap-6 mt-16">
                            {[
                                { icon: Search, title: "Search Drug", desc: "Enter medication name" },
                                { icon: Activity, title: "AI Analysis", desc: "Genetic risk assessment" },
                                { icon: FileText, title: "Get Report", desc: "Detailed clinical insights" }
                            ].map((item, i) => (
                                <Card key={i} className="text-center hover:border-primary/30 transition-all group">
                                    <CardContent className="pt-8 pb-8">
                                        <div className="w-16 h-16 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center group-hover:bg-primary/10 transition-all">
                                            <item.icon className="w-8 h-8 text-gray-500 group-hover:text-primary transition-colors" />
                                        </div>
                                        <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                                        <p className="text-sm text-gray-500">{item.desc}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
