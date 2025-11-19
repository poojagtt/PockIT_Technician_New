import React, {ReactNode} from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  GestureResponderEvent,
  TextStyle,
  ActivityIndicator,
  TextProps,
} from 'react-native';
import {Size, useTheme} from '../modules';
import Animated, {SlideInRight, SlideOutRight} from 'react-native-reanimated';
import Icon, {ICON_PROPS} from './Icon';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  labelStyle?: TextStyle;
  loading?: boolean;
  disable?: boolean;
  RightChild?: ReactNode;
  labelProps?: TextProps;
  primary?: boolean;
  Leftchild?: ReactNode;
}
const Button: React.FC<ButtonProps> = ({
  label = 'Button',
  onPress,
  style,
  disable,
  loading,
  labelStyle,
  RightChild,
  Leftchild,
  labelProps,
  primary = true,
  ...rest
 
}) => {
  const colors = useTheme();
  return (
    <TouchableOpacity
      style={[
        {
          height: 48,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          gap: 10,
          backgroundColor: disable ? '#666666' : primary ? colors.primary2 : colors.white,
          borderWidth: primary ? 0 : 1,
          borderColor: colors.primary2,
          opacity: disable ? 0.5 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disable || loading}
      {...rest}>
      <Text
        style={[
          {
            fontFamily: 'SF Pro Text',
            fontWeight: 500,
            fontSize: 16,
            lineHeight: 24,
            textAlign: 'center',
            color: disable ? colors.text : primary ? colors.white : colors.primary2,
          },
          labelStyle,
        ]}
        {...labelProps}>
        {'' + label}
      </Text>
    {  Leftchild ?(
        <Animated.View
          style={{position: 'absolute', left: Size.padding}}
          entering={SlideInRight.duration(300)}
          exiting={SlideOutRight.duration(300)}>
          {Leftchild}
        </Animated.View>):null}
      
      {RightChild ? (
        <Animated.View
          style={{position: 'absolute', right: Size.padding}}
          entering={SlideInRight.duration(300)}
          exiting={SlideOutRight.duration(300)}>
          {RightChild}
        </Animated.View>
      ) : null}
      {loading ? (
        <Animated.View
          style={{position: 'absolute', right: Size.padding}}
          entering={SlideInRight.duration(300)}
          exiting={SlideOutRight.duration(300)}>
          <ActivityIndicator color={primary ? colors.white : colors.primary2} />
        </Animated.View>
      ) : null}
    </TouchableOpacity>
  );
};
export default Button;
const styles = StyleSheet.create({
  _label: {
    flex: 1,
    textAlign: 'center',
    fontSize: Size.lg,
    letterSpacing: 0.89,
  },
  _button: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    alignItems: 'center',
    padding: Size.padding,
    borderRadius: Size.padding,
  },
});
