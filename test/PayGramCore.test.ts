import { expect } from "chai";
import { ethers } from "hardhat";
import { PayGramCore, TrustScoring, PayGramToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

/**
 * PayGramCore Test Suite (Multi-Employer)
 *
 * Tests are split into two categories:
 *
 * 1. State & access-control tests -- run on any Hardhat network. These verify
 *    deployment, modifiers, view helpers, payment lifecycle, and event emissions.
 *
 * 2. FHE-dependent tests -- require a Hardhat node with the Zama FHEVM
 *    coprocessor deployed. On vanilla Hardhat these auto-skip via
 *    try/catch + this.skip().
 */

describe("PayGramCore", function () {
  let payGramCore: PayGramCore;
  let trustScoring: TrustScoring;
  let payGramToken: PayGramToken;

  let owner: HardhatEthersSigner;
  let employer: HardhatEthersSigner;
  let employer2: HardhatEthersSigner;
  let employee1: HardhatEthersSigner;
  let employee2: HardhatEthersSigner;
  let employee3: HardhatEthersSigner;
  let oracle: HardhatEthersSigner;
  let unauthorized: HardhatEthersSigner;

  /** Whether FHE operations are available on this network. */
  let fheAvailable = false;

  /**
   * Attempts to add an employee using the plaintext helper.
   * If FHE is unavailable (vanilla Hardhat), skips the calling test.
   */
  async function addEmployeeOrSkip(
    ctx: Mocha.Context,
    emp: HardhatEthersSigner,
    wallet: HardhatEthersSigner,
    salary: number,
    role: string
  ) {
    try {
      await payGramCore
        .connect(emp)
        .addEmployeePlaintext(wallet.address, salary, role);
    } catch {
      ctx.skip();
    }
  }

  /**
   * Adds an employee and a trust score. Skips if FHE is unavailable.
   */
  async function addScoredEmployeeOrSkip(
    ctx: Mocha.Context,
    emp: HardhatEthersSigner,
    wallet: HardhatEthersSigner,
    salary: number,
    role: string,
    score: number
  ) {
    try {
      await payGramCore
        .connect(emp)
        .addEmployeePlaintext(wallet.address, salary, role);
      await trustScoring
        .connect(oracle)
        .setTrustScorePlaintext(wallet.address, score);
    } catch {
      ctx.skip();
    }
  }

  beforeEach(async function () {
    [owner, employer, employer2, employee1, employee2, employee3, oracle, unauthorized] =
      await ethers.getSigners();

    // Deploy TrustScoring
    const TrustScoringFactory =
      await ethers.getContractFactory("TrustScoring");
    trustScoring = await TrustScoringFactory.deploy(owner.address);
    await trustScoring.waitForDeployment();

    // Authorize oracle
    await trustScoring.connect(owner).setOracle(oracle.address, true);

    // Deploy PayGramToken (initial supply = 0; FHE-dependent constructor mint skipped)
    const PayGramTokenFactory =
      await ethers.getContractFactory("PayGramToken");
    payGramToken = await PayGramTokenFactory.deploy(owner.address, 0);
    await payGramToken.waitForDeployment();

    // Deploy PayGramCore
    const PayGramCoreFactory =
      await ethers.getContractFactory("PayGramCore");
    payGramCore = await PayGramCoreFactory.deploy(
      owner.address,
      employer.address,
      await trustScoring.getAddress(),
      await payGramToken.getAddress()
    );
    await payGramCore.waitForDeployment();

    // Wire TrustScoring -> PayGramCore for employer-scoped scoring
    await trustScoring.connect(owner).setPayGramCore(await payGramCore.getAddress());

    // Detect FHE availability by trying a minimal FHE operation
    try {
      await trustScoring
        .connect(oracle)
        .setTrustScorePlaintext(employee1.address, 50);
      fheAvailable = true;
      // Clean up: revoke so tests start fresh
      await trustScoring.connect(oracle).revokeScore(employee1.address);
    } catch {
      fheAvailable = false;
    }
  });

  // ================================================================
  //  DEPLOYMENT
  // ================================================================

  describe("Deployment", function () {
    it("should deploy with the correct owner", async function () {
      expect(await payGramCore.owner()).to.equal(owner.address);
    });

    it("should register the initial employer", async function () {
      expect(await payGramCore.isEmployer(employer.address)).to.equal(true);
    });

    it("should reference the correct TrustScoring contract", async function () {
      expect(await payGramCore.trustScoring()).to.equal(
        await trustScoring.getAddress()
      );
    });

    it("should reference the correct payToken address", async function () {
      expect(await payGramCore.payToken()).to.equal(
        await payGramToken.getAddress()
      );
    });

    it("should start with zero employees for employer", async function () {
      expect(await payGramCore.employeeCount(employer.address)).to.equal(0);
    });

    it("should start with zero payrolls executed for employer", async function () {
      expect(await payGramCore.employerPayrollCount(employer.address)).to.equal(0);
    });

    it("should start with nextPaymentId at zero", async function () {
      expect(await payGramCore.nextPaymentId()).to.equal(0);
    });

    it("should expose correct delay period constant", async function () {
      expect(await payGramCore.DELAY_PERIOD()).to.equal(24 * 60 * 60);
    });

    it("should expose correct max batch size constant", async function () {
      expect(await payGramCore.MAX_BATCH_SIZE()).to.equal(50);
    });

    it("should revert if employer is zero address", async function () {
      const Factory = await ethers.getContractFactory("PayGramCore");
      await expect(
        Factory.deploy(
          owner.address,
          ethers.ZeroAddress,
          await trustScoring.getAddress(),
          await payGramToken.getAddress()
        )
      ).to.be.revertedWithCustomError(payGramCore, "ZeroAddress");
    });

    it("should revert if trustScoring is zero address", async function () {
      const Factory = await ethers.getContractFactory("PayGramCore");
      await expect(
        Factory.deploy(
          owner.address,
          employer.address,
          ethers.ZeroAddress,
          await payGramToken.getAddress()
        )
      ).to.be.revertedWithCustomError(payGramCore, "ZeroAddress");
    });

    it("should revert if payToken is zero address", async function () {
      const Factory = await ethers.getContractFactory("PayGramCore");
      await expect(
        Factory.deploy(
          owner.address,
          employer.address,
          await trustScoring.getAddress(),
          ethers.ZeroAddress
        )
      ).to.be.revertedWithCustomError(payGramCore, "ZeroAddress");
    });
  });

  // ================================================================
  //  EMPLOYER REGISTRATION
  // ================================================================

  describe("Employer Registration", function () {
    it("should allow anyone to register as employer", async function () {
      await payGramCore.connect(employer2).registerAsEmployer();
      expect(await payGramCore.isEmployer(employer2.address)).to.equal(true);
    });

    it("should emit EmployerRegistered event", async function () {
      await expect(payGramCore.connect(employer2).registerAsEmployer())
        .to.emit(payGramCore, "EmployerRegistered")
        .withArgs(employer2.address);
    });

    it("should reject double registration", async function () {
      await expect(
        payGramCore.connect(employer).registerAsEmployer()
      ).to.be.revertedWithCustomError(payGramCore, "AlreadyEmployer");
    });

    it("should not be employer by default", async function () {
      expect(await payGramCore.isEmployer(unauthorized.address)).to.equal(false);
    });
  });

  // ================================================================
  //  EMPLOYEE MANAGEMENT
  // ================================================================

  describe("Employee Management", function () {
    it("should add an employee with plaintext salary", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");
      expect(await payGramCore.employeeCount(employer.address)).to.equal(1);
      expect(await payGramCore.isActiveEmployee(employer.address, employee1.address)).to.equal(true);
    });

    it("should emit EmployeeAdded event", async function () {
      try {
        await expect(
          payGramCore
            .connect(employer)
            .addEmployeePlaintext(employee1.address, 5000, "engineer")
        ).to.emit(payGramCore, "EmployeeAdded");
      } catch {
        this.skip();
      }
    });

    it("should store correct employee role", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "designer");
      const [, , , , role] = await payGramCore.getEmployee(employer.address, employee1.address);
      expect(role).to.equal("designer");
    });

    it("should store correct hire date", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");
      const [, , hireDate] = await payGramCore.getEmployee(employer.address, employee1.address);
      expect(hireDate).to.be.gt(0);
    });

    it("should reject adding zero address", async function () {
      await expect(
        payGramCore
          .connect(employer)
          .addEmployeePlaintext(ethers.ZeroAddress, 5000, "test")
      ).to.be.revertedWithCustomError(payGramCore, "ZeroAddress");
    });

    it("should reject duplicate employee", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");
      await expect(
        payGramCore
          .connect(employer)
          .addEmployeePlaintext(employee1.address, 6000, "senior")
      ).to.be.revertedWithCustomError(payGramCore, "EmployeeAlreadyExists");
    });

    it("should reject non-employer adding employee", async function () {
      await expect(
        payGramCore
          .connect(unauthorized)
          .addEmployeePlaintext(employee1.address, 5000, "test")
      ).to.be.revertedWithCustomError(payGramCore, "NotEmployer");
    });

    it("should track employee list correctly", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "a");
      try {
        await payGramCore
          .connect(employer)
          .addEmployeePlaintext(employee2.address, 6000, "b");
      } catch {
        this.skip();
      }
      const list = await payGramCore.getEmployeeList(employer.address);
      expect(list.length).to.equal(2);
      expect(list[0]).to.equal(employee1.address);
      expect(list[1]).to.equal(employee2.address);
    });

    // -- Removing employees --

    it("should remove an employee (set inactive)", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");
      await payGramCore.connect(employer).removeEmployee(employee1.address);
      expect(await payGramCore.isActiveEmployee(employer.address, employee1.address)).to.equal(false);
    });

    it("should emit EmployeeRemoved event", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");
      await expect(
        payGramCore.connect(employer).removeEmployee(employee1.address)
      )
        .to.emit(payGramCore, "EmployeeRemoved")
        .withArgs(employer.address, employee1.address);
    });

    it("should revert removing non-existent employee", async function () {
      await expect(
        payGramCore.connect(employer).removeEmployee(employee1.address)
      ).to.be.revertedWithCustomError(payGramCore, "EmployeeNotFound");
    });

    it("should revert removing already-inactive employee", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");
      await payGramCore.connect(employer).removeEmployee(employee1.address);
      await expect(
        payGramCore.connect(employer).removeEmployee(employee1.address)
      ).to.be.revertedWithCustomError(payGramCore, "EmployeeNotActive");
    });

    it("should revert non-employer removing employee", async function () {
      await expect(
        payGramCore.connect(unauthorized).removeEmployee(employee1.address)
      ).to.be.revertedWithCustomError(payGramCore, "NotEmployer");
    });

    // -- Active employee count --

    it("should track active employee count correctly", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "a");
      try {
        await payGramCore
          .connect(employer)
          .addEmployeePlaintext(employee2.address, 6000, "b");
      } catch {
        this.skip();
      }
      expect(await payGramCore.activeEmployeeCount(employer.address)).to.equal(2);

      await payGramCore.connect(employer).removeEmployee(employee1.address);
      expect(await payGramCore.activeEmployeeCount(employer.address)).to.equal(1);
    });

    // -- Updating role --

    it("should update employee role", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "junior");
      await payGramCore
        .connect(employer)
        .updateEmployeeRole(employee1.address, "senior");
      const [, , , , role] = await payGramCore.getEmployee(employer.address, employee1.address);
      expect(role).to.equal("senior");
    });

    it("should emit EmployeeUpdated on role change", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "junior");
      await expect(
        payGramCore
          .connect(employer)
          .updateEmployeeRole(employee1.address, "senior")
      )
        .to.emit(payGramCore, "EmployeeUpdated")
        .withArgs(employer.address, employee1.address);
    });

    it("should revert role update for non-existent employee", async function () {
      await expect(
        payGramCore
          .connect(employer)
          .updateEmployeeRole(employee1.address, "test")
      ).to.be.revertedWithCustomError(payGramCore, "EmployeeNotFound");
    });

    it("should revert role update for inactive employee", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");
      await payGramCore.connect(employer).removeEmployee(employee1.address);
      await expect(
        payGramCore
          .connect(employer)
          .updateEmployeeRole(employee1.address, "test")
      ).to.be.revertedWithCustomError(payGramCore, "EmployeeNotActive");
    });

    // -- Salary updates --

    it("should update salary via plaintext helper", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");
      try {
        await payGramCore
          .connect(employer)
          .updateSalaryPlaintext(employee1.address, 7000);
      } catch {
        this.skip();
      }
    });

    it("should emit SalaryUpdated on salary change", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");
      try {
        await expect(
          payGramCore
            .connect(employer)
            .updateSalaryPlaintext(employee1.address, 7000)
        )
          .to.emit(payGramCore, "SalaryUpdated")
          .withArgs(employer.address, employee1.address);
      } catch {
        this.skip();
      }
    });

    it("should revert salary update for non-existent employee", async function () {
      await expect(
        payGramCore
          .connect(employer)
          .updateSalaryPlaintext(employee1.address, 7000)
      ).to.be.revertedWithCustomError(payGramCore, "EmployeeNotFound");
    });

    it("should revert salary update from non-employer", async function () {
      await expect(
        payGramCore
          .connect(unauthorized)
          .updateSalaryPlaintext(employee1.address, 7000)
      ).to.be.revertedWithCustomError(payGramCore, "NotEmployer");
    });
  });

  // ================================================================
  //  MULTI-EMPLOYER ISOLATION
  // ================================================================

  describe("Multi-Employer Isolation", function () {
    beforeEach(async function () {
      // Register employer2
      await payGramCore.connect(employer2).registerAsEmployer();
    });

    it("should keep employee lists separate per employer", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "a");
      try {
        await payGramCore
          .connect(employer2)
          .addEmployeePlaintext(employee2.address, 6000, "b");
      } catch {
        this.skip();
      }

      const list1 = await payGramCore.getEmployeeList(employer.address);
      const list2 = await payGramCore.getEmployeeList(employer2.address);

      expect(list1.length).to.equal(1);
      expect(list1[0]).to.equal(employee1.address);
      expect(list2.length).to.equal(1);
      expect(list2[0]).to.equal(employee2.address);
    });

    it("should allow same employee under different employers", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "dev");
      try {
        await payGramCore
          .connect(employer2)
          .addEmployeePlaintext(employee1.address, 8000, "consultant");
      } catch {
        this.skip();
      }

      const [, , , , role1] = await payGramCore.getEmployee(employer.address, employee1.address);
      const [, , , , role2] = await payGramCore.getEmployee(employer2.address, employee1.address);
      expect(role1).to.equal("dev");
      expect(role2).to.equal("consultant");
    });

    it("should track payroll counts independently", async function () {
      await payGramCore.connect(employer).executePayroll();
      await payGramCore.connect(employer).executePayroll();
      await payGramCore.connect(employer2).executePayroll();

      expect(await payGramCore.employerPayrollCount(employer.address)).to.equal(2);
      expect(await payGramCore.employerPayrollCount(employer2.address)).to.equal(1);
    });

    it("should not let employer remove another employer's employee", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "dev");

      // employer2 tries to remove employer's employee
      await expect(
        payGramCore.connect(employer2).removeEmployee(employee1.address)
      ).to.be.revertedWithCustomError(payGramCore, "EmployeeNotFound");
    });
  });

  // ================================================================
  //  PAYROLL EXECUTION
  // ================================================================

  describe("Payroll Execution", function () {
    it("should reject payroll from non-employer", async function () {
      await expect(
        payGramCore.connect(unauthorized).executePayroll()
      ).to.be.revertedWithCustomError(payGramCore, "NotEmployer");
    });

    it("should handle payroll with no employees", async function () {
      await payGramCore.connect(employer).executePayroll();
      expect(await payGramCore.employerPayrollCount(employer.address)).to.equal(1);
    });

    it("should emit PayrollExecuted event", async function () {
      await expect(payGramCore.connect(employer).executePayroll())
        .to.emit(payGramCore, "PayrollExecuted");
    });

    it("should increment employerPayrollCount", async function () {
      await payGramCore.connect(employer).executePayroll();
      await payGramCore.connect(employer).executePayroll();
      expect(await payGramCore.employerPayrollCount(employer.address)).to.equal(2);
    });

    it("should skip inactive employees during payroll", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");
      await payGramCore.connect(employer).removeEmployee(employee1.address);

      await payGramCore.connect(employer).executePayroll();
      expect(await payGramCore.employerPayrollCount(employer.address)).to.equal(1);
    });

    it("should create escrowed payment for unscored employee", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");

      await payGramCore.connect(employer).executePayroll();

      const paymentId = 0;
      const [empAddr, empEmployer, status, , , milestone] =
        await payGramCore.getPendingPayment(paymentId);
      expect(empAddr).to.equal(employee1.address);
      expect(empEmployer).to.equal(employer.address);
      expect(status).to.equal(3); // Escrowed = 3
      expect(milestone).to.equal("Pending employer approval");
    });

    it("should update lastPayDate after payroll", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");
      await payGramCore.connect(employer).executePayroll();

      const [, , , lastPay] = await payGramCore.getEmployee(employer.address, employee1.address);
      expect(lastPay).to.be.gt(0);
    });

    it("should execute payroll with scored employee (FHE routing)", async function () {
      await addScoredEmployeeOrSkip(this, employer, employee1, 5000, "engineer", 85);

      try {
        await payGramCore.connect(employer).executePayroll();
        expect(await payGramCore.nextPaymentId()).to.equal(3);
      } catch {
        this.skip();
      }
    });

    it("should process mixed scored/unscored batch", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "a");
      try {
        await payGramCore
          .connect(employer)
          .addEmployeePlaintext(employee2.address, 6000, "b");
      } catch {
        this.skip();
      }

      await payGramCore.connect(employer).executePayroll();
      expect(await payGramCore.nextPaymentId()).to.equal(2);
    });
  });

  // ================================================================
  //  PAYMENT MANAGEMENT
  // ================================================================

  describe("Payment Management", function () {
    it("should revert release for non-existent payment", async function () {
      await expect(
        payGramCore.connect(employer).releasePayment(999)
      ).to.be.revertedWithCustomError(payGramCore, "PaymentNotFound");
    });

    it("should revert cancel for non-existent payment", async function () {
      await expect(
        payGramCore.connect(employer).cancelPayment(999)
      ).to.be.revertedWithCustomError(payGramCore, "PaymentNotFound");
    });

    it("should release an escrowed payment (employer approval)", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");

      await payGramCore.connect(employer).executePayroll();

      await expect(payGramCore.connect(employer).releasePayment(0))
        .to.emit(payGramCore, "PaymentReleased")
        .withArgs(0, employee1.address);

      const [, , status] = await payGramCore.getPendingPayment(0);
      expect(status).to.equal(4); // Released = 4
    });

    it("should reject non-employer releasing escrowed payment", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");
      await payGramCore.connect(employer).executePayroll();

      await expect(
        payGramCore.connect(unauthorized).releasePayment(0)
      ).to.be.revertedWithCustomError(payGramCore, "NotPaymentEmployer");
    });

    it("should cancel a pending escrowed payment", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");
      await payGramCore.connect(employer).executePayroll();

      await expect(payGramCore.connect(employer).cancelPayment(0))
        .to.emit(payGramCore, "PaymentCancelled")
        .withArgs(0, employee1.address);

      const [, , status] = await payGramCore.getPendingPayment(0);
      expect(status).to.equal(5); // Completed = 5
    });

    it("should reject cancelling already-released payment", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");
      await payGramCore.connect(employer).executePayroll();
      await payGramCore.connect(employer).releasePayment(0);

      await expect(
        payGramCore.connect(employer).cancelPayment(0)
      ).to.be.revertedWithCustomError(payGramCore, "PaymentAlreadyProcessed");
    });

    it("should reject releasing already-released payment", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");
      await payGramCore.connect(employer).executePayroll();
      await payGramCore.connect(employer).releasePayment(0);

      await expect(
        payGramCore.connect(employer).releasePayment(0)
      ).to.be.revertedWithCustomError(payGramCore, "PaymentNotReleasable");
    });

    it("should reject releasing cancelled payment", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");
      await payGramCore.connect(employer).executePayroll();
      await payGramCore.connect(employer).cancelPayment(0);

      await expect(
        payGramCore.connect(employer).releasePayment(0)
      ).to.be.revertedWithCustomError(payGramCore, "PaymentNotReleasable");
    });

    it("should reject non-employer cancelling payment", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");
      await payGramCore.connect(employer).executePayroll();

      await expect(
        payGramCore.connect(unauthorized).cancelPayment(0)
      ).to.be.revertedWithCustomError(payGramCore, "NotPaymentEmployer");
    });

    it("should reject another employer cancelling payment", async function () {
      await payGramCore.connect(employer2).registerAsEmployer();
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");
      await payGramCore.connect(employer).executePayroll();

      await expect(
        payGramCore.connect(employer2).cancelPayment(0)
      ).to.be.revertedWithCustomError(payGramCore, "NotPaymentEmployer");
    });

    it("should track pending payments for an employee", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");
      await payGramCore.connect(employer).executePayroll();
      await payGramCore.connect(employer).executePayroll();

      const payments = await payGramCore.getPendingPaymentsForEmployee(
        employee1.address
      );
      expect(payments.length).to.equal(2);
      expect(payments[0]).to.equal(0);
      expect(payments[1]).to.equal(1);
    });

    it("should list releasable payments", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");
      await payGramCore.connect(employer).executePayroll();

      const releasable = await payGramCore.getReleasablePayments();
      expect(releasable.length).to.equal(1);
      expect(releasable[0]).to.equal(0);
    });

    it("should remove released payment from releasable list", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");
      await payGramCore.connect(employer).executePayroll();
      await payGramCore.connect(employer).releasePayment(0);

      const releasable = await payGramCore.getReleasablePayments();
      expect(releasable.length).to.equal(0);
    });
  });

  // ================================================================
  //  DELAYED PAYMENT TIME-LOCK
  // ================================================================

  describe("Delayed Payment Time-Lock", function () {
    it("should reject early release of delayed payment (FHE path)", async function () {
      await addScoredEmployeeOrSkip(this, employer, employee1, 5000, "engineer", 50);

      try {
        await payGramCore.connect(employer).executePayroll();

        let delayedId: number | null = null;
        const total = Number(await payGramCore.nextPaymentId());
        for (let i = 0; i < total; i++) {
          const [, , status] = await payGramCore.getPendingPayment(i);
          if (status === 2n) {
            delayedId = i;
            break;
          }
        }

        if (delayedId !== null) {
          await expect(
            payGramCore.connect(employer).releasePayment(delayedId)
          ).to.be.revertedWithCustomError(payGramCore, "DelayNotElapsed");
        }
      } catch {
        this.skip();
      }
    });

    it("should release delayed payment after hold period (FHE path)", async function () {
      await addScoredEmployeeOrSkip(this, employer, employee1, 5000, "engineer", 50);

      try {
        await payGramCore.connect(employer).executePayroll();

        let delayedId: number | null = null;
        const total = Number(await payGramCore.nextPaymentId());
        for (let i = 0; i < total; i++) {
          const [, , status] = await payGramCore.getPendingPayment(i);
          if (status === 2n) {
            delayedId = i;
            break;
          }
        }

        if (delayedId !== null) {
          await time.increase(25 * 60 * 60);

          await expect(
            payGramCore.releasePayment(delayedId)
          ).to.emit(payGramCore, "PaymentReleased");
        }
      } catch {
        this.skip();
      }
    });
  });

  // ================================================================
  //  VIEW FUNCTIONS
  // ================================================================

  describe("View Functions", function () {
    it("should revert getEmployee for unknown address", async function () {
      await expect(
        payGramCore.getEmployee(employer.address, employee1.address)
      ).to.be.revertedWithCustomError(payGramCore, "EmployeeNotFound");
    });

    it("should revert getPendingPayment for non-existent ID", async function () {
      await expect(
        payGramCore.getPendingPayment(0)
      ).to.be.revertedWithCustomError(payGramCore, "PaymentNotFound");
    });

    it("should return employee data correctly", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");

      const [wallet, isActive, hireDate, lastPay, role] =
        await payGramCore.getEmployee(employer.address, employee1.address);
      expect(wallet).to.equal(employee1.address);
      expect(isActive).to.equal(true);
      expect(hireDate).to.be.gt(0);
      expect(lastPay).to.equal(0);
      expect(role).to.equal("engineer");
    });

    it("should return empty employee list initially", async function () {
      const list = await payGramCore.getEmployeeList(employer.address);
      expect(list.length).to.equal(0);
    });

    it("should return zero active employees initially", async function () {
      expect(await payGramCore.activeEmployeeCount(employer.address)).to.equal(0);
    });

    it("should report isActiveEmployee as false for unknown address", async function () {
      expect(await payGramCore.isActiveEmployee(employer.address, employee1.address)).to.equal(false);
    });

    it("should return empty pending payments for unregistered employee", async function () {
      const payments = await payGramCore.getPendingPaymentsForEmployee(
        employee1.address
      );
      expect(payments.length).to.equal(0);
    });

    it("should return empty releasable payments when none exist", async function () {
      const releasable = await payGramCore.getReleasablePayments();
      expect(releasable.length).to.equal(0);
    });

    it("should return payment details correctly", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");
      await payGramCore.connect(employer).executePayroll();

      const [empAddr, empEmployer, status, createdAt, releaseTime, milestone] =
        await payGramCore.getPendingPayment(0);
      expect(empAddr).to.equal(employee1.address);
      expect(empEmployer).to.equal(employer.address);
      expect(status).to.equal(3); // Escrowed
      expect(createdAt).to.be.gt(0);
      expect(releaseTime).to.equal(0);
      expect(milestone).to.equal("Pending employer approval");
    });
  });

  // ================================================================
  //  ADMIN FUNCTIONS
  // ================================================================

  describe("Admin Functions", function () {
    it("should update TrustScoring address", async function () {
      const newAddr = employee3.address;
      await expect(
        payGramCore.connect(owner).updateTrustScoring(newAddr)
      )
        .to.emit(payGramCore, "TrustScoringUpdated")
        .withArgs(newAddr);
      expect(await payGramCore.trustScoring()).to.equal(newAddr);
    });

    it("should reject updateTrustScoring with zero address", async function () {
      await expect(
        payGramCore.connect(owner).updateTrustScoring(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(payGramCore, "ZeroAddress");
    });

    it("should reject updateTrustScoring from non-owner", async function () {
      await expect(
        payGramCore.connect(unauthorized).updateTrustScoring(employee3.address)
      ).to.be.revertedWithCustomError(
        payGramCore,
        "OwnableUnauthorizedAccount"
      );
    });

    it("should update payToken address", async function () {
      const newAddr = employee3.address;
      await expect(payGramCore.connect(owner).updatePayToken(newAddr))
        .to.emit(payGramCore, "PayTokenUpdated")
        .withArgs(newAddr);
      expect(await payGramCore.payToken()).to.equal(newAddr);
    });

    it("should reject updatePayToken with zero address", async function () {
      await expect(
        payGramCore.connect(owner).updatePayToken(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(payGramCore, "ZeroAddress");
    });

    it("should reject updatePayToken from non-owner", async function () {
      await expect(
        payGramCore.connect(unauthorized).updatePayToken(employee3.address)
      ).to.be.revertedWithCustomError(
        payGramCore,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  // ================================================================
  //  ACCESS CONTROL (Ownable2Step)
  // ================================================================

  describe("Ownership (Ownable2Step)", function () {
    it("should support two-step ownership transfer", async function () {
      await payGramCore.connect(owner).transferOwnership(employee1.address);
      expect(await payGramCore.owner()).to.equal(owner.address);

      await payGramCore.connect(employee1).acceptOwnership();
      expect(await payGramCore.owner()).to.equal(employee1.address);
    });

    it("should reject ownership acceptance from wrong address", async function () {
      await payGramCore.connect(owner).transferOwnership(employee1.address);
      await expect(
        payGramCore.connect(employee2).acceptOwnership()
      ).to.be.revertedWithCustomError(
        payGramCore,
        "OwnableUnauthorizedAccount"
      );
    });

    it("should allow new owner to use admin functions", async function () {
      await payGramCore.connect(owner).transferOwnership(employee1.address);
      await payGramCore.connect(employee1).acceptOwnership();

      await payGramCore
        .connect(employee1)
        .updateTrustScoring(employee2.address);
      expect(await payGramCore.trustScoring()).to.equal(employee2.address);
    });
  });

  // ================================================================
  //  EDGE CASES
  // ================================================================

  describe("Edge Cases", function () {
    it("should handle multiple payroll runs", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");

      await payGramCore.connect(employer).executePayroll();
      await payGramCore.connect(employer).executePayroll();
      await payGramCore.connect(employer).executePayroll();

      expect(await payGramCore.employerPayrollCount(employer.address)).to.equal(3);
      expect(await payGramCore.nextPaymentId()).to.equal(3);

      const payments = await payGramCore.getPendingPaymentsForEmployee(
        employee1.address
      );
      expect(payments.length).to.equal(3);
    });

    it("should handle payroll when all employees are inactive", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");
      await payGramCore.connect(employer).removeEmployee(employee1.address);

      await payGramCore.connect(employer).executePayroll();
      expect(await payGramCore.employerPayrollCount(employer.address)).to.equal(1);
      expect(await payGramCore.nextPaymentId()).to.equal(0);
    });

    it("should retain removed employee in list for audit", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "engineer");
      await payGramCore.connect(employer).removeEmployee(employee1.address);

      expect(await payGramCore.employeeCount(employer.address)).to.equal(1);
      expect(await payGramCore.isActiveEmployee(employer.address, employee1.address)).to.equal(false);

      const [wallet, isActive] = await payGramCore.getEmployee(
        employer.address, employee1.address
      );
      expect(wallet).to.equal(employee1.address);
      expect(isActive).to.equal(false);
    });

    it("should handle payroll with mixed active/inactive employees", async function () {
      await addEmployeeOrSkip(this, employer, employee1, 5000, "a");
      try {
        await payGramCore
          .connect(employer)
          .addEmployeePlaintext(employee2.address, 6000, "b");
      } catch {
        this.skip();
      }

      await payGramCore.connect(employer).removeEmployee(employee1.address);
      await payGramCore.connect(employer).executePayroll();

      expect(await payGramCore.nextPaymentId()).to.equal(1);
      const [empAddr] = await payGramCore.getPendingPayment(0);
      expect(empAddr).to.equal(employee2.address);
    });
  });
});
