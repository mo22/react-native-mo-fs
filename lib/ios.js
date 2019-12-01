import { NativeModules, Platform, NativeEventEmitter } from 'react-native';
export var ImagePickerControllerSourceType;
(function (ImagePickerControllerSourceType) {
    ImagePickerControllerSourceType[ImagePickerControllerSourceType["PhotoLibrary"] = 0] = "PhotoLibrary";
    ImagePickerControllerSourceType[ImagePickerControllerSourceType["Camera"] = 1] = "Camera";
    ImagePickerControllerSourceType[ImagePickerControllerSourceType["SavedPhotosAlbum"] = 2] = "SavedPhotosAlbum";
})(ImagePickerControllerSourceType || (ImagePickerControllerSourceType = {}));
export var ImagePickerControllerQualityType;
(function (ImagePickerControllerQualityType) {
    ImagePickerControllerQualityType[ImagePickerControllerQualityType["High"] = 0] = "High";
    ImagePickerControllerQualityType[ImagePickerControllerQualityType["Medium"] = 1] = "Medium";
    ImagePickerControllerQualityType[ImagePickerControllerQualityType["Low"] = 2] = "Low";
})(ImagePickerControllerQualityType || (ImagePickerControllerQualityType = {}));
export var ImagePickerControllerCameraCaptureMode;
(function (ImagePickerControllerCameraCaptureMode) {
    ImagePickerControllerCameraCaptureMode[ImagePickerControllerCameraCaptureMode["Photo"] = 0] = "Photo";
    ImagePickerControllerCameraCaptureMode[ImagePickerControllerCameraCaptureMode["Video"] = 1] = "Video";
})(ImagePickerControllerCameraCaptureMode || (ImagePickerControllerCameraCaptureMode = {}));
export var ImagePickerControllerCameraDevice;
(function (ImagePickerControllerCameraDevice) {
    ImagePickerControllerCameraDevice[ImagePickerControllerCameraDevice["Rear"] = 0] = "Rear";
    ImagePickerControllerCameraDevice[ImagePickerControllerCameraDevice["Front"] = 1] = "Front";
})(ImagePickerControllerCameraDevice || (ImagePickerControllerCameraDevice = {}));
export var ImagePickerControllerCameraFlashMode;
(function (ImagePickerControllerCameraFlashMode) {
    ImagePickerControllerCameraFlashMode[ImagePickerControllerCameraFlashMode["Off"] = -1] = "Off";
    ImagePickerControllerCameraFlashMode[ImagePickerControllerCameraFlashMode["Auto"] = 0] = "Auto";
    ImagePickerControllerCameraFlashMode[ImagePickerControllerCameraFlashMode["On"] = 1] = "On";
})(ImagePickerControllerCameraFlashMode || (ImagePickerControllerCameraFlashMode = {}));
export const Module = (Platform.OS === 'ios') ? NativeModules.ReactNativeMoFs : undefined;
export const Events = Module ? new NativeEventEmitter(NativeModules.ReactNativeMoFs) : undefined;
//# sourceMappingURL=ios.js.map