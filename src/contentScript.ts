
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
    // Ensure message is an object, defaulting to an empty object if not
    const messageData = data.message && typeof data.message === 'object' 
      ? data.message 
      : {};
      
    // Add origin information to the message
    const message = {
      ...messageData,
      origin: window.location.origin,
      title: document.title || window.location.hostname
    };
    
    // Forward to background script and await the response
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (resp) => {
        resolve(resp);
      });
    });
    
    // Create a response object and ensure it's safe to spread
    const responseObj = response && typeof response === 'object' ? response : {};
    
    // Send response back to inpage script
    window.postMessage({
      channel: 'soloasis_wallet_background',
      response: {
        id: data.id,
        ...responseObj
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

