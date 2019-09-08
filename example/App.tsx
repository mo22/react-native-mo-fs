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
  });
}
if (Fs.android.Events) {
  Fs.android.Events.addListener('ReactNativeMoFsNewIntent', (asd) => {
    console.log('XXX ReactNativeMoFsLink', asd);
  });
  Fs.android.Module!.getInitialIntent().then((asd) => {
    console.log('XXX getInitialIntent', asd);
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
