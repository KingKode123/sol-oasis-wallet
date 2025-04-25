
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, ArrowDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useWalletStore from '@/store/walletStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

  // This function verifies if a transaction is a send or receive relative to the current user
  const verifyTransactionType = (tx: any) => {
    if (!publicKey) return tx.type;
    
    // Double check transaction type based on from/to addresses
    if (tx.from === publicKey && tx.to !== publicKey) {
      return 'send';
    } else if (tx.to === publicKey && tx.from !== publicKey) {
      return 'receive';
    }
    
    return tx.type; // Fallback to the original type
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount (SOL)</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx, index) => {
                  // Enforce correct transaction type
                  const actualType = verifyTransactionType(tx);
                  const isSend = actualType === 'send';
                  const displayAddress = isSend ? tx.to : tx.from;
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className={`rounded-full p-2 mr-2 ${
                            isSend ? 'bg-red-100' : 'bg-green-100'
                          }`}>
                            {isSend ? (
                              <Send className="h-4 w-4 text-red-600" />
                            ) : (
                              <ArrowDown className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <span>{isSend ? 'Sent' : 'Received'}</span>
                        </div>
                      </TableCell>
                      <TableCell className={`font-medium ${
                        isSend ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {isSend ? '-' : '+'}{tx.amount.toFixed(5)}
                      </TableCell>
                      <TableCell className="truncate max-w-[150px]">
                        {isSend 
                          ? `To: ${displayAddress?.substring(0, 4)}...${displayAddress?.substring(displayAddress.length - 4)}` 
                          : `From: ${displayAddress?.substring(0, 4)}...${displayAddress?.substring(displayAddress.length - 4)}`
                        }
                      </TableCell>
                      <TableCell>{formatDate(tx.timestamp)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 h-auto text-xs"
                          onClick={() => handleOpenExplorer(tx.signature)}
                        >
                          View on Solscan
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
