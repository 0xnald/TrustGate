"use client";

import { useState, useRef, useEffect } from "react";
import {
  Wallet,
  ChevronDown,
  LogOut,
  ExternalLink,
  Copy,
  Check,
  ArrowRightLeft,
  Globe,
} from "lucide-react";
import { useWeb3 } from "@/providers/Web3Provider";
import { cn } from "@/lib/utils";

function truncateAddr(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getNetworkColor(chainId: number | null) {
  if (!chainId) return "bg-gray-300";
  if (chainId === 1) return "bg-emerald-500";      // green for Mainnet
  if (chainId === 11155111) return "bg-blue-500";   // blue for Sepolia
  return "bg-red-500";                              // red for unsupported
}

function getExplorerUrl(chainId: number | null, address: string) {
  if (chainId === 1) return `https://etherscan.io/address/${address}`;
  return `https://sepolia.etherscan.io/address/${address}`;
}

export default function ConnectButton() {
  const {
    address,
    chainId,
    chainName,
    hasWallet,
    isConnected,
    isLoading,
    isSupportedChain,
    connect,
    disconnect,
    switchChain,
    switchToSepolia,
  } = useWeb3();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // State 1: Actively connecting
  if (isLoading) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 border border-gray-200 text-gray-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500"
      >
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        Connecting...
      </button>
    );
  }

  // State 2: Not connected
  if (!isConnected || !address) {
    return (
      <button
        type="button"
        onClick={connect}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold",
          "bg-primary text-white hover:bg-primary-hover active:scale-[0.98]",
          "transition-all duration-200"
        )}
      >
        <Wallet size={16} />
        {hasWallet ? "Connect Wallet" : "Install MetaMask"}
      </button>
    );
  }

  // State 3: Connected but wrong network
  if (!isSupportedChain) {
    return (
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
            "bg-amber-50 border border-amber-200 dark:bg-amber-900/30 dark:border-amber-800",
            "hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200"
          )}
        >
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
          <span className="font-medium text-amber-700 dark:text-amber-400">Wrong Network</span>
          <ChevronDown
            size={14}
            className={cn(
              "text-amber-400 transition-transform duration-200",
              dropdownOpen && "rotate-180"
            )}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 animate-slide-down z-50 bg-white border border-gray-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
            {/* Address header */}
            <div className="p-3 border-b border-gray-200 dark:border-slate-700">
              <p className="text-xs text-gray-400 mb-1">Connected Wallet</p>
              <p className="text-xs font-mono text-gray-500 dark:text-slate-400 break-all">
                {address}
              </p>
            </div>

            {/* Network info */}
            <div className="px-3 py-2.5 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2">
              <Globe size={12} className="text-gray-400" />
              <span className="text-xs text-gray-400">Network:</span>
              <span className="text-xs font-medium text-red-600 flex items-center gap-1.5">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                {chainName}
              </span>
            </div>

            <div className="p-1">
              {/* Switch to Mainnet */}
              <button
                type="button"
                onClick={() => {
                  switchChain(1);
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 rounded-lg transition-colors font-medium"
              >
                <ArrowRightLeft size={14} />
                Switch to Mainnet
              </button>

              {/* Switch to Sepolia */}
              <button
                type="button"
                onClick={() => {
                  switchToSepolia();
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <ArrowRightLeft size={14} />
                Switch to Sepolia
              </button>

              {/* Copy */}
              <button
                type="button"
                onClick={handleCopy}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                {copied ? (
                  <Check size={14} className="text-primary" />
                ) : (
                  <Copy size={14} />
                )}
                {copied ? "Copied!" : "Copy Address"}
              </button>

              {/* Disconnect */}
              <button
                type="button"
                onClick={() => {
                  disconnect();
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <LogOut size={14} />
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // State 4: Connected on correct network
  const networkColor = getNetworkColor(chainId);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
          "bg-white border border-gray-200 dark:bg-slate-800 dark:border-slate-700",
          "hover:border-gray-300 dark:hover:border-slate-600 transition-all duration-200"
        )}
      >
        <span className={cn("relative inline-flex h-2 w-2", networkColor)}>
          <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping", networkColor)} />
          <span className={cn("relative inline-flex h-2 w-2 rounded-full", networkColor)} />
        </span>
        <span className="font-mono text-gray-900 dark:text-slate-100">{truncateAddr(address)}</span>
        <span className={cn(
          "px-1.5 py-0.5 rounded text-[10px] font-medium",
          chainId === 1 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        )}>
          {chainName}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "text-gray-400 transition-transform duration-200",
            dropdownOpen && "rotate-180"
          )}
        />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 animate-slide-down z-50 bg-white border border-gray-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
          {/* Address header */}
          <div className="p-3 border-b border-gray-200 dark:border-slate-700">
            <p className="text-xs text-gray-400 mb-1">Connected Wallet</p>
            <div className="flex items-center gap-2">
              <p className="text-xs font-mono text-gray-500 dark:text-slate-400 break-all flex-1">
                {address}
              </p>
              <button
                type="button"
                onClick={handleCopy}
                className="flex-shrink-0 p-1 rounded text-gray-400 hover:text-primary transition-colors"
                title="Copy address"
              >
                {copied ? (
                  <Check size={12} className="text-primary" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            </div>
          </div>

          {/* Network info */}
          <div className="px-3 py-2.5 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2">
            <Globe size={12} className="text-gray-400" />
            <span className="text-xs text-gray-400">Network:</span>
            <span className={cn("text-xs font-medium flex items-center gap-1.5", chainId === 1 ? "text-emerald-700" : "text-blue-700")}>
              <span className={cn("inline-flex h-1.5 w-1.5 rounded-full", networkColor)} />
              {chainName}
            </span>
          </div>

          <div className="p-1">
            {/* View on Explorer */}
            <a
              href={getExplorerUrl(chainId, address)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <ExternalLink size={14} />
              View on Explorer
            </a>

            {/* Disconnect */}
            <button
              type="button"
              onClick={() => {
                disconnect();
                setDropdownOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            >
              <LogOut size={14} />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
