import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Linking,
} from 'react-native';
import {Reducers, useDispatch, useSelector} from '../../context';
import {apiCall, BASE_URL} from '../../modules/services';
import {_noProfile, SVG} from '../../assets';
import {
  fontFamily,
  Size,
  tokenStorage,
  useStorage,
  useTheme,
} from '../../modules';
import {Button, Icon, ImagePicker} from '../../components';
import {MenuRoutes} from '../../routes/Menu';
import DeviceInfo from 'react-native-device-info';
import SliderIndicator from '../../components/SliderIndicator';
import {RootState} from '../../context/reducers/store';
import messaging from '@react-native-firebase/messaging';

interface MenuProps extends MenuRoutes<'MainMenu'> {
  navigation: any;
}
const Menu: React.FC<MenuProps> = ({navigation}) => {
  const colors = useTheme();
  const dispatch = useDispatch();
  const {user, techStatus} = useSelector((state: RootState) => state.app);
  const appVersion = DeviceInfo.getVersion();

  // const {user} = useSelector(state => state.app);
  const [loading, setLoading] = useState<boolean>(false);
  const ID = user?.ID;
  const [loader, setLoader] = useState({
    profile: false,
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await apiCall
        .post('api/technician/get', {
          filter: ` AND ID = ${ID} `,
        })
        .then(res => res.data);
      if (response.data && response.data.length > 0) {
        const userData = response.data[0];
        dispatch(Reducers.setUser(userData));
      } else {
        Alert.alert('No user data found');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error fetching user data');
    } finally {
      setLoading(false);
    }
  };
  const logout = async () => {
    const deviceId = await DeviceInfo.getUniqueId();
    const body = {
      SESSION_KEY: deviceId,
      USER_ID: user?.ID,
    };
    try {
      apiCall
        .post('api/technician/logout', body)
        .then(async res => {
          if (res.data.code === 200) {
            const subscribedChannels = JSON.parse(
              useStorage.getString('SUBSCRIBED_CHANNELS') || '[]',
            );
            const chat_topic = useStorage.getString('CHAT_TOPIC');
            useStorage.clearAll();
            tokenStorage.clearToken();
            dispatch(Reducers.setSplash(true));
            subscribedChannels.map(async (item: any) => {
              await messaging()
                .unsubscribeFromTopic(item.CHANNEL_NAME)
                .then(value => {
                  console.log('unsubscribed from topic');
                })
                .catch(value => {
                  console.warn('err in unsubscribe of all_mem', value);
                });
            });
            if (chat_topic) {
              await messaging()
                .unsubscribeFromTopic(chat_topic)
                .then(() => {
                  console.log(`Unsubscribed from topic: ${chat_topic}`);
                });
            }
          } else {
            Alert.alert('Failed to Logout');
          }
        })
        .catch(err => {
          console.log('Error logout:', err);
        });
    } catch (error) {
      console.log('Error logout:', error);
    }
  };
  const uploadProfilePhoto = async (image: any) => {
    setLoader({...loader, profile: true});
    try {
      let formData = new FormData();
      const name = ('IMG_' + Date.now()).substring(0, 20) + '.jpg';
      formData.append('Image', {
        uri: image.fileUrl,
        type: image.fileType,
        name: name,
      });
      await apiCall
        .post('api/upload/TechnicianProfile', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        .then(res => {
          if (res.data && res.data.code == 200) {
            apiCall
              .post('api/technician/updateTechnicianProfile', {
                ID: user?.ID,
                NAME: user?.NAME,
                EMAIL_ID: user?.EMAIL_ID,
                PROFILE_PHOTO: name || user?.PROFILE_PHOTO,
                MOBILE_NUMBER: user?.MOBILE_NUMBER,
              })
              .then(response => {
                if (response.status == 200) {
                  fetchProfile();
                }
                setLoader({...loader, profile: false});
              })
              .catch(err => {
                setLoader({...loader, profile: false});
              });
          } else {
            setLoader({...loader, profile: false});
            return false;
          }
        })
        .catch(error => {
          console.log(error);
          return false;
        });
    } catch (error) {
      setLoader({...loader, profile: false});
    }
  };
  const menuItems = [
    {
      id: '9',
      icon: <Icon type="Feather" name="clock" size={25} />,
      label: 'Set availability',
      route: 'TimeSheet',
    },
    {
      id: '1',
      icon: <SVG.certificates width={Size['3xl']} height={Size['3xl']} />,
      label: 'Certifications',
      route: 'Certifications',
    },
    // {
    //   id: '2',
    //   icon: (
    //     <Icon
    //       type="Feather"
    //       name="credit-card"
    //       size={25}
    //     />
    //   ),
    //   label: 'Achievements',
    //   route: 'Achievements',
    // },
    {
      id: '3',
      icon: <SVG.skill width={Size['3xl']} height={Size['3xl']} />,
      label: 'Skills',
      route: 'Skills',
    },
    {
      id: '4',
      icon: <Icon type="SimpleLineIcons" name="graduation" size={26} />,
      label: 'Training',
      route: 'Training',
    },
    {
      id: '5',
      icon: <Icon type="Feather" name="briefcase" size={26} />,
      label: 'PockIT kit',
      route: 'PockItKit',
    },
    {
      id: '6',
      icon: <Icon type="Feather" name="settings" size={25} />,
      label: 'Settings',
      route: 'Settings',
    },
    {
      id: '7',
      icon: <Icon type="MaterialIcons" name="support-agent" size={27} />,
      label: 'Help and Support',
      route: 'HelpAndSupport',
    },
    {
      id: '8',
      icon: <Icon type="AntDesign" name="infocirlceo" size={23} />,
      label: 'About',
      route: 'About',
    },
    // {
    //   id: '10',
    //   icon: <Icon type="MaterialIcons" name="privacy-tip" size={23} />,
    //   label: 'Privacy Policy',
    //   route: 'About',
    // },
  ];
  return (
    <SafeAreaView style={[styles._container, {backgroundColor: colors.white}]}>
      {/* profile */}
      <View
        style={{
          backgroundColor: colors.white,
          marginBottom: 16,
          paddingHorizontal: Size.containerPadding,
          paddingTop: Size.containerPadding,
        }}>
        {/* <Icon
          type="MaterialIcons"
          name="keyboard-backspace"
          size={27}
          onPress={() => navigation.goBack()}
        /> */}
        <Text style={styles._heading}>Your profile</Text>
        <View
          style={{
            backgroundColor: colors.background,
            // height: 16,
            paddingHorizontal: Size.containerPadding,
            marginHorizontal: -Size.containerPadding,
          }}>
          <SliderIndicator
            navigation={navigation}
            from="P"
            onStatusChange={() => {}}
          />
        </View>
      </View>
      <View style={styles._profileSection}>
        <ImagePicker
          onCapture={res => {
            uploadProfilePhoto(res);
          }}
          style={{alignSelf: 'center'}}>
          <View
            style={[
              styles._profileImageContainer,
              {backgroundColor: colors.secondary},
            ]}>
            <Image
              source={
                user?.PROFILE_PHOTO
                  ? {
                      uri: `${BASE_URL}static/TechnicianProfile/${user?.PROFILE_PHOTO}`,
                    }
                  : _noProfile
              }
              style={styles._profileImage}
            />
            {techStatus && <View style={styles.onlineIndicator} />}
            <View style={styles._editIcon}>
              <Icon
                type="Octicons"
                name="pencil"
                size={19}
                style={{alignSelf: 'center'}}
                color={colors.primary}
              />
            </View>
          </View>
        </ImagePicker>
      </View>
      {/* name */}
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <View style={{marginHorizontal: Size.containerPadding}}>
          <Text style={styles._name}>{user?.NAME}</Text>
          <View
            style={{
              flexWrap: 'wrap',
              flexDirection: 'row',
              alignItems: 'center',
              // justifyContent: 'space-around',
              gap: 2,
            }}>
            <Text style={styles._contact}>{user?.MOBILE_NUMBER}</Text>
            <View
              style={{
                marginLeft:16,
                marginRight: 4,
                height: 4,
                width: 4,
                backgroundColor: '#98B7EF',
                borderRadius: 2,
              }}></View>
            <Text style={styles._contact}>{user?.EMAIL_ID}</Text>
            <Icon
              type="Octicons"
              name="pencil"
              size={20}
              color={colors.primary}
              style={{}}
              onPress={() => navigation.navigate('EditProfile')}
            />
          </View>
        </View>
      )}
      {/* line */}
      <View
        style={{
          width: '100%',
          borderWidth: 0.5,
          borderColor: '#ccc',
          marginTop: 20,
          marginBottom: Size.sm,
        }}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{gap: 3, paddingHorizontal: Size.containerPadding}}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              activeOpacity={0.7}
              key={index}
              style={styles._menuItem}
              onPress={() => {
                if (item.id == '10') {
                  const url =
                    'https://pockitapp.pockitengineers.com/privacy_policy_page';

                  Linking.openURL(url).catch(err => {
                    console.error('Error opening URL:', err);
                  });
                } else if (item.route) {
                  navigation.navigate(item.route);
                }
              }}>
              <View style={styles._menuLeft}>
                {item.icon}
                <Text style={styles._txt}>{item.label}</Text>
              </View>
              <Icon
                type="Entypo"
                name="chevron-small-right"
                size={25}
                color={'#8F90A6'}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Button
          primary={false}
          label="Logout"
          onPress={() => logout()}
          loading={loader.profile}
          style={{margin: 10}}
        />
        <Text
          style={{
            color: colors.primaryText2,
            textAlign: 'center',
            marginBottom: 5,
            fontFamily: fontFamily,
          }}>
          Version {appVersion}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};
