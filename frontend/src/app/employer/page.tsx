"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Users, DollarSign, Wallet, Shield, ChevronRight, Coins, UserPlus, CheckCircle, AlertCircle } from "lucide-react";
import { useWeb3 } from "@/providers/Web3Provider";
import { MOCK_STATS } from "@/lib/mockData";
import AddressDisplay from "@/components/ui/AddressDisplay";
import StatCard from "@/components/ui/StatCard";
import Tabs from "@/components/ui/Tabs";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import NetworkBanner from "@/components/layout/NetworkBanner";
import AddEmployee from "@/components/employer/AddEmployee";
import EmployeeList from "@/components/employer/EmployeeList";
import ExecutePayroll from "@/components/employer/ExecutePayroll";
import PayrollHistory from "@/components/employer/PayrollHistory";

const TABS = [
  { id: "employees", label: "Employees", icon: <Users size={14} /> },
  { id: "payroll", label: "Run Payroll", icon: <DollarSign size={14} /> },
  { id: "history", label: "Payment History", icon: <Wallet size={14} /> },
];

export default function EmployerDashboard() {
  const { address, isConnected, isSupportedChain, contractsReady, payGramCore, payGramToken } = useWeb3();
  const [activeTab, setActiveTab] = useState("employees");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isEmployer, setIsEmployer] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalPayrolls: 0,
    loaded: false,
  });

  const checkEmployer = useCallback(async () => {
    if (!payGramCore || !address) {
      setIsEmployer(false);
      return;
    }
    try {
      const registered: boolean = await payGramCore.isEmployer(address);
      setIsEmployer(registered);
    } catch {
      setIsEmployer(false);
    }
  }, [payGramCore, address]);

  useEffect(() => {
    checkEmployer();
  }, [checkEmployer]);

  const fetchStats = useCallback(async () => {
    if (!payGramCore || !address) return;
    try {
      const [total, active, payrolls] = await Promise.all([
        payGramCore.employeeCount(address),
        payGramCore.activeEmployeeCount(address),
        payGramCore.employerPayrollCount(address),
      ]);
      setStats({
        totalEmployees: Number(total),
        activeEmployees: Number(active),
        totalPayrolls: Number(payrolls),
        loaded: true,
      });
    } catch {
      // Keep defaults on error
    }
  }, [payGramCore, address]);

  useEffect(() => {
    if (contractsReady && isEmployer) fetchStats();
  }, [contractsReady, isEmployer, fetchStats]);

  async function handleRegister() {
    if (!payGramCore) return;
    setIsRegistering(true);
    try {
      const tx = await payGramCore.registerAsEmployer();
      await tx.wait();
      setIsEmployer(true);
    } catch {
      // Registration failed
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleMintTestTokens() {
    if (!payGramToken) return;
    setIsMinting(true);
    setMintStatus(null);
    try {
      const tx = await payGramToken.mintTestTokens();
      await tx.wait();
      setMintStatus({ type: "success", message: "10,000 cPAY minted to your wallet" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to mint test tokens";
      setMintStatus({ type: "error", message });
    } finally {
      setIsMinting(false);
    }
  }

  const showDashboard = isConnected && isSupportedChain;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500 mb-6">
        <Link href="/" className="hover:text-gray-700 dark:hover:text-slate-200 transition-colors">
          Home
        </Link>
        <ChevronRight size={12} />
        <span className="text-gray-500 dark:text-slate-400">Employer</span>
      </div>

      {/* Network Banner */}
      <NetworkBanner />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-slate-100">
            Employer Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Manage employees, execute payroll, and track payments
          </p>
        </div>
        {isConnected && address && (
          <div className="flex items-center gap-3">
            <AddressDisplay address={address} />
            {!isSupportedChain && (
              <Badge variant="danger" size="sm">
                Wrong Network
              </Badge>
            )}
          </div>
        )}
      </div>

      {!showDashboard && (
        <div className="card p-12 text-center">
          <Wallet size={48} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
          <h2 className="text-lg font-heading font-bold text-gray-900 dark:text-slate-100 mb-2">
            {!isConnected ? "Connect Your Wallet" : "Switch Network"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
            {!isConnected
              ? "Connect your wallet to access the employer dashboard"
              : "Please switch to Sepolia to use this dashboard"}
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500">
            Showing demo data below
          </p>
        </div>
      )}

      {/* Registration prompt for non-employers */}
      {showDashboard && contractsReady && !isEmployer && (
        <div className="card p-8 text-center mb-8">
          <UserPlus size={40} className="mx-auto mb-4 text-primary" />
          <h2 className="text-lg font-heading font-bold text-gray-900 dark:text-slate-100 mb-2">
            Register as Employer
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Register to create your own payroll, add employees, set trust scores, and execute payments.
          </p>
          <Button
            onClick={handleRegister}
            loading={isRegistering}
            size="lg"
          >
            <UserPlus size={16} />
            Register as Employer
          </Button>
        </div>
      )}

      {/* Faucet + Stats Row */}
      {(!showDashboard || isEmployer) && (
        <>
          {/* Get Test Tokens button */}
          {showDashboard && contractsReady && isEmployer && (
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMintTestTokens}
                loading={isMinting}
              >
                <Coins size={14} />
                Get Test Tokens
              </Button>
              {mintStatus && (
                <span className={`flex items-center gap-1.5 text-xs ${
                  mintStatus.type === "success"
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}>
                  {mintStatus.type === "success" ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                  {mintStatus.message}
                </span>
              )}
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Employees"
              value={stats.loaded ? stats.totalEmployees : MOCK_STATS.totalEmployees}
              icon={Users}
              accentColor="primary"
            />
            <StatCard
              title="Active Employees"
              value={stats.loaded ? stats.activeEmployees : MOCK_STATS.activeEmployees}
              icon={DollarSign}
              accentColor="secondary"
            />
            <StatCard
              title="Payrolls Executed"
              value={stats.loaded ? stats.totalPayrolls : MOCK_STATS.totalPayrolls}
              icon={Wallet}
              accentColor="primary"
            />
            <StatCard
              title="Avg Trust Score"
              value={stats.loaded ? "Encrypted" : MOCK_STATS.avgTrustScore}
              icon={Shield}
              accentColor="warning"
            />
          </div>

          {/* Tab Navigation */}
          <Tabs
            tabs={TABS}
            activeTab={activeTab}
            onChange={setActiveTab}
            className="mb-6"
          />

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === "employees" && (
              <EmployeeList onAddEmployee={() => setAddDialogOpen(true)} isEmployer={isEmployer} />
            )}
            {activeTab === "payroll" && <ExecutePayroll isEmployer={isEmployer} />}
            {activeTab === "history" && <PayrollHistory />}
          </div>

          {/* Add Employee Dialog */}
          <AddEmployee
            open={addDialogOpen}
            onClose={() => setAddDialogOpen(false)}
          />
        </>
      )}
    </div>
  );
}
