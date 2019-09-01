import * as React from 'react';
import { ScrollView, Text } from 'react-native';
import { NavigationInjectedProps, NavigationActions } from 'react-navigation';
import { ListItem } from 'react-native-elements';
import { Fs } from 'react-native-mo-fs';

interface State {
  path: string;
  entries: { [name: string]: string };
}

export default class DirBrowser extends React.Component<NavigationInjectedProps, State> {
  public state: State = {
    path: '',
    entries: {},
  };

  public componentDidMount() {
    this.setPath('');
  }

  private async setPath(path: string) {
    if (path === '') {
      const paths = await Fs.getPaths();
      this.setState({ path: path, entries: paths as any });
    } else {
      const entries: { [name: string]: string } = {};
      for (const rs of await Fs.listDir(path)) {
        entries[rs] = path + '/' + rs;
      }
      this.setState({ path: path, entries: entries });
    }
  }

  public render() {
    return (
      <ScrollView>

        <Text>{this.state.path}</Text>

        {Object.entries(this.state.entries).map(([name, path]) => (
          <ListItem
            onPress={() => {
              this.setPath(path);
            }}
            chevron={true}
            title={name}
            key={name}
          />
        ))}


      </ScrollView>
    );
  }
}
