import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ToastAndroid,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
  Platform,
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
import {Button, Icon, TextInput} from '../../../components';
import Modal from '../../../components/Modal';
import {JobRoutes} from '../../../routes/Job';
import ImageView from 'react-native-image-viewing';
import messaging from '@react-native-firebase/messaging';

import moment from 'moment';
import Toast from '../../../components/Toast';

export interface Message {
  IS_FIRST: number;
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
  CREATED_DATETIME?: string;
  SEND_DATE?: string;
  RECEIVED_DATE?: string | null;
  IS_DELIVERED?: boolean;
  ROOM_ID?: string | null;
  JOB_CARD_NUMBER?: string;
  ORDER_NUMBER: string;
}

interface User {
  ID: number;
  NAME: string;
}
export interface ChatScreenRouteParams {
  jobItem: JobData;
}
interface AppState {
  app: {
    user: User | null;
  };
}
export interface ChatScreenProps extends JobRoutes<'ChatScreen'> {}
const ChatScreen: React.FC<ChatScreenProps> = ({navigation, route}) => {
  const colors = useTheme();
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState<string>('');
  const {user} = useSelector((state: AppState) => state.app);
  const {jobItem} = route.params as ChatScreenRouteParams;
  const isFocused = useIsFocused();
  const flatListRef = useRef<FlatList>(null);
  const isFocusedRef = useRef(isFocused);
  const [openModal, setOpenModal] = useState({
    upload: false,
    sendModal: false,
    imageView: false,
  });
  const [media, setMedia] = useState({
    uri: '',
    name: '',
    type: '',
    mediaType: '',
  });
  const [loader, setLoader] = useState({
    chat: true,
    uploadMedia: false,
  });
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    isFocusedRef.current = isFocused;
  }, [isFocused]);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({animated: true});
    }, 300);
  }, [chatMessages]);

  useEffect(() => {
    subscribeToTopic();
    getChatMessages();
  }, []);
  const subscribeToTopic = async () => {
    const topicName =
      'chat_' + jobItem.ID + '_technician_' + user?.ID + '_channel';
    const oldTopic = useStorage.getString('CHAT_TOPIC_CUST');
    if (oldTopic != topicName) {
      const res = await apiCall.post(
        'api/channelSubscribedUsers/subscribeToChanel',
        {
          CHANNEL_NAME: topicName,
          USER_ID: user?.ID,
          STATUS: true,
          CLIENT_ID: 1,
          USER_NAME: user?.NAME,
          TYPE: 'T',
        },
      );
      console.log('res', res.data);
      if (res.status === 200) {
        await messaging()
          .subscribeToTopic(topicName)
          .then(() => {
            console.log('subscribed to', topicName);
            useStorage.set('CHAT_TOPIC_CUST', topicName);
          });
      }
    }
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      getChatMessages();
    });
  };
  const getChatMessages = async () => {
    const res = await apiCall.post('api/orderChat/get', {
      filter: {
        JOB_CARD_ID: jobItem.ID,
        ORDER_ID: jobItem.ORDER_ID,
      },
      sortKey: 'SEND_DATE',
      sortValue: 'ASC',
    });
    if (res.data && res.data.code === 200) {
      setChatMessages(res.data.data);
      setLoader(prev => ({...prev, chat: false}));
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
  console.log('first....', jobItem);
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
      const res = await apiCall.post('api/upload/OrderChat', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const ReceivedFirstMessage = chatMessages.some(
        item => item.BY_CUSTOMER === true,
      );
      if (res.data && res.data.code === 200) {
        const newMsg: Omit<Message, '_id'> = {
          IS_FIRST: !ReceivedFirstMessage ? 1 : 0,
          ORDER_ID: jobItem.ORDER_ID,
          CUSTOMER_ID: jobItem.CUSTOMER_ID,
          CUSTOMER_NAME: jobItem.CUSTOMER_NAME,
          BY_CUSTOMER: false,
          SENDER_USER_ID: user?.ID ?? null,
          RECIPIENT_USER_ID: jobItem.CUSTOMER_ID,
          RECIPIENT_USER_NAME: jobItem.CUSTOMER_NAME,
          MESSAGE: message,
          JOB_CARD_ID: jobItem.ID ? jobItem.ID : jobItem.JOB_CARD_ID,
          TECHNICIAN_ID: user?.ID ?? null,
          TECHNICIAN_NAME: user?.NAME,
          ATTACHMENT_URL: media.name,
          MEDIA_TYPE: media.mediaType,
          CREATED_DATETIME: moment().format('YYYY-MM-DD HH:mm:ss'),
          STATUS: 'sent',
          SEND_DATE: moment().format('YYYY-MM-DD HH:mm:ss'),
          RECEIVED_DATE: null,
          IS_DELIVERED: false,
          ROOM_ID: null,
          JOB_CARD_NUMBER: jobItem.JOB_CARD_NO
            ? jobItem.JOB_CARD_NO
            : jobItem.JOB_CARD_NUMBER,
          ORDER_NUMBER: jobItem.ORDER_NO
            ? jobItem.ORDER_NO
            : jobItem.ORDER_NUMBER,
        };
        const res = await apiCall.post('api/orderChat/create', newMsg);
        if (res.data && res.data.code === 200) {
          const createdMessage: Message = {
            ...newMsg,
            _id: new Date().getTime().toString(),
          };
          setMessage('');
          setMedia({
            mediaType: '',
            name: '',
            type: '',
            uri: '',
          });
          setLoader({...loader, uploadMedia: false});
          setOpenModal({...openModal, upload: false, sendModal: false});
          setChatMessages(prev => [...prev, createdMessage]);
        }
      } else {
        setLoader({...loader, uploadMedia: false});
        throw new Error('Upload failed');
      }
    } catch (error) {
      setLoader({...loader, uploadMedia: false});
      throw error;
    }
  };

  const handleNewMessage = async (): Promise<void> => {
    if (message.trim().length === 0) {
      Toast(`Message can't be empty`);
      return;
    }
    const ReceivedFirstMessage = chatMessages.some(
      item => item.BY_CUSTOMER === true,
    );
    console.log('chat messages', ReceivedFirstMessage);
    const newMsg: Omit<Message, '_id'> = {
      IS_FIRST: !ReceivedFirstMessage ? 1 : 0,
      ORDER_ID: jobItem.ORDER_ID,
      CUSTOMER_ID: jobItem.CUSTOMER_ID,
      CUSTOMER_NAME: jobItem.CUSTOMER_NAME,
      BY_CUSTOMER: false,
      SENDER_USER_ID: user?.ID ?? null,
      RECIPIENT_USER_ID: jobItem.CUSTOMER_ID,
      RECIPIENT_USER_NAME: jobItem.CUSTOMER_NAME,
      MESSAGE: message,
      JOB_CARD_ID: jobItem.ID ? jobItem.ID : jobItem.JOB_CARD_ID,
      TECHNICIAN_ID: user?.ID ?? null,
      TECHNICIAN_NAME: user?.NAME,
      CREATED_DATETIME: moment().format('YYYY-MM-DD HH:mm:ss'),
      STATUS: 'sent',
      SEND_DATE: moment().format('YYYY-MM-DD HH:mm:ss'),
      RECEIVED_DATE: null,
      ATTACHMENT_URL: media.name,
      IS_DELIVERED: false,
      ROOM_ID: null,
      MEDIA_TYPE: media.mediaType,
      JOB_CARD_NUMBER: jobItem.JOB_CARD_NO
        ? jobItem.JOB_CARD_NO
        : jobItem.JOB_CARD_NUMBER,
      ORDER_NUMBER: jobItem.ORDER_NO ? jobItem.ORDER_NO : jobItem.ORDER_NUMBER,
    };
    console.log('body', newMsg);
    const res = await apiCall.post('api/orderChat/create', newMsg);
    if (res.data && res.data.code === 200) {
      const createdMessage: Message = {
        ...newMsg,
        _id: new Date().getTime().toString(),
      };
      setMessage('');
      setMedia({
        mediaType: '',
        name: '',
        type: '',
        uri: '',
      });
      setChatMessages(prev => [...prev, createdMessage]);
    }
  };
  const renderItem = ({item}: {item: Message}) => {
    // const isUserMessage = item.SENDER_USER_ID == user?.ID;
    const isUserMessage = !item.BY_CUSTOMER;
    // console.log('Message:', item.MESSAGE, 'SENDER_USER_ID:', item.SENDER_USER_ID, 'User ID:', user?.ID);

    return (
      <View
        style={{
          alignSelf: isUserMessage ? 'flex-end' : 'flex-start',
          backgroundColor: colors.white,
          borderColor: '#CBCBCB',
          borderWidth: 1,
          borderRadius: 11,
          marginVertical: 4,
          maxWidth: '80%',
          padding: 16,
          paddingVertical: 6,
          borderTopRightRadius: isUserMessage ? 0 : 20,
          borderTopLeftRadius: isUserMessage ? 20 : 0,
        }}>
        {item.ATTACHMENT_URL &&
          (item.MEDIA_TYPE === 'I' ? (
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => {
                setImageUrl(
                  BASE_URL + 'static/OrderChat/' + item.ATTACHMENT_URL,
                );
                setOpenModal({...openModal, imageView: true});
              }}>
              <Image
                source={{
                  uri: BASE_URL + 'static/OrderChat/' + item.ATTACHMENT_URL,
                }}
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: 8,
                  marginBottom: 4,
                  marginTop: 6,
                }}
                onLoad={() => {
                  setTimeout(() => {
                    flatListRef.current?.scrollToEnd({animated: true});
                  }, 100);
                }}
              />
            </TouchableOpacity>
          ) : (
            <VideoPlayer
              videoUri={BASE_URL + 'static/OrderChat/' + item.ATTACHMENT_URL}
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
    <SafeAreaView
      style={[styles.messagingScreen, {backgroundColor: colors.background}]}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 56 : 36} // Adjust offset as needed
      >
        <View
          style={{
            backgroundColor: '#FDFDFD',
            paddingHorizontal: Size.containerPadding,
            padding: Size.containerPadding,
          }}>
          <Icon
            name="keyboard-backspace"
            type="MaterialCommunityIcons"
            size={25}
            onPress={() => {
              navigation.goBack();
            }}
          />
          <View
            style={{
              marginTop: Size.containerPadding,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FDFDFD',
            }}>
            <Text
              style={[styles.headerTxt, {flex: 1, color: colors.primaryText}]}>
              {jobItem.SERVICE_NAME}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.callContainer, {backgroundColor: colors.primary2}]}
              onPress={() => {
                const phoneNumber = jobItem.CUSTOMER_MOBILE_NUMBER;
                Linking.openURL(`tel:${phoneNumber}`);
              }}>
              <View style={styles.call}>
                <Icon
                  name="call"
                  type="MaterialIcons"
                  size={18}
                  color={colors.primary2}
                  style={{alignSelf: 'center'}}
                />
              </View>
              <Text style={styles.callText}>{'Call'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{flex: 1}}>
          <View
            style={{
              flex: 1,
              paddingHorizontal: Size.containerPadding,
              paddingBottom: Size.sm,
            }}>
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
                  keyExtractor={(item: Message) => item._id}
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
            <View style={{flex: 1}}>
              <TextInput
                placeholder="Message.."
                onChangeText={setMessage}
                value={message}
              />
            </View>

            <Icon
              name="attach-file"
              type="MaterialIcons"
              size={22}
              onPress={() => {
                setOpenModal({...openModal, upload: true});
              }}
            />
            <Icon
              name="send-outline"
              type="Ionicons"
              size={22}
              color={message.length < 1 ? colors.primaryText : colors.primary}
              onPress={handleNewMessage}
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

export default ChatScreen;

const styles = StyleSheet.create({
  messagingScreen: {
    flex: 1,
  },
  receiverName: {
    fontFamily: 'SF Pro Text',
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: 0.3,
  },
  headerTxt: {
    fontFamily: fontFamily,
    fontSize: 19,
    fontWeight: '600',
    lineHeight: 30,
    textAlign: 'left',
    letterSpacing: 0.3,
  },
  callContainer: {
    borderRadius: 30,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    gap: 8,
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
    fontSize: 15,
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
