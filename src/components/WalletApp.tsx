
import React, { useEffect } from 'react';
import WalletLayout from './WalletLayout';
import WelcomeScreen from './WelcomeScreen';
import CreateWallet from './CreateWallet';
import ImportWallet from './ImportWallet';
import BackupView from './BackupView';
import Dashboard from './Dashboard';
import SendView from './SendView';
import ReceiveView from './ReceiveView';
import SettingsView from './SettingsView';
import TransactionsView from './TransactionsView';
import useWalletStore from '@/store/walletStore';

const WalletApp: React.FC = () => {
  const { currentView, isWalletInitialized, seedPhraseBackedUp } = useWalletStore();
  
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
    // If wallet is initialized but seed phrase isn't backed up, and the user manually navigated to the backup view
    if (isWalletInitialized && !seedPhraseBackedUp && currentView === 'backup') {
      return <BackupView />;
    }
    
    // Otherwise show the appropriate view
    switch (currentView) {
      case 'welcome':
        return <WelcomeScreen />;
      case 'create':
        return <CreateWallet />;
      case 'import':
        return <ImportWallet />;
      case 'backup':
        return <BackupView />;
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
