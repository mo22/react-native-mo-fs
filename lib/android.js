import { NativeModules, Platform } from 'react-native';
export const Module = (Platform.OS === 'android') ? NativeModules.ReactNativeMoFs : undefined;
//# sourceMappingURL=android.js.map