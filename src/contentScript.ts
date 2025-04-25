
// Communication bridge between dApps and the wallet extension
console.log('SOL Oasis wallet content script loaded');

// Inject the inpage script for dApp communication
const injectScript = () => {
  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inpage.js');
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
    console.log('Injected SOL Oasis wallet inpage script');
  } catch (error) {
    console.error('Error injecting SOL Oasis wallet script:', error);
  }
};

injectScript();

// Handle messages from inpage script and forward to background
window.addEventListener('message', async (event) => {
  // Only accept messages from the current window
  if (event.source !== window || !event.data || event.data.channel !== 'soloasis_wallet') {
    return;
  }
  
  const { data } = event;
  
  try {
    // Add origin information to the message
    const message = {
      ...data.message,
      origin: window.location.origin,
      title: document.title || window.location.hostname
    };
    
    // Forward to background script
    const response = await chrome.runtime.sendMessage(message);
    
    // Send response back to inpage script
    window.postMessage({
      channel: 'soloasis_wallet_background',
      response: {
        id: data.id,
        ...response
      }
    }, '*');
  } catch (error) {
    console.error('Error forwarding message to extension:', error);
    
    // Send error back to inpage script
    window.postMessage({
      channel: 'soloasis_wallet_background',
      response: {
        id: data.id,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }, '*');
  }
});
