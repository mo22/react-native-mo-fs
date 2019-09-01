import * as React from 'react';
import { ScrollView, Text } from 'react-native';
import { NavigationInjectedProps, NavigationActions } from 'react-navigation';
import { ListItem } from 'react-native-elements';
import { Fs } from 'react-native-mo-fs';

interface State {
  entries: { [name: string]: string };
}

export default class DirBrowser extends React.Component<NavigationInjectedProps<{ path: string; }>, State> {
  public state: State = {
    entries: {},
  };

  public async componentDidMount() {
    const path = this.props.navigation.getParam('path');
    console.log(path);
    if (path === '') {
      const paths = await Fs.getPaths();
      this.setState({ entries: paths as any });
    } else {
      const entries: { [name: string]: string } = {};
      for (const rs of await Fs.listDir(path)) {
        entries[rs] = path + '/' + rs;
      }
      this.setState({ entries: entries });
    }
  }

  public render() {
    const path = this.props.navigation.getParam('path');
    return (
      <ScrollView>

        <Text>{path}</Text>

        {Object.entries(this.state.entries).map(([name, path]) => (
          <ListItem
            onPress={async () => {
              const stat = await Fs.stat(path);
              if (stat.dir) {
                this.props.navigation.dispatch(NavigationActions.navigate({
                  routeName: 'DirBrowser',
                  key: path,
                  params: {
                    path: path,
                  },
                }));
              } else {
                this.props.navigation.dispatch(NavigationActions.navigate({
                  routeName: 'ItemBrowser',
                  key: path,
                  params: {
                    path: path,
                  },
                }));
              }
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
