// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RitualWrapped
 * @notice Stores on-chain Wrapped data for Ritual Chain wallets.
 *         Phase 1: simple storage contract.
 *         Phase 2: add LLM precompile integration for AI-generated insights.
 */
contract RitualWrapped {
    struct WrappedResult {
        address wallet;
        uint256 totalTransactions;
        uint256 totalGasSpent;
        uint256 walletAgeDays;
        uint256 uniqueContracts;
        string title;
        string subtitle;
        string funFact;
        uint256 generatedAt;
        bool exists;
    }

    mapping(address => WrappedResult) public results;
    address[] public allWallets;

    event WrappedGenerated(
        address indexed wallet,
        string title,
        uint256 generatedAt
    );

    /**
     * @notice Store a generated Wrapped result on-chain.
     * @param totalTransactions Total tx count for the wallet.
     * @param totalGasSpent Total gas spent in wei.
     * @param walletAgeDays Days since first transaction.
     * @param uniqueContracts Number of unique contracts interacted with.
     * @param title AI-generated title (e.g., "Ritual Degen").
     * @param subtitle AI-generated subtitle.
     * @param funFact AI-generated fun fact.
     */
    function storeWrapped(
        uint256 totalTransactions,
        uint256 totalGasSpent,
        uint256 walletAgeDays,
        uint256 uniqueContracts,
        string calldata title,
        string calldata subtitle,
        string calldata funFact
    ) external {
        if (!results[msg.sender].exists) {
            allWallets.push(msg.sender);
        }

        results[msg.sender] = WrappedResult({
            wallet: msg.sender,
            totalTransactions: totalTransactions,
            totalGasSpent: totalGasSpent,
            walletAgeDays: walletAgeDays,
            uniqueContracts: uniqueContracts,
            title: title,
            subtitle: subtitle,
            funFact: funFact,
            generatedAt: block.timestamp,
            exists: true
        });

        emit WrappedGenerated(msg.sender, title, block.timestamp);
    }

    /**
     * @notice Check if a wallet has generated a Wrapped.
     */
    function hasWrapped(address wallet) external view returns (bool) {
        return results[wallet].exists;
    }

    /**
     * @notice Get total number of wallets with Wrapped.
     */
    function totalWrapped() external view returns (uint256) {
        return allWallets.length;
    }

    /**
     * @notice Accept RITUAL deposits (for future LLM fee funding).
     */
    receive() external payable {}
}