export default Menu;

const styles = StyleSheet.create({
  _container: {
    flex: 1,

    // padding: Size.containerPadding,
  },
  onlineIndicator: {
    width: 18,
    height: 18,
    borderRadius: 8,
    backgroundColor: '#2A8F42',
    position: 'absolute',
    right: 10,
    top: 16,
    borderWidth: 3,
    borderColor: '#fff',
  },
  _heading: {
    fontSize: 20,
    fontWeight: 700,
    fontFamily: fontFamily,
    color: '#1C1C28',
    marginBottom: Size.sm,
  },
  _profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  _profileImageContainer: {
    width: 148,
    height: 148,
    backgroundColor: '#F36631',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  _profileImage: {
    width: 140,
    height: 140,
    borderRadius: 95,
  },
  _editIcon: {
    position: 'absolute',
    bottom: 24,
    right: -4,
    backgroundColor: '#fff',
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  _name: {
    fontSize: 24,
    fontWeight: 500,
    fontFamily: fontFamily,
    color: '#0E0E0E',
  },
  _contact: {
    fontSize: 14,
    fontWeight: 400,
    fontFamily: fontFamily,
    color: '#0E0E0E',
    marginRight: 8,
  },
  _menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  _menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  _txt: {
    fontWeight: 600,
    fontSize: 16,
    fontFamily: fontFamily,
    color: '#0E0E0E',
  },
  _modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  _modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  _modalTitle: {
    paddingBottom: 20,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  _closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  _optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 20,
  },
  _option: {
    alignItems: 'center',
  },
  _optionCircle: {
    width: 60,
    height: 60,
    borderRadius: 40,
    backgroundColor: 'lightgray',
    alignItems: 'center',
    justifyContent: 'center',
  },
  _optionText: {
    marginTop: 5,
    fontSize: 14,
  },
});
