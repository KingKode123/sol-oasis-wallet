// Type definitions for Chrome extension API
declare namespace chrome {
  export namespace runtime {
    function getURL(path: string): string;
    function sendMessage(message: any, responseCallback?: (response: any) => void): void;
    const onMessage: {
      addListener: (
        callback: (
          message: any,
          sender: chrome.runtime.MessageSender,
          sendResponse: (response?: any) => void
        ) => void
      ) => void;
    };
  }
  
  export namespace storage {
    const sync: {
      get: (keys: string | string[] | object | null, callback: (items: { [key: string]: any }) => void) => void;
      set: (items: object, callback?: () => void) => void;
      remove: (keys: string | string[], callback?: () => void) => void;
    };
    const local: {
      get: (keys: string | string[] | object | null, callback: (items: { [key: string]: any }) => void) => void;
      set: (items: object, callback?: () => void) => void;
      remove: (keys: string | string[], callback?: () => void) => void;
    };
  }
  
  export namespace tabs {
    function query(queryInfo: object, callback: (result: any[]) => void): void;
    function create(createProperties: object, callback?: (tab: any) => void): void;
    function update(tabId: number, updateProperties: object, callback?: (tab?: any) => void): void;
  }
  
  export namespace runtime {
    interface MessageSender {
      tab?: any;
      frameId?: number;
      id?: string;
      url?: string;
      tlsChannelId?: string;
      origin?: string;
    }
  }
}
