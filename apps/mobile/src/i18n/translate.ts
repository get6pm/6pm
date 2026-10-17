import { Platform } from 'react-native';

import { translatorFor } from '@6pm/i18n';

/** `t` as this phone reads it: Android words a few keys its own way (no iPhone, App Store or iCloud). */
export const translate = translatorFor(Platform.OS === 'android' ? 'android' : 'ios');
