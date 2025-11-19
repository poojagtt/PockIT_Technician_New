import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import ImagePicker from '../../components/ImagePicker';
import {fontFamily, useTheme} from '../../modules';
import {Icon} from '../../components';
import Button from '../../components/Button';
import {apiCall} from '../../modules';
import {useSelector} from '../../context';

interface JobCloseProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (remarks: string, photos: {PHOTOS: string}[]) => void;
  item: JobData;
}

const JobClose: React.FC<JobCloseProps> = ({
  visible,
  onClose,
  onSubmit,
  item,
}) => {
  interface Photo {
    fileUrl: string;
    PHOTOS: string;
    fileType: string;
  }
  const [loader, setLoader] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [remarks, setRemarks] = useState('');
  const colors = useTheme();
  const {user} = useSelector(state => state.app);

  const addImage = async (res: any) => {
    try {
      let formData = new FormData();
      formData.append('Image', {
        uri: res.fileUrl,
        type: res.fileType,
        name: res.fileName,
      });
      const response = await apiCall.post('api/upload/JobPhotos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data && response.data.code === 200) {
        setPhotos([
          ...photos,
          {
            fileUrl: res.fileUrl,
            PHOTOS: res.fileName,
            fileType: res.fileType,
          },
        ]);
      } else {
        Alert.alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Error in Image Upload:', error);
      Alert.alert('Failed to upload image');
    } finally {
      setLoader(false);
    }
  };
  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };
  const handleSubmit = async () => {
    setLoader(true);
    try {
      let payload = {
        JOB_CARD_ID: item.ID,
        TECHNICIAN_ID: user?.ID,
        CUSTOMER_ID: item.CUSTOMER_ID,
        ORDER_ID: item.ORDER_ID,
        STATUS: 1,
        REMARK: remarks,
        IS_JOB_COMPLETE: 1,
        PHOTOS_DATA: photos,
      };
      console.log(payload);
      const response = await apiCall.post(
        'api/jobPhotosDetails/addPhotos',
        payload,
      );
      if (response.data && response.data.code === 200) {
        await onSubmit(remarks, photos);
        setPhotos([]);
        setRemarks('');
      } else {
        Alert.alert('Failed to Add images');
      }
    } catch (error) {
      console.error('Error in Submit:', error);
      Alert.alert('Failed to Submit');
    } finally {
      setLoader(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
         <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                style={{flex: 1}}
              >
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}>
        <StatusBar barStyle="dark-content" />

        <View
          style={{
            width: '100%',
            maxHeight: '90%',
            backgroundColor: '#fff',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            paddingBottom: 20,
          }}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onClose}
            style={{
              position: 'absolute',
              alignSelf: 'center',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.white,
              padding: 6,
              borderRadius: 100,
              top: -50,
            }}>
            <Icon name="close" type="Ionicons" size={28} />
          </TouchableOpacity>
          <View
            style={{
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#eee',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '500',
                color: colors.primaryText,
                fontFamily: fontFamily,
              }}>
              Do you want to mark job as complete?
            </Text>
          </View>
          <View style={{padding: 16}}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '400',
                marginBottom: 10,
                color: colors.primaryText2,
                fontFamily: fontFamily,
              }}>
              Add photo of completed job
            </Text>
            <ImagePicker
              onCapture={res => addImage(res)}
              style={{alignSelf: 'flex-end'}}>
              <View
                style={{
                  width: '100%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 6,
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 8,
                }}>
                <Text style={{fontFamily: fontFamily}}>Add photo...</Text>
                <View
                  style={{
                    backgroundColor: colors.background,
                    padding: 6,
                    borderRadius: 8,
                  }}>
                  <Icon
                    type="MaterialCommunityIcons"
                    name="camera-plus-outline"
                    size={28}
                    color={colors.primary2}
                  />
                </View>
              </View>
            </ImagePicker>

            {photos.length > 0 && (
              <View style={{marginTop: 16}}>
                {photos.map((photo, index) => (
                  <View
                    key={photo.PHOTOS}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: '#eee',
                    }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '400',
                        fontFamily: fontFamily,
                        color: colors.primary2,
                      }}>
                      {/* {photo.PHOTOS} */}
                      {`Img ${index + 1}.${photo.PHOTOS.split('.')[1]}`}
                    </Text>
                    <TouchableOpacity onPress={() => handleRemovePhoto(index)}>
                      <Icon
                        name="close"
                        type="Ionicons"
                        size={22}
                        color={colors.primary2}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '400',
                  marginBottom: 16,
                  color: colors.primaryText2,
                  marginTop: 15,
                  fontFamily: fontFamily,
                }}>
                Add remarks
              </Text>
              <Text
                style={{
                  color: '#666',
                  fontWeight: '400',
                  textAlign: 'right',
                  fontFamily: fontFamily,
                }}>
                (optional)
              </Text>
            </View>
            <TextInput
              style={{
                height: 120,
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                padding: 12,
                textAlignVertical: 'top',
              }}
              placeholder="Details about the job"
              multiline
              value={remarks}
              onChangeText={setRemarks}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              padding: 16,
              borderTopWidth: 1,
              borderTopColor: '#eee',
              gap: 12,
            }}>
            <Button
              label="No"
              onPress={onClose}
              loading={false}
              primary={false}
              style={{flex: 1}}
            />
            <Button
              label="Yes"
              style={{flex: 1}}
              onPress={handleSubmit}
              loading={loader}
            />
          </View>
        </View>
      </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default JobClose;
