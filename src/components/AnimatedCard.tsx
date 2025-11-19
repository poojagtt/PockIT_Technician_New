import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
  Animated,
} from 'react-native';
import {Icon} from './index';
import {Size} from '../modules';

interface AnimatedCardProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  mainChildren?: React.ReactNode;
  children: React.ReactNode;
  titleStyle?: ViewStyle;
  containerStyle?: ViewStyle;
  titleColor?: string;
  icon?: React.ReactNode;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  title,
  isExpanded,
  onToggle,
  mainChildren,
  children,
  titleStyle,
  containerStyle,
  titleColor = '#0E0E0E',
  icon,
}) => {
  const rotateAnimation = React.useRef(new Animated.Value(0)).current;
  const heightAnimation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(rotateAnimation, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(heightAnimation, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isExpanded]);

  const rotateInterpolate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={[styles.card, containerStyle]}>
      <View>{mainChildren}</View>
      <TouchableOpacity activeOpacity={0.7} onPress={onToggle}>
        <View style={styles.header}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            {icon && <View style={{}}>{icon}</View>}
            <Animated.Text
              style={[styles.title, titleStyle, {color: titleColor}]}>
              {title}
            </Animated.Text>
          </View>
          <Animated.View
            style={{
              transform: [{rotate: rotateInterpolate}],
            }}>
            <Icon
              type="Entypo"
              name="chevron-small-down"
              size={24}
              color={'#636363'}
            />
          </Animated.View>
        </View>
      </TouchableOpacity>
      <Animated.View
        style={{
          maxHeight: heightAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1000],
          }),
          opacity: heightAnimation,
        }}>
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 3,
    padding: Size.containerPadding,
    borderWidth: 0.5,
    borderColor: '#CBCBCB',
    borderRadius: 8,
    backgroundColor: '#FDFDFD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'SF Pro Text',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
});

export default AnimatedCard;
