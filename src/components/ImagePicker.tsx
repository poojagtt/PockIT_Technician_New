import React, {ReactNode, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacityProps,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {fontFamily, Permissions, useTheme} from '../modules';
import Modal from './Modal';
import Icon from './Icon';
import ImageCropPicker, {
  Options,
  Image as CroppedImage,
} from 'react-native-image-crop-picker';

type captureInterface = {
  fileUrl: string;
  fileName: string;
  fileType: string;
};
interface ImagePickerProps extends TouchableOpacityProps {
  onCapture: (data: captureInterface) => void;
  onPress?: () => void;
}
const ImagePicker: React.FC<ImagePickerProps> = ({
  onCapture,
  onPress,
  ...rest
}) => {
  const NAME_MAX_LENGTH = 20;
  const colors = useTheme();
  const ImageOptions: Options = {
    cropping: true,
    mediaType: 'photo',
    cropperTintColor: colors.primary,
    freeStyleCropEnabled: true,
    multiple: false,
    cropperActiveWidgetColor: colors.primary,
    cropperCancelColor: colors.primary,
    cropperChooseColor: colors.primary,
    cropperToolbarColor: colors.primary,
    cropperToolbarWidgetColor: colors.primary,
    cropperStatusBarColor: colors.primary,
    disableCropperColorSetters: true,
    maxFiles: 1,
    compressImageQuality: 0.5,
    showCropFrame: true,
    forceJpg: true,
  };
  const [modal, setModal] = useState({
    permission: false,
    options: false,
  });
  const onSelectImage = async () => {
    try {
      const hasPermission = await Permissions.checkCamera();
      console.log("Has Camera Permission:", hasPermission);

      if (!hasPermission) {
        const granted = await Permissions.requestCamera();
        if (!granted) {
          Alert.alert(
            'Permission Denied',
            'Camera permission is required to use this feature.',
          );
          return;
        }
      }
      setModal({...modal, options: true});
    } catch (error) {
      console.error('Permission check failed:', error);
      Alert.alert('Error', 'Failed to check camera permissions');
    }
  };
  const onSuccess = (image: CroppedImage) => {
    let extension = image.path.substring(image.path.lastIndexOf('.'));
    let fileName =
      ('IMG_' + Date.now()).substring(0, NAME_MAX_LENGTH) + extension;
    onCapture({fileUrl: image.path, fileName: fileName, fileType: image.mime});
  };
  const onCameraPress = () => {
    ImageCropPicker.openCamera(ImageOptions)
      .then(onSuccess)
      .catch(error => {
        console.error(error);
      })
      .finally(() => {
        setModal({...modal, options: false});
      });
  };
  const onImagePress = () => {
    ImageCropPicker.openPicker(ImageOptions)
      .then(onSuccess)
      .catch(error => {
        console.error(error);
      })
      .finally(() => {
        setModal({...modal, options: false});
      });
  };
  return (
    <TouchableOpacity
      onPress={onSelectImage}
      activeOpacity={0.8}
      style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}
      {...rest}>
      {rest.children}
      <Modal
        show={modal.options}
        containerStyle={{margin: 0}}
        style={{
          justifyContent: 'flex-end',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
        onClose={() => setModal({...modal, options: false})}>
        <View style={{flexDirection: 'row', gap: 20}}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onCameraPress()}
            style={[styles.button, {borderColor: colors.primary}]}>
            <Icon name="camera-outline" type="Ionicons" size={40} />
            <Text style={[styles.label, {color: colors.primary}]}>
              {'Camera'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onImagePress()}
            style={[styles.button, {borderColor: colors.primary}]}>
            <Icon name="images-outline" type="Ionicons" size={40} />
            <Text style={[styles.label, {color: colors.primary}]}>
              {'Gallery'}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </TouchableOpacity>
  );
};
export default ImagePicker;
const styles = StyleSheet.create({
  button: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 6,
    borderColor: '#000',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontFamily: fontFamily,
    fontWeight: 'bold',
  },
});
