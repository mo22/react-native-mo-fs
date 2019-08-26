import { NativeModules, Platform } from 'react-native';
export const Module = (Platform.OS === 'ios') ? NativeModules.ReactNativeMoFs : undefined;
//# sourceMappingURL=ios.js.map