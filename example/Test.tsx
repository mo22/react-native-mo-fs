import * as React from 'react';
import { View } from 'react-native';
import { NavigationInjectedProps } from 'react-navigation';

export default class Test extends React.Component<NavigationInjectedProps> {
  public render() {
    return (
      <View style={{ backgroundColor: 'yellow' }} />
    );
  }
}
