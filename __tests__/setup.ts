import path from 'path';

// Global setup for React Native / Expo environment in Node.js
(globalThis as any).__DEV__ = false;
(globalThis as any).window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { reload: () => {} },
};

// Module redirection in Node
const Module = require('module');
const originalResolveFilename = Module._resolveFilename;

const mockNotificationsPath = path.resolve(__dirname, 'mocks/expoNotificationsMock.ts');

Module._resolveFilename = function (request: string, parent: any, isMain: boolean, options: any) {
  if (request === 'expo-notifications') {
    return mockNotificationsPath;
  }
  if (request === 'react-native') {
    return originalResolveFilename.call(this, 'react-native-web', parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
