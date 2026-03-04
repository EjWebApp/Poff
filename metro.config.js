const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@supabase/realtime-js') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'lib/supabaseRealtimeStub.js'),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
