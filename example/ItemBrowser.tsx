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
          maxWidth: 32, // 256,
          maxHeight: 256,
          fill: true,
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
      console.log('arraybuffer', buffer.constructor.name, buffer.byteLength);
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

        {this.state.blob && Fs.ios.Module && (
          <React.Fragment>
            <ListItem
              chevron={true}
              title="Open In"
              onPress={async () => {
                const res = await Fs.ios.Module!.showDocumentInteractionController({ path: path, type: 'openin' });
                console.log('res', res);
              }}
            />
            <ListItem
              chevron={true}
              title="Options"
              onPress={async () => {
                const res = await Fs.ios.Module!.showDocumentInteractionController({ path: path, type: 'options' });
                console.log('res', res);
              }}
            />
            <ListItem
              chevron={true}
              title="Preview"
              onPress={async () => {
                const res = await Fs.ios.Module!.showDocumentInteractionController({ path: path, type: 'preview' });
                console.log('res', res);
              }}
            />
          </React.Fragment>
        )}

        {this.state.blob && Fs.android.Module && (
          <React.Fragment>
            <ListItem
              chevron={true}
              title="Send To"
              onPress={async () => {
                await Fs.android.Module!.sendIntentChooser({ path: path, title: 'Choose', subject: 'subject', text: 'text' });
              }}
            />
            <ListItem
              chevron={true}
              title="View"
              onPress={async () => {
                const uri = await Fs.android.Module!.getProviderUri(path);
                console.log('ASD', path);
                console.log('ASD', uri);
                await Fs.android.Module!.viewIntentChooser({ path: path, title: 'Choose', type: 'image/jpeg' });
              }}
            />
          </React.Fragment>
        )}

        {this.state.thumbnail && (
          <Image
            style={{ width: 32, height: 256 }}
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
