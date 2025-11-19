import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import {MenuRoutes} from '../../routes/Menu';
import {apiCall, BASE_URL} from '../../modules/services';
import {Reducers, useDispatch, useSelector} from '../../context';
import {_noProfile} from '../../assets';
import {Button, Icon, ImagePicker, TextInput} from '../../components';
import {fontFamily, Size, useTheme} from '../../modules';
import SuccessModal from '../../components/SuccessModal';
import {RadioButton} from 'react-native-paper';
import CustomRadioButton from '../../components/CustomRadioButton';

interface ProfileProps extends MenuRoutes<'EditProfile'> {}
const EditProfile: React.FC<ProfileProps> = ({navigation}) => {
  const {user} = useSelector(state => state.app);
  const colors = useTheme();
  const [loading, setLoading] = useState<boolean>(false);
  const [input, setInput] = useState({
    imageUrl: '',
    name: user?.NAME,
    mobile: user?.MOBILE_NUMBER,
    email: user?.EMAIL_ID,
    gender: user?.GENDER || 'M',
  });
  const dispatch = useDispatch();
  const [loader, setLoader] = useState({
    profile: false,
  });
  const [isModalVisible, setModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await apiCall
        .post('api/technician/get', {
          filter: ` AND ID = ${user?.ID} `,
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
  const updateProfile = async () => {
    setLoader(prev => ({...prev, profile: true}));
    try {
      let imageName = '';
      if (input.imageUrl) {
        const name = ('IMG_' + Date.now()).substring(0, 20) + '.jpg';
        let formData = new FormData();
        formData.append('Image', {
          uri: input.imageUrl,
          type: 'image/jpeg',
          name: name,
        });
        const res = await apiCall.post(
          'api/upload/TechnicianProfile',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );
        if (res.data?.code === 200) {
          imageName = name;
        } else {
          Alert.alert('Failed to upload image');
          return;
        }
      }
      const profileUpdateData = {
        ID: user?.ID,
        NAME: input.name,
        EMAIL_ID: input.email,
        PROFILE_PHOTO: imageName || user?.PROFILE_PHOTO,
        MOBILE_NUMBER: input.mobile,
        GENDER: gender,
      };
      const updateResponse = await apiCall.post(
        'api/technician/updateTechnicianProfile',
        profileUpdateData,
      );
      if (updateResponse.status == 200) {
        if (updateResponse.data?.is_new_mobile === 1) {
          navigation.navigate('OtpScreen', {
            mobile: input.mobile || '',
            email: input.email || '',
            name: input.name || '',
            photo: imageName || user?.PROFILE_PHOTO || '',
          });
        } else {
          setSuccessMessage('Profile updated successfully');
          fetchProfile();
          setModalVisible(true);
          setTimeout(() => {
            setModalVisible(false);
            navigation.goBack();
          }, 3000);
        }
      } else {
        Alert.alert('Failed', 'Failed to create profile update request');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Error updating profile');
    } finally {
      setLoader(prev => ({...prev, profile: false}));
    }
  };
  const [gender, setGender] = useState(user?.GENDER || 'M');

  return (
    <SafeAreaView
      style={[styles._container, {backgroundColor: colors.background}]}>
      <View
        style={{
          backgroundColor: colors.white,
          marginBottom: 16,
          paddingHorizontal: Size.containerPadding,
          paddingTop: Size.containerPadding,
        }}>
        <Icon
          type="MaterialIcons"
          name="keyboard-backspace"
          size={27}
          color={'#999999'}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles._heading}>Your profile</Text>
      </View>
      <ScrollView
        onScroll={() => {
          Keyboard.dismiss();
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {loading ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={styles._loadingIndicator}
          />
        ) : (
          <View style={{backgroundColor: colors.white, flex: 1}}>
            <View style={styles._profileSection}>
              <ImagePicker
                onCapture={res => {
                  setInput({...input, imageUrl: res.fileUrl});
                }}
                style={{alignSelf: 'center'}}>
                <View style={styles._profileImageContainer}>
                  <Image
                    source={
                      input.imageUrl
                        ? {uri: input.imageUrl}
                        : user?.PROFILE_PHOTO
                        ? {
                            uri: `${BASE_URL}static/TechnicianProfile/${user?.PROFILE_PHOTO}`,
                          }
                        : _noProfile
                    }
                    style={styles._profileImage}
                  />
                  <View style={styles._editIcon}>
                    <Icon
                      type="Octicons"
                      name="pencil"
                      size={19}
                      color={colors.primary}
                    />
                  </View>
                </View>
              </ImagePicker>
            </View>
            <View
              style={{
                backgroundColor: '#CBCBCB',
                height: 1,
                margin: Size.containerPadding,
              }}/>

            <View style={styles._inputContainer}>
              <TextInput
                onChangeText={name => {
                  setInput({...input, name});
                }}
                value={'' + input.name}
                label="Name"
              />
              <TextInput
                disable
                label="Mobile"
                value={'' + input.mobile}
                keyboardType="numeric"
                onChangeText={mobile => {
                  setInput({...input, mobile});
                }}
              />
              <TextInput
                disable
                label="Email"
                value={'' + input.email}
                keyboardType="email-address"
                onChangeText={email => {
                  setInput({...input, email});
                }}
              />
              <View style={{marginHorizontal: 5}}>
                <Text style={styles._genderLabel}>Gender</Text>

                <View style={styles._radioContainer}>
                  <View style={{flex: 1, flexDirection: 'row', padding: 16}}>
                    <CustomRadioButton
                      label="Male"
                      value="M"
                      selected={gender === 'M'}
                      onPress={setGender}
                    />
                    <View style={{marginLeft: 12}}>
                      <CustomRadioButton
                        label="Female"
                        value="F"
                        selected={gender === 'F'}
                        onPress={setGender}
                      />
                    </View>
                  </View>
                  {/* <View style={styles._radioButton}>
                      <RadioButton
                        value="M"
                        color={colors.primary2}
                        uncheckedColor="#999" // <- Add this
                      />
                      <Text style={styles._radioLabel}>Male</Text>
                    </View>
                  
                    <View style={styles._radioButton}>
                      <RadioButton
                        value="F"
                        color={colors.primary2}
                        uncheckedColor="#999" // <- Add this
                      />
                      <Text style={styles._radioLabel}>Female</Text>
                    </View> */}
                </View>
              </View>
            </View>
            {/* <View style={{height: Size.lg}} /> */}
          </View>
        )}
        <SuccessModal visible={isModalVisible} message={successMessage} />
      </ScrollView>
      <Button
        primary={false}
        label="Update profile"
        onPress={updateProfile}
        loading={loader.profile}
        style={{margin: 16}}
      />
    </SafeAreaView>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  _container: {
    flex: 1,
    // backgroundColor: '#fff',
    // padding: Size.containerPadding,
  },
  _heading: {
    fontSize: 20,
    fontWeight: 700,
    fontFamily: fontFamily,
    color: '#1C1C28',
    marginTop: Size.sm,
    marginBottom: Size.lg,
  },
  _profileSection: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    // marginBottom: Size.containerPadding,
  },
  _profileImageContainer: {
    width: 158,
    height: 158,
    borderRadius: 100,
    backgroundColor: '#F36631',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  _profileImage: {
    width: 150,
    height: 150,
    borderRadius: 95,
  },
  _editIcon: {
    position: 'absolute',
    bottom: 25,
    right: 0,
    backgroundColor: '#fff',
    height: 30,
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  _inputContainer: {
    margin: 10,
    gap: Size.lg,
    backgroundColor: '#ffffff',
  },
  _loadingIndicator: {
    marginTop: 50,
  },
  _verifyText: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{translateY: -35}],
    color: '#0000FF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  _genderLabel: {
    fontSize: 13,
    fontFamily: fontFamily,
    color: '#1C1C28',
    // marginBottom: Size.sm,
  },
  _radioContainer: {
    flexDirection: 'row',
    gap: Size.xl,
  },
  _radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  _radioLabel: {
    fontSize: 16,
    fontFamily: fontFamily,
    color: '#1C1C28',
  },
});
