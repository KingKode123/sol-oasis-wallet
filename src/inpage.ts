
class SolOasisWallet {
  private _requests: Map<string, { resolve: Function, reject: Function }> = new Map();
  private _connected: boolean = false;
  private _publicKey: string | null = null;
  
  constructor() {
    // Listen for responses from content script
    window.addEventListener('message', this._handleMessage.bind(this));
    console.log('SOL Oasis Wallet inpage script initialized');
  }
  
  private _handleMessage(event: MessageEvent) {
    if (
      event.source !== window || 
      !event.data || 
      event.data.channel !== 'soloasis_wallet_background'
    ) {
      return;
    }
    
    const { response } = event.data;
    const handler = this._requests.get(response.id);
    
    if (handler) {
      if (response.success) {
        handler.resolve(response.data);
      } else {
        handler.reject(new Error(response.error || 'Unknown error'));
      }
      this._requests.delete(response.id);
    }
  }
  
  private async _sendRequest(type: string, data: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      
      this._requests.set(id, { resolve, reject });
      
      window.postMessage({
        channel: 'soloasis_wallet',
        id,
        message: {
          type,
          ...data
        }
      }, '*');
      
      // Add timeout to prevent hanging requests
      setTimeout(() => {
        if (this._requests.has(id)) {
          this._requests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }
  
  async connect(): Promise<{ publicKey: string }> {
    if (this._connected && this._publicKey) {
      return { publicKey: this._publicKey };
    }
    
    await this._sendRequest('connect');
    this._connected = true;
    
    // Get public key after connecting
    this._publicKey = await this._sendRequest('getPublicKey');
    
    return { publicKey: this._publicKey! };
  }
  
  async disconnect(): Promise<void> {
    await this._sendRequest('disconnect');
    this._connected = false;
    this._publicKey = null;
  }
  
  get connected(): boolean {
    return this._connected;
  }
  
  get publicKey(): string | null {
    return this._publicKey;
  }
  
  async signTransaction(transaction: any): Promise<any> {
    if (!this._connected) {
      throw new Error('Wallet not connected');
    }
    
    return this._sendRequest('signTransaction', { transaction });
  }
  
  async signAllTransactions(transactions: any[]): Promise<any[]> {
    if (!this._connected) {
      throw new Error('Wallet not connected');
    }
    
    return this._sendRequest('signAllTransactions', { transactions });
  }
  
  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    if (!this._connected) {
      throw new Error('Wallet not connected');
    }
    
    return this._sendRequest('signMessage', { message: Array.from(message) });
  }
  
  async sendTransaction(transaction: any, options?: any): Promise<string> {
    if (!this._connected) {
      throw new Error('Wallet not connected');
    }
    
    return this._sendRequest('sendTransaction', { 
      transaction,
      options
    });
  }
}

// Inject the wallet instance into window
declare global {
  interface Window {
    soloasisWallet?: SolOasisWallet;
  }
}

window.soloasisWallet = new SolOasisWallet();

// Notify dApps that wallet is ready
window.dispatchEvent(new Event('soloasis_wallet_ready'));

console.log('SOL Oasis Wallet is available at window.soloasisWallet');
