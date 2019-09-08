import * as React from 'react';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
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
  Fs.ios.Events.addListener('ReactNativeMoFsOpenURL', async (asd) => {
    console.log('XXX ReactNativeMoFsOpenURL', asd);
    const blob = await Fs.readURL(asd.url);
    console.log('blob', blob);
    blob.close();
    // 'XXX ReactNativeMoFsOpenURL', { url: 'file:///private/var/mobile/Containers/Data/Application/8250D055-04FF-483C-9861-F5E3BF611DE3/tmp/org.reactjs.native.example.example-Inbox/2018_07_24_12_51_03.pdf',
    //   options: { UIApplicationOpenURLOptionsOpenInPlaceKey: false } }
  });
  Fs.ios.Module!.getLastOpenURL().then(async (asd) => {
    console.log('XXX getLastOpenURL', asd);
    if (!asd) return;
    const blob = await Fs.readURL(asd.url);
    console.log('blob', blob);
    blob.close();
  });
}
if (Fs.android.Events) {
  Fs.android.Events.addListener('ReactNativeMoFsNewIntent', async (asd) => {
    console.log('XXX ReactNativeMoFsNewIntent', asd);
    if (asd.action === 'android.intent.action.SEND' && asd.extras && asd.extras['android.intent.extra.STREAM']) {
      const blob = await Fs.readURL(asd.extras['android.intent.extra.STREAM']);
      console.log('blob', blob);
      blob.close();
    }
    // 'XXX ReactNativeMoFsLink', { extras:
    //    { 'android.intent.extra.TITLE': 'sample.pdf',
    //      'android.intent.extra.STREAM': 'content://com.android.providers.downloads.documents/document/695',
    //      'referrer.string': '/pdfviewer',
    //      'android.intent.extra.SUBJECT': 'sample.pdf',
    //      'referrer.code': 97 },
    //   type: 'application/pdf',
    //   action: 'android.intent.action.SEND' }
  });
  Fs.android.Module!.getInitialIntent().then(async (asd) => {
    console.log('XXX getInitialIntent', asd);
    if (asd.action === 'android.intent.action.SEND' && asd.extras && asd.extras['android.intent.extra.STREAM']) {
      const blob = await Fs.readURL(asd.extras['android.intent.extra.STREAM']);
      console.log('blob', blob);
      blob.close();
    }
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

class App extends React.PureComponent<{}> {
  public render() {
    return (
      <AppContainer />
    );
  }
}

export default App;
