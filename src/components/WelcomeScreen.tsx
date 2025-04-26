
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import useWalletStore from '@/store/walletStore';

const WelcomeScreen: React.FC = () => {
  const { setCurrentView, unlockWallet, encryptedMnemonic, error } = useWalletStore();
  const { toast } = useToast();
  
  const [password, setPassword] = useState('');
  const [showError, setShowError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasExistingWallet, setHasExistingWallet] = useState(false);
  
  // Check if there's an existing wallet
  useEffect(() => {
    const checkWallet = async () => {
      const hasWallet = Boolean(encryptedMnemonic || localStorage.getItem('soloasisWallet'));
      setHasExistingWallet(hasWallet);
    };
    
    checkWallet();
  }, [encryptedMnemonic]);
  
  const handleUnlock = async () => {
    if (!password) {
      setShowError('Please enter your password');
      return;
    }
    
    setIsLoading(true);
    setShowError('');
    
    try {
      const unlocked = await unlockWallet(password);
      if (unlocked) {
        // Save password to session storage (will be cleared when browser is closed)
        sessionStorage.setItem('soloasisWalletPassword', password);
        toast({
          title: "Wallet unlocked!",
          description: "Welcome back to SOL Oasis",
        });
      } else {
        setShowError('Invalid password');
        toast({
          title: "Error unlocking wallet",
          description: "Please check your password and try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to unlock wallet";
      setShowError(errorMessage);
      toast({
        title: "Error unlocking wallet",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6 py-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold solana-gradient-text">SOL Oasis</h1>
        <p className="text-muted-foreground">Secure Solana Wallet for your crypto journey</p>
      </div>
      
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Welcome to SOL Oasis</CardTitle>
          <CardDescription>
            {hasExistingWallet 
              ? "Unlock your existing wallet" 
              : "Your secure Solana wallet"}
          </CardDescription>
        </CardHeader>
        
        {hasExistingWallet ? (
          <>
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
                  placeholder="Enter your wallet password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUnlock();
                    }
                  }}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-3">
              <Button 
                className="w-full"
                onClick={handleUnlock}
                disabled={isLoading}
              >
                {isLoading ? 'Unlocking...' : 'Unlock Wallet'}
              </Button>
              
              <div className="flex justify-between w-full">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentView('create')}
                  className="text-sm"
                >
                  Create New
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentView('import')}
                  className="text-sm"
                >
                  Import Different
                </Button>
              </div>
            </CardFooter>
          </>
        ) : (
          <>
            <CardContent className="space-y-4">
              <p>Manage your SOL and SPL tokens with ease and security.</p>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-3">
              <Button 
                className="w-full"
                onClick={() => setCurrentView('create')}
              >
                Create New Wallet
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setCurrentView('import')}
              >
                Import Existing Wallet
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
};

export default WelcomeScreen;
