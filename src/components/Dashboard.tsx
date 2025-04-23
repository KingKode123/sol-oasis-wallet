import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, ArrowDown, RefreshCw } from 'lucide-react';
import useWalletStore from '@/store/walletStore';

const Dashboard: React.FC = () => {
  const { 
    publicKey, 
    solBalance, 
    tokenBalances,
    network,
    refreshWallet,
    setCurrentView
  } = useWalletStore();
  
  useEffect(() => {
    // Refresh the wallet when dashboard is mounted
    refreshWallet();
  }, [refreshWallet]);
  
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
