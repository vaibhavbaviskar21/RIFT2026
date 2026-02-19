import Link from "next/link";
import { ArrowRight, Dna, Pill, FileText, Activity, ShieldAlert, Cpu } from "lucide-react";

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] -z-10 animate-pulse-slow delay-1000"></div>

            <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">

                {/* Left Column: Text Content */}
                <div className="text-center lg:text-left z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm animate-[fadeIn_1s_ease-out]">
                        <span className="flex h-2 w-2 rounded-full bg-green-400"></span>
                        <span className="text-sm font-medium text-gray-300 tracking-wide uppercase">
                            RIFT 2026 HealthTech Track
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
                        Unlock Your <br />
                        <span className="text-gradient">Genetic Potential</span> <br />
                        For Safer Medicine.
                    </h1>

                    <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                        PharmaGuard analyzes your unique genetic profile to predict drug risks and optimize treatments.
                        Precision medicine is now just one click away.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                        <Link
                            href="/analyze"
                            className="px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-lg shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:shadow-[0_0_50px_rgba(124,58,237,0.6)] transition-all transform hover:-translate-y-1 flex items-center gap-2"
                        >
                            Start Analysis <ArrowRight className="w-5 h-5" />
                        </Link>

                    </div>

                    <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                        <span className="text-lg font-bold text-gray-500 flex items-center gap-2"><Cpu className="w-5 h-5" /> AI-Powered</span>
                        <span className="text-lg font-bold text-gray-500 flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> Secure</span>
                        <span className="text-lg font-bold text-gray-500 flex items-center gap-2"><Activity className="w-5 h-5" /> Clinical Grade</span>
                    </div>
                </div>

                {/* Right Column: Orbital Animation */}
                <div className="relative h-[600px] hidden lg:flex items-center justify-center">

                    {/* Orbits */}
                    <div className="absolute w-[500px] h-[500px] border border-white/5 rounded-full animate-[spin_60s_linear_infinite]"></div>
                    <div className="absolute w-[350px] h-[350px] border border-white/10 rounded-full animate-[spin_40s_linear_infinite_reverse]"></div>
                    <div className="absolute w-[200px] h-[200px] border border-white/15 rounded-full animate-[spin_20s_linear_infinite]"></div>

                    {/* Central Node */}
                    <div className="relative z-10 w-32 h-32 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-[0_0_60px_rgba(124,58,237,0.5)] animate-float">
                        <Dna className="w-16 h-16 text-white" />
                    </div>

                    {/* Floating Nodes (Absolute positioning mimicking orbits) */}

                    {/* Node 1 */}
                    <div className="absolute top-[15%] right-[20%] p-4 rounded-2xl glass-card animate-float delay-700">
                        <Pill className="w-8 h-8 text-secondary" />
                    </div>

                    {/* Node 2 */}
                    <div className="absolute bottom-[20%] left-[15%] p-4 rounded-2xl glass-card animate-float delay-1000">
                        <Activity className="w-8 h-8 text-tertiary" />
                    </div>

                    {/* Node 3 */}
                    <div className="absolute top-[40%] left-[5%] p-3 rounded-xl glass-card animate-pulse-glow delay-500">
                        <div className="text-xs font-bold text-white">CYP2D6</div>
                        <div className="text-[10px] text-gray-400">Metabolizer</div>
                    </div>

                    {/* Node 4 */}
                    <div className="absolute bottom-[30%] right-[10%] p-3 rounded-xl glass-card animate-pulse-glow delay-200">
                        <div className="text-xs font-bold text-white">Risk: Low</div>
                        <div className="text-[10px] text-green-400">Safe</div>
                    </div>

                    {/* Node 5 */}
                    <div className="absolute top-[10%] left-[40%] p-2 rounded-full bg-white/10 backdrop-blur-md animate-float delay-300">
                        <img src="https://ui-avatars.com/api/?name=Dr+Smith&background=random" className="w-8 h-8 rounded-full" alt="Doctor" />
                    </div>

                </div>
            </div>
        </section>
    );
}
