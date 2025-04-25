
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import useWalletStore from '@/store/walletStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ImportWallet: React.FC = () => {
  const { importWallet, error, isLoading } = useWalletStore();
  const { toast } = useToast();
  
  const [mnemonic, setMnemonic] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showError, setShowError] = useState('');
  
  const handleImport = async (importType: 'mnemonic' | 'privateKey') => {
    // Validate inputs
    if (importType === 'mnemonic' && !mnemonic.trim()) {
      setShowError('Please enter your recovery phrase');
      return;
    }
    
    if (importType === 'privateKey' && !privateKey.trim()) {
      setShowError('Please enter your private key');
      return;
    }
    
    if (password.length < 8) {
      setShowError('Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setShowError('Passwords do not match');
      return;
    }
    
    if (!termsAccepted) {
      setShowError('You must accept the terms of service');
      return;
    }
    
    setShowError('');
    
    try {
      if (importType === 'mnemonic') {
        await importWallet(mnemonic.trim(), password);
      } else {
        await importWallet(privateKey.trim(), password, true); // true flag indicates private key import
      }
      
      toast({
        title: "Wallet imported successfully!",
        description: "Your wallet is ready to use.",
      });
    } catch (err) {
      toast({
        title: "Error importing wallet",
        description: error || "An unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center h-full py-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Import Existing Wallet</CardTitle>
          <CardDescription>Import using recovery phrase or private key</CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="mnemonic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mnemonic">Recovery Phrase</TabsTrigger>
            <TabsTrigger value="privateKey">Private Key</TabsTrigger>
          </TabsList>
          
          <CardContent className="space-y-4 pt-4">
            {(showError || error) && (
              <Alert variant="destructive">
                <AlertDescription>
                  {showError || error}
                </AlertDescription>
              </Alert>
            )}
            
            <TabsContent value="mnemonic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mnemonic">Recovery Phrase</Label>
                <Textarea
                  id="mnemonic"
                  placeholder="Enter your 12-word recovery phrase"
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Separate each word with a space
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="privateKey" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="privateKey">Private Key</Label>
                <Input
                  id="privateKey"
                  type="text"
                  placeholder="Enter your private key"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your Base58 encoded private key
                </p>
              </div>
            </TabsContent>
            
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter a secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password" 
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="terms" 
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              />
              <Label htmlFor="terms" className="text-sm">
                I understand that I am responsible for storing my recovery details securely
              </Label>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-3">
            <Tabs.Context.Consumer>
              {(context) => (
                <Button 
                  className="w-full" 
                  onClick={() => handleImport(context?.value as 'mnemonic' | 'privateKey')}
                  disabled={isLoading}
                >
                  {isLoading ? 'Importing...' : 'Import Wallet'}
                </Button>
              )}
            </Tabs.Context.Consumer>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => useWalletStore.setState({ currentView: 'welcome' })}
              disabled={isLoading}
            >
              Back
            </Button>
          </CardFooter>
        </Tabs>
      </Card>
    </div>
  );
};

export default ImportWallet;
