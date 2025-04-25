
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRight, ExternalLink, Wallet, DollarSign, Info } from 'lucide-react';
import useWalletStore from '@/store/walletStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SendView: React.FC = () => {
  const { 
    solBalance, 
    network, 
    sendTransaction, 
    getExplorerUrl, 
    gasAccountPublicKey, 
    gasAccountBalance,
    isGasAccountEnabled
  } = useWalletStore();
  const { toast } = useToast();
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [useGasAccount, setUseGasAccount] = useState(isGasAccountEnabled);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const ESTIMATED_FEE = 0.000005; // Solana's typical transaction fee in SOL
  
  const validateTransaction = () => {
    if (!recipient) {
      setError('Recipient address is required');
      return false;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }
    
    if (parseFloat(amount) > solBalance) {
      setError('Insufficient balance');
      return false;
    }
    
    if (useGasAccount && gasAccountBalance < ESTIMATED_FEE) {
      setError('Gas account has insufficient balance for network fee');
      return false;
    }
    
    return true;
  };

  const handleInitiateSend = () => {
    setError('');
    if (validateTransaction()) {
      setShowConfirmDialog(true);
    }
  };
  
  const handleConfirmSend = async () => {
    setShowConfirmDialog(false);
    setError('');
    setTxSignature(null);
    setIsLoading(true);
    
    try {
      const signature = await sendTransaction(recipient, parseFloat(amount), memo || undefined, useGasAccount);
      
      setTxSignature(signature);
      
      toast({
        title: "Transaction sent",
        description: `${amount} SOL sent to ${recipient.substring(0, 8)}...`,
      });
      
      // Reset the form
      setAmount('');
      setMemo('');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      
      toast({
        title: "Transaction failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOpenExplorer = () => {
    if (txSignature) {
      const url = getExplorerUrl(txSignature);
      window.open(url, '_blank');
    }
  };
  
  const getTotalAmount = () => {
    const amountNum = parseFloat(amount) || 0;
    const fee = useGasAccount ? 0 : ESTIMATED_FEE;
    return (amountNum + fee).toFixed(6);
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold">Send SOL</h2>
        <p className="text-sm text-muted-foreground">
          Balance: {solBalance.toFixed(5)} SOL
        </p>
      </div>
      
      <Card>
        <CardContent className="pt-6 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          {txSignature && (
            <Alert>
              <AlertDescription className="flex flex-col gap-2">
                <p>Transaction submitted successfully!</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full flex items-center justify-center"
                  onClick={handleOpenExplorer}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View on Solscan
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="Enter Solana address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (SOL)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.000001"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="memo">Memo (Optional)</Label>
            <Input
              id="memo"
              placeholder="Add a note"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>
          
          {gasAccountPublicKey && (
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="use-gas-account"
                checked={useGasAccount}
                onCheckedChange={setUseGasAccount}
              />
              <div className="space-y-0.5">
                <Label htmlFor="use-gas-account" className="flex items-center">
                  <Wallet className="h-4 w-4 mr-1" />
                  Use gas account for fee
                </Label>
                <p className="text-xs text-muted-foreground">
                  Gas account balance: {gasAccountBalance.toFixed(5)} SOL
                </p>
              </div>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground pt-2">
            <p>Network Fee: ~{ESTIMATED_FEE} SOL</p>
            <p>Network: {network === 'mainnet-beta' ? 'Mainnet' : 
                          network === 'testnet' ? 'Testnet' : 'Devnet'}</p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleInitiateSend}
            disabled={isLoading}
            className="flex items-center"
          >
            {isLoading ? 'Sending...' : (
              <>
                Send SOL
                <ArrowRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Confirm Transaction
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <div className="border rounded-lg p-4 space-y-2 bg-muted/50">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-medium">{amount} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span>Network Fee:</span>
                  <span className="font-medium">
                    {useGasAccount ? (
                      <span className="text-green-600">Paid by gas account</span>
                    ) : (
                      `${ESTIMATED_FEE} SOL`
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>{getTotalAmount()} SOL</span>
                </div>
                <div className="pt-2 text-sm">
                  <div><strong>To:</strong> {recipient}</div>
                  {memo && <div><strong>Memo:</strong> {memo}</div>}
                  <div><strong>Network:</strong> {network}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Please review the transaction details before confirming
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSend}>Confirm Send</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SendView;
