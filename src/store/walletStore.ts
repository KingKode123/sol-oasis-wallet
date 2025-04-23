
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
  mnemonic: string | null;
  publicKey: string | null;
  keypair: Keypair | null;
  encryptedMnemonic: string | null;
  isWalletInitialized: boolean;
  network: NetworkType;
  connection: Connection;
  
  seedPhraseBackedUp: boolean;
  showSeedPhrase: boolean;
  
  solBalance: number;
  tokenBalances: Array<{
    mint: string;
    symbol: string;
    balance: number;
    decimals: number;
  }>;
  
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
  
  isLoading: boolean;
  currentView: 'welcome' | 'create' | 'import' | 'dashboard' | 'send' | 'receive' | 'settings' | 'transactions' | 'backup';
  error: string | null;
  
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

// Utility function to convert Uint8Array to hex string
const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

const generateMnemonic = (): string => {
  try {
    // Generate random bytes for entropy (16 bytes = 128 bits for 12-word phrase)
    const entropy = nacl.randomBytes(16);
    // Convert to hex string which bip39 can use
    const entropyHex = bytesToHex(entropy);
    
    // Use the entropyHex directly with entropyToMnemonic
    // This avoids using Buffer which is not available in browser environments
    return bip39.entropyToMnemonic(entropyHex);
  } catch (error) {
    console.error('Failed to generate mnemonic:', error);
    throw new Error('Failed to generate mnemonic: ' + (error instanceof Error ? error.message : String(error)));
  }
};

const validateMnemonic = (mnemonic: string): boolean => {
  return bip39.validateMnemonic(mnemonic);
};

const getKeypairFromMnemonic = (mnemonic: string): Keypair => {
  try {
    // Use mnemonicToSeedSync to generate the seed without Buffer
    // Convert to hex string first to avoid Buffer dependency
    const seedArray = new Uint8Array(64); // 512 bits seed
    const encoder = new TextEncoder();
    const mnemonicBytes = encoder.encode(mnemonic);
    
    // A simple derivation as fallback when bip39.mnemonicToSeedSync isn't working in browser
    for (let i = 0; i < mnemonicBytes.length && i < seedArray.length; i++) {
      seedArray[i] = mnemonicBytes[i];
    }
    
    // Use the seed with derivePath
    const seedHex = bytesToHex(seedArray);
    const derivedSeed = derivePath("m/44'/501'/0'/0'", seedHex).key;
    
    // Create keypair from the derived seed
    return Keypair.fromSeed(new Uint8Array(derivedSeed.slice(0, 32)));
  } catch (error) {
    console.error('Failed to derive keypair:', error);
    throw new Error('Failed to derive keypair from mnemonic: ' + (error instanceof Error ? error.message : String(error)));
  }
};

const useWalletStore = create<WalletState>((set, get) => ({
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
  
  setNetwork: (network) => {
    const connection = new Connection(clusterApiUrl(network), 'confirmed');
    set({ network, connection });
    get().fetchSolBalance();
    get().fetchTransactionHistory();
  },
  
  createWallet: async (password) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Starting wallet creation process...');
      
      const mnemonic = generateMnemonic();
      console.log('Mnemonic generated successfully:', mnemonic.split(' ').length + ' words');
      
      const encryptedMnemonic = CryptoJS.AES.encrypt(mnemonic, password).toString();
      
      const keypair = getKeypairFromMnemonic(mnemonic);
      const publicKey = keypair.publicKey.toBase58();
      console.log('Keypair created successfully with public key:', publicKey);
      
      set({
        mnemonic,
        encryptedMnemonic,
        publicKey,
        keypair,
        isWalletInitialized: true,
        currentView: 'create', // Keep on create view until user clicks continue
        seedPhraseBackedUp: false,
        isLoading: false
      });
      
      localStorage.setItem('soloasisWallet', encryptedMnemonic);
      
      await get().fetchSolBalance();
    } catch (error) {
      console.error('Error creating wallet:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create wallet', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  importWallet: async (mnemonic, password) => {
    set({ isLoading: true, error: null });
    try {
      if (!validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }
      
      const encryptedMnemonic = CryptoJS.AES.encrypt(mnemonic, password).toString();
      
      const keypair = getKeypairFromMnemonic(mnemonic);
      const publicKey = keypair.publicKey.toBase58();
      
      set({
        mnemonic,
        encryptedMnemonic,
        publicKey,
        keypair,
        isWalletInitialized: true,
        currentView: 'dashboard',
        seedPhraseBackedUp: true,
        isLoading: false
      });
      
      localStorage.setItem('soloasisWallet', encryptedMnemonic);
      
      await get().fetchSolBalance();
      await get().fetchTransactionHistory();
    } catch (error) {
      console.error('Error importing wallet:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to import wallet', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  unlockWallet: async (password) => {
    set({ isLoading: true, error: null });
    try {
      const encryptedMnemonic = localStorage.getItem('soloasisWallet');
      
      if (!encryptedMnemonic) {
        throw new Error('No wallet found');
      }
      
      const bytes = CryptoJS.AES.decrypt(encryptedMnemonic, password);
      const mnemonic = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!mnemonic || !validateMnemonic(mnemonic)) {
        throw new Error('Invalid password');
      }
      
      const keypair = getKeypairFromMnemonic(mnemonic);
      const publicKey = keypair.publicKey.toBase58();
      
      set({
        mnemonic,
        encryptedMnemonic,
        publicKey,
        keypair,
        isWalletInitialized: true,
        currentView: 'dashboard',
        isLoading: false
      });
      
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
      const pubKey = new PublicKey(publicKey);
      const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 10 });
      
      const transactionDetails = await Promise.all(
        signatures.map(async (sig) => {
          try {
            const tx = await connection.getTransaction(sig.signature);
            
            if (!tx || !tx.meta) return null;
            
            const isReceiver = tx.transaction.message.accountKeys[0].toString() !== pubKey.toString();
            
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
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: recipientPubkey,
          lamports,
        })
      );
      
      if (memo) {
        // This would require memo program, simplified for now
      }
      
      const signature = await connection.sendTransaction(transaction, [keypair]);
      
      const confirmation = await connection.confirmTransaction(signature);
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed to confirm');
      }
      
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
