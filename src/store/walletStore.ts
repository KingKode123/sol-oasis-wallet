
import { create } from 'zustand';
import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';
import * as bip39 from 'bip39';
import CryptoJS from 'crypto-js';

export type NetworkType = 'devnet' | 'testnet' | 'mainnet-beta';

export interface WalletState {
  // Wallet and connection
  mnemonic: string | null;
  publicKey: string | null;
  keypair: any | null; // We'll store the keypair in memory only when needed
  encryptedMnemonic: string | null;
  isWalletInitialized: boolean;
  network: NetworkType;
  connection: Connection;
  
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
  }>;
  
  // UI state
  isLoading: boolean;
  currentView: 'welcome' | 'create' | 'import' | 'dashboard' | 'send' | 'receive' | 'settings' | 'transactions';
  error: string | null;
  
  // Methods
  setNetwork: (network: NetworkType) => void;
  createWallet: (password: string) => Promise<void>;
  importWallet: (mnemonic: string, password: string) => Promise<void>;
  unlockWallet: (password: string) => Promise<boolean>;
  signOut: () => void;
  fetchSolBalance: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  setCurrentView: (view: WalletState['currentView']) => void;
}

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
  
  solBalance: 0,
  tokenBalances: [],
  
  transactions: [],
  
  isLoading: false,
  currentView: 'welcome',
  error: null,
  
  // Methods
  setNetwork: (network) => {
    const connection = new Connection(clusterApiUrl(network), 'confirmed');
    set({ network, connection });
    get().fetchSolBalance();
  },
  
  createWallet: async (password) => {
    set({ isLoading: true, error: null });
    try {
      // Generate mnemonic
      const mnemonic = bip39.generateMnemonic(128); // 12 words
      
      // Encrypt the mnemonic with the password
      const encryptedMnemonic = CryptoJS.AES.encrypt(mnemonic, password).toString();
      
      // In a full implementation, we would derive keypair from mnemonic
      // For now, we'll just store the mnemonic and public key
      // We need to implement proper keypair derivation
      
      // Simulating keypair for now - to be replaced with proper derivation
      const keypairSeed = CryptoJS.SHA256(mnemonic).toString();
      const publicKey = keypairSeed.slice(0, 44); // Just a placeholder
      
      // Set state
      set({
        mnemonic,
        encryptedMnemonic,
        publicKey,
        isWalletInitialized: true,
        currentView: 'dashboard',
        isLoading: false
      });
      
      // Save encrypted mnemonic to localStorage
      localStorage.setItem('soloasisWallet', encryptedMnemonic);
      
      // Fetch balance
      await get().fetchSolBalance();
    } catch (error) {
      console.error('Error creating wallet:', error);
      set({ error: 'Failed to create wallet', isLoading: false });
    }
  },
  
  importWallet: async (mnemonic, password) => {
    set({ isLoading: true, error: null });
    try {
      // Validate mnemonic
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }
      
      // Encrypt the mnemonic with the password
      const encryptedMnemonic = CryptoJS.AES.encrypt(mnemonic, password).toString();
      
      // Simulating keypair for now - to be replaced with proper derivation
      const keypairSeed = CryptoJS.SHA256(mnemonic).toString();
      const publicKey = keypairSeed.slice(0, 44); // Just a placeholder
      
      // Set state
      set({
        mnemonic,
        encryptedMnemonic,
        publicKey,
        isWalletInitialized: true,
        currentView: 'dashboard',
        isLoading: false
      });
      
      // Save encrypted mnemonic to localStorage
      localStorage.setItem('soloasisWallet', encryptedMnemonic);
      
      // Fetch balance
      await get().fetchSolBalance();
    } catch (error) {
      console.error('Error importing wallet:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to import wallet', 
        isLoading: false 
      });
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
      
      if (!mnemonic || !bip39.validateMnemonic(mnemonic)) {
        throw new Error('Invalid password');
      }
      
      // Simulating keypair for now - to be replaced with proper derivation
      const keypairSeed = CryptoJS.SHA256(mnemonic).toString();
      const publicKey = keypairSeed.slice(0, 44); // Just a placeholder
      
      // Set state
      set({
        mnemonic,
        encryptedMnemonic,
        publicKey,
        isWalletInitialized: true,
        currentView: 'dashboard',
        isLoading: false
      });
      
      // Fetch balance
      await get().fetchSolBalance();
      
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
      error: null
    });
  },
  
  fetchSolBalance: async () => {
    const { connection, publicKey } = get();
    
    if (!publicKey) return;
    
    try {
      // This is just a placeholder - in a real implementation, we would use the actual public key
      // const balance = await connection.getBalance(new PublicKey(publicKey));
      // set({ solBalance: balance / LAMPORTS_PER_SOL });
      
      // For demo purposes, we'll just set a random balance
      set({ solBalance: Math.random() * 10 });
    } catch (error) {
      console.error('Error fetching SOL balance:', error);
    }
  },
  
  refreshWallet: async () => {
    await get().fetchSolBalance();
    // We would also fetch token balances and transaction history here
  },
  
  setCurrentView: (view) => {
    set({ currentView: view });
  }
}));

export default useWalletStore;
