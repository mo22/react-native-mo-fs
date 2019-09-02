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
    UPDATE THIS
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
  Need to modify AppDelegate: https://facebook.github.io/react-native/docs/linking

## TODO
- [ ] load picture from camera save in documents

- [ ] for existing picture in ItemBRowser: create thumbnail

- [ ] itembrowser open in?!
  https://github.com/Elyx0/react-native-document-picker/blob/master/ios/RNDocumentPicker/RNDocumentPicker.m

- [ ] read/write with offset?
- [ ] append to log file? / read and write text file? read/write partial?
- [ ] blob to text / text from blob?

- [ ] handle open doc:
  09-02 20:40:39.061 27999 28010 I ActivityManager: START u0 {act=android.intent.action.SEND cat=[android.intent.category.DEFAULT] typ=application/pdf flg=0xb080001 cmp=com.example/.MainActivity clip={application/pdf U:content://com.android.providers.downloads.documents/document/695} (has extras)} from uid 10051
  09-02 20:40:39.061 27999 28010 I ActivityManager: Ignoring FLAG_ACTIVITY_NEW_DOCUMENT, launchMode is "singleInstance" or "singleTask"
