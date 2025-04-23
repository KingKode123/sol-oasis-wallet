
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import useWalletStore from '@/store/walletStore';

const CreateWallet: React.FC = () => {
  const { createWallet, error, isLoading } = useWalletStore();
  const { toast } = useToast();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showError, setShowError] = useState('');
  
  const handleCreate = async () => {
    // Validate inputs
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
      await createWallet(password);
      toast({
        title: "Wallet created successfully!",
        description: "Your new wallet is ready to use.",
      });
    } catch (err) {
      console.error('Error in component:', err);
      toast({
        title: "Error creating wallet",
        description: error || "An unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center h-full py-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create a New Wallet</CardTitle>
          <CardDescription>Set a password to secure your wallet</CardDescription>
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
            <Label htmlFor="password">Password</Label>
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
              I understand that I am responsible for storing my password securely
            </Label>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-3">
          <Button 
            className="w-full" 
            onClick={handleCreate}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Wallet'}
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

export default CreateWallet;
