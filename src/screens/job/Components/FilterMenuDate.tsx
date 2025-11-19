import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {fontFamily, Size, useTheme} from '../../../modules';
import Modal from '../../../components/Modal';
import {Icon} from '../../../components';

const FilterMenuDate = ({
  isVisible,
  onMenuPress,
  selectedMenu,
}: {
  isVisible: boolean;
  onMenuPress: (selectedMenu: string) => void;
  selectedMenu: string;
}) => {
  const colors = useTheme();
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
            <TouchableOpacity
              onPress={() => onMenuPress('Ongoing')}
              style={{
                borderWidth: 1.5,
                borderColor:
                  selectedMenu == 'Ongoing' ? colors.primary2 : colors.white,
                padding: Size.paddingY,
                paddingHorizontal: Size.containerPadding,
                borderRadius: 8,
                backgroundColor:
                  selectedMenu == 'Ongoing' ? '#F5F9FF' : colors.white,
              }}>
              <Text
                style={{
                  fontFamily: fontFamily,
                  fontSize: 16,
                  fontWeight: '500',
                  color:
                    selectedMenu == 'Ongoing'
                      ? colors.primaryText
                      : colors.primaryText2,
                }}>
                {'Ongoing'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onMenuPress('Today')}
              style={{
                borderWidth: 1.5,
                borderColor:
                  selectedMenu == 'Today' ? colors.primary2 : colors.white,
                padding: Size.paddingY,
                paddingHorizontal: Size.containerPadding,
                borderRadius: 8,
                backgroundColor:
                  selectedMenu == 'Today' ? '#F5F9FF' : colors.white,
              }}>
              <Text
                style={{
                  fontFamily: fontFamily,
                  fontSize: 16,
                  fontWeight: '500',
                  color:
                    selectedMenu == 'Today'
                      ? colors.primaryText
                      : colors.primaryText2,
                }}>
                {'Today'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onMenuPress('Upcoming')}
              style={{
                borderWidth: 1.5,
                borderColor:
                  selectedMenu == 'Upcoming' ? colors.primary2 : colors.white,
                padding: Size.paddingY,
                paddingHorizontal: Size.containerPadding,
                borderRadius: 8,
                backgroundColor:
                  selectedMenu == 'Upcoming' ? '#F5F9FF' : colors.white,
              }}>
              <Text
                style={{
                  fontFamily: fontFamily,
                  fontSize: 16,
                  fontWeight: '500',
                  color:
                    selectedMenu == 'Upcoming'
                      ? colors.primaryText
                      : colors.primaryText2,
                }}>
                {'Upcoming'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onMenuPress('Previous')}
              style={{
                borderWidth: 1.5,
                borderColor:
                  selectedMenu == 'Previous' ? colors.primary2 : colors.white,
                padding: Size.paddingY,
                paddingHorizontal: Size.containerPadding,
                borderRadius: 8,
                backgroundColor:
                  selectedMenu == 'Previous' ? '#F5F9FF' : colors.white,
              }}>
              <Text
                style={{
                  fontFamily: fontFamily,
                  fontSize: 16,
                  fontWeight: '500',
                  color:
                    selectedMenu == 'Previous'
                      ? colors.primaryText
                      : colors.primaryText2,
                }}>
                {'Previous'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onMenuPress('Pending')}
              style={{
                borderWidth: 1.5,
                borderColor:
                  selectedMenu == 'Pending' ? colors.primary2 : colors.white,
                padding: Size.paddingY,
                paddingHorizontal: Size.containerPadding,
                borderRadius: 8,
                backgroundColor:
                  selectedMenu == 'Pending' ? '#F5F9FF' : colors.white,
              }}>
              <Text
                style={{
                  fontFamily: fontFamily,
                  fontSize: 16,
                  fontWeight: '500',
                  color:
                    selectedMenu == 'Pending'
                      ? colors.primaryText
                      : colors.primaryText2,
                }}>
                {'Pending'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onMenuPress('All')}
              style={{
                borderWidth: 1.5,
                borderColor:
                  selectedMenu == 'All' ? colors.primary2 : colors.white,
                padding: Size.paddingY,
                paddingHorizontal: Size.containerPadding,
                borderRadius: 8,
                backgroundColor:
                  selectedMenu == 'All' ? '#F5F9FF' : colors.white,
              }}>
              <Text
                style={{
                  fontFamily: fontFamily,
                  fontSize: 16,
                  fontWeight: '500',
                  color:
                    selectedMenu == 'All'
                      ? colors.primaryText
                      : colors.primaryText2,
                }}>
                {'All'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default FilterMenuDate;
