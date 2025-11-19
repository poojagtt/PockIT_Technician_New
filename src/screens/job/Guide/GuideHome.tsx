import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import React, {useEffect, useState, useRef} from 'react';
import {apiCall, Size, fontFamily, useTheme} from '../../../modules';
import {JobRoutes} from '../../../routes/Job';
import {Icon} from '../../../components';

interface GuideHome extends JobRoutes<'GuideHome'> {}
const GuideHome: React.FC<GuideHome> = ({navigation, route}) => {
  const {item} = route.params;
  const colors = useTheme();
  const [docData, setDocData] = useState<HELP_DOCUMENT[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const getServiceHelpDoc = async () => {
    if (!mounted.current) return;
    try {
      setListLoading(true);
      const res = await apiCall.post(`api/serviceDocumemtMapping/get`, {
        filter: ` AND SERVICE_ID = ${item.SERVICE_ID} AND STATUS = 1 `,
      });
      if (mounted.current) {
        if (res.status == 200 && res.data.code == 200) {
          setDocData(res.data.data);
        } else {
          console.warn('Something went wrong.');
        }
      }
    } catch (error) {
      if (mounted.current) {
        console.log('Error fetching documents:', error);
      }
    } finally {
      if (mounted.current) {
        setListLoading(false);
      }
    }
  };
  const mounted = useRef(true);
  useEffect(() => {
    getServiceHelpDoc();
    return () => {
      mounted.current = false;
    };
  }, [item.SERVICE_ID]);

  return (
    <SafeAreaView style={styles._container}>
      <View style={{flex: 1, padding: Size.containerPadding}}>
        {/* header */}
        <Icon
          name="keyboard-backspace"
          type="MaterialCommunityIcons"
          size={24}
          color={'#999999'}
          onPress={() => {
            navigation.goBack();
          }}
        />
        <Text style={[styles._headerTxt]}>Guide</Text>
        <FlatList
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => getServiceHelpDoc()}
            />
          }
          removeClippedSubviews={false}
          data={docData}
          keyExtractor={(item, index) => index.toString()}
          getItemLayout={(data, index) => ({
            length: 80,
            offset: 80 * index,
            index,
          })}
          showsVerticalScrollIndicator={false}
          renderItem={({item, index}) => (
            <TouchableOpacity
              style={styles._card}
              onPress={() =>
                navigation.navigate('PdfViewer', {
                  item,
                })
              }>
              <Text style={styles._title}>{item.MASTER_NAME}</Text>
              <Text style={styles._name}>
                {`Document Type :- `}
                <Text style={[styles._name, {color: colors.primary}]}>
                  {`${item.TYPE == 'D' ? 'Document' : item.LINK}`}
                </Text>
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 50,
              }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.primary,
                  fontFamily: fontFamily,
                }}>
                No data found
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default GuideHome;
const styles = StyleSheet.create({
  _container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  _card: {
    marginVertical: 5,
    padding: Size.paddingX,
    borderWidth: 1,
    borderColor: '#9f83e650',
    borderRadius: 8,
  },
  _headerTxt: {
    fontFamily: fontFamily,
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 30,
    textAlign: 'left',
    letterSpacing: 0.6,
    marginTop: Size.containerPadding,
  },
  _title: {
    fontSize: 18,
    color: '#333333',
    fontWeight: '600',
    fontFamily: fontFamily,
  },
  _name: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
    fontFamily: fontFamily,
  },
});
