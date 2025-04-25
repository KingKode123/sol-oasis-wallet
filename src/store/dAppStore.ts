
import { create } from 'zustand';
import { Transaction, VersionedTransaction } from '@solana/web3.js';
import useWalletStore from './walletStore';

export type ConnectionRequest = {
  id: string;
  origin: string;
  title: string;
  icon?: string;
  timestamp: number;
  state: 'pending' | 'approved' | 'rejected';
};

export type TransactionRequest = {
  id: string;
  origin: string;
  title: string;
  icon?: string;
  timestamp: number;
  transactions: (Transaction | VersionedTransaction)[];
  state: 'pending' | 'approved' | 'rejected';
};

export type MessageSignRequest = {
  id: string;
  origin: string;
  title: string;
  icon?: string;
  timestamp: number;
  message: Uint8Array;
  state: 'pending' | 'approved' | 'rejected';
};

export type ConnectedSite = {
  origin: string;
  title: string;
  icon?: string;
  connectedAt: number;
  permissions: {
    autoApprove: boolean;
  };
};

export interface DAppState {
  isEnabled: boolean;
  autoLock: boolean;
  connectionRequests: ConnectionRequest[];
  transactionRequests: TransactionRequest[];
  messageSignRequests: MessageSignRequest[];
  connectedSites: ConnectedSite[];
  currentConnectionRequest: ConnectionRequest | null;
  currentTransactionRequest: TransactionRequest | null;
  currentMessageSignRequest: MessageSignRequest | null;
  
  // Settings
  toggleEnabled: (enabled: boolean) => void;
  toggleAutoLock: (enabled: boolean) => void;
  
  // Connection management
  addConnectionRequest: (request: Omit<ConnectionRequest, 'id' | 'timestamp' | 'state'>) => string;
  approveConnectionRequest: (id: string) => void;
  rejectConnectionRequest: (id: string) => void;
  disconnectSite: (origin: string) => void;
  isConnected: (origin: string) => boolean;
  getSiteByOrigin: (origin: string) => ConnectedSite | undefined;
  updateSitePermissions: (origin: string, permissions: Partial<ConnectedSite['permissions']>) => void;
  
  // Transaction signing
  addTransactionRequest: (request: Omit<TransactionRequest, 'id' | 'timestamp' | 'state'>) => string;
  approveTransactionRequest: (id: string) => Promise<string[]>;
  rejectTransactionRequest: (id: string) => void;
  
  // Message signing
  addMessageSignRequest: (request: Omit<MessageSignRequest, 'id' | 'timestamp' | 'state'>) => string;
  approveMessageSignRequest: (id: string) => Promise<Uint8Array>;
  rejectMessageSignRequest: (id: string) => void;
  
  clearRequests: () => void;
}

