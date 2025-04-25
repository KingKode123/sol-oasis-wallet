
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Shield, Globe } from 'lucide-react';
import useDAppStore, { ConnectionRequest } from '@/store/dAppStore';

interface ConnectionRequestViewProps {
  request?: ConnectionRequest;
}

const ConnectionRequestView: React.FC<ConnectionRequestViewProps> = ({ request }) => {
  const { approveConnectionRequest, rejectConnectionRequest } = useDAppStore();
  
  const handleApprove = () => {
    if (request) {
      approveConnectionRequest(request.id);
    }
  };
  
  const handleReject = () => {
    if (request) {
      rejectConnectionRequest(request.id);
    }
  };
  
  if (!request) {
    return null;
  }
  
  return (
    <div className="p-4 max-w-md mx-auto">
      <Card className="border-2 border-yellow-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-yellow-500" />
            Connection Request
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <span className="font-bold">{request.title}</span> wants to connect to your wallet
            </AlertDescription>
          </Alert>
          
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            {request.icon ? (
              <img 
                src={request.icon} 
                alt={request.title}
                className="w-10 h-10 rounded-full" 
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Globe className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="font-medium">{request.title}</p>
              <p className="text-xs text-muted-foreground">{request.origin}</p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <p className="font-medium">This site will be able to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>See your wallet address</li>
              <li>Request transaction approvals</li>
              <li>Request message signing</li>
            </ul>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Only connect to sites you trust. You can disconnect at any time from the Settings.
          </p>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleReject}
            className="flex items-center gap-1"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
          <Button 
            onClick={handleApprove}
            className="flex items-center gap-1"
          >
            <CheckCircle className="h-4 w-4" />
            Connect
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ConnectionRequestView;
