
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, MessageSquare, Globe, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import useDAppStore, { MessageSignRequest } from '@/store/dAppStore';

interface MessageSignRequestViewProps {
  request?: MessageSignRequest;
}

const MessageSignRequestView: React.FC<MessageSignRequestViewProps> = ({ request }) => {
  const { approveMessageSignRequest, rejectMessageSignRequest } = useDAppStore();
  const { toast } = useToast();
  const [isApproving, setIsApproving] = React.useState(false);
  
  const handleApprove = async () => {
    if (!request) return;
    
    try {
      setIsApproving(true);
      await approveMessageSignRequest(request.id);
      
      toast({
        title: "Message signed",
        description: "Message has been successfully signed"
      });
    } catch (error) {
      console.error('Error signing message:', error);
      toast({
        title: "Signing failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsApproving(false);
    }
  };
  
  const handleReject = () => {
    if (request) {
      rejectMessageSignRequest(request.id);
      toast({
        title: "Request rejected",
        description: "You've rejected the message signing request"
      });
    }
  };
  
  if (!request) {
    return null;
  }
  
  // Convert message to string for display
  const messageText = (() => {
    try {
      return new TextDecoder().decode(request.message);
    } catch (e) {
      return Array.from(request.message)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
  })();
  
  return (
    <div className="p-4 max-w-md mx-auto">
      <Card className="border-2 border-yellow-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Sign Message Request
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <span className="font-bold">{request.title}</span> is requesting to sign a message
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
          
          <div className="space-y-2">
            <p className="font-medium text-sm flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              Message Content:
            </p>
            <div className="bg-muted p-3 rounded-md overflow-auto max-h-32">
              <pre className="text-xs whitespace-pre-wrap break-all font-mono">
                {messageText}
              </pre>
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              Signing this message allows the site to verify you own this wallet address. 
              Only sign messages from sites you trust.
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleReject}
            className="flex items-center gap-1"
            disabled={isApproving}
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
          <Button 
            onClick={handleApprove}
            className="flex items-center gap-1"
            disabled={isApproving}
          >
            <CheckCircle className="h-4 w-4" />
            {isApproving ? "Signing..." : "Sign Message"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MessageSignRequestView;
