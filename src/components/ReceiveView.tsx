
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { Copy } from 'lucide-react';
import useWalletStore from '@/store/walletStore';

const ReceiveView: React.FC = () => {
  const { publicKey, network } = useWalletStore();
  const { toast } = useToast();
  
  const handleCopy = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey);
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold">Receive SOL</h2>
        <p className="text-sm text-muted-foreground">
          Share your address to receive SOL or tokens
        </p>
      </div>
      
      <Card>
        <CardContent className="pt-6 flex flex-col items-center space-y-6">
          {/* QR Code */}
          <div className="bg-white p-4 rounded-lg">
            <QRCodeSVG
              value={publicKey || 'No address available'}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
          
          {/* Address */}
          <div className="w-full">
            <p className="text-sm text-muted-foreground text-center mb-2">My Address ({network})</p>
            <div className="flex items-center space-x-2">
              <div className="bg-muted p-3 rounded-md flex-1 font-mono text-sm overflow-x-auto">
                {publicKey || '0x...'}
              </div>
              <Button variant="outline" size="icon" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Only send Solana (SOL) and SPL tokens to this address.
            <br />
            Sending other assets may result in permanent loss.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceiveView;
