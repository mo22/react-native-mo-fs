import * as React from 'react';
import { ScrollView, Alert } from 'react-native';
import { NavigationInjectedProps, NavigationActions } from 'react-navigation';
import { ListItem } from 'react-native-elements';
import ImagePicker from 'react-native-image-picker';
import { Fs } from 'react-native-mo-fs';
import moment from 'moment';

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
              noData: true,
              storageOptions: {
                skipBackup: true,
              },
            }, async (res) => {
              if (res.didCancel) return;
              if (res.error) {
                Alert.alert('Error', res.error);
                return;
              }

              const blob = await Fs.readURL(res.uri);
              // save to docs?
              const paths = await Fs.getPaths();
              const path = paths.docs + '/' + moment().format('YYYY-MM-DD HH:mm:ss') + '.jpg';
              console.log('blob', blob);
              console.log('path', path);
              Alert.alert('Success', 'Imported to ' + path);

            });
          }}
          title="ImagePicker"
        />

      </ScrollView>
    );
  }
}
