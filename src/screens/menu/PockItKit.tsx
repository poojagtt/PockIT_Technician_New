import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {MenuRoutes} from '../../routes/Menu';
import {apiCall, fontFamily, Size, useTheme} from '../../modules';
import {Icon} from '../../components';
import {Reducers, useDispatch, useSelector} from '../../context';

interface PockItKitProps extends MenuRoutes<'PockItKit'> {}

const PockItKit: React.FC<PockItKitProps> = ({navigation}) => {
  const {user} = useSelector(state => state.app);
  const colors = useTheme();
  const dispatch = useDispatch();
  useEffect(() => {
    getUserData();
  }, []);
  const getUserData = async () => {
    try {
      const res = await apiCall
        .post('api/technician/get', {
          filter: ` AND ID = ${user?.ID} `,
        })
        .then(res => res.data);
      if (res.data && res.data.length > 0) {
        const userData = res.data[0];
        dispatch(Reducers.setUser(userData));
      }
    } catch (error) {
      console.log('error..', error);
    }
  };
  return (
   <SafeAreaView style={styles._container}>
    <View style={{paddingHorizontal: Size.containerPadding}}>
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
       {/* Heading */}
      <Text style={styles._headingTxt}>PockIT Kit</Text>
      <View
        style={{
          backgroundColor: colors.background,
          height: 20,
          marginHorizontal: -Size.containerPadding,
          marginBottom:20
        }}></View>
    </View>
     <ScrollView style={styles._container}>
      {/* Back Button */}
     

     

      {/* Kit Card */}
      <View style={styles._card}>
        <Text style={styles._kitLabel}>Toolkit</Text>
        <View
          style={[
            styles._statusBadge,
            {
              backgroundColor:
                user?.IS_TOOLKIT_ASSIGNED == 1 ? colors.primary : colors.secondary,
            },
          ]}>
          <Text style={styles._statusText}>
            {user?.IS_TOOLKIT_ASSIGNED == 1 ? 'Assigned' : 'Not assigned'}
          </Text>
        </View>
      </View>
      <View style={styles._card}>
        <Text style={styles._kitLabel}>Uniform</Text>
        <View
          style={[
            styles._statusBadge,
            {
              backgroundColor:
                user?.IS_UNIFORM_ASSIGNED == 1 ?colors.primary : colors.secondary,
            },
          ]}>
          <Text style={styles._statusText}>
            {user?.IS_UNIFORM_ASSIGNED == 1 ? 'Assigned' : 'Not assigned'}
          </Text>
        </View>
      </View>
    </ScrollView>
   </SafeAreaView>
  );
};

export default PockItKit;

const styles = StyleSheet.create({
  _container: {
    flex: 1,
    padding: Size.containerPadding,
    backgroundColor: '#FFF',
  },
  _backButton: {
    marginBottom: 10,
  },
  _headingTxt: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: fontFamily,
    color: '#1C1C28',
  },
  _card: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  _kitLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C28',
    fontFamily: fontFamily,
  },
  _statusBadge: {
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  _statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: fontFamily,
  },
});
