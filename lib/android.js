import { NativeModules, Platform, NativeEventEmitter } from 'react-native';
export const Module = (Platform.OS === 'android') ? NativeModules.ReactNativeMoFs : undefined;
export const Events = Module ? new NativeEventEmitter(NativeModules.ReactNativeMoFs) : undefined;
//# sourceMappingURL=android.js.map