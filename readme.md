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

## TODO

- [ ] getBlobInfo: exif? which keys / format?

- [ ] handle open in - intent + linking stuff?
  -> send event
  -> event listener?
  -> initial event?


android:
sendIntentChooser({ path, type, title, subject, text })
viewIntentChooser() ?
getContent({ type })



ios:
showDocumentInteractionController({ path, uti, annotation, type: 'preview'|'openin'|'options' })
  -> broken in beta?
showDocumentPickerView({ utis, UIDocumentPickerModeImport?,  })
  -> ...
pass promise to delegate
keep delegates in NSMutableSet
finish delegates
