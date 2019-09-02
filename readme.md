# react-native-mo-fs

## Notes

- to enable iTunes file sharing (Info.plist):
  ```
  <key>UIFileSharingEnabled</key>
  <true/>
  ```

- to let your android app open a file type (manifest):
  ```
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <data android:scheme="file" />
    <data android:host="*" />
    <data android:pathPattern=".*\\.pdf" />
    <data android:mimeType="application/pdf" />
  </intent-filter>
  ```

- to let your ios app open a file type (Info.plist):
  ```
  <key>CFBundleDocumentTypes</key>
  <array>
    <dict>
      <key>CFBundleTypeName</key>
      <string>PDF</string>
      <key>LSHandlerRank</key>
      <string>Alternate</string>
      <key>LSItemContentTypes</key>
      <array>
          <string>com.adobe.pdf</string>
      </array>
    </dict>
  </array>
  ```

## TODO
- [ ] itembrowser open in?!
- [ ] load picture from camera and resize?
- [ ] append to log file? / read and write text file? read/write partial?
- [ ] https://github.com/react-native-community/react-native-image-picker
- [ ] linking / open file types
- [ ] CameraRoll show photos page
- [ ] resize photo...
- [ ] blob to text / text from blob?
