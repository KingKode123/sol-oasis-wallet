
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import useWalletStore, { NetworkType } from '@/store/walletStore';

const SettingsView: React.FC = () => {
  const { network, setNetwork, signOut } = useWalletStore();
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
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-lock">Auto-lock wallet</Label>
              <p className="text-xs text-muted-foreground">Lock wallet after 15 minutes of inactivity</p>
            </div>
            <Switch id="auto-lock" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dapp-connections">dApp connections</Label>
              <p className="text-xs text-muted-foreground">Allow connections from decentralized applications</p>
            </div>
            <Switch id="dapp-connections" defaultChecked />
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
