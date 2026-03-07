import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import hre from "hardhat";

/**
 * Trusted PayGram — Full Sepolia Deployment (Multi-Employer v2)
 *
 * Deploys all 3 contracts, wires them, registers deployer as employer,
 * seeds 5 demo employees, sets trust scores, grants FHE ACL access,
 * funds PayGramCore, and executes one payroll.
 */

const INITIAL_SUPPLY = 1_000_000n; // 1M cPAY tokens

// 5 demo employees: 4 scored, 1 unscored
const EMPLOYEES = [
  {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    salary: 5000,
    role: "Senior Engineer",
    score: 85,
    label: "Employee 1 (HIGH trust)",
  },
  {
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    salary: 3500,
    role: "Product Manager",
    score: 55,
    label: "Employee 2 (MEDIUM trust)",
  },
  {
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    salary: 2000,
    role: "Junior Developer",
    score: 25,
    label: "Employee 3 (LOW trust)",
  },
  {
    address: "0xCbdE65F69574C94f0c3Ba7927E3D5Eb7d921FfEd",
    salary: 4500,
    role: "Designer",
    score: 85,
    label: "Employee 4 (HIGH trust)",
  },
  {
    address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    salary: 3000,
    role: "Marketing Lead",
    score: 0,    // unscored — will be skipped for scoring
    label: "Employee 5 (Unscored — escrow)",
  },
];

interface TxResult {
  hash: string;
  gasUsed: bigint;
  status: number;
}

async function sendAndWait(
  label: string,
  txPromise: Promise<ethers.TransactionResponse>,
  provider: ethers.JsonRpcProvider
): Promise<TxResult | null> {
  try {
    const tx = await txPromise;
    console.log(`        tx: ${tx.hash}`);
    console.log(`        https://sepolia.etherscan.io/tx/${tx.hash}`);
    console.log("        waiting for confirmation...");

    const receipt = await provider.waitForTransaction(tx.hash, 2, 300_000);
    if (!receipt) {
      console.log("        TIMEOUT");
      return null;
    }
    if (receipt.status === 1) {
      console.log(
        `        OK — block ${receipt.blockNumber}, gas: ${receipt.gasUsed}`
      );
      return { hash: tx.hash, gasUsed: receipt.gasUsed, status: 1 };
    } else {
      console.log(
        `        REVERTED — block ${receipt.blockNumber}, gas: ${receipt.gasUsed}`
      );
      return { hash: tx.hash, gasUsed: receipt.gasUsed, status: 0 };
    }
  } catch (err: unknown) {
    const error = err as Error & { reason?: string; code?: string };
    console.log(`        FAILED: ${error.reason ?? error.message}`);
    return null;
  }
}

