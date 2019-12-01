import * as React from 'react';
import { ScrollView, Alert } from 'react-native';
import { NavigationInjectedProps, NavigationActions } from 'react-navigation';
import { ListItem } from 'react-native-elements';
import ImagePicker from 'react-native-image-picker';
import { Fs } from 'react-native-mo-fs';
import moment from 'moment';
import * as forge from 'node-forge';
import { Buffer } from 'buffer';



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
            const res = await Fs.pickImage({ type: 'image' });
            if (res) {
              // @TODO: extension for mime type?
              const blob = await Fs.readURL(res);
              const path = Fs.paths.docs + '/import_' + moment().format('YYYY-MM-DD_HH:mm:ss') + '.jpg';
              await Fs.writeFile(path, blob);
              blob.close();
              Alert.alert('Success', 'Imported to ' + path);
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
            const res = await Fs.pickImage({ type: 'video' });
            if (res) {
              const blob = await Fs.readURL(res);
              const path = Fs.paths.docs + '/import_' + moment().format('YYYY-MM-DD_HH:mm:ss') + '.jpg';
              await Fs.writeFile(path, blob);
              blob.close();
              Alert.alert('Success', 'Imported to ' + path);
            }
          }}
          title="ImagePicker video"
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
            const data = 'R0lGODlhPQBEAPeoAJosM//AwO/AwHVYZ/z595kzAP/s7P+goOXMv8+fhw/v739/f+8PD98fH/8mJl+fn/9ZWb8/PzWlwv///6wWGbImAPgTEMImIN9gUFCEm/gDALULDN8PAD6atYdCTX9gUNKlj8wZAKUsAOzZz+UMAOsJAP/Z2ccMDA8PD/95eX5NWvsJCOVNQPtfX/8zM8+QePLl38MGBr8JCP+zs9myn/8GBqwpAP/GxgwJCPny78lzYLgjAJ8vAP9fX/+MjMUcAN8zM/9wcM8ZGcATEL+QePdZWf/29uc/P9cmJu9MTDImIN+/r7+/vz8/P8VNQGNugV8AAF9fX8swMNgTAFlDOICAgPNSUnNWSMQ5MBAQEJE3QPIGAM9AQMqGcG9vb6MhJsEdGM8vLx8fH98AANIWAMuQeL8fABkTEPPQ0OM5OSYdGFl5jo+Pj/+pqcsTE78wMFNGQLYmID4dGPvd3UBAQJmTkP+8vH9QUK+vr8ZWSHpzcJMmILdwcLOGcHRQUHxwcK9PT9DQ0O/v70w5MLypoG8wKOuwsP/g4P/Q0IcwKEswKMl8aJ9fX2xjdOtGRs/Pz+Dg4GImIP8gIH0sKEAwKKmTiKZ8aB/f39Wsl+LFt8dgUE9PT5x5aHBwcP+AgP+WltdgYMyZfyywz78AAAAAAAD///8AAP9mZv///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAAKgALAAAAAA9AEQAAAj/AFEJHEiwoMGDCBMqXMiwocAbBww4nEhxoYkUpzJGrMixogkfGUNqlNixJEIDB0SqHGmyJSojM1bKZOmyop0gM3Oe2liTISKMOoPy7GnwY9CjIYcSRYm0aVKSLmE6nfq05QycVLPuhDrxBlCtYJUqNAq2bNWEBj6ZXRuyxZyDRtqwnXvkhACDV+euTeJm1Ki7A73qNWtFiF+/gA95Gly2CJLDhwEHMOUAAuOpLYDEgBxZ4GRTlC1fDnpkM+fOqD6DDj1aZpITp0dtGCDhr+fVuCu3zlg49ijaokTZTo27uG7Gjn2P+hI8+PDPERoUB318bWbfAJ5sUNFcuGRTYUqV/3ogfXp1rWlMc6awJjiAAd2fm4ogXjz56aypOoIde4OE5u/F9x199dlXnnGiHZWEYbGpsAEA3QXYnHwEFliKAgswgJ8LPeiUXGwedCAKABACCN+EA1pYIIYaFlcDhytd51sGAJbo3onOpajiihlO92KHGaUXGwWjUBChjSPiWJuOO/LYIm4v1tXfE6J4gCSJEZ7YgRYUNrkji9P55sF/ogxw5ZkSqIDaZBV6aSGYq/lGZplndkckZ98xoICbTcIJGQAZcNmdmUc210hs35nCyJ58fgmIKX5RQGOZowxaZwYA+JaoKQwswGijBV4C6SiTUmpphMspJx9unX4KaimjDv9aaXOEBteBqmuuxgEHoLX6Kqx+yXqqBANsgCtit4FWQAEkrNbpq7HSOmtwag5w57GrmlJBASEU18ADjUYb3ADTinIttsgSB1oJFfA63bduimuqKB1keqwUhoCSK374wbujvOSu4QG6UvxBRydcpKsav++Ca6G8A6Pr1x2kVMyHwsVxUALDq/krnrhPSOzXG1lUTIoffqGR7Goi2MAxbv6O2kEG56I7CSlRsEFKFVyovDJoIRTg7sugNRDGqCJzJgcKE0ywc0ELm6KBCCJo8DIPFeCWNGcyqNFE06ToAfV0HBRgxsvLThHn1oddQMrXj5DyAQgjEHSAJMWZwS3HPxT/QMbabI/iBCliMLEJKX2EEkomBAUCxRi42VDADxyTYDVogV+wSChqmKxEKCDAYFDFj4OmwbY7bDGdBhtrnTQYOigeChUmc1K3QTnAUfEgGFgAWt88hKA6aCRIXhxnQ1yg3BCayK44EWdkUQcBByEQChFXfCB776aQsG0BIlQgQgE8qO26X1h8cEUep8ngRBnOy74E9QgRgEAC8SvOfQkh7FDBDmS43PmGoIiKUUEGkMEC/PJHgxw0xH74yx/3XnaYRJgMB8obxQW6kL9QYEJ0FIFgByfIL7/IQAlvQwEpnAC7DtLNJCKUoO/w45c44GwCXiAFB/OXAATQryUxdN4LfFiwgjCNYg+kYMIEFkCKDs6PKAIJouyGWMS1FSKJOMRB/BoIxYJIUXFUxNwoIkEKPAgCBZSQHQ1A2EWDfDEUVLyADj5AChSIQW6gu10bE/JG2VnCZGfo4R4d0sdQoBAHhPjhIB94v/wRoRKQWGRHgrhGSQJxCS+0pCZbEhAAOw==';
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

        <ListItem
          onPress={async () => {
            console.log('create 1 MB random file');
            // const data = forge.random.getBytesSync(1024 * 1024);
            const data = forge.random.getBytesSync(1024 * 8);
            console.log('have data');
            const blob = await Fs.createBlob(Buffer.from(data, 'binary'), 'arraybuffer');
            console.log('have blob');
            try {
              {
                const md = forge.md.md5.create();
                md.update(data);
                const mdhash = Buffer.from(md.digest().data, 'binary').toString('hex');
                const hash = await Fs.getBlobHash(blob, 'md5');
                console.log('md5', hash, mdhash);
                if (hash != mdhash) throw new Error('sha1 hash failure');
              }
              {
                const md = forge.md.sha1.create();
                md.update(data);
                const mdhash = Buffer.from(md.digest().data, 'binary').toString('hex');
                const hash = await Fs.getBlobHash(blob, 'sha1');
                console.log('sha1', hash, mdhash);
                if (hash != mdhash) throw new Error('sha1 hash failure');
              }
              {
                const md = forge.md.sha256.create();
                md.update(data);
                const mdhash = Buffer.from(md.digest().data, 'binary').toString('hex');
                const hash = await Fs.getBlobHash(blob, 'sha256');
                console.log('sha256', hash, mdhash);
                if (hash != mdhash) throw new Error('sha1 hash failure');
              }
              {
                const md = forge.hmac.create();
                md.start('sha256', 'keykeykey');
                md.update(data);
                const mdhash = Buffer.from(md.digest().data, 'binary').toString('hex');
                const hash = await Fs.getBlobHmac(blob, 'sha256', Buffer.from('keykeykey').toString('base64'));
                console.log('hmac-sha256', hash, mdhash);
                if (hash != mdhash) throw new Error('sha256 hmac failure');
              }
              {
                const key = Buffer.from('01234567890123456789012345678901');
                // const iv = Buffer.from('01234567890123456789012345678901');
                const iv = Buffer.from('0123456789012345');

                const cipher = forge.cipher.createCipher('AES-CBC', new forge.util.ByteStringBuffer(key));
                cipher.start({ iv: iv.toString('binary') });
                cipher.update(new forge.util.ByteStringBuffer(data));
                cipher.finish();
                const cipherRef = Buffer.from(cipher.output.data, 'binary');

                const enc = await Fs.cryptBlob(blob, {
                  algorithm: 'aes-cbc',
                  direction: 'encrypt',
                  key: key,
                  iv: iv,
                });
                const encData = Buffer.from(await Fs.readBlob(enc, 'arraybuffer'));
                // console.log('A', cipherRef.byteLength);
                // console.log('B', encData.byteLength);
                // console.log('A', cipherRef.toString('base64'));
                // console.log('B', encData.toString('base64'));
                if (cipherRef.toString('base64') !== encData.toString('base64')) throw new Error('aes failure');
                const dec = await Fs.cryptBlob(enc, {
                  algorithm: 'aes-cbc',
                  direction: 'decrypt',
                  key: key,
                  iv: iv,
                });
                const decData = Buffer.from(await Fs.readBlob(dec, 'arraybuffer'));
                if (decData.toString('binary') !== data) throw new Error('aes decode failure');
                enc.close();
                dec.close();
              }
              Alert.alert('hashes match');
            } finally {
              blob.close();
            }
          }}
          title="test hash and crypto"
        />

        <ListItem
          onPress={async () => {
            const path = Fs.paths.docs + '/test.dat';
            const b1 = await Fs.createBlob('hello', 'utf8');
            const b2 = await Fs.createBlob(' world', 'utf8');
            if (Fs.ios.Module) {
              await Fs.ios.Module.writeFile({ path: path, blob: b1.data, offset: 0, truncate: true });
              await Fs.ios.Module.writeFile({ path: path, blob: b2.slice(1, -1).data, offset: -1, truncate: true });
              const r1 = new Blob(); r1.data = await Fs.ios.Module.readFile({ path: path, offset: 1 });
              const res = await Fs.readBlob(r1, 'utf8');
              r1.close();
              if (res != 'elloworl') throw new Error('failed');
            }
            b1.close();
            b2.close();
          }}
          title="test offset read"
        />

      </ScrollView>
    );
  }
}
