
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Globe, Trash2, Shield } from 'lucide-react';
import useDAppStore from '@/store/dAppStore';

const DAppConnectionsView: React.FC = () => {
  const { connectedSites, disconnectSite, updateSitePermissions, isEnabled, toggleEnabled } = useDAppStore();
  const { toast } = useToast();
  
  const handleDisconnect = (origin: string, title: string) => {
    disconnectSite(origin);
    toast({
      title: "Site disconnected",
      description: `${title} has been disconnected from your wallet`
    });
  };
  
  const handleToggleAutoApprove = (origin: string, value: boolean) => {
    updateSitePermissions(origin, { autoApprove: value });
    toast({
      title: value ? "Auto-approve enabled" : "Auto-approve disabled",
      description: value 
        ? "Transactions will be auto-approved for this site" 
        : "Transactions will require manual approval"
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold">Connected dApps</h2>
        <p className="text-sm text-muted-foreground">
          Manage your connected decentralized applications
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Connection Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dapp-connections">dApp Connections</Label>
              <p className="text-xs text-muted-foreground">Allow connections from decentralized applications</p>
            </div>
            <Switch 
              id="dapp-connections" 
              checked={isEnabled}
              onCheckedChange={toggleEnabled}
            />
          </div>
        </CardContent>
      </Card>
      
      {connectedSites.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Connected Sites</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {connectedSites.map((site, index) => (
                <div key={index} className="p-4 flex items-center space-x-4">
                  <div className="shrink-0">
                    {site.icon ? (
                      <img 
                        src={site.icon} 
                        alt={site.title}
                        className="w-10 h-10 rounded-full" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Globe className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{site.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{site.origin}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id={`auto-approve-${index}`}
                        checked={site.permissions.autoApprove}
                        onCheckedChange={(checked) => handleToggleAutoApprove(site.origin, checked)}
                      />
                      <Label htmlFor={`auto-approve-${index}`} className="text-xs">Auto</Label>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect(site.origin, site.title)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No connected dApps</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DAppConnectionsView;
