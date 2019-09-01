import * as React from 'react';
import { ScrollView, Text } from 'react-native';
import { NavigationInjectedProps, NavigationActions } from 'react-navigation';
import { ListItem } from 'react-native-elements';
import { Fs, Stat } from 'react-native-mo-fs';

interface State {
  stat?: Stat;
  mime?: string;
}

export default class ItemBrowser extends React.Component<NavigationInjectedProps<{ path: string; }>, State> {
  public state: State = {
  };

  public async componentDidMount() {
    const path = this.props.navigation.getParam('path');
    const stat = await Fs.stat(path);
    this.setState({ stat: stat });
    const mime = await Fs.getMimeType(path);
    this.setState({ mime: mime });
    if (stat.exists && !stat.dir) {
      const blob = await Fs.readFile(path);
      console.log('blob', blob);
      const info = await Fs.getBlobInfo(blob);
      console.log('info', info);
    }
  }

  public render() {
    const path = this.props.navigation.getParam('path');
    return (
      <ScrollView>

        <Text>{path}</Text>

        {this.state.stat && (
          <React.Fragment>
            <ListItem
              title="size"
              rightTitle={String(this.state.stat.size)}
            />
            <ListItem
              title="modified"
              rightTitle={String(this.state.stat.modified)}
            />
          </React.Fragment>
        )}

        {this.state.mime && (
          <ListItem
            title="mime"
            rightTitle={this.state.mime}
          />
        )}

      </ScrollView>
    );
  }
}
