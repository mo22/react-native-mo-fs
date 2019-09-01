import * as React from 'react';
import { ScrollView, Text } from 'react-native';
import { NavigationInjectedProps, NavigationActions } from 'react-navigation';
import { ListItem } from 'react-native-elements';
import { Fs } from 'react-native-mo-fs';

interface State {
  entries: { [name: string]: string };
}

export default class ItemBrowser extends React.Component<NavigationInjectedProps<{ path: string; }>, State> {
  public state: State = {
    entries: {},
  };

  public async componentDidMount() {
    const path = this.props.navigation.getParam('path');
  }

  public render() {
    const path = this.props.navigation.getParam('path');
    return (
      <ScrollView>

        <Text>{path}</Text>

      </ScrollView>
    );
  }
}
