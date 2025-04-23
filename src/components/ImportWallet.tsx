
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import useWalletStore from '@/store/walletStore';

const ImportWallet: React.FC = () => {
  const { importWallet, error, isLoading } = useWalletStore();
  const { toast } = useToast();
  
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showError, setShowError] = useState('');
  
  const handleImport = async () => {
    // Validate inputs
    if (!mnemonic.trim()) {
      setShowError('Please enter your recovery phrase');
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
      await importWallet(mnemonic.trim(), password);
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
          <CardDescription>Enter your 12-word recovery phrase</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {(showError || error) && (
            <Alert variant="destructive">
              <AlertDescription>
                {showError || error}
              </AlertDescription>
            </Alert>
          )}
          
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
              I understand that I am responsible for storing my recovery phrase securely
            </Label>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-3">
          <Button 
            className="w-full" 
            onClick={handleImport}
            disabled={isLoading}
          >
            {isLoading ? 'Importing...' : 'Import Wallet'}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => useWalletStore.setState({ currentView: 'welcome' })}
            disabled={isLoading}
          >
            Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ImportWallet;
