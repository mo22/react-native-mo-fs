import * as React from 'react';
import { ScrollView, Text, Image } from 'react-native';
import { NavigationInjectedProps } from 'react-navigation';
import { ListItem } from 'react-native-elements';
import { Fs, Stat } from 'react-native-mo-fs';

interface State {
  stat?: Stat;
  mime?: string;
  blob?: Blob;
  sha1?: string;
  uti?: string;
  thumbnail?: Blob;
  text?: string;
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
    if (Fs.ios.Module) {
      this.setState({ uti: await Fs.ios.Module.getUti(path) });
    }
    if (stat.exists && !stat.dir) {
      const blob = await Fs.readFile(path);
      const info = await Fs.getBlobInfo(blob, { sha1: true, image: true, exif: true });
      console.log('info', info);
      this.setState({ blob: blob, sha1: info.sha1 });
      if (blob.type === 'image/jpeg' || blob.type === 'image/png') {
        // get image size?
        const thumbnail = await Fs.resizeImage(blob, {
          maxWidth: 256,
          maxHeight: 256,
          encoding: 'jpeg',
          quality: 0.5,
        });
        this.setState({ thumbnail: thumbnail });
      }
      if (blob.type === 'text/plain' || blob.type === 'application/json') {
        const text = await Fs.readBlob(blob, 'utf8');
        this.setState({ text: text.slice(0, 8000) });
      }
      const buffer = await Fs.readBlob(blob.slice(0, 100), 'arraybuffer');
      console.log('buffer', buffer);
    }
  }

  public componentWillUnmount() {
    if (this.state.thumbnail) {
      this.state.thumbnail.close();
    }
    if (this.state.blob) {
      this.state.blob.close();
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
              subtitle={String(this.state.stat.size)}
            />
            <ListItem
              title="modified"
              subtitle={String(this.state.stat.modified)}
            />
          </React.Fragment>
        )}

        {this.state.mime && (
          <ListItem
            title="mime"
            subtitle={this.state.mime}
          />
        )}

        {this.state.uti && (
          <ListItem
            title="uti"
            subtitle={this.state.uti}
          />
        )}

        {this.state.blob && (
          <ListItem
            title="blob"
            subtitle={Fs.getBlobURL(this.state.blob)}
          />
        )}

        {this.state.blob && (
          <ListItem
            title="blob.type"
            subtitle={this.state.blob.type}
          />
        )}

        {this.state.sha1 && (
          <ListItem
            title="sha1"
            subtitle={this.state.sha1}
          />
        )}

        {this.state.blob && (
          <ListItem
            chevron={true}
            title="Open"
            onPress={async () => {
              try {
                if (Fs.ios.Module) {
                  await Fs.ios.Module.showDocumentInteractionController({ path: path, type: 'openin' });
                }
                if (Fs.android.Module) {
                  await Fs.android.Module.sendIntentChooser({ path: path });
                }
              } catch (e) {
                console.log(e);
              }
            }}
          />
        )}

        {this.state.thumbnail && (
          <Image
            style={{ width: 100, height: 100 }}
            source={{ uri: Fs.getBlobURL(this.state.thumbnail) }}
          />
        )}

        {this.state.text && (
          <Text>{this.state.text}</Text>
        )}

      </ScrollView>
    );
  }
}
