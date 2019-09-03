import { NativeModules, Platform, NativeEventEmitter } from 'react-native';
export const Module = (Platform.OS === 'ios') ? NativeModules.ReactNativeMoFs : undefined;
export const Events = Module ? new NativeEventEmitter(NativeModules.ReactNativeMoFs) : undefined;
//# sourceMappingURL=ios.js.map