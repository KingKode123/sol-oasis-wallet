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
import bs58 from 'bs58';

export type NetworkType = 'devnet' | 'testnet' | 'mainnet-beta';

export interface WalletState {
  mnemonic: string | null;
  publicKey: string | null;
  keypair: Keypair | null;
  encryptedMnemonic: string | null;
  isWalletInitialized: boolean;
  network: NetworkType;
  connection: Connection;
  
  gasAccountPublicKey: string | null;
  gasAccountKeypair: Keypair | null;
  isGasAccountEnabled: boolean;
  
  seedPhraseBackedUp: boolean;
  showSeedPhrase: boolean;
  
  solBalance: number;
  gasAccountBalance: number;
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
    gasAccount?: string;
  }>;
  isLoadingTransactions: boolean;
  
  isLoading: boolean;
  currentView: 'welcome' | 'create' | 'import' | 'dashboard' | 'send' | 'receive' | 'settings' | 'transactions' | 'backup' | 'gas-account';
  error: string | null;
  
  setNetwork: (network: NetworkType) => void;
  createWallet: (password: string) => Promise<void>;
  importWallet: (mnemonic: string, password: string) => Promise<void>;
  unlockWallet: (password: string) => Promise<boolean>;
  signOut: () => void;
  fetchSolBalance: () => Promise<void>;
  fetchTransactionHistory: () => Promise<void>;
  sendTransaction: (recipient: string, amount: number, memo?: string, useGasAccount?: boolean) => Promise<string>;
  refreshWallet: () => Promise<void>;
  setCurrentView: (view: WalletState['currentView']) => void;
  setSeedPhraseBackedUp: (value: boolean) => void;
  setShowSeedPhrase: (value: boolean) => void;
  getExplorerUrl: (signature: string) => string;
  
  importGasAccount: (mnemonicOrPrivateKey: string, password: string | null, isPrivateKey?: boolean) => Promise<void>;
  toggleGasAccount: (enabled: boolean) => void;
  fetchGasAccountBalance: () => Promise<void>;
}

const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
};

const generateMnemonic = (): string => {
  try {
    console.log('Generating new mnemonic...');
    
    const entropy = nacl.randomBytes(16);
    console.log('Generated random entropy:', bytesToHex(entropy));
    
    const wordlist = bip39.wordlists.english;
    
    const entropyBits = bytesToHex(entropy).split('').map(c => parseInt(c, 16).toString(2).padStart(4, '0')).join('');
    const checksumBits = entropyBits.length / 32;
    
    const hash = CryptoJS.SHA256(CryptoJS.enc.Hex.parse(bytesToHex(entropy)));
    const hashHex = hash.toString(CryptoJS.enc.Hex);
    const hashBytes = hexToBytes(hashHex);
    
    const checksumBinary = bytesToHex(hashBytes)
      .split('')
      .map(c => parseInt(c, 16).toString(2).padStart(4, '0'))
      .join('')
      .slice(0, checksumBits);
    
    const bits = entropyBits + checksumBinary;
    
    const chunks = bits.match(/(.{1,11})/g) || [];
    const words = chunks.map(binary => wordlist[parseInt(binary, 2)]);
    
    const mnemonic = words.join(' ');
    console.log('Generated mnemonic with', words.length, 'words');
    
    return mnemonic;
  } catch (error) {
    console.error('Failed to generate mnemonic:', error);
    throw new Error('Failed to generate mnemonic: ' + (error instanceof Error ? error.message : String(error)));
  }
};

const generateSimpleMnemonic = (): string => {
  try {
    console.log('Using simplified mnemonic generation...');
    const wordlist = bip39.wordlists.english;
    const words = [];
    
    for (let i = 0; i < 12; i++) {
      const randomIndex = Math.floor(Math.random() * wordlist.length);
      words.push(wordlist[randomIndex]);
    }
    
    return words.join(' ');
  } catch (error) {
    console.error('Failed to generate simple mnemonic:', error);
    throw new Error('Failed to generate simple mnemonic: ' + (error instanceof Error ? error.message : String(error)));
  }
};

const validateMnemonic = (mnemonic: string): boolean => {
  try {
    const wordlist = bip39.wordlists.english;
    const words = mnemonic.trim().split(/\s+/);
    return (words.length === 12 || words.length === 24) && words.every(word => wordlist.includes(word));
  } catch (error) {
    console.error('Mnemonic validation error:', error);
    return false;
  }
};

