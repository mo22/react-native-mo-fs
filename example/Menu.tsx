import * as React from 'react';
import { ScrollView, Linking } from 'react-native';
import { NavigationInjectedProps, NavigationActions } from 'react-navigation';
import { ListItem } from 'react-native-elements';
import ImagePicker from 'react-native-image-picker';
import { Fs } from 'react-native-mo-fs';

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
              if (res.error) return;
              console.log(res);

              // fails
              // try {
              //   const blob1 = await Fs.readURL(res.origURL!);
              //   console.log('blob1', blob1);
              // } catch (e) {
              //   console.error(e);
              // }

              try {
                // works for android
                // works for ios
                const blob2 = await Fs.readURL(res.uri);
                console.log('blob2', blob2);
              } catch (e) {
                console.error(e);
              }

              if (res.path) {
                try {
                  // works for android
                  const blob3 = await Fs.readFile(res.path);
                  console.log('blob3', blob3);
                } catch (e) {
                  console.error(e);
                }
              }

              try {
                const blob4 = await Fs.readFile(res.uri.replace('file://', ''));
                console.log('blob4', blob4);
              } catch (e) {
                console.error(e);
              }

              // Linking.openURL(); //

            });
          }}
          title="ImagePicker"
        />

      </ScrollView>
    );
  }
}
