import { create } from 'zustand';
import { 
  Connection, 
  PublicKey, 
  LAMPORTS_PER_SOL, 
  clusterApiUrl, 
  SystemProgram,
  Transaction,
  SendTransactionError,
  Keypair
} from '@solana/web3.js';
import * as bip39 from 'bip39';
import CryptoJS from 'crypto-js';
import * as nacl from 'tweetnacl';
import { derivePath } from 'ed25519-hd-key';

export type NetworkType = 'devnet' | 'testnet' | 'mainnet-beta';

export interface WalletState {
  // Wallet and connection
  mnemonic: string | null;
  publicKey: string | null;
  keypair: Keypair | null;
  encryptedMnemonic: string | null;
  isWalletInitialized: boolean;
  network: NetworkType;
  connection: Connection;
  
  // Seed phrase backup
  seedPhraseBackedUp: boolean;
  showSeedPhrase: boolean;
  
  // Balances
  solBalance: number;
  tokenBalances: Array<{
    mint: string;
    symbol: string;
    balance: number;
    decimals: number;
  }>;
  
  // Transactions
  transactions: Array<{
    signature: string;
    timestamp: number;
    amount: number;
    type: 'send' | 'receive';
    to?: string;
    from?: string;
    token?: string;
    status?: 'confirmed' | 'processing' | 'failed';
  }>;
  isLoadingTransactions: boolean;
  
  // UI state
  isLoading: boolean;
  currentView: 'welcome' | 'create' | 'import' | 'dashboard' | 'send' | 'receive' | 'settings' | 'transactions' | 'backup';
  error: string | null;
  
  // Methods
  setNetwork: (network: NetworkType) => void;
  createWallet: (password: string) => Promise<void>;
  importWallet: (mnemonic: string, password: string) => Promise<void>;
  unlockWallet: (password: string) => Promise<boolean>;
  signOut: () => void;
  fetchSolBalance: () => Promise<void>;
  fetchTransactionHistory: () => Promise<void>;
  sendTransaction: (recipient: string, amount: number, memo?: string) => Promise<string>;
  refreshWallet: () => Promise<void>;
  setCurrentView: (view: WalletState['currentView']) => void;
  setSeedPhraseBackedUp: (value: boolean) => void;
  setShowSeedPhrase: (value: boolean) => void;
  getExplorerUrl: (signature: string) => string;
}

// Completely browser-compatible mnemonic generation
const generateMnemonic = (): string => {
  try {
    // Use crypto.getRandomValues which is browser-compatible
    const entropy = new Uint8Array(16); // 16 bytes = 128 bits for 12-word mnemonic
    window.crypto.getRandomValues(entropy);
    
    // Generate mnemonic directly using bip39
    return bip39.entropyToMnemonic(Array.from(entropy)
      .map(b => b.toString(16).padStart(2, '0'))
      .join(''));
  } catch (error) {
    console.error('Failed to generate mnemonic:', error);
    throw new Error('Failed to generate mnemonic');
  }
};

// Utility function to validate mnemonic
const validateMnemonic = (mnemonic: string): boolean => {
  return bip39.validateMnemonic(mnemonic);
};

// Function to derive keypair from mnemonic - FIXED IMPLEMENTATION
const getKeypairFromMnemonic = (mnemonic: string): Keypair => {
  try {
    // Generate seed from mnemonic
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    
    // Use derivePath from ed25519-hd-key
    const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key;
    
    // Create keypair from derived seed
    return Keypair.fromSeed(Uint8Array.from(derivedSeed));
  } catch (error) {
    console.error('Failed to derive keypair:', error);
    throw new Error('Failed to derive keypair from mnemonic');
  }
};

