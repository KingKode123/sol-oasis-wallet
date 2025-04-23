
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, ArrowDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useWalletStore from '@/store/walletStore';

const TransactionsView: React.FC = () => {
  const { 
    transactions, 
    fetchTransactionHistory, 
    isLoadingTransactions,
    publicKey,
    getExplorerUrl
  } = useWalletStore();

  useEffect(() => {
    fetchTransactionHistory();
  }, [fetchTransactionHistory]);
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleOpenExplorer = (signature: string) => {
    const url = getExplorerUrl(signature);
    window.open(url, '_blank');
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold">Transaction History</h2>
      </div>
      
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {publicKey && `Showing transactions for ${publicKey.substring(0, 4)}...${publicKey.substring(publicKey.length - 4)}`}
        </p>
        <Button variant="outline" size="sm" onClick={() => fetchTransactionHistory()} disabled={isLoadingTransactions}>
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingTransactions ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingTransactions ? (
            <div className="text-center py-8">
              <p>Loading transactions...</p>
            </div>
          ) : transactions.length > 0 ? (
            <div className="divide-y">
              {transactions.map((tx, index) => (
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
                      <span className="truncate max-w-[150px]">
                        {tx.type === 'receive' 
                          ? `From: ${tx.from?.substring(0, 4)}...${tx.from?.substring(tx.from.length - 4)}` 
                          : `To: ${tx.to?.substring(0, 4)}...${tx.to?.substring(tx.to.length - 4)}`}
                      </span>
                      <span>{formatDate(tx.timestamp)}</span>
                    </div>
                    
                    <div className="mt-2">
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 h-auto text-xs"
                        onClick={() => handleOpenExplorer(tx.signature)}
                      >
                        View on Solscan
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No transactions found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsView;
