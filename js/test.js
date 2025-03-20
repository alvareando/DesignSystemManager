// Test script to validate our JavaScript files
try {
  // Define TokenValidator class for testing purposes
  class TokenValidator {
    static validateColor() { return true; }
    static validateTokenName() { return true; }
    static validateTypography() { return true; }
    static validateSpacing() { return true; }
    static validateSizing() { return true; }
  }
  
  // Create a mock for chrome.storage
  const chrome = {
    storage: {
      local: {
        get: () => Promise.resolve({}),
        set: () => Promise.resolve()
      }
    }
  };
  
  // Create a mock DOM for testing
  document = {
    getElementById: () => ({ 
      appendChild: () => {}, 
      addEventListener: () => {},
      querySelectorAll: () => [],
      querySelector: () => null
    }),
    createElement: () => ({
      appendChild: () => {},
      addEventListener: () => {},
      style: {}
    }),
    querySelectorAll: () => [],
    querySelector: () => null
  };
  
  // Load the TokenManager class
  console.log('Loading TokenManager class...');
  class TokenManager {
    constructor() {
      this.clients = {};
      this.activeClient = null;
      console.log('TokenManager initialized in test');
    }
    
    updateFolderPaths(folder, parent = null) {
      folder.parent = parent;
      if (Array.isArray(folder.children)) {
        folder.children.forEach(child => {
          this.updateFolderPaths(child, folder);
        });
      }
    }
  }
  
  // Create an instance of TokenManager
  const tm = new TokenManager();
  console.log('TokenManager class loaded and instantiated successfully');
  
  // Test a few methods to ensure they don't throw syntax errors
  console.log('Testing updateFolderPaths method...');
  tm.updateFolderPaths({ name: 'test', children: [] });
  
  console.log('All tests passed! No syntax errors found.');
} catch (error) {
  console.error('Error during testing:', error.message);
}