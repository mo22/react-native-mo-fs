import * as React from 'react';
import { createStackNavigator, createAppContainer } from 'react-navigation';
import { NativeModules } from 'react-native';

const buf = new ArrayBuffer(10);
NativeModules.ReactNativeMoFs.test(buf);

const AppNavigator = createStackNavigator({
  Menu: {
    screen: require('./Menu').default,
    navigationOptions: {
      title: 'Menu',
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
