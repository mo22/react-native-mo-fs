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
      console.log('linking url', url);
    });
    Linking.getInitialURL().then((url) => {
      if (!url) return;
      console.log('linking url', url);
    });
  }
  public render() {
    return (
      <AppContainer />
    );
  }
}

export default App;
