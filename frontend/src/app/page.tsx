"use client";

import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  Clock,
  Lock,
  ArrowDownToLine,
  BarChart3,
  Send,
  Wallet,
  Lock as LockIcon,
  Users,
  ArrowRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/GlassCard";
import Badge from "@/components/ui/Badge";
import StatusDot from "@/components/ui/StatusDot";

/* ───────────────────────── Marquee ───────────────────────── */

const MARQUEE_ITEMS = [
  "100% ENCRYPTED SALARIES",
  "INSTANT HIGH-TRUST PAYMENTS",
  "EIGENTRUST SCORING",
  "cUSDC / cUSDT PAYROLL",
  "FHE ON-CHAIN PRIVACY",
];

function MarqueeStrip() {
  return (
    <div className="w-full overflow-hidden card-static py-3 my-12">
      <div className="flex gap-8 animate-marquee" style={{ "--duration": "25s" } as React.CSSProperties}>
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map(
          (item, i) => (
            <span
              key={i}
              className="flex items-center gap-2 text-xs font-mono font-medium text-gray-400 dark:text-slate-500 whitespace-nowrap tracking-widest uppercase"
            >
              <span className="h-1 w-1 rounded-full bg-primary" />
              {item}
            </span>
          )
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── Mini Stat Cards ───────────────────────── */

function MiniStat({
  label,
  value,
  icon,
  delay,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  delay: number;
}) {
  return (
    <div
      className="card px-5 py-4 opacity-0 animate-slide-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-center gap-3">
        <div className="text-primary">{icon}</div>
        <div>
          <p className="text-lg font-heading font-bold text-gray-900 dark:text-slate-100">{value}</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Trust Tier Card ───────────────────────── */

const tierStyles = {
  primary: {
    border: "border-l-emerald-500",
    iconBg: "bg-emerald-50 dark:bg-emerald-900/30",
    iconText: "text-emerald-600",
    pillBg: "bg-emerald-50 dark:bg-emerald-900/30",
    pillBorder: "border-emerald-200 dark:border-emerald-800",
    pillText: "text-emerald-700 dark:text-emerald-400",
  },
  warning: {
    border: "border-l-amber-500",
    iconBg: "bg-amber-50 dark:bg-amber-900/30",
    iconText: "text-amber-600",
    pillBg: "bg-amber-50 dark:bg-amber-900/30",
    pillBorder: "border-amber-200 dark:border-amber-800",
    pillText: "text-amber-700 dark:text-amber-400",
  },
  danger: {
    border: "border-l-red-500",
    iconBg: "bg-red-50 dark:bg-red-900/30",
    iconText: "text-red-600",
    pillBg: "bg-red-50 dark:bg-red-900/30",
    pillBorder: "border-red-200 dark:border-red-800",
    pillText: "text-red-700 dark:text-red-400",
  },
};

function TrustTierCard({
  title,
  subtitle,
  description,
  icon: Icon,
  accentColor,
  flowLabel,
  delay,
}: {
  title: string;
  subtitle: string;
  description: string;
  icon: typeof ShieldCheck;
  accentColor: "primary" | "warning" | "danger";
  flowLabel: string;
  delay: number;
}) {
  const style = tierStyles[accentColor];

  return (
    <div
      className={cn(
        "card p-6 opacity-0 animate-slide-up border-l-4",
        style.border
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className={cn("inline-flex p-3 rounded-xl mb-4", style.iconBg)}>
        <Icon size={28} className={style.iconText} />
      </div>
      <h3 className="text-lg font-heading font-bold text-gray-900 dark:text-slate-100 mb-1">
        {title}
      </h3>
      <p className={cn("text-xs font-mono font-medium mb-3", style.iconText)}>
        {subtitle}
      </p>
      <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-4">
        {description}
      </p>
      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500">
        <span className="px-2 py-0.5 rounded bg-gray-50 border border-gray-200 dark:bg-slate-800/50 dark:border-slate-700">
          Employer
        </span>
        <ArrowRight size={12} className={style.iconText} />
        <span className={cn("px-2 py-0.5 rounded border", style.pillBg, style.pillBorder, style.pillText)}>
          {flowLabel}
        </span>
        <ArrowRight size={12} className={style.iconText} />
        <span className="px-2 py-0.5 rounded bg-gray-50 border border-gray-200 dark:bg-slate-800/50 dark:border-slate-700">
          Employee
        </span>
      </div>
    </div>
  );
}

/* ───────────────────────── Step Card ───────────────────────── */

function StepCard({
  number,
  title,
  description,
  icon: Icon,
  isLast,
}: {
  number: string;
  title: string;
  description: string;
  icon: typeof ArrowDownToLine;
  isLast?: boolean;
}) {
  return (
    <div className="relative flex flex-col items-center text-center">
      {/* Connector line */}
      {!isLast && (
        <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-gray-200 dark:bg-slate-700" />
      )}

      {/* Number circle */}
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 dark:bg-blue-900/30 dark:border-blue-800 flex items-center justify-center">
          <Icon size={24} className="text-primary" />
        </div>
        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-blue-200 dark:bg-slate-800 dark:border-blue-800 flex items-center justify-center text-[10px] font-mono font-bold text-primary shadow-sm">
          {number}
        </span>
      </div>

      <h3 className="text-sm font-heading font-bold text-gray-900 dark:text-slate-100 mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed max-w-[200px]">
        {description}
      </p>
    </div>
  );
}

/* ───────────────────────── Tech Badge ───────────────────────── */

function TechPill({ label }: { label: string }) {
  return (
    <span className="px-4 py-2 rounded-full bg-gray-100 border border-gray-200 text-xs font-medium text-gray-600 hover:text-gray-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:text-slate-100 transition-all duration-200 cursor-default">
      {label}
    </span>
  );
}

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* ─── HERO SECTION ─── */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-900 dark:to-[#0F172A]">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Floating badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400 mb-8 animate-fade-in">
            <LockIcon size={12} />
            ERC-7984 Confidential Tokens
          </div>

          {/* Main heading */}
          <h1 className="font-heading font-extrabold tracking-tight leading-[1.1] animate-fade-in text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
            <span className="text-gray-900 dark:text-slate-100">Payroll,</span>
            <br />
            <span className="text-primary">Encrypted.</span>
            <br className="sm:hidden" />
            <span className="text-gray-900 dark:text-slate-100"> Trust, </span>
            <span className="text-emerald-600">Verified.</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-gray-500 dark:text-slate-400 leading-relaxed opacity-0 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            Pay your team with confidential stablecoins. Trust scores gate every
            payment flow. Salaries stay encrypted — only employees see their own.
          </p>

          {/* CTA buttons */}
          <div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-slide-up"
            style={{ animationDelay: "0.4s" }}
          >
            <Link
              href="/employer"
              className={cn(
                "inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold",
                "bg-primary text-white hover:bg-primary-hover active:scale-[0.98]",
                "transition-all duration-200"
              )}
            >
              Try It Now
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/employee"
              className={cn(
                "inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-medium",
                "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
                "dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700/50",
                "transition-all duration-200"
              )}
            >
              Employee Portal
            </Link>
          </div>
        </div>

        {/* Marquee bar */}
        <div className="w-full max-w-5xl mx-auto">
          <MarqueeStrip />
        </div>

        {/* Mini stat cards */}
        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 pb-12">
          <MiniStat
            label="Active Payrolls"
            value="2,847"
            icon={<StatusDot status="active" size="md" />}
            delay={0.6}
          />
          <MiniStat
            label="Total Encrypted"
            value="$12.4M"
            icon={<LockIcon size={18} />}
            delay={0.7}
          />
          <MiniStat
            label="Trust Scores"
            value="15,203"
            icon={<Shield size={18} />}
            delay={0.8}
          />
        </div>
      </section>

      {/* ─── TRUST TIERS SECTION ─── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="primary" className="mb-4">
              <Shield size={12} />
              Payment Routing
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-slate-100">
              Trust-Gated Payment Flows
            </h2>
            <p className="mt-3 text-sm text-gray-500 dark:text-slate-400 max-w-lg mx-auto">
              Smart contracts make encrypted decisions on encrypted data.
              Payment routing happens entirely within FHE — nobody learns the
              trust scores.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <TrustTierCard
              title="Instant Transfer"
              subtitle="HIGH TRUST (75-100)"
              description="Verified employees receive encrypted cUSDC immediately. No delays, no friction."
              icon={ShieldCheck}
              accentColor="primary"
              flowLabel="Instant"
              delay={0.1}
            />
            <TrustTierCard
              title="24h Delayed Release"
              subtitle="MEDIUM TRUST (40-74)"
              description="Building trust takes time. Payments held for 24 hours before release."
              icon={Clock}
              accentColor="warning"
              flowLabel="24h Hold"
              delay={0.2}
            />
            <TrustTierCard
              title="Escrow with Approval"
              subtitle="LOW TRUST (0-39)"
              description="New relationships start carefully. Funds held in escrow until milestones are met."
              icon={Lock}
              accentColor="danger"
              flowLabel="Escrow"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS SECTION ─── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50/50 dark:bg-slate-800/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="primary" className="mb-4">
              <Zap size={12} />
              Workflow
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-slate-100">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StepCard
              number="01"
              title="Wrap"
              description="Employer wraps USDC into confidential cUSDC"
              icon={ArrowDownToLine}
            />
            <StepCard
              number="02"
              title="Score"
              description="Trust scores encrypted and stored on-chain via FHE"
              icon={BarChart3}
            />
            <StepCard
              number="03"
              title="Pay"
              description="Batch payroll routes payments by encrypted trust tiers"
              icon={Send}
            />
            <StepCard
              number="04"
              title="Claim"
              description="Employees decrypt and claim their confidential salary"
              icon={Wallet}
              isLast
            />
          </div>
        </div>
      </section>

      {/* ─── TECH STACK SECTION ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-6">
            Built with the latest in confidential computing
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <TechPill label="Zama Protocol" />
            <TechPill label="Solidity" />
            <TechPill label="ERC-7984" />
            <TechPill label="FHE" />
            <TechPill label="EigenTrust" />
            <TechPill label="Next.js" />
          </div>
        </div>
      </section>

      {/* ─── TRY IT YOURSELF SECTION ─── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="primary" className="mb-4">
              <Users size={12} />
              Open Demo
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-slate-100">
              Try It Yourself
            </h2>
            <p className="mt-3 text-sm text-gray-500 dark:text-slate-400 max-w-lg mx-auto">
              No permissions needed. Anyone can register as an employer and run
              the full payroll flow on Sepolia testnet.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="card p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-heading font-bold text-primary">1</span>
              </div>
              <h3 className="text-sm font-heading font-bold text-gray-900 dark:text-slate-100 mb-2">
                Register
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                Connect your wallet and register as an employer with a single
                transaction.
              </p>
            </div>
            <div className="card p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-heading font-bold text-primary">2</span>
              </div>
              <h3 className="text-sm font-heading font-bold text-gray-900 dark:text-slate-100 mb-2">
                Get Test Tokens
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                Mint 10,000 cPAY test tokens from the built-in faucet to fund
                your payroll.
              </p>
            </div>
            <div className="card p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-heading font-bold text-primary">3</span>
              </div>
              <h3 className="text-sm font-heading font-bold text-gray-900 dark:text-slate-100 mb-2">
                Run Payroll
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                Add employees, set trust scores, and execute encrypted payroll --
                all on-chain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA SECTION ─── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-10 text-center border-l-4 border-l-primary" hover={false}>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 dark:text-slate-100 mb-3">
              Ready to try confidential payroll?
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-8">
              Register as employer, get test tokens, and run trust-gated payroll in minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/employer"
                className={cn(
                  "inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold",
                  "bg-primary text-white hover:bg-primary-hover active:scale-[0.98]",
                  "transition-all duration-200"
                )}
              >
                <Users size={16} />
                Employer Dashboard
              </Link>
              <Link
                href="/employee"
                className={cn(
                  "inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium",
                  "bg-white border border-gray-300 text-gray-700",
                  "hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700/50",
                  "transition-all duration-200"
                )}
              >
                <Wallet size={16} />
                Employee Portal
              </Link>
            </div>
            <p className="mt-6 text-xs text-gray-400 dark:text-slate-500">
              Deployed on Ethereum Sepolia Testnet
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
