import * as React from 'react';
import { ScrollView } from 'react-native';
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

              // hmm no
              // const blob1 = await Fs.readURL(res.origURL!);
              // console.log('blob1', blob1);

              const blob2 = await Fs.readFile(res.uri.replace('file://', ''));
              console.log('blob2', blob2);

              // 2019-09-02 20:06:20.571876+0200 example[830:477932] { fileSize: 349782,
              // fileName: 'IMG_0008.PNG',
              // width: 750,
              // origURL: 'assets-library://asset/asset.JPG?id=C861A35F-FB24-4699-B93A-5770B6578E1C&ext=JPG',
              // type: 'image/jpeg',
              // height: 1334,
              // timestamp: '2019-04-04T08:13:23Z',
              // isVertical: true,
              // uri: 'file:///var/mobile/Containers/Data/Application/8DFD97BA-2E68-412C-97C6-6AFD54EE4EFE/tmp/8326B670-2D6F-4BEA-9303-0E1D34E45833.jpg' }

            });
          }}
          title="ImagePicker"
        />

      </ScrollView>
    );
  }
}
