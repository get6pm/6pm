// @ts-check
// Expo loads config plugins with Node's CommonJS loader, so this uses require and module.exports.
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS, see above */
const fs = require('node:fs');
const path = require('node:path');

const { IOSConfig, withDangerousMod, withXcodeProject } = require('expo/config-plugins');
/* eslint-enable @typescript-eslint/no-require-imports */

/**
 * @typedef {{ name: string; light: string; dark?: string; tinted?: string }} AlternateIcon
 */

const APPEARANCES = /** @type {const} */ ({
  light: null,
  dark: [{ appearance: 'luminosity', value: 'dark' }],
  tinted: [{ appearance: 'luminosity', value: 'tinted' }],
});

/**
 * iOS alternate app icons, each a 1024² image with an optional dark and tinted one (without them
 * iOS shows the light image in dark mode and tints it itself): one app icon set per icon in the
 * app's asset catalogue, and the app target told to build them in. Only the
 * target whose primary icon is `AppIcon` gets them: the widget, share and intents extensions are
 * left alone.
 *
 * @param {import('expo/config').ExpoConfig} config
 * @param {{ icons: AlternateIcon[] }} options
 */
function withAlternateIcons(config, { icons }) {
  config = withDangerousMod(config, [
    'ios',
    (mod) => {
      const { projectRoot, platformProjectRoot } = mod.modRequest;
      const projectName = IOSConfig.XcodeUtils.getProjectName(projectRoot);
      const catalogue = path.join(platformProjectRoot, projectName, 'Images.xcassets');
      for (const icon of icons) {
        const set = path.join(catalogue, `${icon.name}.appiconset`);
        fs.mkdirSync(set, { recursive: true });
        const images = [];
        for (const variant of /** @type {const} */ (['light', 'dark', 'tinted'])) {
          const source = icon[variant];
          if (source === undefined) continue;
          const filename = `${icon.name}-${variant}.png`;
          fs.copyFileSync(path.join(projectRoot, source), path.join(set, filename));
          const appearances = APPEARANCES[variant];
          images.push({
            ...(appearances ? { appearances } : {}),
            filename,
            idiom: 'universal',
            platform: 'ios',
            size: '1024x1024',
          });
        }
        const contents = { images, info: { author: 'expo', version: 1 } };
        fs.writeFileSync(path.join(set, 'Contents.json'), JSON.stringify(contents, null, 2));
      }
      return mod;
    },
  ]);

  return withXcodeProject(config, (mod) => {
    const names = icons.map((icon) => icon.name).join(' ');
    const configurations = mod.modResults.pbxXCBuildConfigurationSection();
    for (const entry of Object.values(configurations)) {
      const settings = typeof entry === 'object' && entry !== null ? entry.buildSettings : null;
      if (settings?.ASSETCATALOG_COMPILER_APPICON_NAME !== 'AppIcon') continue;
      settings.ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES = `"${names}"`;
    }
    return mod;
  });
}

module.exports = withAlternateIcons;
