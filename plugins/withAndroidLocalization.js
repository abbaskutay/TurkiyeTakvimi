const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const ANDROID_APP_NAMES = {
  tr: 'Türkiye Takvimi',
  en: 'Turkiye Calendar',
  ar: 'تقويم تركيا',
};

const withAndroidLocalization = (config) => {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const resDir = path.join(
        modConfig.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res'
      );

      for (const [lang, appName] of Object.entries(ANDROID_APP_NAMES)) {
        const langValuesDir = path.join(resDir, `values-${lang}`);
        if (!fs.existsSync(langValuesDir)) {
          fs.mkdirSync(langValuesDir, { recursive: true });
        }

        const stringsXmlPath = path.join(langValuesDir, 'strings.xml');
        const xmlContent = `<resources>\n  <string name="app_name">${appName}</string>\n</resources>\n`;
        fs.writeFileSync(stringsXmlPath, xmlContent, 'utf-8');
      }

      return modConfig;
    },
  ]);
};

module.exports = withAndroidLocalization;
