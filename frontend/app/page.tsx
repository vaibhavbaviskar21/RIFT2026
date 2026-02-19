import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white overflow-x-hidden relative">
      <Navbar />
      <Hero />
      <Features />

      {/* Footer / CTA Section could go here */}
      <section className="py-20 text-center border-t border-white/5">
        <p className="text-gray-500 text-sm">
          © 2026 PharmaGuard. Built for RIFT 2026 HealthTech Track.
        </p>
      </section>
    </main>
  );
}
