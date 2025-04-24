
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Wallet, Copy } from 'lucide-react';
import useWalletStore from '@/store/walletStore';

const GasAccountView: React.FC = () => {
  const { 
    gasAccountPublicKey, 
    gasAccountBalance, 
    importGasAccount, 
    isGasAccountEnabled, 
    toggleGasAccount,
    network
  } = useWalletStore();
  
  const { toast } = useToast();
  
  const [mnemonic, setMnemonic] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('mnemonic');
  
  const handleImportGasAccount = async () => {
    setError('');
    
    if (activeTab === 'mnemonic') {
      if (!mnemonic) {
        setError('Recovery phrase is required');
        return;
      }
      
      if (!password) {
        setError('Password is required');
        return;
      }
    } else {
      if (!privateKey) {
        setError('Private key is required');
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      if (activeTab === 'mnemonic') {
        await importGasAccount(mnemonic, password);
      } else {
        await importGasAccount(privateKey, null, true);
      }
      
      toast({
        title: "Gas account imported",
        description: "Your gas account has been successfully imported",
      });
      
      // Reset the form
      setMnemonic('');
      setPrivateKey('');
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
  
  const handleCopyAddress = () => {
    if (gasAccountPublicKey) {
      navigator.clipboard.writeText(gasAccountPublicKey);
      toast({
        title: "Address copied",
        description: "Gas account address copied to clipboard",
      });
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
        // Show gas account details and top-up option if already imported
        <Card>
          <CardHeader>
            <CardTitle>Gas Account</CardTitle>
            <CardDescription>This account will pay for transaction fees</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Address</Label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 font-mono bg-muted p-2 rounded-md overflow-hidden text-ellipsis">
                  {gasAccountPublicKey}
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleCopyAddress}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Copy this address to send SOL for gas fees
              </p>
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
                onCheckedChange={toggleGasAccount}
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
            
            <Tabs defaultValue="mnemonic" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mnemonic">Recovery Phrase</TabsTrigger>
                <TabsTrigger value="private-key">Private Key</TabsTrigger>
              </TabsList>
              
              <TabsContent value="mnemonic" className="space-y-4">
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
              </TabsContent>
              
              <TabsContent value="private-key" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="private-key">Private Key</Label>
                  <Input
                    id="private-key"
                    placeholder="Enter your private key"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Private key should be in base58 format
                  </p>
                </div>
              </TabsContent>
            </Tabs>
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

