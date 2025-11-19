import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {useDispatch} from '../../context';
import {MenuRoutes} from '../../routes/Menu';
import {apiCall, fontFamily, Size, useTheme} from '../../modules';
import {Button, Icon} from '../../components';

interface HelpandSupportProps extends MenuRoutes<'HelpAndSupport'> {}
const HelpandSupport: React.FC<HelpandSupportProps> = ({navigation}) => {
  const colors = useTheme();
  const [faqs, setFaqs] = useState<{id: number; name: string}[]>([]);
  const [selectedFaq, setSelectedFaq] = useState<number | null>(null);
  const [faqDetails, setFaqDetails] = useState<
    {id: number; question: string; answer: string}[]
  >([]);
  const [expandedFaqs, setExpandedFaqs] = useState<{[key: number]: boolean}>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isDetailsOpened, setDetailsOpened] = useState(false);
  useEffect(() => {
    faqheads();
  }, []);
  const faqheads = async () => {
    setLoading(true);
    try {
      const res = await apiCall.post('/api/faqHead/get', {
        filter: ` AND STATUS = 1 AND FAQ_HEAD_TYPE = 'T'`,
      });
      if (res.data && Array.isArray(res.data.data)) {
        const formattedFaqs = res.data.data.map((item: any) => ({
          id: item.ID,
          name: item.NAME,
        }));

        setFaqs(formattedFaqs);
      } else {
        console.error('Unexpected API response format:', res.data);
      }
    } catch (error) {
      console.error('Error Fetching FAQs', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFaqDetails = async (faqHeadId: number) => {
    setLoadingDetails(true);
    try {
      const res = await apiCall.post('/api/faq/get', {
        
        filter: ` AND FAQ_HEAD_ID = ${faqHeadId} AND FAQ_TYPE='T' AND STATUS=1`,
        sortKey: "SEQ_NO",
       sortValue: "asc"
      });
      if (res.data && Array.isArray(res.data.data)) {
        console.log("faq",res.data.data)
        const formattedDetails = res.data.data.map((item: any) => ({
          id: item.ID,
          question: item.QUESTION,
          answer: item.ANSWER,
        }));
        setFaqDetails(formattedDetails);
        setExpandedFaqs({});
      } else {
        console.error('Unexpected FAQ details format:', res.data);
        setFaqDetails([]);
      }
    } catch (error) {
      console.error('Error Fetching FAQ Details', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const toggleFaqCategory = (id: number) => {
    if (selectedFaq === id) {
      setSelectedFaq(null);
      setFaqDetails([]);
    } else {
      setSelectedFaq(id);
      fetchFaqDetails(id);
    }
  };

  const toggleFaqItem = (faqId: number) => {
    setExpandedFaqs(prevState => ({
      ...prevState,
      [faqId]: !prevState[faqId],
    }));
  };

  return (
    <SafeAreaView style={styles._container}>
     <View style={{paddingHorizontal: Size.containerPadding}}>
       <Icon
        type="MaterialIcons"
        name="keyboard-backspace"
        size={27}
        onPress={() => {
          if (isDetailsOpened) {
            setDetailsOpened(false);
            setSelectedFaq(null);
            setFaqDetails([]);
            setExpandedFaqs({});
          } else {
            navigation.goBack();
          }
        }}
      />

      <Text style={styles._headingTxt}>Help & Support</Text>
     </View>
      <View
        style={{
          backgroundColor: colors.background,
          height: 20,
          marginHorizontal: -Size.containerPadding,
        }}
      />
      <Text
        style={[styles._headingTxt, {fontWeight: '600', marginTop: Size.sm,paddingHorizontal: Size.containerPadding}]}>
        FAQs
      </Text>

      {loading ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator
            size="small"
            color={colors.primary2}
            style={styles._loading}
          />
        </View>
      ) : selectedFaq === null ? (
        <FlatList
          data={faqs}
          keyExtractor={item => item.id.toString()}
          removeClippedSubviews={false}
          showsVerticalScrollIndicator={false}
          renderItem={({item}) => (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles._faqItem}
              onPress={() => {
                setDetailsOpened(true);
                toggleFaqCategory(item.id);
              }}>
              <View style={styles._faqRow}>
                <Text style={styles._txt}>{item.name}</Text>
                <Icon
                  type="Feather"
                  name={'chevron-right'}
                  size={23}
                  color={'#8F90A6'}
                />
              </View>
            </TouchableOpacity>
          )}
        />
      ) : loadingDetails ? (
        <ActivityIndicator
          size="large"
          color="#007BFF"
          style={styles._loading}
        />
      ) : (
        <FlatList
          data={faqDetails}
          keyExtractor={item => item.id.toString()}
          removeClippedSubviews={false}
          showsVerticalScrollIndicator={false}
          renderItem={({item}) => (
            <View>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles._faqItem}
                onPress={() => toggleFaqItem(item.id)}>
                <View style={styles._faqRow}>
                  <View style={styles._textContainer}>
                    <Text style={styles._txt}>{item.question}</Text>
                  </View>

                  <Icon
                    type="Feather"
                    name={expandedFaqs[item.id] ? 'chevron-up' : 'chevron-down'}
                    size={23}
                    color={'#8F90A6'}
                  />
                </View>
              </TouchableOpacity>

              {expandedFaqs[item.id] && (
                <View style={styles._faqAnswerContainer}>
                  <Text style={styles._faqAnswer}>{item.answer}</Text>
                </View>
              )}
            </View>
          )}
        />
      )}

     <View style={{paddingHorizontal: Size.containerPadding, marginVertical: 20}}>
       <Button
        label="Contact Us"
        onPress={() => {
          Linking.openURL('tel:9582700865');
        }}
      />
     </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  _container: {
    flex: 1,
    // padding: 16,
    backgroundColor: '#ffffff',
  },
  _headingTxt: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    fontFamily: fontFamily,
  },
  _faqItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  _faqRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  _txt: {
    fontSize: 16,
    fontFamily: fontFamily,
  },
  _faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
    marginBottom: 14,
  },
  _faqAnswer: {
    fontSize: 14,
    color: '#555',
    fontFamily: fontFamily,
  },

  _textContainer: {
    flex: 1,
    marginRight: 10,
  },
  _loading: {
    marginTop: 20,
    alignSelf: 'center',
  },
});

export default HelpandSupport;
