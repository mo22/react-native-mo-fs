import * as React from 'react';
import { ScrollView } from 'react-native';
import { NavigationInjectedProps, NavigationActions } from 'react-navigation';
import { ListItem } from 'react-native-elements';

export default class Menu extends React.Component<NavigationInjectedProps> {
  public render() {
    return (
      <ScrollView>

        <ListItem
          onPress={() => {
            this.props.navigation.dispatch(NavigationActions.navigate({ routeName: 'ScrollViewInsideSafeArea' }));
          }}
          title="ScrollViewInsideSafeArea"
        />

        <ListItem
          onPress={() => {
            this.props.navigation.dispatch(NavigationActions.navigate({ routeName: 'SafeAreaInsideScrollView' }));
          }}
          title="SafeAreaInsideScrollView"
        />

      </ScrollView>
    );
  }
}
