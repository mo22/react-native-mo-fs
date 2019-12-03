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
  extension?: string;
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
      this.setState({ uti: await Fs.ios.Module.getUtiForPath(path) });
    }
    this.setState({ extension: mime && await Fs.getExtensionForMimeType(mime) });
    if (stat.exists && !stat.dir) {
      const blob = await Fs.readFile(path);
      const sha1 = await Fs.getBlobHash(blob, 'sha1');
      const exif = await Fs.getExif(blob);
      console.log('exif', exif);
      this.setState({ blob: blob, sha1: sha1 });
      if (blob.type === 'image/jpeg' || blob.type === 'image/png') {
        // get image size?
        const thumbnail = await Fs.resizeImage(blob, {
          maxWidth: 256,
          maxHeight: 256,
          fill: true,
          encoding: 'jpeg',
          quality: 0.5,
        });
        this.setState({ thumbnail: thumbnail });
      } else if (blob.type.startsWith('video/')) {
        console.log('video!');
        if (Fs.ios.Module) {
          const thumbnail = new Blob();
          thumbnail.data = await Fs.ios.Module.assetImageGenerator({
            url: 'file://' + path,
            encoding: 'jpeg',
            quality: 0.5,
          })
          this.setState({ thumbnail: thumbnail });
        } else if (Fs.android.Module) {
          const thumbnail = new Blob();
          thumbnail.data = await Fs.android.Module.createThumbnail({
            path: path,
            encoding: 'jpeg',
            quality: 0.5,
          })
          this.setState({ thumbnail: thumbnail });
        }
      }
      if (blob.type === 'text/plain' || blob.type === 'application/json') {
        const text = await Fs.readBlob(blob, 'utf8');
        this.setState({ text: text.slice(0, 8000) });
      }
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

        {this.state.extension && (
          <ListItem
            title="extension"
            subtitle={this.state.extension}
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
              title="iOS Open In"
              onPress={async () => {
                const res = await Fs.ios.Module!.showDocumentInteractionController({ path: path, type: 'openin' });
                console.log('res', res);
              }}
            />
            <ListItem
              chevron={true}
              title="iOS Options"
              onPress={async () => {
                const res = await Fs.ios.Module!.showDocumentInteractionController({ path: path, type: 'options' });
                console.log('res', res);
              }}
            />
            <ListItem
              chevron={true}
              title="iOS Preview"
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
              title="Android Send To"
              onPress={async () => {
                await Fs.android.Module!.sendIntentChooser({ path: path, title: 'Choose', subject: 'subject', text: 'text' });
              }}
            />
            <ListItem
              chevron={true}
              title="Android View"
              onPress={async () => {
                await Fs.android.Module!.viewIntentChooser({ path: path, title: 'Choose' });
              }}
            />
            <ListItem
              chevron={true}
              title="Android View Blob"
              onPress={async () => {
                const blob = await Fs.readFile(path);
                const uri = Fs.getBlobURL(blob);
                console.log('uri', uri);
                await Fs.android.Module!.viewIntentChooser({ url: uri, title: 'Choose' });
                // blob.close() ?
              }}
            />
          </React.Fragment>
        )}

        {this.state.blob && (
          <React.Fragment>
            <ListItem
              chevron={true}
              title="viewFile"
              onPress={async () => {
                await Fs.viewFile(path);
              }}
            />
            <ListItem
              chevron={true}
              title="shareFile"
              onPress={async () => {
                await Fs.shareFile(path);
              }}
            />
          </React.Fragment>
        )}

        {this.state.thumbnail && (
          <Image
            style={{ width: 256, height: 256 }}
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