const useDAppStore = create<DAppState>((set, get) => ({
  isEnabled: true,
  autoLock: true,
  connectionRequests: [],
  transactionRequests: [],
  messageSignRequests: [],
  connectedSites: [],
  currentConnectionRequest: null,
  currentTransactionRequest: null,
  currentMessageSignRequest: null,
  
  // Settings
  toggleEnabled: (enabled) => set({ isEnabled: enabled }),
  toggleAutoLock: (enabled) => set({ autoLock: enabled }),
  
  // Connection management
  addConnectionRequest: (request) => {
    const id = crypto.randomUUID();
    
    const newRequest: ConnectionRequest = {
      ...request,
      id,
      timestamp: Date.now(),
      state: 'pending'
    };
    
    set(state => ({
      connectionRequests: [newRequest, ...state.connectionRequests],
      currentConnectionRequest: newRequest
    }));
    
    return id;
  },
  
  approveConnectionRequest: (id) => {
    set(state => {
      const request = state.connectionRequests.find(r => r.id === id);
      if (!request) return state;
      
      const updatedRequests = state.connectionRequests.map(r => 
        r.id === id ? { ...r, state: 'approved' as const } : r
      );
      
      // Add to connected sites if not already connected
      const existingSite = state.connectedSites.find(s => s.origin === request.origin);
      let updatedSites = state.connectedSites;
      
      if (!existingSite) {
        updatedSites = [
          {
            origin: request.origin,
            title: request.title,
            icon: request.icon,
            connectedAt: Date.now(),
            permissions: {
              autoApprove: false
            }
          },
          ...state.connectedSites
        ];
      }
      
      return {
        connectionRequests: updatedRequests,
        connectedSites: updatedSites,
        currentConnectionRequest: null
      };
    });
  },
  
  rejectConnectionRequest: (id) => {
    set(state => ({
      connectionRequests: state.connectionRequests.map(r => 
        r.id === id ? { ...r, state: 'rejected' as const } : r
      ),
      currentConnectionRequest: null
    }));
  },
  
  disconnectSite: (origin) => {
    set(state => ({
      connectedSites: state.connectedSites.filter(s => s.origin !== origin)
    }));
  },
  
  isConnected: (origin) => {
    return get().connectedSites.some(s => s.origin === origin);
  },
  
  getSiteByOrigin: (origin) => {
    return get().connectedSites.find(s => s.origin === origin);
  },
  
  updateSitePermissions: (origin, permissions) => {
    set(state => ({
      connectedSites: state.connectedSites.map(s => 
        s.origin === origin 
          ? { ...s, permissions: { ...s.permissions, ...permissions } } 
          : s
      )
    }));
  },
  
  // Transaction signing
  addTransactionRequest: (request) => {
    const id = crypto.randomUUID();
    
    const newRequest: TransactionRequest = {
      ...request,
      id,
      timestamp: Date.now(),
      state: 'pending'
    };
    
    set(state => ({
      transactionRequests: [newRequest, ...state.transactionRequests],
      currentTransactionRequest: newRequest
    }));
    
    return id;
  },
  
  approveTransactionRequest: async (id) => {
    const request = get().transactionRequests.find(r => r.id === id);
    if (!request) throw new Error('Transaction request not found');
    
    const { keypair, connection } = useWalletStore.getState();
    if (!keypair) throw new Error('Wallet not unlocked');
    
    const signatures: string[] = [];
    
    // Sign and send all transactions
    try {
      for (const tx of request.transactions) {
        if (tx instanceof Transaction) {
          // Legacy transaction
          tx.feePayer = keypair.publicKey;
          tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          tx.sign(keypair);
          
          const signature = await connection.sendRawTransaction(tx.serialize());
          signatures.push(signature);
        } else {
          // Versioned transaction
          const signature = await connection.sendTransaction(tx);
          signatures.push(signature);
        }
      }
      
      set(state => ({
        transactionRequests: state.transactionRequests.map(r => 
          r.id === id ? { ...r, state: 'approved' as const } : r
        ),
        currentTransactionRequest: null
      }));
      
      return signatures;
    } catch (error) {
      console.error('Error approving transaction:', error);
      throw error;
    }
  },
  
  rejectTransactionRequest: (id) => {
    set(state => ({
      transactionRequests: state.transactionRequests.map(r => 
        r.id === id ? { ...r, state: 'rejected' as const } : r
      ),
      currentTransactionRequest: null
    }));
  },
  
  // Message signing
  addMessageSignRequest: (request) => {
    const id = crypto.randomUUID();
    
    const newRequest: MessageSignRequest = {
      ...request,
      id,
      timestamp: Date.now(),
      state: 'pending'
    };
    
    set(state => ({
      messageSignRequests: [newRequest, ...state.messageSignRequests],
      currentMessageSignRequest: newRequest
    }));
    
    return id;
  },
  
  approveMessageSignRequest: async (id) => {
    const request = get().messageSignRequests.find(r => r.id === id);
    if (!request) throw new Error('Message sign request not found');
    
    const { keypair } = useWalletStore.getState();
    if (!keypair) throw new Error('Wallet not unlocked');
    
    try {
      // Sign the message
      const signedMessage = keypair.sign(request.message);
      
      set(state => ({
        messageSignRequests: state.messageSignRequests.map(r => 
          r.id === id ? { ...r, state: 'approved' as const } : r
        ),
        currentMessageSignRequest: null
      }));
      
      return signedMessage;
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  },
  
  rejectMessageSignRequest: (id) => {
    set(state => ({
      messageSignRequests: state.messageSignRequests.map(r => 
        r.id === id ? { ...r, state: 'rejected' as const } : r
      ),
      currentMessageSignRequest: null
    }));
  },
  
  clearRequests: () => {
    set({
      connectionRequests: [],
      transactionRequests: [],
      messageSignRequests: [],
      currentConnectionRequest: null,
      currentTransactionRequest: null,
      currentMessageSignRequest: null
    });
  }
}));

export default useDAppStore;