const getKeypairFromMnemonic = (mnemonic: string): Keypair => {
  try {
    console.log('Deriving keypair from mnemonic...');
    
    const seed = new Uint8Array(64);
    
    const encoder = new TextEncoder();
    const mnemonicBytes = encoder.encode(mnemonic);
    
    for (let i = 0; i < mnemonicBytes.length && i < seed.length; i++) {
      seed[i] = mnemonicBytes[i];
    }
    
    const hash = CryptoJS.SHA256(mnemonic);
    const hashHex = hash.toString(CryptoJS.enc.Hex);
    const hashBytes = hexToBytes(hashHex);
    
    for (let i = 0; i < hashBytes.length && i < seed.length; i++) {
      seed[i] = seed[i] ^ hashBytes[i];
    }
    
    try {
      const seedHex = bytesToHex(seed);
      const derived = derivePath("m/44'/501'/0'/0'", seedHex);
      
      console.log('Successfully derived keypair using derivePath');
      return Keypair.fromSeed(new Uint8Array(derived.key.slice(0, 32)));
    } catch (error) {
      console.error('Error using derivePath, falling back to direct seed:', error);
      
      return Keypair.fromSeed(seed.slice(0, 32));
    }
  } catch (error) {
    console.error('Failed to derive keypair:', error);
    throw new Error('Failed to derive keypair from mnemonic: ' + (error instanceof Error ? error.message : String(error)));
  }
};

const getKeypairFromPrivateKey = (privateKeyString: string): Keypair => {
  try {
    const privateKeyBytes = bs58.decode(privateKeyString);
    return Keypair.fromSecretKey(privateKeyBytes);
  } catch (error) {
    console.error('Failed to derive keypair from private key:', error);
    throw new Error('Invalid private key format');
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
  
  gasAccountPublicKey: null,
  gasAccountKeypair: null,
  isGasAccountEnabled: false,
  gasAccountBalance: 0,
  
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
      
      let mnemonic;
      try {
        mnemonic = generateMnemonic();
      } catch (e) {
        console.error('Primary mnemonic generation failed, trying backup method:', e);
        mnemonic = generateSimpleMnemonic();
      }
      
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
        currentView: 'backup',
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
    const { connection, publicKey, gasAccountPublicKey } = get();
    
    if (!publicKey) return;
    
    try {
      const balance = await connection.getBalance(new PublicKey(publicKey));
      set({ solBalance: balance / LAMPORTS_PER_SOL });
      
      if (gasAccountPublicKey) {
        await get().fetchGasAccountBalance();
      }
    } catch (error) {
      console.error('Error fetching SOL balance:', error);
    }
  },
  
  fetchGasAccountBalance: async () => {
    const { connection, gasAccountPublicKey } = get();
    
    if (!gasAccountPublicKey) return;
    
    try {
      const balance = await connection.getBalance(new PublicKey(gasAccountPublicKey));
      set({ gasAccountBalance: balance / LAMPORTS_PER_SOL });
    } catch (error) {
      console.error('Error fetching gas account SOL balance:', error);
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
  
  sendTransaction: async (recipient, amount, memo, useGasAccount = false) => {
    const { connection, publicKey, keypair, network, gasAccountKeypair, isGasAccountEnabled } = get();
    
    if (!publicKey || !keypair) {
      throw new Error('Wallet not initialized');
    }
    
    try {
      const recipientPubkey = new PublicKey(recipient);
      const lamports = amount * LAMPORTS_PER_SOL;
      
      const transaction = new Transaction();
      
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: recipientPubkey,
          lamports,
        })
      );
      
      if (memo) {
        // This would require memo program, simplified for now
      }
      
      const useGasPayer = useGasAccount && isGasAccountEnabled && gasAccountKeypair;
      
      let signature;
      if (useGasPayer && gasAccountKeypair) {
        transaction.feePayer = gasAccountKeypair.publicKey;
        
        transaction.sign(keypair, gasAccountKeypair);
        
        signature = await connection.sendRawTransaction(transaction.serialize());
      } else {
        transaction.feePayer = keypair.publicKey;
        
        signature = await connection.sendTransaction(transaction, [keypair]);
      }
      
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
        status: 'confirmed' as const,
        gasAccount: useGasPayer ? gasAccountKeypair?.publicKey.toBase58() : undefined
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
  },
  
  importGasAccount: async (mnemonicOrPrivateKey: string, password: string | null, isPrivateKey = false) => {
    set({ isLoading: true, error: null });
    try {
      let gasKeypair;
      
      if (isPrivateKey) {
        gasKeypair = getKeypairFromPrivateKey(mnemonicOrPrivateKey);
      } else {
        if (!validateMnemonic(mnemonicOrPrivateKey)) {
          throw new Error('Invalid mnemonic phrase');
        }
        
        const encryptedGasMnemonic = CryptoJS.AES.encrypt(mnemonicOrPrivateKey, password!).toString();
        gasKeypair = getKeypairFromMnemonic(mnemonicOrPrivateKey);
        
        // Only store encrypted mnemonic if using recovery phrase
        localStorage.setItem('soloasisGasAccount', encryptedGasMnemonic);
      }
      
      const gasPublicKey = gasKeypair.publicKey.toBase58();
      
      set({
        gasAccountPublicKey: gasPublicKey,
        gasAccountKeypair: gasKeypair,
        isGasAccountEnabled: true,
        isLoading: false
      });
      
      await get().fetchGasAccountBalance();
    } catch (error) {
      console.error('Error importing gas account:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to import gas account', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  toggleGasAccount: (enabled) => {
    set({ isGasAccountEnabled: enabled });
  }
}));

export default useWalletStore;
