"use client";

import { Dna, ShieldCheck, BrainCircuit, Activity, FileJson, GitBranch } from "lucide-react";
import { useState, useRef, MouseEvent } from "react";

const features = [
    {
        step: "01",
        icon: <Dna className="w-10 h-10 text-tertiary" />,
        title: "VCF File Parsing",
        description: "Securely upload and parse standard Variant Call Format (VCF) files to extract genomic data with 100% accuracy.",
        color: "cyan",
    },
    {
        step: "02",
        icon: <Activity className="w-10 h-10 text-primary" />,
        title: "Gene Analysis",
        description: "Screens for pharmacogenomic variants across 6 critical genes: CYP2D6, CYP2C19, CYP2C9, SLCO1B1, TPMT, and DPYD.",
        color: "violet",
    },
    {
        step: "03",
        icon: <ShieldCheck className="w-10 h-10 text-success" />,
        title: "Risk Prediction",
        description: "AI-driven prediction of drug-specific risks: Safe, Adjust Dosage, Toxic, Ineffective, or Unknown.",
        color: "emerald",
    },
    {
        step: "04",
        icon: <BrainCircuit className="w-10 h-10 text-secondary" />,
        title: "LLM Explanations",
        description: "Generates clinical explanations using advanced LLMs with specific variant citations and biological mechanisms.",
        color: "pink",
    },
    {
        step: "05",
        icon: <FileJson className="w-10 h-10 text-yellow-400" />,
        title: "Structured JSON",
        description: "Standardized JSON output compliant with the RIFT 2026 schema for seamless integration.",
        color: "yellow",
    },
    {
        step: "06",
        icon: <GitBranch className="w-10 h-10 text-blue-400" />,
        title: "CPIC Guidelines",
        description: "Dosing recommendations aligned with the latest Clinical Pharmacogenetics Implementation Consortium guidelines.",
        color: "blue",
    },
];

export default function Features() {
    return (
        <section className="py-32 relative overflow-hidden" id="how-it-works">
            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-24">
                    <span className="inline-block py-1 px-3 rounded-full bg-white/5 border border-white/10 text-secondary text-sm font-medium mb-6">
                        Advanced Technology
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        <span className="text-white">How </span>
                        <span className="text-gradient">PharmaGuard Works</span>
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
                        From raw genomic data to actionable clinical insights, our pipeline ensures precision at every step.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <FeatureCard key={index} feature={feature} index={index} />
                    ))}
                </div>
            </div>

            {/* Background Glows */}
            <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-tertiary/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>
        </section>
    );
}

function FeatureCard({ feature, index }: { feature: any, index: number }) {
    const divRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;

        const div = divRef.current;
        const rect = div.getBoundingClientRect();

        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleMouseEnter = () => {
        setOpacity(1);
    };

    const handleMouseLeave = () => {
        setOpacity(0);
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="holo-card p-8 rounded-3xl group relative"
            style={{
                "--mouse-x": `${position.x}px`,
                "--mouse-y": `${position.y}px`,
            } as React.CSSProperties}
        >
            <div className="absolute top-6 right-8 text-8xl font-bold text-white/5 font-mono select-none pointer-events-none group-hover:text-white/10 transition-colors">
                {feature.step}
            </div>

            <div className={`mb-8 p-4 rounded-2xl bg-white/5 w-fit border border-white/10 group-hover:scale-110 group-hover:border-${feature.color}-500/50 transition-all duration-300 relative z-10 shadow-lg`}>
                {feature.icon}
            </div>

            <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-colors relative z-10">
                {feature.title}
            </h3>

            <p className="text-gray-400 leading-relaxed text-sm relative z-10 group-hover:text-gray-300 transition-colors">
                {feature.description}
            </p>
        </div>
    );
}
