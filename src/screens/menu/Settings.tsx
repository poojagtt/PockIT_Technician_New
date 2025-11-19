import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  SafeAreaView,
} from 'react-native';
import {MenuRoutes} from '../../routes/Menu';
import {requestNotifications} from 'react-native-permissions';
import {apiCall, fontFamily, Size, useStorage, useTheme} from '../../modules';
import {Icon} from '../../components';
import {RadioButton} from 'react-native-paper';
import {useSelector} from '../../context';
import Toast from '../../components/Toast';

interface SettingsProps extends MenuRoutes<'Settings'> {}

const Settings: React.FC<SettingsProps> = ({navigation}) => {
  const colors = useTheme();
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<any>(null);
  const [languages, setLanguages] = useState([]);
  const {user} = useSelector(state => state.app);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false); // For language update loader

  useEffect(() => {
    loadNotificationStatus();
    fetchLanguages();
  }, []);

  const loadNotificationStatus = async () => {
    const storedStatus = await useStorage.getBoolean('NOTIFICATIONS_ENABLED');
    setIsEnabled(
      storedStatus == undefined || storedStatus == true ? true : false,
    );
  };

  const requestNotificationPermission = async () => {
    const {status} = await requestNotifications(['alert', 'sound', 'badge']);
    if (status === 'granted') {
      setIsEnabled(true);
      await useStorage.set('NOTIFICATIONS_ENABLED', true);
    }
  };

  const fetchLanguages = async () => {
    setLoading(true);
    try {
      const response = await apiCall
        .post('api/technicianLanguageMapping/get', {
          sortKey: 'ID',
          sortValue: 'asc',
          filter: ` AND TECHNICIAN_ID = ${user?.ID} AND IS_ACTIVE = 1 `,
        })
        .then(res => res.data);
      if (response.data && response.code == 200) {
        setLanguages(response.data);
        const data = response.data.filter(item => item.IS_PRIMARY == 1);
        setSelectedLanguage(data[0] ? data[0] : response.data[0]);
      } else {
        console.warn('No Languages found.');
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
    } finally {
      setLoading(false);
    }
  };

  const setLanguagePreference = async (selectedLanguage: any) => {
    setUpdating(true); // Start updating loader
    try {
      const body = {
        TECHNICIAN_ID: user?.ID,
        ID: selectedLanguage.ID,
        LANGUAGE_ID: selectedLanguage.LANGUAGE_ID,
      };
      const response = await apiCall
        .post('api/technicianLanguageMapping/updatePrimaryLanguage', body)
        .then(res => res.data);
      if (response) {
        Toast('Language Preference Updated Successfully.');
      } else {
        console.warn('Failed to set Language');
      }
    } catch (error) {
      console.error('Failed to set Language:', error);
    } finally {
      setUpdating(false); // Stop updating loader
    }
  };

  const toggleSwitch = async () => {
    const newStatus = !isEnabled;
    if (newStatus) {
      await requestNotificationPermission();
    } else {
      Alert.alert('Notifications Disabled', "You won't receive notifications.");
      setIsEnabled(false);
      await useStorage.set('NOTIFICATIONS_ENABLED', false);
    }
  };

  return (
    <SafeAreaView  style={[styles._container, {backgroundColor: colors.background}]}>
       <View
        style={{
          backgroundColor: colors.white,
          paddingHorizontal: Size.containerPadding,
          paddingTop: Size.containerPadding,
        }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles._backButton}>
          <Icon
            type="MaterialIcons"
            name="keyboard-backspace"
            size={27}
            color={'#999999'}
          />
        </TouchableOpacity>

        <Text style={styles._headingTxt}>Settings</Text>
      </View>
   
    <ScrollView
      style={[styles._container, {backgroundColor: colors.background}]}>
     
      {/* Notifications */}
      <View style={[styles._card, {marginTop: Size.containerPadding}]}>
        <Text style={styles._sectionTitle}>Notifications</Text>
        <View style={styles._menuItem}>
          <Text style={styles._txt}>PockIT Notification</Text>
          <TouchableOpacity
            onPress={toggleSwitch}
            style={[
              styles._toggleContainer,
              isEnabled && styles._toggleActive,
            ]}>
            <View
              style={[
                styles._toggleCircle,
                isEnabled && styles._toggleCircleActive,
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>
      {/* Language Selection */}
      <View style={styles._card}>
        <Text style={styles._sectionTitle}>Language Preference</Text>
        {loading && <ActivityIndicator size={'small'} color={colors.primary} />}
        {languages.map((lang: any) => (
          <TouchableOpacity
            activeOpacity={0.8}
            key={lang.LANGUAGE_NAME}
            style={styles._radioContainer}
            onPress={() => {
              setSelectedLanguage(lang);
              setLanguagePreference(lang);
            }}>
            <RadioButton
              value={lang.LANGUAGE_NAME}
              status={
                selectedLanguage?.LANGUAGE_NAME === lang.LANGUAGE_NAME
                  ? 'checked'
                  : 'unchecked'
              }
              onPress={() => {
                setSelectedLanguage(lang);
                setLanguagePreference(lang);
              }}
              color={colors.secondary}
            />
            <Text
              style={[
                styles._radioText,
                selectedLanguage?.LANGUAGE_NAME === lang.LANGUAGE_NAME &&
                  styles._radioTextSelected,
              ]}>
              {lang.LANGUAGE_NAME}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Full-Screen Loader for Language Update */}
      {updating && (
        <Modal transparent={true} animationType="none" visible={updating}>
          <View style={styles._loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </Modal>
      )}
    </ScrollView>
     </SafeAreaView>
  );
};

export default Settings;

const styles = StyleSheet.create({
  _container: {
    flex: 1,
  },
  _backButton: {
    marginBottom: 10,
  },
  _headingTxt: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: fontFamily,
    color: '#1C1C28',
    marginBottom: 20,
  },
  _card: {
    marginBottom: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#b094f550',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
  },
  _sectionTitle: {
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: '#092B9C',
    marginBottom: 10,
    lineHeight: 22,
  },
  _radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  _radioText: {
    fontSize: 16,
    color: '#6D6D6D',
    fontFamily: fontFamily,
  },
  _radioTextSelected: {
    fontWeight: 'bold',
    color: '#1C1C28',
  },
  _menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  _txt: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6D6D6D',
    fontFamily: fontFamily,
  },
  _toggleContainer: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#dad7d7',
    padding: 2,
    justifyContent: 'center',
  },
  _toggleActive: {
    backgroundColor: '#F36631',
  },
  _toggleCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  _toggleCircleActive: {
    transform: [{translateX: 20}],
  },
  _loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});
