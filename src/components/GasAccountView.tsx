
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRight, Wallet } from 'lucide-react';
import useWalletStore from '@/store/walletStore';

const GasAccountView: React.FC = () => {
  const { 
    gasAccountPublicKey, 
    gasAccountBalance, 
    importGasAccount, 
    isGasAccountEnabled, 
    toggleGasAccount,
    network,
    getExplorerUrl
  } = useWalletStore();
  
  const { toast } = useToast();
  
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleImportGasAccount = async () => {
    setError('');
    
    if (!mnemonic) {
      setError('Recovery phrase is required');
      return;
    }
    
    if (!password) {
      setError('Password is required');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await importGasAccount(mnemonic, password);
      
      toast({
        title: "Gas account imported",
        description: "Your gas account has been successfully imported",
      });
      
      // Reset the form
      setMnemonic('');
      setPassword('');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      
      toast({
        title: "Failed to import gas account",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleToggleGasAccount = (enabled: boolean) => {
    toggleGasAccount(enabled);
    
    toast({
      title: enabled ? "Gas account enabled" : "Gas account disabled",
      description: enabled 
        ? "Transactions will now use the gas account to pay fees" 
        : "Transactions will now use the main account to pay fees",
    });
  };
  
  const handleOpenExplorer = () => {
    if (gasAccountPublicKey) {
      const baseUrl = network === 'mainnet-beta' 
        ? 'https://solscan.io'
        : `https://solscan.io/${network}`;
        
      const url = `${baseUrl}/account/${gasAccountPublicKey}`;
      window.open(url, '_blank');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold">Gas Account</h2>
        <p className="text-sm text-muted-foreground">
          Set up an account to pay for transaction fees
        </p>
      </div>
      
      {gasAccountPublicKey ? (
        // Show gas account details if already imported
        <Card>
          <CardHeader>
            <CardTitle>Gas Account</CardTitle>
            <CardDescription>This account will pay for transaction fees</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Address</Label>
              <div className="flex items-center justify-between">
                <p className="text-sm font-mono bg-muted p-2 rounded-md overflow-hidden text-ellipsis">
                  {gasAccountPublicKey}
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleOpenExplorer}
                >
                  View
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Balance</Label>
              <p className="text-xl font-bold">{gasAccountBalance.toFixed(5)} SOL</p>
              <p className="text-xs text-muted-foreground">
                Make sure to keep this account funded to pay for transaction fees
              </p>
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="use-gas-account"
                checked={isGasAccountEnabled}
                onCheckedChange={handleToggleGasAccount}
              />
              <Label htmlFor="use-gas-account">Use gas account for transaction fees</Label>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Show import form if no gas account
        <Card>
          <CardHeader>
            <CardTitle>Import Gas Account</CardTitle>
            <CardDescription>Import a wallet to use as a gas account</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="mnemonic">Recovery Phrase</Label>
              <Input
                id="mnemonic"
                placeholder="Enter your 12 or 24 word recovery phrase"
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                className="font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Wallet Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your wallet password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end">
            <Button
              onClick={handleImportGasAccount}
              disabled={isLoading}
              className="flex items-center"
            >
              {isLoading ? 'Importing...' : (
                <>
                  Import Gas Account
                  <ArrowRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default GasAccountView;
