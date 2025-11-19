import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ToastAndroid,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
  Platform,
  InteractionManager,
} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import ImagePicker from 'react-native-image-crop-picker';
import {useSelector} from '../../../context';
import {
  apiCall,
  BASE_URL,
  fontFamily,
  Size,
  useStorage,
  useTheme,
} from '../../../modules';
import VideoPlayer from './VideoPlayer';
import {Button, Icon} from '../../../components';
import Modal from '../../../components/Modal';
import {JobRoutes} from '../../../routes/Job';
import messaging from '@react-native-firebase/messaging';
import ImageView from 'react-native-image-viewing';
import moment from 'moment';
import Toast from '../../../components/Toast';

export interface Message {
  _id: string;
  SENDER_USER_ID: number | null;
  RECIPIENT_USER_ID: number | null;
  ORDER_ID: number;
  MESSAGE: string;
  STATUS: string | null;
  CUSTOMER_ID?: number | null;
  CUSTOMER_NAME?: string;
  BY_CUSTOMER?: boolean;
  RECIPIENT_USER_NAME?: string;
  JOB_CARD_ID?: number;
  TECHNICIAN_ID?: number | null;
  TECHNICIAN_NAME?: string;
  ATTACHMENT_URL?: string;
  MEDIA_TYPE?: string;
}
interface User {
  ID: number;
  NAME: string;
}
export interface ChatScreenRouteParams {
  jobItem: {
    ORDER_ID: number;
    CUSTOMER_ID: number;
    CUSTOMER_NAME: string;
    ID?: number;
    CUSTOMER_MOBILE_NUMBER: string;
  };
}
interface AppState {
  app: {
    user: User | null;
  };
}

export interface TechnicianBackOfficeChat
  extends JobRoutes<'TechnicianBackOfficeChat'> {}
