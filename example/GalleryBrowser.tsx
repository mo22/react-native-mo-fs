import * as React from 'react';
import { ScrollView, Text, CameraRoll } from 'react-native';
import { NavigationInjectedProps, NavigationActions } from 'react-navigation';
import { ListItem } from 'react-native-elements';

interface State {
  entries: { [name: string]: string };
}

export default class GalleryBrowser extends React.Component<NavigationInjectedProps<{ path: string; }>, State> {
  public state: State = {
    entries: {},
  };

  public async componentDidMount() {
    CameraRoll.
  }

  public render() {
    return (
      <ScrollView>

        {Object.entries(this.state.entries).map(([name, path]) => (
          <ListItem
            onPress={async () => {
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
