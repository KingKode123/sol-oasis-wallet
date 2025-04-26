
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
    setCurrentView,
    encryptedMnemonic,
    unlockWallet
  } = useWalletStore();
  
  const { 
    currentConnectionRequest, 
    currentTransactionRequest, 
    currentMessageSignRequest 
  } = useDAppStore();
  
  // Check for existing wallet on load and attempt auto-unlock if password is in session storage
  useEffect(() => {
    const checkExistingWallet = async () => {
      const storedEncryptedMnemonic = localStorage.getItem('soloasisWallet');
      
      if (storedEncryptedMnemonic) {
        // Update the encrypted mnemonic in the store
        useWalletStore.setState({ 
          encryptedMnemonic: storedEncryptedMnemonic
        });
        
        // Check if we have a saved password in session storage (cleared on browser close)
        const savedPassword = sessionStorage.getItem('soloasisWalletPassword');
        if (savedPassword) {
          try {
            // Try to unlock the wallet with the saved password
            const unlocked = await unlockWallet(savedPassword);
            if (unlocked) {
              // Successfully unlocked, wallet state is now set in unlockWallet function
              console.log('Wallet auto-unlocked successfully');
            } else {
              // If unlock fails, show welcome screen
              setCurrentView('welcome');
            }
          } catch (error) {
            console.error('Auto-unlock failed:', error);
            setCurrentView('welcome');
          }
        } else {
          // No saved password, show welcome screen
          setCurrentView('welcome');
        }
      }
    };
    
    checkExistingWallet();
  }, [unlockWallet, setCurrentView]);
  
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
