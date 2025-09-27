interface BlockchainRecord {
  id: string;
  hash: string;
  previousHash: string;
  timestamp: Date;
  data: any;
  signature: string;
  blockNumber: number;
  merkleRoot: string;
  nonce: number;
  difficulty: number;
}

interface CivicTransaction {
  id: string;
  type: 'report_created' | 'status_updated' | 'comment_added' | 'vote_cast' | 'resolution_confirmed' | 'verification_completed';
  reportId: string;
  userId: string;
  data: any;
  timestamp: Date;
  hash: string;
  signature?: string;
  gasUsed?: number;
}

interface TransparencyAudit {
  reportId: string;
  auditTrail: AuditEntry[];
  verificationStatus: 'pending' | 'verified' | 'disputed' | 'confirmed';
  stakeholderSignatures: StakeholderSignature[];
  immutabilityScore: number;
  consensusLevel: number;
  publicVerifiable: boolean;
}

interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  actorType: 'citizen' | 'official' | 'system' | 'contractor';
  timestamp: Date;
  previousState: any;
  newState: any;
  hash: string;
  blockNumber: number;
  gasUsed: number;
  verified: boolean;
}

interface StakeholderSignature {
  stakeholder: string;
  role: 'reporter' | 'municipal_official' | 'department_head' | 'contractor' | 'auditor';
  signature: string;
  timestamp: Date;
  publicKey: string;
  verified: boolean;
}

interface SmartContract {
  id: string;
  name: string;
  type: 'civic_report' | 'budget_allocation' | 'contractor_payment' | 'citizen_voting' | 'performance_bond';
  address: string;
  abi: any[];
  deployedAt: Date;
  version: string;
  status: 'active' | 'paused' | 'deprecated';
  conditions: ContractCondition[];
}

interface ContractCondition {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  parameters: any;
  automated: boolean;
  status: 'active' | 'fulfilled' | 'failed' | 'pending';
}

interface DecentralizedVoting {
  id: string;
  reportId: string;
  question: string;
  options: string[];
  startTime: Date;
  endTime: Date;
  eligibleVoters: string[];
  votes: Vote[];
  results: VotingResults;
  quorum: number;
  isActive: boolean;
  consensus: boolean;
}

interface Vote {
  id: string;
  voterId: string;
  voterHash: string; // Anonymous identifier
  option: string;
  timestamp: Date;
  signature: string;
  weight: number; // Based on stake or reputation
  verified: boolean;
}

interface VotingResults {
  totalVotes: number;
  quorumMet: boolean;
  consensusReached: boolean;
  optionResults: { [option: string]: { count: number; weight: number } };
  winningOption: string;
  confidence: number;
}

interface CitizenReputation {
  userId: string;
  reputationScore: number;
  trustLevel: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  verifiedReports: number;
  accuracyRate: number;
  communityEndorsements: number;
  stakeholderEndorsements: number;
  participationScore: number;
  transparencyContributions: number;
  lastUpdated: Date;
}

export class BlockchainTransparencyService {
  private blockchain: BlockchainRecord[] = [];
  private pendingTransactions: CivicTransaction[] = [];
  private auditTrails: Map<string, TransparencyAudit> = new Map();
  private smartContracts: Map<string, SmartContract> = new Map();
  private activeVotings: Map<string, DecentralizedVoting> = new Map();
  private citizenReputations: Map<string, CitizenReputation> = new Map();
  private difficulty = 4;
  private miningReward = 10;
  private isInitialized = false;

  constructor() {
    this.initializeGenesisBlock();
    this.initializeSmartContracts();
    this.startBlockchainMaintenance();
  }

  private initializeGenesisBlock() {
    const genesisBlock: BlockchainRecord = {
      id: 'genesis',
      hash: this.calculateHash('genesis', '', new Date(), { genesis: true }, 0),
      previousHash: '0',
      timestamp: new Date(),
      data: {
        genesis: true,
        description: 'Urban Guardians Blockchain Genesis Block',
        version: '1.0.0',
        network: 'civic-transparency'
      },
      signature: 'genesis_signature',
      blockNumber: 0,
      merkleRoot: 'genesis_merkle',
      nonce: 0,
      difficulty: this.difficulty
    };
    
    this.blockchain.push(genesisBlock);
    this.isInitialized = true;
    console.log('🔗 Blockchain initialized with genesis block');
  }

