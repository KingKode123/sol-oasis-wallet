
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Wallet, Settings, Shield } from 'lucide-react';
import useWalletStore, { NetworkType } from '@/store/walletStore';
import useDAppStore from '@/store/dAppStore';

const SettingsView: React.FC = () => {
  const { network, setNetwork, signOut, setCurrentView, gasAccountPublicKey } = useWalletStore();
  const { isEnabled, toggleEnabled, autoLock, toggleAutoLock } = useDAppStore();
  const { toast } = useToast();
  
  const handleNetworkChange = (value: NetworkType) => {
    setNetwork(value);
    toast({
      title: "Network changed",
      description: `Connected to ${value === 'mainnet-beta' ? 'Mainnet' : 
                    value === 'testnet' ? 'Testnet' : 'Devnet'}`,
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold">Settings</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Network</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={network}
            onValueChange={(value) => handleNetworkChange(value as NetworkType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select network" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="devnet">Devnet</SelectItem>
              <SelectItem value="testnet">Testnet</SelectItem>
              <SelectItem value="mainnet-beta">Mainnet</SelectItem>
            </SelectContent>
          </Select>
          
          <p className="text-xs text-muted-foreground">
            Warning: Switching networks will change your connected blockchain environment.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Gas Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm">
              {gasAccountPublicKey 
                ? "Manage your gas account for transaction fees" 
                : "Set up a gas account to pay for transaction fees"}
            </p>
            
            <Button
              variant="outline"
              className="flex items-center"
              onClick={() => setCurrentView('gas-account')}
            >
              <Wallet className="mr-2 h-4 w-4" />
              {gasAccountPublicKey ? "Manage Gas Account" : "Set Up Gas Account"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            dApp Connections
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dapp-connections">Allow dApp connections</Label>
              <p className="text-xs text-muted-foreground">Allow connections from decentralized applications</p>
            </div>
            <Switch 
              id="dapp-connections" 
              checked={isEnabled}
              onCheckedChange={toggleEnabled}
            />
          </div>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setCurrentView('dapp-connections')}
          >
            Manage Connected dApps
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-lock">Auto-lock wallet</Label>
              <p className="text-xs text-muted-foreground">Lock wallet after 15 minutes of inactivity</p>
            </div>
            <Switch 
              id="auto-lock" 
              checked={autoLock}
              onCheckedChange={toggleAutoLock}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signOut()}
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsView;
