import * as React from 'react';
import { ScrollView, Text, Linking, Image } from 'react-native';
import { NavigationInjectedProps } from 'react-navigation';
import { ListItem } from 'react-native-elements';
import { Fs, Stat } from 'react-native-mo-fs';

interface State {
  stat?: Stat;
  mime?: string;
  blob?: Blob;
  sha1?: string;
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
    if (stat.exists && !stat.dir) {
      const blob = await Fs.readFile(path);
      const info = await Fs.getBlobInfo(blob, { sha1: true, image: true });
      console.log('info', info);
      this.setState({ blob: blob, sha1: info.sha1 });
      if (blob.type === 'image/jpeg' || blob.type === 'image/png') {
        // get image size?
        const thumbnail = await Fs.updateImage(blob, {
          matrix: [
            0.2, 0, 0,
            0, 0.2, 0,
            0, 0, 1,
          ],
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
                await Linking.openURL(Fs.getBlobURL(this.state.blob!));
              } catch (e) {
                console.log(e);
              }
            }}
          />
        )}

        {this.state.blob && (
          <ListItem
            chevron={true}
            title="Open 2"
            onPress={async () => {
              try {
                await Linking.openURL('file://' + path);
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
