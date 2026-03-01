import { ethers } from "hardhat";
import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

// ── Existing Sepolia Addresses (unchanged) ───────────────────────────
const PAY_GRAM_CORE = "0x331048736e7dC599E46187CaBa00dcC46952a7d7";
const PAY_GRAM_TOKEN = "0xC97C848E7021AdFC36269ddc5e39E54939E81704";

// ── Employees to re-score ────────────────────────────────────────────
const EMPLOYEES = [
  { address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", score: 85, label: "Employee 1 (HIGH)" },
  { address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", score: 55, label: "Employee 2 (MEDIUM)" },
  { address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", score: 25, label: "Employee 3 (LOW)" },
  { address: "0xCbdE65F69574C94f0c3Ba7927E3D5Eb7d921FfEd", score: 85, label: "Employee 4 (HIGH — real)" },
];

// ── ABIs ─────────────────────────────────────────────────────────────
const TRUST_ABI = [
  "function setOracle(address oracle, bool authorized)",
  "function setTrustScorePlaintext(address account, uint64 score)",
  "function allowScoreAccess(address account, address allowedAddress)",
  "function hasScore(address) view returns (bool)",
  "function getTrustTierPlaintext(address) view returns (uint8)",
  "function totalScoredAddresses() view returns (uint256)",
];

const CORE_ABI = [
  "function updateTrustScoring(address newTrustScoring)",
  "function trustScoring() view returns (address)",
];

async function sendAndWait(
  label: string,
  txPromise: Promise<ethers.TransactionResponse>,
  provider: ethers.JsonRpcProvider
) {
  console.log(`\n  ${label}`);
  const tx = await txPromise;
  console.log(`    tx: ${tx.hash}`);
  console.log("    waiting...");
  const receipt = await provider.waitForTransaction(tx.hash, 1, 300_000);
  if (!receipt || receipt.status !== 1) {
    console.log("    FAILED");
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
  console.log("  Redeploy TrustScoring (with tier cache)");
  console.log("=".repeat(60));
  console.log(`  Deployer: ${deployer}`);
  console.log(`  Balance : ${ethers.formatEther(balance)} ETH`);

  // ── 1. Deploy ──────────────────────────────────────────────────
  console.log("\n  [1/5] Deploying new TrustScoring...");
  const Factory = await ethers.getContractFactory("TrustScoring", wallet);
  const deployTx = await Factory.getDeployTransaction(deployer);
  const sent = await wallet.sendTransaction(deployTx);
  console.log(`    tx: ${sent.hash}`);
  const receipt = await provider.waitForTransaction(sent.hash, 2, 300_000);
  if (!receipt || receipt.status !== 1) { console.log("    DEPLOY FAILED"); process.exit(1); }
  const newAddr = receipt.contractAddress!;
  console.log(`    NEW TrustScoring: ${newAddr}`);

  const trust = new ethers.Contract(newAddr, TRUST_ABI, wallet);

  // ── 2. Authorize oracle ────────────────────────────────────────
  await sendAndWait(
    "[2/5] Authorizing deployer as oracle...",
    trust.setOracle(deployer, true) as Promise<ethers.TransactionResponse>,
    provider
  );

  // ── 3. Set scores + grant ACL ──────────────────────────────────
  console.log("\n  [3/5] Setting scores and granting ACL...");
  for (const emp of EMPLOYEES) {
    await sendAndWait(
      `setTrustScorePlaintext(${emp.label}, ${emp.score})`,
      trust.setTrustScorePlaintext(emp.address, emp.score) as Promise<ethers.TransactionResponse>,
      provider
    );
    await sendAndWait(
      `allowScoreAccess(${emp.label} → PayGramCore)`,
      trust.allowScoreAccess(emp.address, PAY_GRAM_CORE) as Promise<ethers.TransactionResponse>,
      provider
    );
  }

  // ── 4. Verify tier cache ───────────────────────────────────────
  console.log("\n  [4/5] Verifying tier cache...");
  for (const emp of EMPLOYEES) {
    const tier = await trust.getTrustTierPlaintext(emp.address);
    const tierName = tier === 2 ? "HIGH" : tier === 1 ? "MEDIUM" : "LOW";
    console.log(`    ${emp.label}: tier=${tier} (${tierName})`);
  }

  // ── 5. Update PayGramCore ──────────────────────────────────────
  const core = new ethers.Contract(PAY_GRAM_CORE, CORE_ABI, wallet);
  await sendAndWait(
    "[5/5] PayGramCore.updateTrustScoring → new address",
    core.updateTrustScoring(newAddr) as Promise<ethers.TransactionResponse>,
    provider
  );

  const verified = await core.trustScoring();
  console.log(`    Verified: ${verified}`);

  // ── Summary ────────────────────────────────────────────────────
  const endBalance = await provider.getBalance(deployer);
  console.log("\n" + "=".repeat(60));
  console.log("  DONE");
  console.log("=".repeat(60));
  console.log(`  New TrustScoring: ${newAddr}`);
  console.log(`  ETH spent: ${ethers.formatEther(balance - endBalance)}`);
  console.log(`  Balance:   ${ethers.formatEther(endBalance)} ETH`);
  console.log("");
  console.log("  NEXT:");
  console.log(`  npx hardhat verify --network sepolia ${newAddr} ${deployer}`);
  console.log("=".repeat(60));

  // Save address
  const outputDir = path.resolve(__dirname, "..", "deployments");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, "sepolia-tiercache.json"),
    JSON.stringify({ newTrustScoring: newAddr, payGramCore: PAY_GRAM_CORE, payGramToken: PAY_GRAM_TOKEN, date: new Date().toISOString() }, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => { console.error("Failed:", error); process.exit(1); });