  private initializeSmartContracts() {
    const contracts: SmartContract[] = [
      {
        id: 'civic_report_contract',
        name: 'Civic Report Management',
        type: 'civic_report',
        address: '0x' + this.generateRandomAddress(),
        abi: [], // Simplified ABI
        deployedAt: new Date(),
        version: '1.0.0',
        status: 'active',
        conditions: [
          {
            id: 'auto_escalate',
            name: 'Auto Escalation',
            description: 'Automatically escalate reports after 48 hours without response',
            trigger: 'report_age > 48_hours && status == pending',
            action: 'escalate_to_supervisor',
            parameters: { hours: 48 },
            automated: true,
            status: 'active'
          },
          {
            id: 'quality_verification',
            name: 'Quality Verification',
            description: 'Verify report quality based on community feedback',
            trigger: 'upvotes > 5 && comments > 3',
            action: 'mark_verified',
            parameters: { min_upvotes: 5, min_comments: 3 },
            automated: true,
            status: 'active'
          }
        ]
      },
      {
        id: 'budget_allocation_contract',
        name: 'Budget Allocation Transparency',
        type: 'budget_allocation',
        address: '0x' + this.generateRandomAddress(),
        abi: [],
        deployedAt: new Date(),
        version: '1.0.0',
        status: 'active',
        conditions: [
          {
            id: 'budget_approval',
            name: 'Budget Approval Process',
            description: 'Multi-signature approval for budget allocations',
            trigger: 'budget_request_submitted',
            action: 'require_multi_sig_approval',
            parameters: { required_signatures: 3 },
            automated: false,
            status: 'active'
          }
        ]
      }
    ];

    contracts.forEach(contract => {
      this.smartContracts.set(contract.id, contract);
    });
  }

