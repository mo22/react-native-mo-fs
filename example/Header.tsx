import * as React from 'react';
import { SafeAreaInjectedProps, withSafeArea } from 'react-native-mo-safearea';
import { View, TouchableWithoutFeedback } from 'react-native';

// @withSafeArea
const Header = withSafeArea(class Header extends React.PureComponent<{} & SafeAreaInjectedProps> {

  public render() {
    console.log('Header.render', this.props.safeArea);
    return (
      <TouchableWithoutFeedback
        onPress={() => {
          console.log('test');
        }}
      >
        <View>
          {this.props.children}
        </View>
      </TouchableWithoutFeedback>
    );
  }

});
export default Header;
