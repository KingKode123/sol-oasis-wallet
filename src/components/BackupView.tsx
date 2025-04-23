
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Key, Copy } from 'lucide-react';
import useWalletStore from '@/store/walletStore';

const BackupView: React.FC = () => {
  const { mnemonic, setCurrentView, showSeedPhrase, setShowSeedPhrase, setSeedPhraseBackedUp } = useWalletStore();
  const { toast } = useToast();
  
  const [confirmed, setConfirmed] = useState(false);
  
  const handleCopy = () => {
    if (mnemonic) {
      navigator.clipboard.writeText(mnemonic);
      toast({
        title: "Seed phrase copied",
        description: "Your recovery phrase has been copied to the clipboard",
      });
    }
  };
  
  const handleContinue = () => {
    if (!confirmed) {
      toast({
        title: "Confirmation required",
        description: "You must confirm that you've saved your seed phrase",
        variant: "destructive"
      });
      return;
    }
    
    setSeedPhraseBackedUp(true);
    setCurrentView('dashboard');
    toast({
      title: "Wallet ready",
      description: "Your wallet has been set up successfully",
    });
  };
  
  return (
    <div className="flex flex-col items-center justify-center h-full py-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-yellow-500" />
            Backup Recovery Phrase
          </CardTitle>
          <CardDescription>
            Write down these 12 words in order and keep them safe
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Anyone with access to your recovery phrase can take your funds. Never share it with anyone.
            </AlertDescription>
          </Alert>
          
          {showSeedPhrase ? (
            <div className="bg-muted p-4 rounded-md grid grid-cols-3 gap-2 text-center">
              {mnemonic?.split(' ').map((word, i) => (
                <div key={i} className="flex items-center">
                  <span className="text-muted-foreground mr-1">{i + 1}.</span>
                  <span className="font-mono">{word}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4 py-8">
              <div className="text-muted-foreground text-center">
                <p>Your recovery phrase is hidden for security</p>
                <p className="text-sm mt-1">Click the button below to reveal</p>
              </div>
              <Button onClick={() => setShowSeedPhrase(true)}>
                Show Recovery Phrase
              </Button>
            </div>
          )}
          
          <div className="flex justify-center pt-2">
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!showSeedPhrase}>
              <Copy className="h-4 w-4 mr-1" />
              Copy to Clipboard
            </Button>
          </div>
          
          <div className="flex items-center space-x-2 pt-4">
            <Checkbox 
              id="confirm" 
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
            />
            <Label htmlFor="confirm" className="text-sm">
              I confirm that I have written down my recovery phrase and stored it in a secure location
            </Label>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-3">
          <Button 
            className="w-full" 
            onClick={handleContinue}
          >
            Continue to Wallet
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BackupView;
