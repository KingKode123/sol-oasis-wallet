import React, { useEffect } from 'react';
import WalletLayout from './WalletLayout';
import WelcomeScreen from './WelcomeScreen';
import CreateWallet from './CreateWallet';
import ImportWallet from './ImportWallet';
import Dashboard from './Dashboard';
import SendView from './SendView';
import ReceiveView from './ReceiveView';
import SettingsView from './SettingsView';
import TransactionsView from './TransactionsView';
import useWalletStore from '@/store/walletStore';

const WalletApp: React.FC = () => {
  const { currentView, isWalletInitialized } = useWalletStore();
  
  // Check for existing wallet on load
  useEffect(() => {
    const encryptedMnemonic = localStorage.getItem('soloasisWallet');
    if (encryptedMnemonic) {
      useWalletStore.setState({ 
        encryptedMnemonic,
        isWalletInitialized: true
      });
    }
  }, []);
  
  const renderContent = () => {
    // If we have a wallet but not on the dashboard yet, show the dashboard
    if (isWalletInitialized && currentView === 'welcome') {
      return <Dashboard />;
    }
    
    // Otherwise show the appropriate view
    switch (currentView) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'create':
        return <CreateWallet />;
      case 'import':
        return <ImportWallet />;
      case 'dashboard':
        return <Dashboard />;
      case 'send':
        return <SendView />;
      case 'receive':
        return <ReceiveView />;
      case 'settings':
        return <SettingsView />;
      case 'transactions':
        return <TransactionsView />;
      default:
        return <Dashboard />;
    }
  };
  
  return (
    <WalletLayout>
      {renderContent()}
    </WalletLayout>
  );
};

export default WalletApp;
