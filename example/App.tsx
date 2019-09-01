import * as React from 'react';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';

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
  public render() {
    return (
      <AppContainer />
    );
  }
}

export default App;
