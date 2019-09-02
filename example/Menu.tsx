import * as React from 'react';
import { ScrollView } from 'react-native';
import { NavigationInjectedProps, NavigationActions } from 'react-navigation';
import { ListItem } from 'react-native-elements';
import ImagePicker from 'react-native-image-picker';

export default class Menu extends React.Component<NavigationInjectedProps> {
  public render() {
    return (
      <ScrollView>

        <ListItem
          onPress={() => {
            this.props.navigation.dispatch(NavigationActions.navigate({ routeName: 'DirBrowser', key: '', params: { path: '' } }));
          }}
          title="DirBrowser"
        />

        <ListItem
          onPress={() => {
            ImagePicker.showImagePicker({
            }, (res) => {
              if (res.didCancel) return;
              if (res.error) return;
              console.log(res);
            });
          }}
          title="ImagePicker"
        />

        <ListItem
          onPress={() => {
            this.props.navigation.dispatch(NavigationActions.navigate({ routeName: 'GalleryBrowser', key: '', params: { path: '' } }));
          }}
          title="GalleryBrowser"
        />

      </ScrollView>
    );
  }
}
