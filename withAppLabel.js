const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAppLabel(config) {
  return withAndroidManifest(config, async (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    const mainActivity = mainApplication.activity?.find(
      (a) => a.$['android:name'] === '.MainActivity'
    );

    if (mainActivity) {
      mainActivity.$['android:label'] = 'VaultKey';
    }
    return config;
  });
};
