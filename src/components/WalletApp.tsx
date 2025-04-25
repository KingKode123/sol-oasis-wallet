
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
import GasAccountView from './GasAccountView';
import ConnectionRequestView from './ConnectionRequestView';
import TransactionRequestView from './TransactionRequestView';
import MessageSignRequestView from './MessageSignRequestView';
import DAppConnectionsView from './DAppConnectionsView';
import useWalletStore from '@/store/walletStore';
import useDAppStore from '@/store/dAppStore';

const WalletApp: React.FC = () => {
  const { 
    currentView, 
    isWalletInitialized, 
    seedPhraseBackedUp, 
    publicKey, 
    setCurrentView 
  } = useWalletStore();
  
  const { 
    currentConnectionRequest, 
    currentTransactionRequest, 
    currentMessageSignRequest 
  } = useDAppStore();
  
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
  
  // Handle pending dApp requests
  const hasPendingDAppRequest = currentConnectionRequest || 
                               currentTransactionRequest || 
                               currentMessageSignRequest;
  
  const renderDAppRequest = () => {
    if (currentConnectionRequest) {
      return <ConnectionRequestView request={currentConnectionRequest} />;
    }
    
    if (currentTransactionRequest) {
      return <TransactionRequestView request={currentTransactionRequest} />;
    }
    
    if (currentMessageSignRequest) {
      return <MessageSignRequestView request={currentMessageSignRequest} />;
    }
    
    return null;
  };
  
  const renderContent = () => {
    // Show dApp requests with highest priority if they exist
    if (hasPendingDAppRequest) {
      return renderDAppRequest();
    }
    
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
      case 'gas-account':
        return <GasAccountView />;
      case 'dapp-connections':
        return <DAppConnectionsView />;
      default:
        return <Dashboard />;
    }
  };
  
  return (
    <WalletLayout showNavigation={walletFullyInitialized && !hasPendingDAppRequest}>
      {renderContent()}
    </WalletLayout>
  );
};

export default WalletApp;