  private generateRandomAddress(): string {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 40; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private startBlockchainMaintenance() {
    // Process pending transactions every 30 seconds
    setInterval(() => {
      this.processPendingTransactions();
    }, 30000);

    // Check smart contract conditions every minute
    setInterval(() => {
      this.executeSmartContractConditions();
    }, 60000);

    // Update citizen reputations every hour
    setInterval(() => {
      this.updateCitizenReputations();
    }, 3600000);
  }

  public recordTransaction(transaction: Omit<CivicTransaction, 'hash' | 'timestamp'>) {
    const completeTransaction: CivicTransaction = {
      ...transaction,
      timestamp: new Date(),
      hash: this.calculateTransactionHash(transaction)
    };

    this.pendingTransactions.push(completeTransaction);
    console.log(`📝 Transaction recorded: ${completeTransaction.type} for report ${completeTransaction.reportId}`);
    
    // Update audit trail
    this.updateAuditTrail(completeTransaction);
    
    return completeTransaction;
  }

  private calculateTransactionHash(transaction: Omit<CivicTransaction, 'hash' | 'timestamp'>): string {
    const data = JSON.stringify({
      id: transaction.id,
      type: transaction.type,
      reportId: transaction.reportId,
      userId: transaction.userId,
      data: transaction.data
    });
    return this.hashFunction(data);
  }

  private updateAuditTrail(transaction: CivicTransaction) {
    let audit = this.auditTrails.get(transaction.reportId);
    
    if (!audit) {
      audit = {
        reportId: transaction.reportId,
        auditTrail: [],
        verificationStatus: 'pending',
        stakeholderSignatures: [],
        immutabilityScore: 0,
        consensusLevel: 0,
        publicVerifiable: true
      };
      this.auditTrails.set(transaction.reportId, audit);
    }

    const auditEntry: AuditEntry = {
      id: transaction.id,
      action: transaction.type,
      actor: transaction.userId,
      actorType: this.determineActorType(transaction.userId),
      timestamp: transaction.timestamp,
      previousState: transaction.data.previousState || null,
      newState: transaction.data.newState || transaction.data,
      hash: transaction.hash,
      blockNumber: this.blockchain.length,
      gasUsed: this.calculateGasUsed(transaction.type),
      verified: false
    };

    audit.auditTrail.push(auditEntry);
    audit.immutabilityScore = this.calculateImmutabilityScore(audit);
    audit.consensusLevel = this.calculateConsensusLevel(audit);
  }

  private determineActorType(userId: string): 'citizen' | 'official' | 'system' | 'contractor' {
    // Simplified logic - in real implementation, this would check user roles
    if (userId.startsWith('system_')) return 'system';
    if (userId.includes('official') || userId.includes('admin')) return 'official';
    if (userId.includes('contractor')) return 'contractor';
    return 'citizen';
  }

  private calculateGasUsed(transactionType: string): number {
    const gasMap = {
      'report_created': 21000,
      'status_updated': 15000,
      'comment_added': 8000,
      'vote_cast': 12000,
      'resolution_confirmed': 25000,
      'verification_completed': 18000
    };
    return gasMap[transactionType] || 10000;
  }

  private calculateImmutabilityScore(audit: TransparencyAudit): number {
    let score = 0;
    
    // Base score from number of entries
    score += Math.min(audit.auditTrail.length * 10, 50);
    
    // Bonus for verified entries
    const verifiedEntries = audit.auditTrail.filter(e => e.verified).length;
    score += (verifiedEntries / audit.auditTrail.length) * 30;
    
    // Bonus for stakeholder signatures
    score += Math.min(audit.stakeholderSignatures.length * 5, 20);
    
    return Math.min(score, 100);
  }

  private calculateConsensusLevel(audit: TransparencyAudit): number {
    if (audit.auditTrail.length === 0) return 0;
    
    const uniqueActors = new Set(audit.auditTrail.map(e => e.actor)).size;
    const verifiedSignatures = audit.stakeholderSignatures.filter(s => s.verified).length;
    
    let consensus = 0;
    
    // Multiple actors increase consensus
    if (uniqueActors >= 3) consensus += 40;
    else if (uniqueActors >= 2) consensus += 20;
    
    // Verified signatures increase consensus
    consensus += Math.min(verifiedSignatures * 15, 60);
    
    return Math.min(consensus, 100);
  }

  private processPendingTransactions() {
    if (this.pendingTransactions.length === 0) return;

    const blockData = {
      transactions: [...this.pendingTransactions],
      timestamp: new Date(),
      validator: 'urban_guardians_validator'
    };

    const newBlock = this.createBlock(blockData);
    const minedBlock = this.mineBlock(newBlock);
    
    if (this.isValidBlock(minedBlock)) {
      this.blockchain.push(minedBlock);
      this.pendingTransactions = [];
      
      console.log(`⛏️ Block ${minedBlock.blockNumber} mined with ${blockData.transactions.length} transactions`);
      
      // Update audit trails
      blockData.transactions.forEach(tx => {
        const audit = this.auditTrails.get(tx.reportId);
        if (audit) {
          const entry = audit.auditTrail.find(e => e.id === tx.id);
          if (entry) {
            entry.verified = true;
            entry.blockNumber = minedBlock.blockNumber;
          }
        }
      });
    }
  }

  private createBlock(data: any): BlockchainRecord {
    const previousBlock = this.blockchain[this.blockchain.length - 1];
    const merkleRoot = this.calculateMerkleRoot(data.transactions || []);
    
    return {
      id: `block_${this.blockchain.length}`,
      hash: '',
      previousHash: previousBlock.hash,
      timestamp: data.timestamp,
      data,
      signature: '',
      blockNumber: this.blockchain.length,
      merkleRoot,
      nonce: 0,
      difficulty: this.difficulty
    };
  }

  private mineBlock(block: BlockchainRecord): BlockchainRecord {
    const target = Array(this.difficulty + 1).join('0');
    
    while (block.hash.substring(0, this.difficulty) !== target) {
      block.nonce++;
      block.hash = this.calculateHash(
        block.id,
        block.previousHash,
        block.timestamp,
        block.data,
        block.nonce
      );
    }
    
    block.signature = this.signBlock(block);
    return block;
  }

  private calculateHash(id: string, previousHash: string, timestamp: Date, data: any, nonce: number): string {
    const input = `${id}${previousHash}${timestamp.toISOString()}${JSON.stringify(data)}${nonce}`;
    return this.hashFunction(input);
  }

  private hashFunction(input: string): string {
    // Simplified hash function (in real implementation, use crypto.createHash('sha256'))
    let hash = 0;
    if (input.length === 0) return hash.toString(16);
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  private calculateMerkleRoot(transactions: CivicTransaction[]): string {
    if (transactions.length === 0) return 'empty_merkle';
    
    const hashes = transactions.map(tx => tx.hash);
    return this.buildMerkleTree(hashes);
  }

  private buildMerkleTree(hashes: string[]): string {
    if (hashes.length === 1) return hashes[0];
    
    const newLevel: string[] = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = hashes[i + 1] || left;
      newLevel.push(this.hashFunction(left + right));
    }
    
    return this.buildMerkleTree(newLevel);
  }

  private signBlock(block: BlockchainRecord): string {
    // Simplified digital signature (in real implementation, use proper cryptographic signing)
    const blockData = JSON.stringify({
      id: block.id,
      hash: block.hash,
      previousHash: block.previousHash,
      timestamp: block.timestamp
    });
    return `sig_${this.hashFunction(blockData)}`;
  }

  private isValidBlock(block: BlockchainRecord): boolean {
    // Validate hash
    const calculatedHash = this.calculateHash(
      block.id,
      block.previousHash,
      block.timestamp,
      block.data,
      block.nonce
    );
    
    if (block.hash !== calculatedHash) return false;
    
    // Validate proof of work
    const target = Array(this.difficulty + 1).join('0');
    if (block.hash.substring(0, this.difficulty) !== target) return false;
    
    // Validate previous hash
    const previousBlock = this.blockchain[this.blockchain.length - 1];
    if (block.previousHash !== previousBlock.hash) return false;
    
    return true;
  }

  private executeSmartContractConditions() {
    this.smartContracts.forEach((contract) => {
      contract.conditions.forEach((condition) => {
        if (condition.status === 'active' && condition.automated) {
          this.checkConditionTrigger(condition, contract);
        }
      });
    });
  }

  private checkConditionTrigger(condition: ContractCondition, contract: SmartContract) {
    // Simplified condition checking (in real implementation, this would be more sophisticated)
    console.log(`🔍 Checking condition: ${condition.name} for contract ${contract.name}`);
    
    // Example: Auto-escalation logic
    if (condition.id === 'auto_escalate') {
      // Check for reports older than 48 hours
      // This would integrate with your report management system
    }
  }

  public createDecentralizedVoting(reportId: string, question: string, options: string[], durationHours: number = 72): string {
    const votingId = `voting_${Date.now()}_${reportId}`;
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
    
    const voting: DecentralizedVoting = {
      id: votingId,
      reportId,
      question,
      options,
      startTime,
      endTime,
      eligibleVoters: this.getEligibleVoters(reportId),
      votes: [],
      results: {
        totalVotes: 0,
        quorumMet: false,
        consensusReached: false,
        optionResults: {},
        winningOption: '',
        confidence: 0
      },
      quorum: Math.max(5, Math.floor(this.citizenReputations.size * 0.1)), // 10% of citizens or minimum 5
      isActive: true,
      consensus: false
    };
    
    // Initialize option results
    options.forEach(option => {
      voting.results.optionResults[option] = { count: 0, weight: 0 };
    });
    
    this.activeVotings.set(votingId, voting);
    
    // Record voting creation on blockchain
    this.recordTransaction({
      id: `vote_create_${votingId}`,
      type: 'vote_cast',
      reportId,
      userId: 'system_voting',
      data: {
        action: 'voting_created',
        question,
        options,
        duration: durationHours
      }
    });
    
    return votingId;
  }

  private getEligibleVoters(reportId: string): string[] {
    // Return users with sufficient reputation to vote
    return Array.from(this.citizenReputations.keys()).filter(userId => {
      const reputation = this.citizenReputations.get(userId);
      return reputation && reputation.reputationScore >= 100; // Minimum reputation for voting
    });
  }

  public castVote(votingId: string, userId: string, option: string): boolean {
    const voting = this.activeVotings.get(votingId);
    
    if (!voting || !voting.isActive || new Date() > voting.endTime) {
      return false;
    }
    
    if (!voting.eligibleVoters.includes(userId)) {
      return false;
    }
    
    // Check if user already voted
    if (voting.votes.some(vote => vote.voterId === userId)) {
      return false;
    }
    
    const reputation = this.citizenReputations.get(userId);
    const weight = reputation ? Math.min(reputation.reputationScore / 100, 5) : 1; // Max weight of 5
    
    const vote: Vote = {
      id: `vote_${Date.now()}_${userId}`,
      voterId: userId,
      voterHash: this.hashFunction(`${userId}_${voting.id}_${Date.now()}`), // Anonymous hash
      option,
      timestamp: new Date(),
      signature: this.hashFunction(`${userId}_${option}_${voting.id}`),
      weight,
      verified: true
    };
    
    voting.votes.push(vote);
    
    // Update results
    voting.results.totalVotes++;
    voting.results.optionResults[option].count++;
    voting.results.optionResults[option].weight += weight;
    
    // Check if quorum is met
    voting.results.quorumMet = voting.votes.length >= voting.quorum;
    
    // Record vote on blockchain
    this.recordTransaction({
      id: `vote_cast_${vote.id}`,
      type: 'vote_cast',
      reportId: voting.reportId,
      userId: 'anonymous_voter', // Keep voter identity private on blockchain
      data: {
        votingId,
        optionSelected: option,
        voterHash: vote.voterHash,
        weight
      }
    });
    
    return true;
  }

  public finalizeVoting(votingId: string): VotingResults | null {
    const voting = this.activeVotings.get(votingId);
    
    if (!voting || voting.isActive === false) {
      return null;
    }
    
    voting.isActive = false;
    
    // Determine winning option
    let winningOption = '';
    let maxWeight = 0;
    
    Object.entries(voting.results.optionResults).forEach(([option, result]) => {
      if (result.weight > maxWeight) {
        maxWeight = result.weight;
        winningOption = option;
      }
    });
    
    voting.results.winningOption = winningOption;
    
    // Calculate confidence based on vote distribution
    const totalWeight = Object.values(voting.results.optionResults)
      .reduce((sum, result) => sum + result.weight, 0);
    
    voting.results.confidence = totalWeight > 0 ? (maxWeight / totalWeight) * 100 : 0;
    
    // Check consensus (>60% agreement)
    voting.results.consensusReached = voting.results.confidence > 60;
    voting.consensus = voting.results.consensusReached;
    
    // Record final results on blockchain
    this.recordTransaction({
      id: `vote_finalize_${votingId}`,
      type: 'verification_completed',
      reportId: voting.reportId,
      userId: 'system_voting',
      data: {
        votingId,
        results: voting.results,
        consensus: voting.consensus
      }
    });
    
    return voting.results;
  }

  private updateCitizenReputations() {
    // Update reputation scores based on blockchain activity
    this.citizenReputations.forEach((reputation, userId) => {
      // This would analyze user's contribution to transparency
      const userTransactions = this.getAllUserTransactions(userId);
      const participationBonus = this.calculateParticipationBonus(userId);
      const accuracyBonus = this.calculateAccuracyBonus(userId);
      
      reputation.participationScore = userTransactions.length;
      reputation.reputationScore += participationBonus + accuracyBonus;
      reputation.reputationScore = Math.min(reputation.reputationScore, 1000); // Cap at 1000
      reputation.lastUpdated = new Date();
      
      // Update trust level
      if (reputation.reputationScore >= 800) reputation.trustLevel = 'diamond';
      else if (reputation.reputationScore >= 600) reputation.trustLevel = 'platinum';
      else if (reputation.reputationScore >= 400) reputation.trustLevel = 'gold';
      else if (reputation.reputationScore >= 200) reputation.trustLevel = 'silver';
      else reputation.trustLevel = 'bronze';
    });
  }

  private getAllUserTransactions(userId: string): CivicTransaction[] {
    const userTransactions: CivicTransaction[] = [];
    
    this.blockchain.forEach(block => {
      if (block.data.transactions) {
        block.data.transactions.forEach((tx: CivicTransaction) => {
          if (tx.userId === userId) {
            userTransactions.push(tx);
          }
        });
      }
    });
    
    return userTransactions;
  }

  private calculateParticipationBonus(userId: string): number {
    const transactions = this.getAllUserTransactions(userId);
    const recentTransactions = transactions.filter(tx => 
      new Date().getTime() - tx.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000 // Last 30 days
    );
    
    return Math.min(recentTransactions.length * 2, 20); // Max 20 points for participation
  }

  private calculateAccuracyBonus(userId: string): number {
    // This would calculate based on report accuracy and community feedback
    // For now, return a small bonus
    return Math.floor(Math.random() * 5);
  }

  public getTransparencyReport(reportId: string): TransparencyAudit | null {
    return this.auditTrails.get(reportId) || null;
  }

  public verifyReportIntegrity(reportId: string): {
    isValid: boolean;
    verificationScore: number;
    issues: string[];
  } {
    const audit = this.auditTrails.get(reportId);
    const issues: string[] = [];
    let verificationScore = 100;
    
    if (!audit) {
      return { isValid: false, verificationScore: 0, issues: ['No audit trail found'] };
    }
    
    // Check hash integrity
    audit.auditTrail.forEach(entry => {
      if (!entry.verified) {
        issues.push(`Unverified entry: ${entry.action}`);
        verificationScore -= 10;
      }
      
      if (!this.verifyEntryHash(entry)) {
        issues.push(`Hash mismatch for entry: ${entry.id}`);
        verificationScore -= 20;
      }
    });
    
    // Check stakeholder signatures
    if (audit.stakeholderSignatures.length === 0) {
      issues.push('No stakeholder signatures found');
      verificationScore -= 15;
    }
    
    const unverifiedSignatures = audit.stakeholderSignatures.filter(sig => !sig.verified);
    if (unverifiedSignatures.length > 0) {
      issues.push(`${unverifiedSignatures.length} unverified signatures`);
      verificationScore -= unverifiedSignatures.length * 5;
    }
    
    verificationScore = Math.max(verificationScore, 0);
    
    return {
      isValid: verificationScore >= 70,
      verificationScore,
      issues
    };
  }

  private verifyEntryHash(entry: AuditEntry): boolean {
    const calculatedHash = this.hashFunction(JSON.stringify({
      id: entry.id,
      action: entry.action,
      actor: entry.actor,
      timestamp: entry.timestamp,
      newState: entry.newState
    }));
    
    return calculatedHash === entry.hash;
  }

  public getBlockchainStats() {
    const totalBlocks = this.blockchain.length;
    const totalTransactions = this.blockchain.reduce((sum, block) => {
      return sum + (block.data.transactions?.length || 0);
    }, 0);
    
    const auditTrails = Array.from(this.auditTrails.values());
    const averageImmutabilityScore = auditTrails.length > 0 ? 
      auditTrails.reduce((sum, audit) => sum + audit.immutabilityScore, 0) / auditTrails.length : 0;
    
    return {
      totalBlocks,
      totalTransactions,
      pendingTransactions: this.pendingTransactions.length,
      auditTrailsCount: auditTrails.length,
      averageImmutabilityScore,
      activeVotings: this.activeVotings.size,
      registeredCitizens: this.citizenReputations.size,
      smartContracts: this.smartContracts.size,
      networkHealth: this.calculateNetworkHealth()
    };
  }

  private calculateNetworkHealth(): number {
    let health = 100;
    
    // Deduct for pending transactions
    if (this.pendingTransactions.length > 100) health -= 20;
    else if (this.pendingTransactions.length > 50) health -= 10;
    
    // Deduct for unverified audit trails
    const auditTrails = Array.from(this.auditTrails.values());
    const unverifiedCount = auditTrails.filter(audit => audit.verificationStatus === 'pending').length;
    health -= Math.min(unverifiedCount * 2, 30);
    
    return Math.max(health, 0);
  }

  public addStakeholderSignature(reportId: string, stakeholder: string, role: StakeholderSignature['role'], signature: string) {
    const audit = this.auditTrails.get(reportId);
    if (!audit) return false;
    
    const stakeholderSignature: StakeholderSignature = {
      stakeholder,
      role,
      signature,
      timestamp: new Date(),
      publicKey: this.generatePublicKey(stakeholder),
      verified: this.verifySignature(signature, stakeholder)
    };
    
    audit.stakeholderSignatures.push(stakeholderSignature);
    audit.consensusLevel = this.calculateConsensusLevel(audit);
    
    // Record signature on blockchain
    this.recordTransaction({
      id: `signature_${Date.now()}_${stakeholder}`,
      type: 'verification_completed',
      reportId,
      userId: stakeholder,
      data: {
        action: 'stakeholder_signature_added',
        role,
        verified: stakeholderSignature.verified
      }
    });
    
    return true;
  }

  private generatePublicKey(stakeholder: string): string {
    return `pub_${this.hashFunction(stakeholder + '_public_key')}`;
  }

  private verifySignature(signature: string, stakeholder: string): boolean {
    // Simplified signature verification
    const expectedSignature = this.hashFunction(`${stakeholder}_signature_${Date.now()}`);
    return signature.length > 10; // Basic validation
  }

  public exportAuditReport(reportId: string): any {
    const audit = this.auditTrails.get(reportId);
    if (!audit) return null;
    
    return {
      reportId,
      auditTrail: audit.auditTrail,
      verificationStatus: audit.verificationStatus,
      stakeholderSignatures: audit.stakeholderSignatures,
      immutabilityScore: audit.immutabilityScore,
      consensusLevel: audit.consensusLevel,
      blockchainVerification: this.verifyReportIntegrity(reportId),
      exportedAt: new Date(),
      blockchainHash: this.blockchain[this.blockchain.length - 1].hash
    };
  }
}

export const blockchainService = new BlockchainTransparencyService();
export default blockchainService;