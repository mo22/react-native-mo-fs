import * as React from 'react';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { Linking } from 'react-native';
import { Fs } from 'react-native-mo-fs';

const AppNavigator = createStackNavigator({
  Menu: {
    screen: require('./Menu').default,
    navigationOptions: {
      title: 'Menu',
    },
  },
  DirBrowser: {
    screen: require('./DirBrowser').default,
    navigationOptions: {
      title: 'DirBrowser',
    },
  },
  ItemBrowser: {
    screen: require('./ItemBrowser').default,
    navigationOptions: {
      title: 'ItemBrowser',
    },
  },
});

const AppContainer = createAppContainer(AppNavigator);


if (Fs.ios.Events) {
  Fs.ios.Events.addListener('ReactNativeMoFsLink', (asd) => {
    console.log('XXX ReactNativeMoFsLink', asd);
    // 'XXX ReactNativeMoFsLink', { url: 'file:///private/var/mobile/Containers/Data/Application/8250D055-04FF-483C-9861-F5E3BF611DE3/tmp/org.reactjs.native.example.example-Inbox/2018_07_24_12_51_03.pdf',
    //   options: { UIApplicationOpenURLOptionsOpenInPlaceKey: false } }
  });
}
if (Fs.android.Events) {
  Fs.android.Events.addListener('ReactNativeMoFsNewIntent', (asd) => {
    console.log('XXX ReactNativeMoFsNewIntent', asd);
    // 'XXX ReactNativeMoFsLink', { extras:
    //    { 'android.intent.extra.TITLE': 'sample.pdf',
    //      'android.intent.extra.STREAM': 'content://com.android.providers.downloads.documents/document/695',
    //      'referrer.string': '/pdfviewer',
    //      'android.intent.extra.SUBJECT': 'sample.pdf',
    //      'referrer.code': 97 },
    //   type: 'application/pdf',
    //   action: 'android.intent.action.SEND' }
  });
  Fs.android.Module!.getInitialIntent().then((asd) => {
    console.log('XXX getInitialIntent', asd);
    // 'XXX getInitialIntent', { extras:
    //        { 'android.intent.extra.TITLE': 'sample.pdf',
    //          'android.intent.extra.STREAM': 'content://com.android.providers.downloads.documents/document/695',
    //          'referrer.string': '/pdfviewer',
    //          'android.intent.extra.SUBJECT': 'sample.pdf',
    //          'referrer.code': 97 },
    //       type: 'application/pdf',
    //       action: 'android.intent.action.SEND' }
  });
}
Linking.addEventListener('url', ({url}) => {
  console.log('XXX linking url event', url);
});
Linking.getInitialURL().then((url) => {
  console.log('XXX linking url initial', url);
  if (!url) return;
});

class App extends React.PureComponent<{}> {
  public render() {
    return (
      <AppContainer />
    );
  }
}

export default App;
