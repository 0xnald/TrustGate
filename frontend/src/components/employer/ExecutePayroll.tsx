"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, AlertCircle, CheckCircle, ShieldCheck, Clock, Lock } from "lucide-react";
import { useWeb3 } from "@/providers/Web3Provider";
import { MOCK_STATS } from "@/lib/mockData";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import Badge from "@/components/ui/Badge";

interface ExecutePayrollProps {
  isOwner: boolean;
}

export default function ExecutePayroll({ isOwner }: ExecutePayrollProps) {
  const { payGramCore, contractsReady } = useWeb3();
  const [activeCount, setActiveCount] = useState<number>(0);
  const [totalPayrolls, setTotalPayrolls] = useState<number>(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [useMock, setUseMock] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchStats = useCallback(async () => {
    if (!payGramCore) {
      setUseMock(true);
      setActiveCount(MOCK_STATS.activeEmployees);
      setTotalPayrolls(MOCK_STATS.totalPayrolls);
      return;
    }
    try {
      const count = await payGramCore.activeEmployeeCount();
      setActiveCount(Number(count));
      const payrolls = await payGramCore.totalPayrollsExecuted();
      setTotalPayrolls(Number(payrolls));
      setUseMock(false);
    } catch {
      setUseMock(true);
      setActiveCount(MOCK_STATS.activeEmployees);
      setTotalPayrolls(MOCK_STATS.totalPayrolls);
    }
  }, [payGramCore]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  async function handleExecute() {
    if (!payGramCore) return;

    setIsExecuting(true);
    setShowConfirm(false);
    setStatus(null);

    try {
      const tx = await payGramCore.executePayroll();
      await tx.wait();
      setStatus({
        type: "success",
        message: "Payroll executed successfully",
      });
      fetchStats();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to execute payroll";
      setStatus({ type: "error", message });
    } finally {
      setIsExecuting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="card-static p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-heading font-bold text-gray-900 dark:text-slate-100">
            Payroll Summary
          </h3>
          {useMock && (
            <Badge variant="warning" size="sm">
              Demo Data
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">Active Employees</p>
            <p className="text-xl font-heading font-bold text-gray-900 dark:text-slate-100">
              {activeCount}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">Total Payrolls</p>
            <p className="text-xl font-heading font-bold text-gray-900 dark:text-slate-100">
              {totalPayrolls}
            </p>
          </div>
        </div>

        {/* Trust tier routing */}
        <div className="space-y-2 mb-6">
          <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider">
            Routing by Trust Tier
          </p>
          <div className="grid gap-2">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span className="text-xs text-gray-600 dark:text-slate-300">High Trust</span>
              </div>
              <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400">Instant</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-amber-600" />
                <span className="text-xs text-gray-600 dark:text-slate-300">
                  Medium Trust
                </span>
              </div>
              <span className="text-xs font-mono text-amber-700 dark:text-amber-400">24h Hold</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800">
              <div className="flex items-center gap-2">
                <Lock size={14} className="text-red-600" />
                <span className="text-xs text-gray-600 dark:text-slate-300">Low Trust</span>
              </div>
              <span className="text-xs font-mono text-red-700 dark:text-red-400">Escrow</span>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setShowConfirm(true)}
          disabled={!contractsReady || activeCount === 0 || !isOwner}
          className="w-full"
          size="lg"
        >
          <Play size={16} />
          Execute Payroll
        </Button>

        {!contractsReady && (
          <p className="flex items-center gap-1.5 mt-3 text-xs text-amber-600">
            <AlertCircle size={12} />
            Connect wallet to execute payroll
          </p>
        )}

        {contractsReady && !isOwner && (
          <p className="flex items-center gap-1.5 mt-3 text-xs text-gray-400 dark:text-slate-500">
            <Lock size={12} />
            Only contract owner can execute payroll
          </p>
        )}

        {status && (
          <div
            className={`flex items-center gap-2 mt-3 p-3 rounded-lg text-sm ${
              status.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle size={14} />
            ) : (
              <AlertCircle size={14} />
            )}
            {status.message}
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      <Dialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Payroll Execution"
        description={`This will process payments for ${activeCount} active employee${activeCount !== 1 ? "s" : ""}.`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Trust-gated routing will determine payment flows based on each
            employee&apos;s encrypted trust score. This operation cannot be
            undone.
          </p>

          <div className="grid gap-2">
            <div className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-slate-800/50">
              <span className="text-xs text-gray-500 dark:text-slate-400">
                High Trust employees
              </span>
              <span className="text-xs text-emerald-700 dark:text-emerald-400">Instant transfer</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-slate-800/50">
              <span className="text-xs text-gray-500 dark:text-slate-400">
                Medium Trust employees
              </span>
              <span className="text-xs text-amber-700 dark:text-amber-400">24h delayed</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-slate-800/50">
              <span className="text-xs text-gray-500 dark:text-slate-400">
                Low Trust employees
              </span>
              <span className="text-xs text-red-700 dark:text-red-400">Escrowed</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleExecute}
              loading={isExecuting}
              className="flex-1"
            >
              Confirm Execute
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={isExecuting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
