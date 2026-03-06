import { Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900">
      {/* Top border */}
      <div className="h-px bg-gray-800" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left -- Brand */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-blue-400" />
              <span className="font-heading font-bold text-white">
                Trusted PayGram
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
              Confidential payroll powered by Zama Protocol. Encrypted salaries,
              trust-gated payment flows.
            </p>
          </div>

          {/* Right -- Links */}
          <div className="flex items-center gap-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://docs.zama.ai/fhevm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Zama Docs
            </a>
            <a
              href="https://eips.ethereum.org/EIPS/eip-7984"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              ERC-7984
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <p className="text-center text-[11px] text-gray-500">
            All salary data encrypted on-chain with FHE. Nobody sees what they
            shouldn&apos;t.
          </p>
        </div>
      </div>
    </footer>
  );
}
