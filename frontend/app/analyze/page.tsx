"use client";

import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { Search, AlertTriangle, CheckCircle, Pill, FileText, Activity, Download } from "lucide-react";
import { getToken, isLoggedIn, authFetch } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function AnalyzePage() {
    const router = useRouter();
    const [drug, setDrug] = useState("");
    const [result, setResult] = useState<any>(null);
    const [rawResult, setRawResult] = useState<any>(null);
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
            setRawResult(data);

            const riskLabel = data.risk_assessment.risk_label;
            setResult({
                risk: riskLabel,
                severity: ["toxic", "ineffective"].some((k) =>
                    riskLabel.toLowerCase().includes(k)
                ) ? "high" : "low",
                gene: data.pharmacogenomic_profile.primary_gene,
                phenotype: data.pharmacogenomic_profile.phenotype,
                diplotype: data.pharmacogenomic_profile.diplotype,
                recommendation: data.clinical_recommendation.recommended_action,
                explanation: data.llm_generated_explanation.summary,
                confidence: data.risk_assessment.confidence_score,
            });
        } catch (err: any) {
            if (err.message?.includes("fetch") || err.message?.includes("Failed")) {
                setError("Cannot reach the backend. Is it running on port 8000?");
            } else {
                setError(err.message || "An error occurred.");
            }
        } finally {
            setLoading(false);
        }
    };

    const downloadReport = () => {
        if (!rawResult) return;
        const blob = new Blob([JSON.stringify(rawResult, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `PharmaGuard_${drug}_Report.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
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
                                    placeholder="e.g. Codeine, Warfarin, Clopidogrel"
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

<<<<<<< Updated upstream
                        {error && (
                            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm max-w-xl mx-auto animate-[fadeIn_0.3s_ease-out]">
                                {error}
                            </div>
=======
            <form onSubmit={handleAnalyze} className="relative max-w-2xl mx-auto">
              <div className="relative group">
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
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze"
                  )}
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
              <Card
                className={`relative overflow-hidden border-2 ${
                  getRiskColor(result.risk_assessment.severity).border
                }`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${
                    getRiskColor(result.risk_assessment.severity).bg
                  } opacity-50`}
                ></div>
                <CardContent className="relative p-8">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="flex items-start gap-6">
                      <div
                        className={`p-5 rounded-2xl ${
                          getRiskColor(result.risk_assessment.severity).icon
                        } backdrop-blur-sm`}
                      >
                        {result.risk_assessment.severity.toLowerCase() === "low" ? (
                          <CheckCircle className="w-12 h-12 text-green-400" />
                        ) : (
                          <AlertTriangle className="w-12 h-12 text-red-400" />
>>>>>>> Stashed changes
                        )}
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
                                                <p className="text-gray-400 text-sm">Confidence: {(result.confidence * 100).toFixed(0)}%</p>
                                            </div>
                                        </div>

<<<<<<< Updated upstream
                                        <div className="flex gap-4 flex-wrap">
                                            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
                                                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Gene</div>
                                                <div className="text-lg font-mono font-bold text-white">{result.gene}</div>
                                            </div>
                                            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
                                                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Phenotype</div>
                                                <div className="text-lg font-mono font-bold text-white">{result.phenotype}</div>
                                            </div>
                                            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
                                                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Diplotype</div>
                                                <div className="text-lg font-mono font-bold text-white">{result.diplotype}</div>
                                            </div>
                                        </div>
                                    </div>
=======
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
                            {result.quality_metrics.vcf_parsing_success ? (
                              <span className="text-green-400">✓ Success</span>
                            ) : (
                              <span className="text-red-400">✗ Failed</span>
                            )}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <p className="text-sm text-gray-400 mb-1">Total Variants</p>
                          <p className="text-xl font-bold text-white">
                            {result.quality_metrics.total_variants}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <p className="text-sm text-gray-400 mb-1">PGx Profile</p>
                          <p className="text-xl font-bold">
                            {result.quality_metrics.pgx_profile_available ? (
                              <span className="text-green-400">Available</span>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Patient Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-6 h-6 text-primary" />
                        Patient & Session
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                          <User className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-400">Patient ID</p>
                            <p className="font-mono text-sm">{result.patient_id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                          <Clock className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-400">Analysis Time</p>
                            <p className="font-mono text-sm">
                              {new Date(result.timestamp).toLocaleString()}
                            </p>
                          </div>
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
                            <span className="font-mono font-bold text-primary text-lg">
                              {result.pharmacogenomic_profile.primary_gene}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-secondary/10 to-transparent border border-secondary/20">
                            <span className="text-gray-400">Phenotype</span>
                            <span className="font-mono font-bold text-secondary text-lg">
                              {result.pharmacogenomic_profile.phenotype}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-tertiary/10 to-transparent border border-tertiary/20">
                            <span className="text-gray-400">Diplotype</span>
                            <span className="font-mono font-bold text-tertiary text-lg">
                              {result.pharmacogenomic_profile.diplotype}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20">
                            <span className="text-gray-400">Detected Variants</span>
                            <span className="font-mono font-bold text-purple-400 text-lg">
                              {uniqueVariants.length} unique
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Variants by Gene Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-green-400" />
                        Variants by Gene
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(variantsByGene).map(([gene, variants]) => {
                          const geneVariants = variants as typeof uniqueVariants;
                          return (
                            <div
                              key={gene}
                              className="p-4 rounded-xl bg-white/5 border border-white/10"
                            >
                              <p className="text-sm text-gray-400 mb-1">{gene}</p>
                              <p className="text-2xl font-bold text-white">{geneVariants.length}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {geneVariants.map((v) => v.star_allele).join(", ")}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="w-6 h-6 text-blue-400" />
                        Full Explanation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 leading-relaxed">
                        {result.llm_generated_explanation}
                      </p>
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
                        <p className="text-lg text-white font-semibold mb-4">
                          {result.clinical_recommendation.action}
                        </p>
                        <div className="h-px bg-white/10 my-4"></div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                          Details
                        </h4>
                        <p className="text-gray-300 leading-relaxed">
                          {result.clinical_recommendation.details}
                        </p>
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
                          <Badge
                            variant={
                              result.risk_assessment.severity.toLowerCase() === "low"
                                ? "success"
                                : "danger"
                            }
                          >
                            {result.risk_assessment.risk_label}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                          <span className="text-gray-400">Severity</span>
                          <span
                            className={`font-bold ${
                              getRiskColor(result.risk_assessment.severity).text
                            }`}
                          >
                            {result.risk_assessment.severity}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                          <span className="text-gray-400">Confidence Score</span>
                          <div className="flex items-center gap-3">
                            <Progress
                              value={result.risk_assessment.confidence_score * 100}
                              className="w-32 h-2"
                            />
                            <span className="font-bold text-white">
                              {(result.risk_assessment.confidence_score * 100).toFixed(0)}%
                            </span>
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
                        Detected Genetic Variants ({uniqueVariants.length} unique,{" "}
                        {result.quality_metrics.total_variants} total)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {uniqueVariants.map((variant, idx) => (
                          <AccordionItem key={idx} value={`item-${idx}`}>
                            <AccordionTrigger className="hover:text-primary">
                              <div className="flex items-center gap-4">
                                <Badge variant="outline">{variant.gene}</Badge>
                                <span className="font-mono text-sm">{variant.rsid}</span>
                                {variant.count > 1 && (
                                  <Badge variant="default" className="ml-2">
                                    x{variant.count}
                                  </Badge>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/5 rounded-xl">
                                <div>
                                  <p className="text-xs text-gray-500 uppercase mb-1">Gene</p>
                                  <p className="font-mono font-bold text-primary">{variant.gene}</p>
>>>>>>> Stashed changes
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="glass-card p-6 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Pill className="w-5 h-5 text-tertiary" />
                                        <h3 className="text-lg font-bold">Recommendation</h3>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed font-medium">{result.recommendation}</p>
                                </div>

                                <div className="glass-card p-6 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Activity className="w-5 h-5 text-secondary" />
                                        <h3 className="text-lg font-bold">Clinical Evidence</h3>
                                    </div>
                                    <p className="text-sm text-gray-400 leading-relaxed">{result.explanation}</p>
                                </div>
                            </div>

                            {/* Download */}
                            <div className="flex justify-center">
                                <button
                                    onClick={downloadReport}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                                >
                                    <Download className="w-5 h-5" />
                                    Download Official Report (JSON)
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!result && !loading && !error && (
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
