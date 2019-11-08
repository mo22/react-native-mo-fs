import 'react-native-gesture-handler';
import * as React from 'react';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { Fs } from 'react-native-mo-fs';
import { Alert } from 'react-native';

Fs.setVerbose(true);

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

Fs.openFile.subscribe(async (event) => {
  const blob = await Fs.readURL(event.url);
  console.log('blob', blob);
  Alert.alert('Import', 'Name ' + blob.type);
  blob.close();
});

class App extends React.PureComponent<{}> {
  public render() {
    return (
      <AppContainer />
    );
  }
}

export default App;
