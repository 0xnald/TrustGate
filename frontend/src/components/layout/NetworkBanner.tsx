"use client";

import { useState } from "react";
import { Info, AlertTriangle, X, ArrowRightLeft } from "lucide-react";
import { useWeb3 } from "@/providers/Web3Provider";
import { cn } from "@/lib/utils";

export default function NetworkBanner() {
  const { isConnected, isSupportedChain, switchChain } = useWeb3();
  const [dismissed, setDismissed] = useState(false);

  // Connected on correct network -- no banner
  if (isConnected && isSupportedChain) return null;

  // Dismissed by user
  if (dismissed) return null;

  const isWrongNetwork = isConnected && !isSupportedChain;

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 px-4 py-3 rounded-xl border-l-4 mb-6",
        "bg-white border border-gray-200 dark:bg-slate-800 dark:border-slate-700",
        isWrongNetwork
          ? "border-l-amber-500"
          : "border-l-blue-500"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg",
          isWrongNetwork
            ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30"
            : "bg-blue-50 text-blue-600 dark:bg-blue-900/30"
        )}
      >
        {isWrongNetwork ? (
          <AlertTriangle size={16} />
        ) : (
          <Info size={16} />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium",
            isWrongNetwork ? "text-amber-700 dark:text-amber-400" : "text-gray-600 dark:text-slate-300"
          )}
        >
          {isWrongNetwork
            ? "You\u2019re on the wrong network"
            : "Connect your wallet to interact with contracts"}
        </p>
        {isWrongNetwork && (
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
            PayGram operates on Ethereum Mainnet or Sepolia testnet
          </p>
        )}
      </div>

      {/* Action button */}
      {isWrongNetwork && (
        <button
          type="button"
          onClick={() => switchChain(1)}
          className={cn(
            "flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold",
            "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50",
            "transition-colors duration-200"
          )}
        >
          <ArrowRightLeft size={12} />
          Switch to Mainnet
        </button>
      )}

      {/* Dismiss */}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
