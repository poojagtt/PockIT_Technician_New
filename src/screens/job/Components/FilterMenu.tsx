import React from 'react';
import {Text, TouchableOpacity, StyleSheet, View} from 'react-native';
import {fontFamily, Size, useTheme} from '../../../modules';
import Modal from '../../../components/Modal';
import {Icon} from '../../../components';

const FilterMenu = ({
  isVisible,
  onMenuPress,
  selectedMenu,
}: {
  isVisible: boolean;
  onMenuPress: (item: any) => void;
  selectedMenu: {label: string; id: string};
}) => {
  const colors = useTheme();
  const data = [
    {label: 'Overdue', id: 'overdue'},
    {label: 'Completed', id: 'completed'},
    // {label: 'Cancelled', id: 'cancelled'},
    {label: 'All', id: 'all'},
  ];
  return (
    <Modal
      show={isVisible}
      onClose={() => onMenuPress(selectedMenu)}
      style={{justifyContent: 'flex-end', borderRadius: 0}}
      containerStyle={{
        borderRadius: 10,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        margin: 0,
        backgroundColor: colors.white,
      }}>
      <View style={{}}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onMenuPress(selectedMenu)}
          style={{
            position: 'absolute',
            alignSelf: 'center',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.white,
            padding: 6,
            borderRadius: 100,
            top: -65,
          }}>
          <Icon name="close" type="Ionicons" size={28} />
        </TouchableOpacity>
        <View>
          <Text
            style={{
              fontFamily: fontFamily,
              fontSize: 16,
              fontWeight: '600',
              color: colors.primaryText,
            }}>
            Filter
          </Text>
          <View style={{padding: Size.sm}}>
            {data.map((item, index) => {
              return (
                <TouchableOpacity
                  onPress={() => {
                    onMenuPress(item);
                  }}
                  key={index}
                  style={{
                    marginBottom: 2,
                    borderWidth: 1.5,
                    borderColor:
                      item.id == selectedMenu.id
                        ? colors.primary2
                        : colors.white,
                    padding: Size.paddingY,
                    paddingHorizontal: Size.containerPadding,
                    borderRadius: 8,
                    backgroundColor:
                      item.id == selectedMenu.id ? '#F5F9FF' : colors.white,
                  }}>
                  <Text
                    style={{
                      fontFamily: fontFamily,
                      fontSize: 16,
                      fontWeight: '500',
                      color:
                        item.id == selectedMenu.id
                          ? colors.primaryText
                          : colors.primaryText2,
                    }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default FilterMenu;
