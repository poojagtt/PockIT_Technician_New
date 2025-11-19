import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Modal as RNModal,
} from 'react-native';
import {MenuRoutes} from '../../routes/Menu';
import {Button, Icon, ImagePicker, TextInput} from '../../components';
import {fontFamily, GlobalStyle, Size, useTheme} from '../../modules';
import moment from 'moment';
import {useSelector} from '../../context';
import {apiCall, BASE_URL} from '../../modules/services';
import SuccessModal from '../../components/SuccessModal';
import {_defaultImage} from '../../assets';
import Toast from '../../components/Toast';
import DateTimePicker from '@react-native-community/datetimepicker';

interface CertificationsFormProps extends MenuRoutes<'CertificationsForm'> {}

const CertificationsForm: React.FC<CertificationsFormProps> = ({
  navigation,
  route,
}) => {
  // @ts-ignore
  const refreshCertifications = route?.params?.refreshCertifications;
  // @ts-ignore
  const certification = route?.params?.certification || {};
  const colors = useTheme();
  const [isEditing, setIsEditing] = useState(
    Object.keys(certification).length > 0,
  );
  const [name, setName] = useState(isEditing ? certification.NAME || '' : '');
  const [organization, setOrganization] = useState(
    isEditing ? certification.ISSUED_BY_ORGANIZATION_NAME || '' : '',
  );
  const [credentialId, setCredentialId] = useState(
    isEditing ? certification.CREDENTIAL_ID || '' : '',
  );
  const [imageUri, setImageUri] = useState(
    isEditing && certification.CERTIFICATE_PHOTO
      ? `${BASE_URL}static/CertificatePhotos/${certification.CERTIFICATE_PHOTO}`
      : null,
  );
  const [date, setDate] = useState(
    isEditing && certification.ISSUED_DATE
      ? moment(certification.ISSUED_DATE, 'YYYY-MM-DD').toDate()
      : new Date(),
  );
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const {user} = useSelector(state => state.app);
  const [isModalVisible, setModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleImageCapture = (data: {fileUrl: string}) => {
    setImageUri(data.fileUrl);
  };

  const handleSubmit = async () => {
    if (!imageUri) {
      Toast('Please add certificate photo');
      return;
    } else if (!name) {
      Toast('Name field required!');
      return;
    } else if (!organization) {
      Toast('Organization field required!');
      return;
    } else if (!date) {
      Toast('Date field required!');
      return;
    }
    setLoading(true);
    let certificatePhotoName = certification.CERTIFICATE_PHOTO || '';
    try {
      if (
        imageUri &&
        imageUri !==
          `${BASE_URL}static/CertificatePhotos/${certificatePhotoName}`
      ) {
        let formData = new FormData();
        const fileName = ('IMG_' + Date.now()).substring(0, 20) + '.jpg';
        formData.append('Image', {
          uri: imageUri,
          type: 'image/jpeg',
          name: fileName,
        });
        const uploadRes = await apiCall.post(
          'api/upload/CertificatePhotos',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );
        if (uploadRes.data && uploadRes.data.code === 200) {
          certificatePhotoName = fileName;
        } else {
          Alert.alert('Error', 'Image upload failed');
          return;
        }
      }
      const requestData = {
        ID: isEditing ? certification.ID : undefined,
        CERTIFICATE_PHOTO: certificatePhotoName,
        NAME: name,
        ISSUED_BY_ORGANIZATION_NAME: organization,
        CREDENTIAL_ID: credentialId,
        STATUS: 'P',
        REJECT_REMARK: '',
        TECHNICIAN_ID: user?.ID,
        TECHNICIAN_NAME: user?.NAME,
        ISSUED_DATE: moment(date).format('YYYY-MM-DD HH:mm:ss'),
        CLIENT_ID: 1,
      };
      let res;
      if (isEditing) {
        res = await apiCall.put(
          'api/techniciancertificaterequest/update',
          requestData,
        );
      } else {
        res = await apiCall.post(
          'api/techniciancertificaterequest/create',
          requestData,
        );
      }
      setSuccessMessage(
        isEditing
          ? `Certification ${name} Updated Successfully`
          : `Certification ${name} has been sent for approval. We will notify you once approved.`,
      );
      setModalVisible(true);
      if (refreshCertifications) {
        refreshCertifications();
      }
      setTimeout(() => {
        setModalVisible(false);
        navigation.goBack();
      }, 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to the server');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container]}>
      <View style={{paddingHorizontal: 16}}>
        <Icon
          type="MaterialIcons"
          name="keyboard-backspace"
          size={27}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.title}>
          {isEditing ? 'Edit Certificate' : 'Add Certificate'}
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={{paddingBottom: 50}}
        style={{flex: 1, marginHorizontal: 16}}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <ImagePicker
          style={{alignSelf: 'center'}}
          onCapture={handleImageCapture}>
          <View style={styles.imageContainer}>
            <Image
              style={styles.image}
              source={imageUri ? {uri: imageUri} : _defaultImage}
            />
            <View style={styles.editIcon}>
              <Icon
                type="Feather"
                name="upload"
                size={18}
                style={{alignSelf: 'center'}}
                color={colors.primary}
              />
            </View>
          </View>
        </ImagePicker>
        <View style={{flex: 1, gap: 12}}>
          <TextInput
            label="Certificate Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter certificate name"
            maxLength={128}
          />

          <TextInput
            value={organization}
            onChangeText={setOrganization}
            placeholder="Enter issuing organization name"
            label="Issuing Organization Name"
            maxLength={256}
          />

          <View>
            <Text
              style={[GlobalStyle.fieldLabel, {color: colors.text}]}
              numberOfLines={1}
              adjustsFontSizeToFit>
              Issued Date
            </Text>
            <TouchableOpacity
              style={[
                GlobalStyle.field,
                {
                  borderColor: '#CBCBCB',
                  marginTop: 3,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                },
              ]}
              onPress={() => setOpen(true)}>
              <Text
                style={{
                  textAlign: 'left',
                  flex: 1,
                  color: colors.text,
                  fontFamily: fontFamily,
                }}>
                {date ? date.toDateString() : 'Select Issued Date'}
              </Text>
              <Icon name="calendar" type="AntDesign" color={colors.primary} />
            </TouchableOpacity>
          </View>

         

          <View style={{marginBottom: 16}}>
            <Text
              style={[
                GlobalStyle.fieldLabel,
                {color: colors.text, marginBottom: 4},
              ]}>
              Credential ID
            </Text>

            <TextInput
              value={credentialId}
              onChangeText={setCredentialId}
              placeholder="Enter credential ID"
              placeholderTextColor="#999"
              style={styles.input1}
              maxLength={128}
            />
          </View>
        </View>
      </ScrollView>
      <View style={{gap: 8, marginTop: Size.sm, marginHorizontal: 16}}>
        <Button
          label={isEditing ? 'Update' : 'Add'}
          loading={loading}
          onPress={handleSubmit}
        />
        <Button
          primary={false}
          label="Cancel"
          onPress={() => navigation.goBack()}
        />
      </View>

      <SuccessModal visible={isModalVisible} message={successMessage} />
      {/* {open && (
        <DatePicker
          modal
          open={open}
          date={date || new Date()}
          mode="date"
          onConfirm={selectedDate => {
            setOpen(false);
            setDate(selectedDate);
          }}
          onCancel={() => {
            setOpen(false);
          }}
          maximumDate={new Date()}
        />
      )} */}

      {open &&
        (Platform.OS === 'ios' ? (
          <RNModal
            transparent
            animationType="fade"
            visible={open}
            onRequestClose={() => setOpen(false)}>
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.3)',
              }}>
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 10,
                  padding: 16,
                  width: '90%',
                  alignItems: 'center',
                }}>
                <DateTimePicker
                  value={date || new Date()}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    if (event.type === 'set' && selectedDate)
                      setDate(selectedDate);
                  }}
                />
                <Button
                  label="Done"
                  style={{marginTop: 10, width: 100}}
                  onPress={() => setOpen(false)}
                />
              </View>
            </View>
          </RNModal>
        ) : (
          <DateTimePicker
            value={date || new Date()}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={(event, selectedDate) => {
              setOpen(false);
              if (event.type === 'set' && selectedDate) setDate(selectedDate);
            }}
          />
        ))}
    </SafeAreaView>
  );
};

export default CertificationsForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: Size.containerPadding,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 10,
    fontFamily: fontFamily,
  },
  imageContainer: {
    alignSelf: 'center',
    width: 250,
    height: 120,
    backgroundColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  editIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    width: 34,
    height: 34,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#092B9C',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#E9E9E9',
    fontSize: 16,
    fontFamily: 'SF Pro Text',
    lineHeight: 24,
    fontWeight: '500',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'SF Pro Text',
    lineHeight: 24,
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    fontFamily: 'SF Pro Text',
    lineHeight: 16,
    fontWeight: '400',
    marginLeft: 10,
    marginBottom: 5,
  },
  dateText: {
    textAlign: 'left',
    width: '100%',
    color: '#555',
  },
  fieldLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 6,
    fontFamily: fontFamily,
  },

  inputWrapper: {
    borderWidth: 1,
    borderColor: '#CBCBCB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    backgroundColor: '#fff',
  },

  input1: {
    fontSize: 14,
    color: '#000',
    fontFamily: fontFamily,
    padding: 0, // Remove default TextInput vertical padding
  },
});
