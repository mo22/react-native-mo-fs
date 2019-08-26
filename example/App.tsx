import * as React from 'react';
import './patchReactNavigationSafeAreaView';
import { createStackNavigator, createAppContainer } from 'react-navigation';
import AsyncStorage from '@react-native-community/async-storage';

const AppNavigator = createStackNavigator({
  Menu: {
    screen: require('./Menu').default,
    navigationOptions: {
      title: 'Menu',
    },
  },
  ScrollViewInsideSafeArea: {
    screen: require('./ScrollViewInsideSafeArea').default,
    navigationOptions: {
      title: 'ScrollViewInsideSafeArea',
    },
  },
  SafeAreaInsideScrollView: {
    screen: require('./SafeAreaInsideScrollView').default,
    navigationOptions: {
      title: 'SafeAreaInsideScrollView',
      header: null,
    },
  },
  Test: {
    screen: require('./Test').default,
    navigationOptions: {
      title: 'Test',
    },
  },
});

const AppContainer = createAppContainer(AppNavigator);

class App extends React.PureComponent<{}> {
  public render() {
    return (
      <AppContainer
        persistNavigationState={async (navState) => {
          try {
            await AsyncStorage.setItem('navState', JSON.stringify(navState));
          } catch (e) {
          }
        }}
        loadNavigationState={async () => {
          if (1) return null;
          try {
            return JSON.parse(await AsyncStorage.getItem('navState') || 'null');
          } catch (e) {
            return null;
          }
        }}
      />
    );
  }
}

export default App;
