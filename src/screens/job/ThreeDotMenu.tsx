import React, {useRef, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import {Icon} from '../../components';
import {fontFamily, Size} from '../../modules';

const ThreeDotMenu = ({
  isVisible,
  isSupport,
  isGuide,
  isPart,
  supportOnPress,
  guideOnPress,
  partOnPress,
}: {
  isVisible: boolean;
  isSupport: boolean;
  isGuide: boolean;
  isPart: boolean;
  supportOnPress?: () => void;
  guideOnPress?: () => void;
  partOnPress?: () => void;
}) => {
  const animationValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      openMenu();
    } else {
      closeMenu();
    }
  }, [isVisible]);

  const openMenu = () => {
    Animated.parallel([
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(animationValue, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animatedStyle = {
    opacity: animationValue,
    transform: [
      {
        scale: scaleValue,
      },
      {
        translateY: animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [-10, 0],
        }),
      },
    ],
  };

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
      ]}>
      {isSupport && (
        <TouchableOpacity
          onPress={supportOnPress}
          activeOpacity={0.8}
          style={styles.menuItem}>
          <Text style={styles.menuText}>Support</Text>
        </TouchableOpacity>
      )}
      {isGuide && (
        <TouchableOpacity
          onPress={guideOnPress}
          activeOpacity={0.8}
          style={styles.menuItem}>
          <Text style={styles.menuText}>Guide</Text>
        </TouchableOpacity>
      )}
      {isPart && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={partOnPress}
          style={styles.menuItem}>
          <Text style={styles.menuText}>Part Request</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 30,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 120,
    transformOrigin: 'top right',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1B1F',
    fontFamily: fontFamily,
  },
});

export default ThreeDotMenu;
