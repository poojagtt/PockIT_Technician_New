import React, {useState} from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
  Text,
} from 'react-native';
import {Icon} from '../../../components';
import FullScreenVideoModal from './FullScreenVideoModal';
import {fontFamily, useTheme} from '../../../modules';

interface VideoPlayerProps {
  videoUri: string;
  style?: StyleProp<ViewStyle>;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({videoUri, style}) => {
  const colors = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const handlePress = () => {
    setModalVisible(true);
  };

  return (
    <View>
      <TouchableOpacity
        onPress={handlePress}
        style={[styles.thumbnailContainer, style]}>
        <Icon name="play-circle" type="Feather" color="#333" size={30} />
        <Text
          style={{
            fontSize: 12,
            color: colors.primary,
            fontWeight: '600',
            fontFamily: fontFamily,
          }}>
          Play
        </Text>
      </TouchableOpacity>
      <FullScreenVideoModal
        visible={modalVisible}
        videoUri={videoUri}
        onClose={() => {
          setModalVisible(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  thumbnailContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#999',
  },
});

export default VideoPlayer;
