import baseConfig from './app.config.js';

export default {
  ...baseConfig,
  expo: {
    ...baseConfig.expo,
    name: "BR8 (Dev)",
    version: "1.0.1",
    extra: {
      ...baseConfig.expo.extra,
      env: {
        ...baseConfig.expo.extra.env,
        ENVIRONMENT: "development"
      }
    }
  }
}; 