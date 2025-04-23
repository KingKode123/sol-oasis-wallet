
import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, ArrowDown, RefreshCw, Activity } from 'lucide-react';
import useWalletStore from '@/store/walletStore';

const Dashboard: React.FC = () => {
  const { 
    publicKey, 
    solBalance, 
    tokenBalances,
    network,
    refreshWallet,
    setCurrentView,
    transactions,
    isLoadingTransactions
  } = useWalletStore();
  
  useEffect(() => {
    // Refresh the wallet when dashboard is mounted
    refreshWallet();
  }, [refreshWallet]);
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  return (
    <div className="space-y-6">
      {/* Network Badge */}
      <div className="flex justify-center">
        <Badge variant="outline" className="text-xs">
          {network === 'mainnet-beta' ? 'Mainnet' : 
           network === 'testnet' ? 'Testnet' : 'Devnet'}
        </Badge>
      </div>
      
      {/* Address and Balance Card */}
      <Card>
        <CardContent className="pt-6 pb-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">My Address</p>
            <p className="font-mono text-sm bg-muted p-2 rounded-md overflow-x-auto">
              {publicKey || '0x...'}
            </p>
            
            <div className="pt-4 space-y-1">
              <p className="text-lg font-semibold solana-gradient-text">
                {solBalance.toFixed(5)} SOL
              </p>
              <Button variant="ghost" size="sm" onClick={() => refreshWallet()}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button onClick={() => setCurrentView('send')} className="flex-1 flex items-center justify-center">
          <Send className="h-4 w-4 mr-2" />
          Send
        </Button>
        <Button onClick={() => setCurrentView('receive')} className="flex-1 flex items-center justify-center">
          <ArrowDown className="h-4 w-4 mr-2" />
          Receive
        </Button>
        <Button onClick={() => setCurrentView('transactions')} className="flex-1 flex items-center justify-center">
          <Activity className="h-4 w-4 mr-2" />
          Activity
        </Button>
      </div>
      
      {/* Recent Activity */}
      <div className="pt-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Recent Activity</h3>
          <Button variant="link" size="sm" onClick={() => setCurrentView('transactions')}>
            View All
          </Button>
        </div>
        
        {isLoadingTransactions ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Loading transactions...</p>
          </div>
        ) : transactions.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {transactions.slice(0, 3).map((tx, index) => (
                  <div key={index} className="p-4 flex items-center space-x-3">
                    <div className={`rounded-full p-2 ${
                      tx.type === 'receive' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {tx.type === 'receive' ? (
                        <ArrowDown className="h-5 w-5 text-green-600" />
                      ) : (
                        <Send className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {tx.type === 'receive' ? 'Received' : 'Sent'} SOL
                        </span>
                        <span className={`${
                          tx.type === 'receive' ? 'text-green-600' : 'text-red-600'
                        } font-medium`}>
                          {tx.type === 'receive' ? '+' : '-'}{tx.amount.toFixed(5)} SOL
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>
                          {formatDate(tx.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No transactions yet</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Token Tabs */}
      <Tabs defaultValue="tokens">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="nfts">NFTs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tokens" className="space-y-4 mt-4">
          {tokenBalances.length > 0 ? (
            tokenBalances.map((token, index) => (
              <Card key={index}>
                <CardContent className="p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{token.symbol}</p>
                    <p className="text-sm text-muted-foreground">{token.balance} tokens</p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No tokens found</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="nfts">
          <div className="text-center py-8 text-muted-foreground">
            <p>No NFTs found</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
