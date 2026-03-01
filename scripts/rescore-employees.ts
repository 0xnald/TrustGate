import { ethers } from "hardhat";
import hre from "hardhat";

// ── Contract Addresses ───────────────────────────────────────────────
const TRUST_SCORING = "0xb239eFe265df2eAD499AeF2d5ECD1b2924da9Fe9";
const PAY_GRAM_CORE = "0x331048736e7dC599E46187CaBa00dcC46952a7d7";

// ── Employees ────────────────────────────────────────────────────────
const EMPLOYEES = [
  { address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", score: 85, label: "Employee 1 (HIGH)" },
  { address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", score: 55, label: "Employee 2 (MEDIUM)" },
  { address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", score: 25, label: "Employee 3 (LOW)" },
];

// ── Minimal ABI ──────────────────────────────────────────────────────
const TRUST_ABI = [
  "function setTrustScorePlaintext(address account, uint64 score)",
  "function allowScoreAccess(address account, address allowedAddress)",
  "function hasScore(address) view returns (bool)",
  "function totalScoredAddresses() view returns (uint256)",
];

async function sendAndWait(
  label: string,
  txPromise: Promise<ethers.TransactionResponse>,
  provider: ethers.JsonRpcProvider
) {
  console.log(`\n  ${label}`);
  const tx = await txPromise;
  console.log(`    tx: ${tx.hash}`);
  console.log(`    https://sepolia.etherscan.io/tx/${tx.hash}`);
  console.log("    waiting for confirmation...");

  const receipt = await provider.waitForTransaction(tx.hash, 1, 300_000);
  if (!receipt) {
    console.log("    TIMEOUT — no receipt");
    process.exit(1);
  }
  if (receipt.status !== 1) {
    console.log(`    REVERTED — block ${receipt.blockNumber}, gas: ${receipt.gasUsed}`);
    process.exit(1);
  }
  console.log(`    SUCCESS — block ${receipt.blockNumber}, gas: ${receipt.gasUsed}`);
  return receipt;
}

async function main() {
  const rpcUrl = (hre.network.config as { url: string }).url;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  const deployer = wallet.address;
  const balance = await provider.getBalance(deployer);

  console.log("=".repeat(60));
  console.log("  Trusted PayGram — Re-score Employees on New TrustScoring");
  console.log("=".repeat(60));
  console.log(`  Network       : ${hre.network.name}`);
  console.log(`  Deployer      : ${deployer}`);
  console.log(`  Balance       : ${ethers.formatEther(balance)} ETH`);
  console.log(`  TrustScoring  : ${TRUST_SCORING}`);
  console.log(`  PayGramCore   : ${PAY_GRAM_CORE}`);

  const trust = new ethers.Contract(TRUST_SCORING, TRUST_ABI, wallet);
  let totalGas = 0n;

  // ── Step 1: Set trust scores ───────────────────────────────────
  console.log("\n  --- Setting trust scores ---");

  for (const emp of EMPLOYEES) {
    const already = await trust.hasScore(emp.address);
    if (already) {
      console.log(`\n  ${emp.label} — already scored, re-setting`);
    }
    const r = await sendAndWait(
      `setTrustScorePlaintext(${emp.address.slice(0, 8)}..., ${emp.score})`,
      trust.setTrustScorePlaintext(emp.address, emp.score) as Promise<ethers.TransactionResponse>,
      provider
    );
    totalGas += r.gasUsed;
  }

  // ── Step 2: Grant PayGramCore ACL access ───────────────────────
  console.log("\n  --- Granting PayGramCore FHE access ---");

  for (const emp of EMPLOYEES) {
    const r = await sendAndWait(
      `allowScoreAccess(${emp.address.slice(0, 8)}..., PayGramCore)`,
      trust.allowScoreAccess(emp.address, PAY_GRAM_CORE) as Promise<ethers.TransactionResponse>,
      provider
    );
    totalGas += r.gasUsed;
  }

  // ── Verify ─────────────────────────────────────────────────────
  const totalScored = await trust.totalScoredAddresses();
  const endBalance = await provider.getBalance(deployer);

  console.log("\n" + "=".repeat(60));
  console.log("  DONE");
  console.log("=".repeat(60));
  console.log(`  Scores set     : ${EMPLOYEES.length}`);
  console.log(`  ACL grants     : ${EMPLOYEES.length}`);
  console.log(`  Total scored   : ${totalScored}`);
  console.log(`  Total gas      : ${totalGas}`);
  console.log(`  ETH spent      : ${ethers.formatEther(balance - endBalance)} ETH`);
  console.log(`  Balance left   : ${ethers.formatEther(endBalance)} ETH`);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