const TechnicianBackOfficeChat: React.FC<TechnicianBackOfficeChat> = ({
  navigation,
  route,
}) => {
  const colors = useTheme();
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState<string>('');
  const [supportContactNo, setSupportContactNo] = useState<string>('');
  const {user} = useSelector((state: AppState) => state.app);
  const flatListRef = useRef<FlatList>(null);
  const {jobItem} = route.params;
  const [openModal, setOpenModal] = useState({
    upload: false,
    sendModal: false,
    imageView: false,
  });
  const [RECIPIENT_USER_ID, setRECIPIENT_USER_ID] = useState({
    name: '',
    id: 0,
  });
  const [media, setMedia] = useState({
    uri: '',
    name: '',
    type: '',
    mediaType: '',
  });
  const [loader, setLoader] = useState({
    chat: false,
    uploadMedia: false,
  });
  const [imageUrl, setImageUrl] = useState<string>('');
  useEffect(() => {
    getChatMessages();
    getSupportContactNo();
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      getChatMessages();
    });

    subscribeToTopic();
  }, []);

  const subscribeToTopic = async () => {
    try{
    const topicName =
      'support_chat_' + jobItem.ID + '_technician_' + user?.ID + '_channel';
    const oldTopic = useStorage.getString('CHAT_TOPIC');
    if (oldTopic != topicName) {
      await messaging()
        .subscribeToTopic(topicName)
        .then(() => {
          console.log('subscribed to', topicName);
          useStorage.set('CHAT_TOPIC', topicName);
        });
      try {
        apiCall
          .post(`api/channelSubscribedUsers/create`, {
            CHANNEL_NAME: topicName,
            USER_ID: user?.ID,
            STATUS: true,
            CLIENT_ID: 1,
            USER_NAME: user?.NAME,
            TYPE: 'T',
            DATE: moment().format('YYYY-MM-DD HH:mm:ss'),
          })
          .then(res => {
            if (res.status == 200) {
              console.log('Channel subscribed users updated successfully');
            }
          });
      } catch (error) {
        console.log(error);
      }
    }
  }catch(error)
  {
      console.log("error",error)
  }
  };
  const getChatMessages = async () => {
    try {
      apiCall
        .post(`api/jobchat/get`, {
          filter: {
            $and: [{TECHNICIAN_ID: user?.ID}, {JOB_CARD_ID: jobItem.ID}],
          },
        })
        .then(res => {
          if (res.status === 200 && res.data.code === 200) {
            console.log('chat messages', res.data.data);
            setChatMessages(res.data.data);
            console.log('chat response', res.data.data);
            const recepantUserID = res.data.data.filter(
              item => item.MSG_SEND_BY === 'B',
            );
            const id =
              recepantUserID.length > 0
                ? recepantUserID[0].SENDER_USER_ID
                : res.data.data[0]?.SENDER_USER_ID ?? 0;
            console.log('\n\n\nrecepantUserID', res.data.data[0].SENDER_USER_ID);
            setRECIPIENT_USER_ID({
              ...RECIPIENT_USER_ID,
              name: res.data.data[0].MSG_SEND_BY,
              id: id,
            });
          }
        });
    } catch (error) {
      console.log(error);
    }
  };
  console.log("jobItem",jobItem)
  const getSupportContactNo = async () => {
    try {
      apiCall
        .post(`api/territory/get`, {
          filter: ` AND ID=${jobItem.TERRITORY_ID}`,
        })
        .then(res => {
          if (res.status === 200 && res.data.code === 200) {
            setSupportContactNo(res.data.data[0].SUPPORT_CONTACT_NUMBER);
          }
        });
    } catch (error) {
      console.log(error);
    }
  };
  const createChatMessages = (checkMessage: boolean = true) => {
    try {
      if (checkMessage && message.trim() === '') {
        Toast('Please enter a message');
        return;
      }

      const currentDate = moment().format('YYYY-MM-DD HH:mm:ss');
      const ReceivedFirstMessage = chatMessages.some(
        item => item.MSG_SEND_BY === 'B',
      );
      const body = {
        IS_FIRST: !ReceivedFirstMessage ? 1 : 0,
        ORDER_ID: jobItem.ORDER_ID,
        ORDER_NUMBER: jobItem?.ORDER_NO ?? '',

        JOB_CARD_ID: jobItem.ID,
        JOB_CARD_NUMBER: jobItem?.JOB_CARD_NO ?? '',

        CUSTOMER_ID: jobItem.CUSTOMER_ID,
        CUSTOMER_NAME: jobItem.CUSTOMER_NAME,
        TECHNICIAN_ID: user?.ID,
        TECHNICIAN_NAME: user?.NAME,
        STATUS: 'S',
        BY_CUSTOMER: 0,
        SENDER_USER_ID: user?.ID,
        SENDER_USER_NAME: user?.NAME,
        RECIPIENT_USER_ID: RECIPIENT_USER_ID.id ? RECIPIENT_USER_ID.id : 0,
        RECIPIENT_USER_NAME: RECIPIENT_USER_ID.name
          ? RECIPIENT_USER_ID.name
          : ' ',
        MESSAGE: message,
        ATTACHMENT_URL: media.name ? media.name : '',
        IS_DELIVERED: 1,
        CLIENT_ID: 1,
        MSG_SEND_BY: 'T',
        MEDIA_TYPE: media.mediaType,
        SEND_DATE: currentDate,
      };
      console.log('\n\n\nbody', body);
      apiCall.post(`api/jobchat/create`, body).then(res => {
        if (res.data.code === 200) {
          setMessage('');
          setMedia({
            uri: '',
            name: '',
            type: '',
            mediaType: '',
          });
          getChatMessages();
        } else {
          console.log('chat create response', res.data);
        }
      });
    } catch (error) {
      console.log(error);
    }
  };
  const handleMediaGalleryUpload = () => {
    ImagePicker.openPicker({
      mediaType: 'any',
      cropping: false,
    })
      .then(file => {
        const mediaType =
          file.mime && file.mime.startsWith('image') ? 'I' : 'V';
        const extension = file.mime.split('/').pop();
        const normalizedExtension = extension === 'jpeg' ? 'jpg' : extension;
        const name =
          ('IMG_' + Date.now()).substring(0, 20) + '.' + normalizedExtension;
        setMedia({
          uri: file.path,
          name: name,
          type: file.mime,
          mediaType: mediaType,
        });
        setOpenModal({...openModal, upload: false, sendModal: true});
      })
      .catch(error => {
        if (error.code === 'E_PICKER_CANCELLED') {
          console.log('User cancelled media picker');
        } else {
          console.error('Error picking media:', error);
        }
      });
  };
  const handleMediaPhotoCapture = () => {
    ImagePicker.openCamera({
      mediaType: 'photo',
      cropping: false,
    })
      .then(file => {
        const extension = file.mime.split('/').pop();
        const normalizedExtension = extension === 'jpeg' ? 'jpg' : extension;
        const name =
          ('IMG_' + Date.now()).substring(0, 20) + '.' + normalizedExtension;
        setMedia({
          uri: file.path,
          name: name,
          type: file.mime,
          mediaType: 'I',
        });
        setOpenModal({...openModal, upload: false, sendModal: true});
      })
      .catch(error => {
        if (error.code === 'E_PICKER_CANCELLED') {
          console.log('User cancelled media picker');
        } else {
          console.error('Error picking media:', error);
        }
      });
  };
  const handleMediaVideoCapture = () => {
    ImagePicker.openCamera({
      mediaType: 'video',
      cropping: false,
    })
      .then(file => {
        console.log('capture', file);
        const extension = file.mime.split('/').pop();
        const normalizedExtension = extension === 'jpeg' ? 'jpg' : extension;
        const name =
          ('IMG_' + Date.now()).substring(0, 20) + '.' + normalizedExtension;
        setMedia({
          uri: file.path,
          name: name,
          type: file.mime,
          mediaType: 'V',
        });
        setOpenModal({...openModal, upload: false, sendModal: true});
      })
      .catch(error => {
        if (error.code === 'E_PICKER_CANCELLED') {
          console.log('User cancelled media picker');
        } else {
          console.error('Error picking media:', error);
        }
      });
  };
  const uploadMediaFile = async () => {
    setLoader({...loader, uploadMedia: true});
    const formData = new FormData();
    formData.append('Image', {
      uri: media.uri,
      name: media.name,
      type: media.type,
    });
    try {
      const res = await apiCall.post('api/upload/JobChat', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data && res.data.code === 200) {
        createChatMessages(false);
        setLoader({...loader, uploadMedia: false});
        setOpenModal({...openModal, upload: false, sendModal: false});
      } else {
        console.error('Upload failed:', res.data);
        setLoader({...loader, uploadMedia: false});
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setLoader({...loader, uploadMedia: false});
      throw error;
    }
  };
  console.log(BASE_URL + 'static/JobChat');
  const renderItem = ({item}: {item: Message}) => {
    const isUserMessage = item.SENDER_USER_ID == user?.ID;
    return (
      <View
        style={{
          alignSelf: isUserMessage ? 'flex-end' : 'flex-start',
          backgroundColor: '#E5E5E5',
          borderRadius: 11,
          marginVertical: 4,
          maxWidth: '80%',
          padding: 16,
          paddingVertical: 6,
          borderTopRightRadius: isUserMessage ? 0 : 11,
          borderTopLeftRadius: isUserMessage ? 11 : 0,
        }}>
        {item.ATTACHMENT_URL &&
          (item.MEDIA_TYPE === 'I' ? (
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => {
                setImageUrl(BASE_URL + 'static/JobChat/' + item.ATTACHMENT_URL);
                setOpenModal({...openModal, imageView: true});
              }}>
              <Image
                source={{
                  uri: BASE_URL + 'static/JobChat/' + item.ATTACHMENT_URL,
                }}
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: 8,
                  marginBottom: 4,
                  marginTop: 6,
                }}
                // onLoad={() => {
                //   setTimeout(() => {
                //     flatListRef.current?.scrollToEnd({animated: true});
                //   }, 100);
                // }}

                onLoad={() => {
  InteractionManager.runAfterInteractions(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  });
}}
              />
            </TouchableOpacity>
          ) : (
            <VideoPlayer
              videoUri={BASE_URL + 'static/JobChat/' + item.ATTACHMENT_URL}
              style={{
                width: 100,
                // height: 200,
                borderRadius: 8,
                marginBottom: 4,
                marginTop: 6,
              }}
            />
          ))}
        {item.MESSAGE && (
          <Text
            style={{
              color: '#000000',
              fontSize: 14,
              fontFamily: fontFamily,
              fontWeight: '500',
              letterSpacing: 0.3,
            }}>
            {item.MESSAGE}
          </Text>
        )}
        {isUserMessage &&
          (item.STATUS == 'sent' ? (
            <Icon
              name="done"
              type="MaterialIcons"
              style={{
                alignSelf: 'flex-end',
                marginRight: -7,
                marginTop: item.ATTACHMENT_URL ? 0 : -4,
              }}
              color="#999"
              size={16}
            />
          ) : item.STATUS == 'delivered' ? (
            <Icon
              name="done-all"
              type="MaterialIcons"
              style={{alignSelf: 'flex-end'}}
              color="#999"
              size={20}
            />
          ) : item.STATUS == 'seen' ? (
            <Icon
              name="done-all"
              type="MaterialIcons"
              style={{alignSelf: 'flex-end'}}
              color={colors.primary}
              size={16}
            />
          ) : null)}
      </View>
    );
  };
  return (
    <SafeAreaView style={styles.messagingScreen}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 56 : 36} // Adjust offset as needed
      >
        <View style={{flex: 1}}>
          <View
            style={{
              flex: 1,
              paddingHorizontal: Size.containerPadding,
              paddingTop: Size.containerPadding,
              paddingBottom: Size.sm,
            }}>
            {/* Header */}
            <View
              style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <Icon
                  name="arrow-back-ios"
                  type="MaterialIcons"
                  size={18}
                  color={'#333333'}
                  onPress={() => {
                    navigation.goBack();
                  }}
                />
                <Text style={styles.receiverName}>
                  {jobItem.TERRITORY_NAME}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.callContainer}
                onPress={() => {
                  Linking.openURL(`tel:${supportContactNo}`);
                }}>
                <View style={styles.call}>
                  <Icon
                    name="call"
                    type="MaterialIcons"
                    size={18}
                    color={'#333333'}
                    style={{alignSelf: 'center'}}
                  />
                </View>
                <Text style={styles.callText}>{'Call'}</Text>
              </TouchableOpacity>
            </View>
            {/* Chat */}
            <View style={styles.chatContainer}>
              {loader.chat ? (
                <ActivityIndicator
                  color={colors.primary}
                  size={'small'}
                  style={{marginTop: Size['3xl'] * 4, alignSelf: 'center'}}
                />
              ) : (
                <FlatList
                  data={chatMessages}
                  ref={flatListRef}
                  renderItem={renderItem}
                 keyExtractor={(item: Message, index) => item._id?.toString() ?? index.toString()}

                  initialNumToRender={10}
                  removeClippedSubviews={false}
                  showsVerticalScrollIndicator={false}
                  onContentSizeChange={() => {
                    setTimeout(() => {
                      flatListRef.current?.scrollToEnd({animated: true});
                    }, 100);
                  }}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>
                      Start the conversation!
                    </Text>
                  }
                />
              )}
            </View>
          </View>
          {/* Message Input Area */}
          <View style={styles.messageContainer}>
            <TextInput
              placeholder="Message"
              style={styles.textInput}
              onChangeText={setMessage}
              value={message}
              autoCorrect={false}
              autoCapitalize="none"
            />
            <Icon
              name="attach-file"
              type="MaterialIcons"
              size={22}
              color="#092B9C"
              onPress={() => {
                setOpenModal({...openModal, upload: true});
              }}
            />
            <Icon
              name="send-outline"
              type="Ionicons"
              size={22}
              color="#092B9C"
              onPress={() => {
                createChatMessages(true);
              }}
            />
          </View>
        </View>
        {/* attach */}
        <Modal
          show={openModal.upload}
          onClose={() => {
            setOpenModal({...openModal, upload: false});
          }}
          style={{
            justifyContent: 'flex-end',
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }}
          containerStyle={{
            margin: 0,
          }}>
          <View style={{flexDirection: 'row', gap: 20}}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                handleMediaPhotoCapture();
              }}
              style={[styles.button, {borderColor: colors.primary}]}>
              <Icon name="camera-outline" type="Ionicons" size={40} />
              <Text style={[styles.label, {color: colors.primary}]}>
                {'Camera'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                handleMediaVideoCapture();
              }}
              style={[styles.button, {borderColor: colors.primary}]}>
              <Icon name="videocam-outline" type="Ionicons" size={40} />
              <Text style={[styles.label, {color: colors.primary}]}>
                {'Video'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                handleMediaGalleryUpload();
              }}
              style={[styles.button, {borderColor: colors.primary}]}>
              <Icon name="images-outline" type="Ionicons" size={40} />
              <Text style={[styles.label, {color: colors.primary}]}>
                {'Gallery'}
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>
        {/* send confirmation */}
        <Modal
          show={openModal.sendModal}
          onClose={() => {
            setOpenModal({...openModal, sendModal: false});
          }}
          style={{}}
          containerStyle={{}}>
          <View style={{gap: 20}}>
            <Text
              style={{
                fontFamily: fontFamily,
                fontSize: 14,
                fontWeight: 500,
                color: '#333333',
                letterSpacing: 0.3,
              }}>
              Are you sure you want to send this?
            </Text>
            <View style={{flexDirection: 'row', gap: 20}}>
              <Button
                label="Cancel"
                onPress={() => {
                  setOpenModal({...openModal, sendModal: false});
                }}
                style={{
                  flex: 1,
                  backgroundColor: colors.white,
                  borderWidth: 1,
                  borderColor: colors.primary,
                }}
                labelStyle={{color: colors.primary}}
              />
              <Button
                label="Send"
                loading={loader.uploadMedia}
                onPress={() => {
                  uploadMediaFile();
                }}
                style={{flex: 1}}
              />
            </View>
          </View>
        </Modal>
        {openModal.imageView && (
          <ImageView
            images={[{uri: imageUrl}]}
            imageIndex={0}
            visible={openModal.imageView}
            onRequestClose={() => {
              setOpenModal({...openModal, imageView: false});
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default TechnicianBackOfficeChat;

const styles = StyleSheet.create({
  messagingScreen: {
    flex: 1,
    backgroundColor: '#f4f2f2',
  },
  receiverName: {
    fontFamily: fontFamily,
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: 0.3,
  },
  callContainer: {
    borderRadius: 30,
    backgroundColor: '#092B9C',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    gap: 5,
  },
  call: {
    height: 24,
    width: 24,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  callText: {
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  chatContainer: {
    backgroundColor: '#FFF',
    flex: 1,
    padding: Size.radius,
    borderRadius: Size.sm,
    marginTop: Size.lg,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#092B9C',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
  },
  button: {
    flex: 1,
    paddingVertical: 15,
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
  emptyText: {
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'center',
    marginTop: Size['3xl'],
  },
});
