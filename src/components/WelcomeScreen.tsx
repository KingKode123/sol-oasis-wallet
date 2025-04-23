
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import useWalletStore from '@/store/walletStore';

const WelcomeScreen: React.FC = () => {
  const { setCurrentView } = useWalletStore();
  
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6 py-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold solana-gradient-text">SOL Oasis</h1>
        <p className="text-muted-foreground">Secure Solana Wallet for your crypto journey</p>
      </div>
      
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Welcome to SOL Oasis</CardTitle>
          <CardDescription>Your secure Solana wallet</CardDescription>
        </CardHeader>
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
      </Card>
    </div>
  );
};

export default WelcomeScreen;
