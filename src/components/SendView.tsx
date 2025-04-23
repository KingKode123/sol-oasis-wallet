
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import useWalletStore from '@/store/walletStore';

const SendView: React.FC = () => {
  const { solBalance, network } = useWalletStore();
  const { toast } = useToast();
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSend = async () => {
    setError('');
    
    if (!recipient) {
      setError('Recipient address is required');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    
    if (parseFloat(amount) > solBalance) {
      setError('Insufficient balance');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate a transaction for demonstration
    setTimeout(() => {
      setIsLoading(false);
      
      toast({
        title: "Transaction sent",
        description: `${amount} SOL sent to ${recipient.substring(0, 8)}...`,
      });
      
      // Reset the form
      setRecipient('');
      setAmount('');
      setMemo('');
      
      // In a real implementation, we would send the transaction to the blockchain
    }, 1500);
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
          
          <div className="text-sm text-muted-foreground pt-2">
            <p>Network Fee: ~0.000005 SOL</p>
            <p>Network: {network === 'mainnet-beta' ? 'Mainnet' : 
                          network === 'testnet' ? 'Testnet' : 'Devnet'}</p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleSend}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send SOL'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SendView;