// Create the store
const useWalletStore = create<WalletState>((set, get) => ({
  // Initial state
  mnemonic: null,
  publicKey: null,
  keypair: null,
  encryptedMnemonic: null,
  isWalletInitialized: false,
  network: 'devnet',
  connection: new Connection(clusterApiUrl('devnet'), 'confirmed'),
  
  seedPhraseBackedUp: false,
  showSeedPhrase: false,
  
  solBalance: 0,
  tokenBalances: [],
  
  transactions: [],
  isLoadingTransactions: false,
  
  isLoading: false,
  currentView: 'welcome',
  error: null,
  
  // Methods
  setNetwork: (network) => {
    const connection = new Connection(clusterApiUrl(network), 'confirmed');
    set({ network, connection });
    get().fetchSolBalance();
    get().fetchTransactionHistory();
  },
  
  createWallet: async (password) => {
    set({ isLoading: true, error: null });
    try {
      // Generate mnemonic using our browser-compatible function
      const mnemonic = generateMnemonic();
      
      // Encrypt the mnemonic with the password
      const encryptedMnemonic = CryptoJS.AES.encrypt(mnemonic, password).toString();
      
      // Generate a real keypair from the mnemonic
      const keypair = getKeypairFromMnemonic(mnemonic);
      const publicKey = keypair.publicKey.toBase58();
      
      // Set state
      set({
        mnemonic,
        encryptedMnemonic,
        publicKey,
        keypair,
        isWalletInitialized: true,
        currentView: 'backup', // Changed from dashboard to backup
        seedPhraseBackedUp: false,
        isLoading: false
      });
      
      // Save encrypted mnemonic to localStorage
      localStorage.setItem('soloasisWallet', encryptedMnemonic);
      
      // Fetch balance
      await get().fetchSolBalance();
    } catch (error) {
      console.error('Error creating wallet:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create wallet', 
        isLoading: false 
      });
      throw error; // Rethrow to handle in the UI
    }
  },
  
  importWallet: async (mnemonic, password) => {
    set({ isLoading: true, error: null });
    try {
      // Validate mnemonic using our browser-compatible function
      if (!validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }
      
      // Encrypt the mnemonic with the password
      const encryptedMnemonic = CryptoJS.AES.encrypt(mnemonic, password).toString();
      
      // Generate a real keypair from the mnemonic
      const keypair = getKeypairFromMnemonic(mnemonic);
      const publicKey = keypair.publicKey.toBase58();
      
      // Set state
      set({
        mnemonic,
        encryptedMnemonic,
        publicKey,
        keypair,
        isWalletInitialized: true,
        currentView: 'dashboard',
        seedPhraseBackedUp: true,  // Assuming user knows their mnemonic when importing
        isLoading: false
      });
      
      // Save encrypted mnemonic to localStorage
      localStorage.setItem('soloasisWallet', encryptedMnemonic);
      
      // Fetch balance and transactions
      await get().fetchSolBalance();
      await get().fetchTransactionHistory();
    } catch (error) {
      console.error('Error importing wallet:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to import wallet', 
        isLoading: false 
      });
      throw error; // Rethrow to handle in the UI
    }
  },
  
  unlockWallet: async (password) => {
    set({ isLoading: true, error: null });
    try {
      const encryptedMnemonic = localStorage.getItem('soloasisWallet');
      
      if (!encryptedMnemonic) {
        throw new Error('No wallet found');
      }
      
      // Decrypt the mnemonic with the password
      const bytes = CryptoJS.AES.decrypt(encryptedMnemonic, password);
      const mnemonic = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!mnemonic || !validateMnemonic(mnemonic)) {
        throw new Error('Invalid password');
      }
      
      // Generate a real keypair from the mnemonic
      const keypair = getKeypairFromMnemonic(mnemonic);
      const publicKey = keypair.publicKey.toBase58();
      
      // Set state
      set({
        mnemonic,
        encryptedMnemonic,
        publicKey,
        keypair,
        isWalletInitialized: true,
        currentView: 'dashboard',
        isLoading: false
      });
      
      // Fetch balance and transactions
      await get().fetchSolBalance();
      await get().fetchTransactionHistory();
      
      return true;
    } catch (error) {
      console.error('Error unlocking wallet:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to unlock wallet', 
        isLoading: false 
      });
      return false;
    }
  },
  
  signOut: () => {
    set({
      mnemonic: null,
      publicKey: null,
      keypair: null,
      isWalletInitialized: false,
      currentView: 'welcome',
      error: null,
      transactions: []
    });
  },
  
  fetchSolBalance: async () => {
    const { connection, publicKey } = get();
    
    if (!publicKey) return;
    
    try {
      // This is a real balance fetch using the Solana connection
      const balance = await connection.getBalance(new PublicKey(publicKey));
      set({ solBalance: balance / LAMPORTS_PER_SOL });
    } catch (error) {
      console.error('Error fetching SOL balance:', error);
    }
  },
  
  fetchTransactionHistory: async () => {
    const { connection, publicKey, network } = get();
    
    if (!publicKey) return;
    
    set({ isLoadingTransactions: true });
    
    try {
      // Fetch transaction signatures for the account
      const pubKey = new PublicKey(publicKey);
      const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 10 });
      
      // Process each transaction to get details
      const transactionDetails = await Promise.all(
        signatures.map(async (sig) => {
          try {
            const tx = await connection.getTransaction(sig.signature);
            
            if (!tx || !tx.meta) return null;
            
            // Determine if this account is sender or receiver
            const isReceiver = tx.transaction.message.accountKeys[0].toString() !== pubKey.toString();
            
            // Calculate amount (simplified - assumes simple SOL transfers)
            const amount = Math.abs(tx.meta.postBalances[0] - tx.meta.preBalances[0]) / LAMPORTS_PER_SOL;
            
            return {
              signature: sig.signature,
              timestamp: tx.blockTime ? tx.blockTime * 1000 : Date.now(),
              amount,
              type: isReceiver ? 'receive' : 'send',
              to: isReceiver ? pubKey.toString() : tx.transaction.message.accountKeys[1]?.toString(),
              from: isReceiver ? tx.transaction.message.accountKeys[0]?.toString() : pubKey.toString(),
              status: 'confirmed',
            };
          } catch (error) {
            console.error('Error parsing transaction:', error);
            return null;
          }
        })
      );
      
      // Filter out null values and set to state
      const validTransactions = transactionDetails.filter(tx => tx !== null) as WalletState['transactions'];
      set({ transactions: validTransactions, isLoadingTransactions: false });
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      set({ isLoadingTransactions: false });
    }
  },
  
  sendTransaction: async (recipient, amount, memo) => {
    const { connection, publicKey, keypair, network } = get();
    
    if (!publicKey || !keypair) {
      throw new Error('Wallet not initialized');
    }
    
    try {
      const recipientPubkey = new PublicKey(recipient);
      const lamports = amount * LAMPORTS_PER_SOL;
      
      // Create a simple transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: recipientPubkey,
          lamports,
        })
      );
      
      // Add memo if provided
      if (memo) {
        // This would require memo program, simplified for now
      }
      
      // Send the transaction
      const signature = await connection.sendTransaction(transaction, [keypair]);
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature);
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed to confirm');
      }
      
      // Add to local transaction history
      const newTransaction = {
        signature,
        timestamp: Date.now(),
        amount,
        type: 'send' as const,
        to: recipient,
        from: publicKey,
        status: 'confirmed' as const
      };
      
      set(state => ({
        transactions: [newTransaction, ...state.transactions]
      }));
      
      // Refresh balance
      await get().fetchSolBalance();
      
      return signature;
    } catch (error) {
      console.error('Error sending transaction:', error);
      if (error instanceof SendTransactionError) {
        throw new Error(`Transaction failed: ${error.message}`);
      }
      throw error;
    }
  },
  
  refreshWallet: async () => {
    await get().fetchSolBalance();
    await get().fetchTransactionHistory();
  },
  
  setSeedPhraseBackedUp: (value) => {
    set({ seedPhraseBackedUp: value });
  },
  
  setShowSeedPhrase: (value) => {
    set({ showSeedPhrase: value });
  },
  
  setCurrentView: (view) => {
    set({ currentView: view });
  },
  
  getExplorerUrl: (signature) => {
    const { network } = get();
    const baseUrl = network === 'mainnet-beta' 
      ? 'https://solscan.io'
      : `https://solscan.io/${network}`;
      
    return `${baseUrl}/tx/${signature}`;
  }
}));

export default useWalletStore;
