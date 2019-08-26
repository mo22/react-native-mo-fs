import * as React from 'react';
import { View, KeyboardAvoidingView } from 'react-native';
import { NavigationInjectedProps, ScrollView, NavigationActions } from 'react-navigation';
import { SafeAreaView, withSafeAreaDecorator, SafeAreaInjectedProps } from 'react-native-mo-safearea';
import { ListItem } from 'react-native-elements';
import Header from './Header';

function keysOf<T extends {}>(obj: T): (keyof T)[] {
  return Object.keys(obj) as any;
}

class Test {
  public constructor(target: React.Component) {
    console.log('target', target.componentWillUnmount);
    console.log('target', Object.getPrototypeOf(target));
  }
}

@withSafeAreaDecorator
export default class SafeAreaInsideScrollView extends React.Component<NavigationInjectedProps & SafeAreaInjectedProps> {
  public state = {
    type: 'layout' as SafeAreaView['props']['type'],
    forceInsets: {
      top: 'auto' as 'always'|'never'|'auto',
      left: 'auto' as 'always'|'never'|'auto',
      right: 'auto' as 'always'|'never'|'auto',
      bottom: 'auto' as 'always'|'never'|'auto',
    },
    minPadding: {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    padding: {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    extraMargin: {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
  };

  public test = new Test(this);

  public componentWillUnmount() {
    console.log('SafeAreaInsideScrollView.componentWillUnmount');
  }

  public render() {
    const types: SafeAreaView['props']['type'][] = ['react', 'native', 'disabled', 'simple', 'layout'];
    const forceInsets: ('always'|'never'|'auto')[] = ['always', 'never', 'auto'];

    return (
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <ScrollView style={{
          backgroundColor: 'red',
          flex: 1,
          marginTop: this.state.extraMargin.top || 0,
          marginLeft: this.state.extraMargin.left || 0,
          marginRight: this.state.extraMargin.right || 0,
          marginBottom: this.state.extraMargin.bottom || 0,
        }}>
          <SafeAreaView
            style={{
              backgroundColor: 'purple',
              flex: 1,
            }}
            minPadding={this.state.minPadding}
            padding={this.state.padding}
            forceInsets={this.state.forceInsets}
            type={this.state.type}
          >
            <View style={{ backgroundColor: 'white' }}>
              <Header />

              <ListItem
                title="back"
                onPress={() => {
                  this.props.navigation.dispatch(NavigationActions.back());
                }}
              />

              <View style={{ height: 20 }} />

              {this.props.safeArea && keysOf(this.props.safeArea).map((i) => (
                <ListItem
                  key={i}
                  title={i}
                  rightTitle={this.props.safeArea[i].toString()}
                />
              ))}

              <View style={{ height: 20 }} />

              <ListItem
                title="type"
                buttonGroup={{
                  selectedIndex: types.indexOf(this.state.type),
                  buttons: types as string[],
                  onPress: (selectedIndex) => {
                    this.setState({ type: types[selectedIndex] });
                  },
                }}
              />

              <View style={{ height: 20 }} />

              {keysOf(this.state.forceInsets).map((i) => (
                <ListItem
                  key={i}
                  title={'forceInsets.' + i}
                  buttonGroup={{
                    selectedIndex: forceInsets.indexOf(this.state.forceInsets[i]),
                    buttons: forceInsets as string[],
                    onPress: (selectedIndex) => {
                      this.state.forceInsets[i] = forceInsets[selectedIndex];
                      this.forceUpdate();
                    },
                  }}
                />
              ))}

              <View style={{ height: 20 }} />

              {keysOf(this.state.padding).map((i) => (
                <ListItem
                  key={i}
                  title={'padding.' + i}
                  input={{
                    value: this.state.padding[i].toString(),
                    onChangeText: (value) => {
                      this.state.padding[i] = parseFloat(value);
                      this.forceUpdate();
                    },
                    keyboardType: 'numeric',
                  }}
                />
              ))}

              <View style={{ height: 20 }} />

              {keysOf(this.state.minPadding).map((i) => (
                <ListItem
                  key={i}
                  title={'minPadding.' + i}
                  input={{
                    value: this.state.minPadding[i].toString(),
                    onChangeText: (value) => {
                      this.state.minPadding[i] = parseFloat(value);
                      this.forceUpdate();
                    },
                    keyboardType: 'numeric',
                  }}
                />
              ))}

              <View style={{ height: 20 }} />

              {keysOf(this.state.extraMargin).map((i) => (
                <ListItem
                  key={i}
                  title={'extraMargin.' + i}
                  input={{
                    value: this.state.extraMargin[i].toString(),
                    onChangeText: (value) => {
                      this.state.extraMargin[i] = parseFloat(value);
                      this.forceUpdate();
                    },
                    keyboardType: 'numeric',
                  }}
                />
              ))}

              <View style={{ height: 20 }} />

              <ListItem
                onPress={() => {
                  this.props.navigation.dispatch(NavigationActions.navigate({ routeName: 'Test' }));
                }}
                title="show Test"
              />

            </View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
}
