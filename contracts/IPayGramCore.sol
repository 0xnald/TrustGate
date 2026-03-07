// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/**
 * @title IPayGramCore
 * @notice Minimal interface for TrustScoring to query employer/employee relationships.
 */
interface IPayGramCore {
    function isEmployer(address account) external view returns (bool);
    function isActiveEmployee(address employer, address wallet) external view returns (bool);
}
