
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, File, Globe, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import useDAppStore, { TransactionRequest } from '@/store/dAppStore';
import useWalletStore from '@/store/walletStore';

interface TransactionRequestViewProps {
  request?: TransactionRequest;
}

const TransactionRequestView: React.FC<TransactionRequestViewProps> = ({ request }) => {
  const { approveTransactionRequest, rejectTransactionRequest } = useDAppStore();
  const { solBalance } = useWalletStore();
  const { toast } = useToast();
  const [isApproving, setIsApproving] = React.useState(false);
  
  const handleApprove = async () => {
    if (!request) return;
    
    try {
      setIsApproving(true);
      const signatures = await approveTransactionRequest(request.id);
      
      toast({
        title: "Transaction approved",
        description: `${signatures.length} transaction(s) successfully sent`
      });
    } catch (error) {
      console.error('Error approving transaction:', error);
      toast({
        title: "Transaction failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsApproving(false);
    }
  };
  
  const handleReject = () => {
    if (request) {
      rejectTransactionRequest(request.id);
      toast({
        title: "Transaction rejected",
        description: "You've rejected the transaction request"
      });
    }
  };
  
  if (!request) {
    return null;
  }
  
  return (
    <div className="p-4 max-w-md mx-auto">
      <Card className="border-2 border-yellow-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Transaction Request
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <span className="font-bold">{request.title}</span> is requesting to execute {request.transactions.length} transaction(s)
            </AlertDescription>
          </Alert>
          
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            {request.icon ? (
              <img 
                src={request.icon} 
                alt={request.title}
                className="w-10 h-10 rounded-full" 
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Globe className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="font-medium">{request.title}</p>
              <p className="text-xs text-muted-foreground">{request.origin}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="font-medium text-sm">Transaction Information:</p>
            <div className="bg-muted p-3 rounded-md text-sm">
              <div className="flex justify-between mb-1">
                <span>Network:</span>
                <span className="font-mono">{useWalletStore.getState().network}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Your balance:</span>
                <span className="font-mono">{solBalance.toFixed(5)} SOL</span>
              </div>
              <div className="flex justify-between">
                <span>Transactions:</span>
                <span className="font-mono">{request.transactions.length}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-center gap-1">
              <File className="h-4 w-4" />
              Always verify transaction details before approving
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleReject}
            className="flex items-center gap-1"
            disabled={isApproving}
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
          <Button 
            onClick={handleApprove}
            className="flex items-center gap-1"
            disabled={isApproving}
          >
            <CheckCircle className="h-4 w-4" />
            {isApproving ? "Approving..." : "Approve"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TransactionRequestView;
