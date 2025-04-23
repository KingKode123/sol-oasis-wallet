
import React from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, Send, ArrowDown, Settings, List } from 'lucide-react';
import useWalletStore from '@/store/walletStore';

interface WalletLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

const WalletLayout: React.FC<WalletLayoutProps> = ({ children, showNavigation = false }) => {
  const { currentView, setCurrentView, signOut } = useWalletStore();
  
  return (
    <div className="w-full max-w-md mx-auto min-h-screen flex flex-col bg-background">
      {/* Header with logo and network */}
      <header className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wallet className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold solana-gradient-text">SOL Oasis</h1>
          </div>
          
          {showNavigation && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
              >
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 p-4 overflow-auto">
        {children}
      </main>
      
      {/* Bottom navigation if logged in */}
      {showNavigation && (
        <nav className="border-t p-2 bg-card">
          <div className="flex justify-around">
            <Button
              variant={currentView === 'dashboard' ? 'default' : 'ghost'}
              size="sm"
              className="flex flex-col items-center"
              onClick={() => setCurrentView('dashboard')}
            >
              <Wallet className="h-5 w-5" />
              <span className="text-xs mt-1">Wallet</span>
            </Button>
            
            <Button
              variant={currentView === 'send' ? 'default' : 'ghost'}
              size="sm"
              className="flex flex-col items-center"
              onClick={() => setCurrentView('send')}
            >
              <Send className="h-5 w-5" />
              <span className="text-xs mt-1">Send</span>
            </Button>
            
            <Button
              variant={currentView === 'receive' ? 'default' : 'ghost'}
              size="sm"
              className="flex flex-col items-center"
              onClick={() => setCurrentView('receive')}
            >
              <ArrowDown className="h-5 w-5" />
              <span className="text-xs mt-1">Receive</span>
            </Button>
            
            <Button
              variant={currentView === 'transactions' ? 'default' : 'ghost'}
              size="sm"
              className="flex flex-col items-center"
              onClick={() => setCurrentView('transactions')}
            >
              <List className="h-5 w-5" />
              <span className="text-xs mt-1">Activity</span>
            </Button>
            
            <Button
              variant={currentView === 'settings' ? 'default' : 'ghost'}
              size="sm"
              className="flex flex-col items-center"
              onClick={() => setCurrentView('settings')}
            >
              <Settings className="h-5 w-5" />
              <span className="text-xs mt-1">Settings</span>
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default WalletLayout;
