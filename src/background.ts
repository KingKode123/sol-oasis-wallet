
import { SolOasisWalletAdapter } from './utils/walletAdapter';

type MessageType = 
  | { type: 'connect', origin: string, title: string, icon?: string }
  | { type: 'disconnect', origin: string }
  | { type: 'getPublicKey' }
  | { type: 'signTransaction', transaction: any }
  | { type: 'signAllTransactions', transactions: any[] }
  | { type: 'signMessage', message: any }
  | { type: 'sendTransaction', transaction: any, options?: any };

type ResponseType = {
  success: boolean;
  data?: any;
  error?: string;
};

// Store adapters for each site
const siteAdapters = new Map<string, SolOasisWalletAdapter>();

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message: MessageType, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  const origin = sender.origin || '';
  let adapter = siteAdapters.get(origin);
  
  const handleRequest = async (): Promise<ResponseType> => {
    try {
      switch (message.type) {
        case 'connect': {
          if (!adapter) {
            adapter = new SolOasisWalletAdapter(
              message.origin, 
              message.title,
              message.icon
            );
            siteAdapters.set(origin, adapter);
          }
          
          await adapter.connect();
          return { success: true };
        }
        
        case 'disconnect': {
          if (adapter) {
            await adapter.disconnect();
            siteAdapters.delete(origin);
          }
          return { success: true };
        }
        
        case 'getPublicKey': {
          if (!adapter) {
            return { 
              success: false, 
              error: 'Not connected. Call connect() first.' 
            };
          }
          
          return { 
            success: true, 
            data: adapter.publicKey?.toBase58()
          };
        }
        
        case 'signTransaction': {
          if (!adapter) {
            return { 
              success: false, 
              error: 'Not connected. Call connect() first.' 
            };
          }
          
          const signedTx = await adapter.signTransaction(message.transaction);
          return { success: true, data: signedTx };
        }
        
        case 'signAllTransactions': {
          if (!adapter) {
            return { 
              success: false, 
              error: 'Not connected. Call connect() first.' 
            };
          }
          
          const signedTxs = await adapter.signAllTransactions(message.transactions);
          return { success: true, data: signedTxs };
        }
        
        case 'signMessage': {
          if (!adapter) {
            return { 
              success: false, 
              error: 'Not connected. Call connect() first.' 
            };
          }
          
          const signature = await adapter.signMessage(message.message);
          return { success: true, data: signature };
        }
        
        case 'sendTransaction': {
          if (!adapter) {
            return { 
              success: false, 
              error: 'Not connected. Call connect() first.' 
            };
          }
          
          const signature = await adapter.sendTransaction(
            message.transaction,
            null, // connection will be supplied by the adapter
            message.options
          );
          
          return { success: true, data: signature };
        }
        
        default:
          return { 
            success: false, 
            error: 'Unknown message type' 
          };
      }
    } catch (error) {
      console.error('Error handling wallet request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };
  
  // Handle request and send response
  handleRequest()
    .then(response => sendResponse(response))
    .catch(error => {
      console.error('Unhandled error in message handler:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    });
  
  // Return true to indicate that we will send a response asynchronously
  return true;
});

console.log('SOL Oasis wallet background script loaded');