async function main() {
  const rpcUrl = (hre.network.config as { url: string }).url;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  const deployerAddress = wallet.address;
  const balance = await provider.getBalance(deployerAddress);

  console.log("=".repeat(60));
  console.log("  Trusted PayGram — Sepolia Deployment (Multi-Employer v2)");
  console.log("=".repeat(60));
  console.log(`  Network : ${hre.network.name} (chainId: ${hre.network.config.chainId})`);
  console.log(`  Deployer: ${deployerAddress}`);
  console.log(`  Balance : ${ethers.formatEther(balance)} ETH`);
  console.log("");

  let totalGas = 0n;

  // ── 1. Deploy TrustScoring ──────────────────────────────────────
  console.log("  [1/11] Deploying TrustScoring...");
  const TrustScoringFactory = new ethers.ContractFactory(
    (await hre.artifacts.readArtifact("TrustScoring")).abi,
    (await hre.artifacts.readArtifact("TrustScoring")).bytecode,
    wallet
  );
  const trustScoring = await TrustScoringFactory.deploy(deployerAddress);
  await trustScoring.waitForDeployment();
  const trustScoringAddr = await trustScoring.getAddress();
  const trustScoringTx = trustScoring.deploymentTransaction();
  console.log(`        TrustScoring : ${trustScoringAddr}`);
  console.log(`        Tx           : ${trustScoringTx?.hash}`);
  if (trustScoringTx) {
    const r = await provider.waitForTransaction(trustScoringTx.hash, 2, 300_000);
    if (r) totalGas += r.gasUsed;
  }
  console.log("");

  // ── 2. Deploy PayGramToken ──────────────────────────────────────
  let tokenSupply = INITIAL_SUPPLY;
  console.log(`  [2/11] Deploying PayGramToken (supply: ${tokenSupply})...`);
  const PayGramTokenFactory = new ethers.ContractFactory(
    (await hre.artifacts.readArtifact("PayGramToken")).abi,
    (await hre.artifacts.readArtifact("PayGramToken")).bytecode,
    wallet
  );
  let payGramToken;
  try {
    payGramToken = await PayGramTokenFactory.deploy(deployerAddress, tokenSupply);
    await payGramToken.waitForDeployment();
  } catch (err) {
    console.log(`        Initial supply mint failed. Retrying with supply = 0...`);
    console.log(`        Reason: ${err instanceof Error ? err.message.slice(0, 120) : err}`);
    tokenSupply = 0n;
    payGramToken = await PayGramTokenFactory.deploy(deployerAddress, tokenSupply);
    await payGramToken.waitForDeployment();
  }
  const payGramTokenAddr = await payGramToken.getAddress();
  const tokenTx = payGramToken.deploymentTransaction();
  console.log(`        PayGramToken : ${payGramTokenAddr}`);
  console.log(`        Tx           : ${tokenTx?.hash}`);
  if (tokenTx) {
    const r = await provider.waitForTransaction(tokenTx.hash, 2, 300_000);
    if (r) totalGas += r.gasUsed;
  }
  console.log("");

  // ── 3. Deploy PayGramCore ───────────────────────────────────────
  console.log("  [3/11] Deploying PayGramCore...");
  const PayGramCoreFactory = new ethers.ContractFactory(
    (await hre.artifacts.readArtifact("PayGramCore")).abi,
    (await hre.artifacts.readArtifact("PayGramCore")).bytecode,
    wallet
  );
  const payGramCore = await PayGramCoreFactory.deploy(
    deployerAddress,    // initialOwner
    deployerAddress,    // initial employer (deployer)
    trustScoringAddr,   // TrustScoring
    payGramTokenAddr    // PayGramToken
  );
  await payGramCore.waitForDeployment();
  const payGramCoreAddr = await payGramCore.getAddress();
  const coreTx = payGramCore.deploymentTransaction();
  console.log(`        PayGramCore  : ${payGramCoreAddr}`);
  console.log(`        Tx           : ${coreTx?.hash}`);
  if (coreTx) {
    const r = await provider.waitForTransaction(coreTx.hash, 2, 300_000);
    if (r) totalGas += r.gasUsed;
  }
  console.log("");

  // ── 4. Wire contracts ──────────────────────────────────────────
  console.log("  [4/11] Wiring contracts...");

  // 4a. PayGramToken.setPayGramCore
  console.log("        PayGramToken.setPayGramCore...");
  let r = await sendAndWait(
    "setPayGramCore",
    payGramToken.getFunction("setPayGramCore")(payGramCoreAddr) as Promise<ethers.TransactionResponse>,
    provider
  );
  if (r) totalGas += r.gasUsed;

  // 4b. TrustScoring.setPayGramCore
  console.log("        TrustScoring.setPayGramCore...");
  r = await sendAndWait(
    "setPayGramCore",
    trustScoring.getFunction("setPayGramCore")(payGramCoreAddr) as Promise<ethers.TransactionResponse>,
    provider
  );
  if (r) totalGas += r.gasUsed;

  // 4c. TrustScoring.setOracle (deployer as oracle)
  console.log("        TrustScoring.setOracle...");
  r = await sendAndWait(
    "setOracle",
    trustScoring.getFunction("setOracle")(deployerAddress, true) as Promise<ethers.TransactionResponse>,
    provider
  );
  if (r) totalGas += r.gasUsed;
  console.log("");

  // ── 5. Verify deployer is employer ─────────────────────────────
  console.log("  [5/11] Verifying deployer is registered as employer...");
  const isEmployer = await payGramCore.getFunction("isEmployer")(deployerAddress);
  console.log(`        isEmployer(deployer): ${isEmployer}`);
  if (!isEmployer) {
    console.log("        ERROR: Deployer not registered as employer");
    process.exit(1);
  }
  console.log("");

  // ── 6. Add 5 employees ─────────────────────────────────────────
  console.log("  [6/11] Adding 5 demo employees...");
  for (const emp of EMPLOYEES) {
    console.log(`\n        ${emp.label}`);
    console.log(`        addr:   ${emp.address}`);
    console.log(`        salary: ${emp.salary} cPAY | role: "${emp.role}"`);

    r = await sendAndWait(
      `addEmployeePlaintext(${emp.role})`,
      payGramCore.getFunction("addEmployeePlaintext")(
        emp.address, emp.salary, emp.role
      ) as Promise<ethers.TransactionResponse>,
      provider
    );
    if (r) totalGas += r.gasUsed;
  }
  console.log("");

  // ── 7. Set trust scores (4 scored employees) ───────────────────
  console.log("  [7/11] Setting trust scores...");
  const scoredEmployees = EMPLOYEES.filter((e) => e.score > 0);

  for (const emp of scoredEmployees) {
    console.log(`\n        ${emp.label} — score: ${emp.score}`);
    r = await sendAndWait(
      `setTrustScorePlaintext(${emp.score})`,
      trustScoring.getFunction("setTrustScorePlaintext")(
        emp.address, emp.score
      ) as Promise<ethers.TransactionResponse>,
      provider
    );
    if (r) totalGas += r.gasUsed;
  }
  console.log("");

  // ── 8. Grant FHE ACL access ────────────────────────────────────
  console.log("  [8/11] Granting FHE ACL access (allowScoreAccess)...");
  for (const emp of scoredEmployees) {
    console.log(`\n        ${emp.label} -> PayGramCore`);
    r = await sendAndWait(
      `allowScoreAccess(${emp.address.slice(0, 10)}..., PayGramCore)`,
      trustScoring.getFunction("allowScoreAccess")(
        emp.address, payGramCoreAddr
      ) as Promise<ethers.TransactionResponse>,
      provider
    );
    if (r) totalGas += r.gasUsed;
  }
  console.log("");

  // ── 9. Fund PayGramCore with tokens ────────────────────────────
  console.log("  [9/11] Funding PayGramCore with 50,000 cPAY...");
  r = await sendAndWait(
    "mint-to-core",
    payGramToken.getFunction("mint")(
      payGramCoreAddr, 50_000
    ) as Promise<ethers.TransactionResponse>,
    provider
  );
  if (r) totalGas += r.gasUsed;
  console.log("");

  // ── 10. Execute payroll ────────────────────────────────────────
  console.log("  [10/11] Executing payroll...");
  console.log("        Routes payments by trust tier using FHE:");
  console.log("          HIGH (85)   -> instant confidentialTransfer");
  console.log("          MEDIUM (55) -> 24h delayed payment record");
  console.log("          LOW (25)    -> escrow payment record");
  console.log("          Unscored    -> escrow payment record");
  console.log("");

  r = await sendAndWait(
    "executePayroll",
    payGramCore.getFunction("executePayroll")() as Promise<ethers.TransactionResponse>,
    provider
  );
  if (r) totalGas += r.gasUsed;
  console.log("");

  // ── 11. Save deployment ────────────────────────────────────────
  console.log("  [11/11] Saving deployment info...");

  const deployment = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployerAddress,
    contracts: {
      TrustScoring: trustScoringAddr,
      PayGramToken: payGramTokenAddr,
      PayGramCore: payGramCoreAddr,
    },
    transactions: {
      TrustScoring: trustScoringTx?.hash,
      PayGramToken: tokenTx?.hash,
      PayGramCore: coreTx?.hash,
    },
    initialSupply: tokenSupply.toString(),
    employees: EMPLOYEES.map((e) => ({
      address: e.address,
      role: e.role,
      salary: e.salary,
      score: e.score,
    })),
    deployedAt: new Date().toISOString(),
  };

  const outputDir = path.resolve(__dirname, "..", "deployments");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputFile = path.join(outputDir, "sepolia.json");
  fs.writeFileSync(outputFile, JSON.stringify(deployment, null, 2));
  console.log(`        Saved to: ${outputFile}`);

  // ── Summary ────────────────────────────────────────────────────
  const endBalance = await provider.getBalance(deployerAddress);
  const spent = balance - endBalance;

  console.log("");
  console.log("=".repeat(60));
  console.log("  DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log(`  TrustScoring : ${trustScoringAddr}`);
  console.log(`  PayGramToken : ${payGramTokenAddr}`);
  console.log(`  PayGramCore  : ${payGramCoreAddr}`);
  console.log(`  Supply minted: ${tokenSupply}`);
  console.log(`  Employees    : ${EMPLOYEES.length}`);
  console.log(`  Scored       : ${scoredEmployees.length}`);
  console.log(`  Gas spent    : ${totalGas}`);
  console.log(`  ETH spent    : ${ethers.formatEther(spent)} ETH`);
  console.log(`  Balance left : ${ethers.formatEther(endBalance)} ETH`);
  console.log("=".repeat(60));
  console.log("");
  console.log("  Next steps:");
  console.log("    1. Verify contracts on Etherscan:");
  console.log(`       npx hardhat verify --network sepolia ${trustScoringAddr} ${deployerAddress}`);
  console.log(`       npx hardhat verify --network sepolia ${payGramTokenAddr} ${deployerAddress} ${tokenSupply}`);
  console.log(`       npx hardhat verify --network sepolia ${payGramCoreAddr} ${deployerAddress} ${deployerAddress} ${trustScoringAddr} ${payGramTokenAddr}`);
  console.log("    2. Update frontend/src/lib/constants.ts with new addresses");
  console.log("    3. Rebuild frontend: cd frontend && npm run build");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
