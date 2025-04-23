
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Receive } from 'lucide-react';
import useWalletStore from '@/store/walletStore';

const TransactionsView: React.FC = () => {
  // In a real implementation, we would fetch transaction history from the blockchain
  // For demo purposes, we'll create some example transactions
  const exampleTransactions = [
    {
      signature: 'xyz123',
      timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
      amount: 0.05,
      type: 'receive' as const,
      from: '8gLCe...7Uj4K',
    },
    {
      signature: 'abc456',
      timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
      amount: 0.1,
      type: 'send' as const,
      to: '3eRTm...9qLz2',
    },
    {
      signature: 'def789',
      timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
      amount: 0.02,
      type: 'receive' as const,
      from: '5tYpQ...2vF8W',
    },
  ];
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold">Transaction History</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {exampleTransactions.length > 0 ? (
            <div className="divide-y">
              {exampleTransactions.map((tx, index) => (
                <div key={index} className="p-4 flex items-center space-x-3">
                  <div className={`rounded-full p-2 ${
                    tx.type === 'receive' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {tx.type === 'receive' ? (
                      <Receive className="h-5 w-5 text-green-600" />
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
                        {tx.type === 'receive' ? '+' : '-'}{tx.amount} SOL
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>
                        {tx.type === 'receive' 
                          ? `From: ${tx.from}` 
                          : `To: ${tx.to}`}
                      </span>
                      <span>{formatDate(tx.timestamp)}</span>
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
