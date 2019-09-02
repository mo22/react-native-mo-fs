import * as React from 'react';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { Linking } from 'react-native';

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

class App extends React.PureComponent<{}> {
  public componentDidMount() {
    Linking.addEventListener('url', ({url}) => {
      console.log('linking url event', url);
    });
    Linking.getInitialURL().then((url) => {
      console.log('linking url initial', url);
      if (!url) return;
    });
    // 2019-09-02 20:32:06.976926+0200 example[862:485610] 'linking url', 'file:///private/var/mobile/Containers/Data/Application/14601C07-5EAB-4428-B111-B2B8AC716736/tmp/org.reactjs.native.example.example-Inbox/2018_07_24_12_51_03.pdf'
  }
  public render() {
    return (
      <AppContainer />
    );
  }
}

export default App;
