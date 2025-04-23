
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
  const { currentView, isWalletInitialized, seedPhraseBackedUp, publicKey } = useWalletStore();
  
  // Check for existing wallet on load, but don't set isWalletInitialized yet
  // We will require proper unlocking first
  useEffect(() => {
    const encryptedMnemonic = localStorage.getItem('soloasisWallet');
    if (encryptedMnemonic) {
      useWalletStore.setState({ 
        encryptedMnemonic,
        // We set currentView to welcome to force login, but don't set isWalletInitialized yet
        currentView: 'welcome'
      });
    }
  }, []);
  
  // Determine if the wallet is fully set up - requires publicKey to be present
  const walletFullyInitialized = Boolean(isWalletInitialized && publicKey);
  
  const renderContent = () => {
    if (isWalletInitialized && !seedPhraseBackedUp && currentView === 'backup') {
      return <BackupView />;
    }
    
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
    <WalletLayout showNavigation={walletFullyInitialized}>
      {renderContent()}
    </WalletLayout>
  );
};

export default WalletApp;
