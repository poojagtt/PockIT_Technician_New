import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fontFamily, Size, useTheme } from '../modules';
import Icon from './Icon';
interface HeaderProps {
  label: string;
  onBack?: () => void;
  onFilter?: () => void;
  onSearch?: () => void;
  rightChild?: React.ReactNode;
  leftChild?: React.ReactNode;
}
const Header: React.FC<HeaderProps> = ({
  label = 'Header',
  leftChild,
  onBack,
  onFilter,
  onSearch,
  rightChild,
}) => {
  const colors = useTheme();
  return (
    <View
      style={{
        height: 80,
        backgroundColor: colors.white,
        paddingHorizontal: Size.containerPadding,
        paddingVertical: 8,
        gap: 5,
        alignItems: 'flex-start',
        maxHeight: 100,
        }}>
      <View style={{ flexDirection: 'row' }}>
        {onBack ? (
          <Icon
            name="keyboard-backspace"
            type="MaterialCommunityIcons"
            onPress={onBack}
          />
        ) : null}
        {leftChild ? leftChild : null}


        {onFilter ? (
          <Icon
            name="filter"
            type="Feather"
            color={colors.background}
            onPress={onFilter}
          />
        ) : null}
        {onSearch ? (
          <Icon
            name="search"
            type="Ionicons"
            color={colors.background}
            onPress={onSearch}
          />
        ) : null}
        {rightChild ? rightChild : null}
      </View>
      <View>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            flex: 1,
            alignItems: 'center',
            fontSize: Size.xl,
            color: colors.black,
            fontFamily: fontFamily,
            fontWeight: '500'
          }}>
          {label}
        </Text>

        
      </View>
    </View>
  );
};
export default Header;
const styles = StyleSheet.create({
  container: {},
});