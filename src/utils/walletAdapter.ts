
import { 
  PublicKey, 
  Transaction, 
  VersionedTransaction, 
  SendOptions 
} from '@solana/web3.js';
import useWalletStore from '../store/walletStore';
import useDAppStore from '../store/dAppStore';
import { signMessage } from './cryptoUtils';

// Standard interface for wallet adapter
export interface WalletAdapter {
  publicKey: PublicKey | null;
  connecting: boolean;
  connected: boolean;
  
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
  sendTransaction(
    transaction: Transaction,
    connection: any,
    options?: SendOptions
  ): Promise<string>;
}

// Implementation of the adapter for our wallet
export class SolOasisWalletAdapter implements WalletAdapter {
  private _connecting: boolean = false;
  private _origin: string;
  private _title: string;
  private _icon?: string;
  
  constructor(origin: string, title: string, icon?: string) {
    this._origin = origin;
    this._title = title;
    this._icon = icon;
  }
  
  get publicKey(): PublicKey | null {
    const { publicKey } = useWalletStore.getState();
    return publicKey ? new PublicKey(publicKey) : null;
  }
  
  get connecting(): boolean {
    return this._connecting;
  }
  
  get connected(): boolean {
    const { isWalletInitialized } = useWalletStore.getState();
    const { isConnected } = useDAppStore.getState();
    return isWalletInitialized && isConnected(this._origin);
  }
  
  async connect(): Promise<void> {
    if (this.connected || this._connecting) return;
    
    try {
      this._connecting = true;
      
      const dAppStore = useDAppStore.getState();
      
      // Check if site is already approved
      const site = dAppStore.getSiteByOrigin(this._origin);
      if (site?.permissions.autoApprove) {
        return;
      }
      
      // Create connection request
      const requestId = dAppStore.addConnectionRequest({
        origin: this._origin,
        title: this._title,
        icon: this._icon
      });
      
      // Wait for user approval
      return new Promise((resolve, reject) => {
        // This would normally use messaging, but for simplicity
        // we'll just poll the store
        const checkInterval = setInterval(() => {
          const requests = useDAppStore.getState().connectionRequests;
          const request = requests.find(r => r.id === requestId);
          
          if (!request) {
            clearInterval(checkInterval);
            reject(new Error('Connection request not found'));
          } else if (request.state === 'approved') {
            clearInterval(checkInterval);
            resolve();
          } else if (request.state === 'rejected') {
            clearInterval(checkInterval);
            reject(new Error('Connection request rejected'));
          }
        }, 500);
      });
    } finally {
      this._connecting = false;
    }
  }
  
  async disconnect(): Promise<void> {
    const { disconnectSite } = useDAppStore.getState();
    disconnectSite(this._origin);
  }
  
  async signTransaction(transaction: Transaction): Promise<Transaction> {
    const { keypair } = useWalletStore.getState();
    const { addTransactionRequest, approveTransactionRequest } = useDAppStore.getState();
    
    if (!keypair) throw new Error('Wallet not connected');
    
    // Add transaction request
    const requestId = addTransactionRequest({
      origin: this._origin,
      title: this._title,
      icon: this._icon,
      transactions: [transaction]
    });
    
    // Wait for user approval
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const requests = useDAppStore.getState().transactionRequests;
        const request = requests.find(r => r.id === requestId);
        
        if (!request) {
          clearInterval(checkInterval);
          reject(new Error('Transaction request not found'));
        } else if (request.state === 'approved') {
          clearInterval(checkInterval);
          // Return the signed transaction
          resolve(transaction);
        } else if (request.state === 'rejected') {
          clearInterval(checkInterval);
          reject(new Error('Transaction request rejected'));
        }
      }, 500);
    });
  }
  
  async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    const { keypair } = useWalletStore.getState();
    const { addTransactionRequest } = useDAppStore.getState();
    
    if (!keypair) throw new Error('Wallet not connected');
    
    // Add transaction request
    const requestId = addTransactionRequest({
      origin: this._origin,
      title: this._title,
      icon: this._icon,
      transactions
    });
    
    // Wait for user approval
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const requests = useDAppStore.getState().transactionRequests;
        const request = requests.find(r => r.id === requestId);
        
        if (!request) {
          clearInterval(checkInterval);
          reject(new Error('Transaction request not found'));
        } else if (request.state === 'approved') {
          clearInterval(checkInterval);
          resolve(transactions);
        } else if (request.state === 'rejected') {
          clearInterval(checkInterval);
          reject(new Error('Transaction request rejected'));
        }
      }, 500);
    });
  }
  
  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    const { keypair } = useWalletStore.getState();
    const { addMessageSignRequest } = useDAppStore.getState();
    
    if (!keypair) throw new Error('Wallet not connected');
    
    // Add message sign request
    const requestId = addMessageSignRequest({
      origin: this._origin,
      title: this._title,
      icon: this._icon,
      message
    });
    
    // Wait for user approval
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const requests = useDAppStore.getState().messageSignRequests;
        const request = requests.find(r => r.id === requestId);
        
        if (!request) {
          clearInterval(checkInterval);
          reject(new Error('Message sign request not found'));
        } else if (request.state === 'approved') {
          clearInterval(checkInterval);
          // Return the signed message using our custom signMessage function
          const signedMessage = signMessage(useWalletStore.getState().keypair!, message);
          resolve(signedMessage);
        } else if (request.state === 'rejected') {
          clearInterval(checkInterval);
          reject(new Error('Message sign request rejected'));
        }
      }, 500);
    });
  }
  
  async sendTransaction(
    transaction: Transaction,
    connection: any,
    options?: any
  ): Promise<string> {
    const signedTransaction = await this.signTransaction(transaction);
    return connection.sendRawTransaction(signedTransaction.serialize(), options);
  }
}

// Create and provide a wallet adapter instance
export const createWalletAdapter = (origin: string, title: string, icon?: string): WalletAdapter => {
  return new SolOasisWalletAdapter(origin, title, icon);
};
