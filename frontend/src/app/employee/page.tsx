"use client";

import Link from "next/link";
import {
  ChevronRight,
  Wallet,
  ExternalLink,
  Shield,
  ShieldCheck,
  Clock,
  Lock,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { useWeb3 } from "@/providers/Web3Provider";
import AddressDisplay from "@/components/ui/AddressDisplay";
import TrustBadge from "@/components/ui/TrustBadge";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/GlassCard";
import NetworkBanner from "@/components/layout/NetworkBanner";
import SalaryView from "@/components/employee/SalaryView";
import PaymentHistory from "@/components/employee/PaymentHistory";

export default function EmployeePortal() {
  const { address, isConnected, isSupportedChain } = useWeb3();

  const showPortal = isConnected && isSupportedChain;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500 mb-6">
        <Link href="/" className="hover:text-gray-700 dark:hover:text-slate-200 transition-colors">
          Home
        </Link>
        <ChevronRight size={12} />
        <span className="text-gray-500 dark:text-slate-400">Employee</span>
      </div>

      {/* Network Banner */}
      <NetworkBanner />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-slate-100">
            Employee Portal
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            View your salary, trust tier, and payment history
          </p>
        </div>
        {isConnected && address && (
          <div className="flex items-center gap-3">
            <AddressDisplay address={address} />
            <TrustBadge tier="high" size="md" />
          </div>
        )}
      </div>

      {!showPortal && (
        <Card className="p-12 text-center" hover={false}>
          <Wallet size={48} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
          <h2 className="text-lg font-heading font-bold text-gray-900 dark:text-slate-100 mb-2">
            {!isConnected ? "Connect Your Wallet" : "Switch Network"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
            {!isConnected
              ? "Connect your wallet to view your employment details"
              : "Please switch to Sepolia to access your portal"}
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500">
            Showing demo data below
          </p>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6 mt-8">
        {/* Left column -- wider */}
        <div className="lg:col-span-2 space-y-6">
          <SalaryView />
          <PaymentHistory />
        </div>

        {/* Right column -- narrower */}
        <div className="space-y-6">
          {/* Trust Score Card */}
          <Card className="p-6 border-l-4 border-l-primary" hover={false}>
            <h3 className="text-sm font-heading font-bold text-gray-900 dark:text-slate-100 mb-4">
              Trust Score
            </h3>

            <div className="text-center py-4">
              <TrustBadge tier="high" size="lg" />
            </div>

            {/* Score meter */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-slate-500">
                <span>0</span>
                <span>40</span>
                <span>75</span>
                <span>100</span>
              </div>
              <div className="relative h-2 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-[40%] bg-red-200 rounded-l-full" />
                <div className="absolute inset-y-0 left-[40%] w-[35%] bg-amber-200" />
                <div className="absolute inset-y-0 left-[75%] w-[25%] bg-emerald-200 rounded-r-full" />
                {/* Indicator */}
                <div className="absolute top-1/2 -translate-y-1/2 left-[82%] w-3 h-3 rounded-full bg-primary border-2 border-white shadow-md" />
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck size={12} className="text-emerald-600" />
                <span>
                  75-100: Instant encrypted transfer
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-amber-600" />
                <span>40-74: 24-hour delayed release</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock size={12} className="text-red-600" />
                <span>0-39: Milestone-gated escrow</span>
              </div>
            </div>

            <p className="mt-4 text-[10px] text-gray-400 dark:text-slate-500">
              Score expires in 24 days
            </p>
          </Card>

          {/* Quick Actions */}
          <div className="card-static p-5">
            <h3 className="text-sm font-heading font-bold text-gray-900 dark:text-slate-100 mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <a
                href={
                  address
                    ? `https://sepolia.etherscan.io/address/${address}`
                    : "#"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-700/50 transition-colors"
              >
                <ExternalLink size={14} />
                View on Explorer
              </a>
              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left"
              >
                <MessageSquare size={14} />
                Contact Employer
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left"
              >
                <RefreshCw size={14} />
                Request Score Update
              </button>
            </div>
          </div>

          {/* FHE Info Card */}
          <div className="card-static p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} className="text-primary" />
              <h3 className="text-sm font-heading font-bold text-gray-900 dark:text-slate-100">
                Privacy
              </h3>
            </div>
            <div className="space-y-2 text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
              <p>
                Your salary and trust score are encrypted using Fully
                Homomorphic Encryption (FHE). Only you can decrypt your own
                data.
              </p>
              <p>
                Your employer cannot see individual salary amounts. Payroll
                routing happens entirely within encrypted computation.
              </p>
            </div>
            <div className="mt-3">
              <Badge variant="primary" size="sm">
                <Lock size={10} />
                FHE Protected
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
