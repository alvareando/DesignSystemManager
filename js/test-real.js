// Create mocks for browser APIs and DOM
const chrome = {
  storage: {
    local: {
      get: () => Promise.resolve({}),
      set: () => Promise.resolve()
    }
  }
};

// DOM mock
document = {
  getElementById: () => ({ 
    appendChild: () => {}, 
    addEventListener: () => {},
    options: { length: 1 },
    remove: () => {},
    value: ''
  }),
  createElement: () => ({
    appendChild: () => {},
    addEventListener: () => {},
    style: {},
    className: '',
    dataset: {}
  }),
  querySelectorAll: () => [],
  querySelector: () => ({
    appendChild: () => {}
  }),
  body: {
    appendChild: () => {}
  }
};

// Mock TokenValidator
class TokenValidator {
  static validateColor() { return true; }
  static validateTokenName() { return true; }
  static validateTypography() { return true; }
  static validateSpacing() { return true; }
  static validateSizing() { return true; }
}

console.log("Loading TokenManager file...");

// Load the file
try {
  require('./tokenManager.js');
  console.log("✅ TokenManager loaded successfully with no syntax errors");
} catch (error) {
  console.error("❌ Error loading TokenManager:", error);
}