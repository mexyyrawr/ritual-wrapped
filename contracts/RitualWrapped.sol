// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title RitualWrapped
 * @notice On-chain storage for Ritual Wrapped card data
 * @dev Users pay gas to claim their wrapped data, which is stored on-chain
 */
contract RitualWrapped is Ownable {
    using Strings for uint256;

    // Wrapped data structure
    struct WrappedData {
        address wallet;
        uint256 totalTransactions;
        uint256 totalSent;      // in wei
        uint256 totalReceived;  // in wei
        uint256 totalGasSpent;  // in wei
        uint256 largestTx;      // in wei
        uint256 walletAgeDays;
        uint256 uniqueContracts;
        uint256 activityScore;
        string activityLevel;
        string funFact;
        uint256 claimedAt;
        uint256 blockNumber;
        bool exists;
    }

    // Storage
    mapping(address => WrappedData) public wrappedData;
    address[] public claimers;
    
    // Events
    event WrappedClaimed(
        address indexed wallet,
        uint256 totalTransactions,
        uint256 activityScore,
        string activityLevel,
        uint256 timestamp
    );

    // Stats
    uint256 public totalClaims;
    uint256 public totalGasUsed;

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Claim your Ritual Wrapped data
     * @param _totalTransactions Total transaction count
     * @param _totalSent Total RITUAL sent (in wei)
     * @param _totalReceived Total RITUAL received (in wei)
     * @param _totalGasSpent Total gas spent (in wei)
     * @param _largestTx Largest transaction (in wei)
     * @param _walletAgeDays Wallet age in days
     * @param _uniqueContracts Number of unique contracts interacted
     * @param _activityScore Activity score (0-100)
     * @param _activityLevel Activity level string
     * @param _funFact Fun fact about the wallet
     */
    function claimWrapped(
        uint256 _totalTransactions,
        uint256 _totalSent,
        uint256 _totalReceived,
        uint256 _totalGasSpent,
        uint256 _largestTx,
        uint256 _walletAgeDays,
        uint256 _uniqueContracts,
        uint256 _activityScore,
        string memory _activityLevel,
        string memory _funFact
    ) external {
        require(!wrappedData[msg.sender].exists, "Already claimed");
        require(_activityScore <= 100, "Invalid score");

        wrappedData[msg.sender] = WrappedData({
            wallet: msg.sender,
            totalTransactions: _totalTransactions,
            totalSent: _totalSent,
            totalReceived: _totalReceived,
            totalGasSpent: _totalGasSpent,
            largestTx: _largestTx,
            walletAgeDays: _walletAgeDays,
            uniqueContracts: _uniqueContracts,
            activityScore: _activityScore,
            activityLevel: _activityLevel,
            funFact: _funFact,
            claimedAt: block.timestamp,
            blockNumber: block.number,
            exists: true
        });

        claimers.push(msg.sender);
        totalClaims++;
        totalGasUsed += gasleft();

        emit WrappedClaimed(
            msg.sender,
            _totalTransactions,
            _activityScore,
            _activityLevel,
            block.timestamp
        );
    }

    /**
     * @notice Check if an address has claimed their wrapped
     * @param _address Address to check
     * @return bool True if claimed
     */
    function hasClaimed(address _address) external view returns (bool) {
        return wrappedData[_address].exists;
    }

    /**
     * @notice Get wrapped data for an address
     * @param _address Address to get data for
     * @return WrappedData The wrapped data
     */
    function getWrappedData(address _address) external view returns (WrappedData memory) {
        require(wrappedData[_address].exists, "Not claimed yet");
        return wrappedData[_address];
    }

    /**
     * @notice Get total number of claims
     * @return uint256 Total claims
     */
    function getTotalClaims() external view returns (uint256) {
        return totalClaims;
    }

    /**
     * @notice Get all claimers (paginated)
     * @param _offset Start index
     * @param _limit Number of items to return
     * @return addresses Array of claimer addresses
     */
    function getClaimers(uint256 _offset, uint256 _limit) external view returns (address[] memory) {
        require(_offset < claimers.length, "Offset out of bounds");
        
        uint256 end = _offset + _limit;
        if (end > claimers.length) {
            end = claimers.length;
        }
        
        uint256 size = end - _offset;
        address[] memory addresses = new address[](size);
        
        for (uint256 i = 0; i < size; i++) {
            addresses[i] = claimers[_offset + i];
        }
        
        return addresses;
    }
}
