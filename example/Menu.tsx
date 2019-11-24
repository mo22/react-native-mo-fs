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
          onPress={async () => {
            if (Fs.ios.Module) {
              const res = await Fs.ios.Module.showImagePickerController({});
              console.log('res', res);
            }
          }}
          onLongPress={() => {
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
              const path = Fs.paths.docs + '/import_' + moment().format('YYYY-MM-DD_HH:mm:ss') + '.jpg';
              await Fs.writeFile(path, blob);
              blob.close();
              Alert.alert('Success', 'Imported to ' + path);
            });
          }}
          title="ImagePicker"
        />

        <ListItem
          onPress={async () => {
            if (Fs.ios.Module) {
              const res = await Fs.ios.Module.showDocumentPickerView({ utis: ['public.jpeg'] });
              if (res) {
                const url = res[0];
                console.log('url', url);
                const blob = await Fs.readURL(url);
                console.log('blob', blob);
              }
            }
            if (Fs.android.Module) {
              const res = await Fs.android.Module.getContent({});
              console.log('res', res);
              if (res) {
                const url = res[0];
                console.log('url', url);
                // const path = decodeURIComponent(url.slice(7));
                // console.log('path', path);
                const blob = await Fs.readURL(url);
                // const blob = await Fs.readFile(path);
                console.log('blob', blob);
              }
            }
          }}
          title="FilePicker"
        />

        <ListItem
          onPress={async () => {
            await Fs.pickFile({ types: ['image/jpeg', 'image/png'] });
          }}
          title="pickFile image"
        />

        <ListItem
          onPress={async () => {
            await Fs.pickFile({ types: ['application/pdf'] });
          }}
          title="pickFile pdf"
        />

        <ListItem
          onPress={async () => {
            const urls = await Fs.pickFile({ multiple: true });
            for (const url of urls) {
              const blob = await Fs.readURL(url);
              console.log('blob', url, blob);
              blob.close();
            }
          }}
          title="pickFile any multiple"
        />

        <ListItem
          onPress={async () => {
            const data = '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';
            const blob = await Fs.createBlob(data, 'base64');
            const path = Fs.paths.docs + '/' + moment().format('YYYY-MM-DD HH:mm:ss') + '.png';
            await Fs.writeFile(path, blob);
            blob.close();
            Alert.alert('Success', 'Imported to ' + path);
          }}
          title="create png"
        />

        <ListItem
          onPress={async () => {
            const data = 'Hello world!';
            const blob = await Fs.createBlob(data, 'utf8');
            const path = Fs.paths.docs + '/' + moment().format('YYYY-MM-DD HH:mm:ss') + '.txt';
            await Fs.writeFile(path, blob);
            blob.close();
            Alert.alert('Success', 'Imported to ' + path);
          }}
          title="create txt"
        />

        <ListItem
          onPress={async () => {
            const data = new Date().toISOString() + '\n';
            const blob = await Fs.createBlob(data, 'utf8');
            const path = Fs.paths.docs + '/append.txt';
            await Fs.appendFile(path, blob);
            blob.close();
          }}
          title="append log"
        />

        <ListItem
          onPress={async () => {
            try {
              await Fs.readFile('/blah');
            } catch (e) {
              Alert.alert('Error', String(e));
            }
          }}
          title="read non existent"
        />

        <ListItem
          onPress={async () => {
            const blob = await Fs.createBlob('', 'utf8');
            try {
              await Fs.writeFile('/blah/blubb', blob);
              Alert.alert('Success', 'write succesful');
            } catch (e) {
              Alert.alert('Error', String(e));
            }
            try {
              await Fs.appendFile('/blah/blubb', blob);
              Alert.alert('Success', 'append succesful');
            } catch (e) {
              Alert.alert('Error', String(e));
            }
            blob.close();
          }}
          title="write non existent"
        />


      </ScrollView>
    );
  }
}
