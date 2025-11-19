import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Linking,
  SafeAreaView,
} from 'react-native';
import {MenuRoutes} from '../../routes/Menu';
import {Icon, TextInput} from '../../components';
import {apiCall, BASE_URL} from '../../modules/services';
import {useSelector} from '../../context';
import {WebView} from 'react-native-webview';
import {fontFamily, Size, useTheme} from '../../modules';

// @ts-ignore
import MathJax from 'react-native-mathjax';

interface TrainingProps extends MenuRoutes<'Training'> {}

const Training: React.FC<TrainingProps> = ({navigation}) => {
  const [search, setSearch] = useState('');
  const [selectedFaq, setSelectedFaq] = useState<number | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const {user} = useSelector(state => state.app);
  const [webviewUrl, setWebviewUrl] = useState<string | null>(null);
  const colors = useTheme();

  const toggleFaq = (id: number) => {
    if (selectedFaq === id) {
      setSelectedFaq(null);
    } else {
      setSelectedFaq(id);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);
  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await apiCall.post(
        'api/jobTraining/getTrainingServices',
        {
          filter: `AND STATUS=1`,
        },
      );
      if (
        response.data &&
        response.data.data &&
        response.data.data.length > 0
      ) {
        const categoryMap = new Map();

        response.data.data.forEach((job: any) => {
          if (!categoryMap.has(job.CATEGORY_ID)) {
            categoryMap.set(job.CATEGORY_ID, {
              categoryId: job.CATEGORY_ID,
              categoryName: job.CATEGORY_NAME,
              serviceIds: [job.ID],
              description: job.DESCRIPTION,
              title: job.TITLE,
              link: job.LINK,
            });
          } else {
            categoryMap.get(job.CATEGORY_ID).serviceIds.push(job.ID);
          }
        });

        const groupedCategories = Array.from(categoryMap.values());
        setJobs(groupedCategories);
      } else {
        console.warn('No training jobs found.');
      }
    } catch (error) {
      console.error('Error fetching training jobs:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchTrainingJobs = async (serviceIDs: number[]) => {
    // setLoading(true);
    try {
      const idList = serviceIDs.join(',');
      console.log('serviceIDs', serviceIDs);
      const response = await apiCall.post('api/jobTraining/get', {
        filter: `AND SERVICE_ID IN (${idList}) AND STATUS=1`,
      });
      if (
        response.data &&
        response.data.data &&
        response.data.data.length > 0
      ) {
        console.log('data,', response.data);
        if (response.status == 200) {
          console.log('response.data.data jobTraining', response.data.data);
          setTrainings(response.data.data);
        }
      } else {
        console.warn('No training jobs found.');
      }
    } catch (error) {
      console.error('Error fetching training jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(
    item =>
      (item.categoryName &&
        item.categoryName.toLowerCase().includes(search.toLowerCase())) ||
      (item.title && item.title.toLowerCase().includes(search.toLowerCase())),
  );
  if (webviewUrl) {
    return (
      <View style={{flex: 1}}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setWebviewUrl(null)}>
          <Icon
            type="MaterialIcons"
            name="keyboard-backspace"
            size={24}
            color={'#999'}
          />
        </TouchableOpacity>
        <WebView source={{uri: webviewUrl}} style={{flex: 1}} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container]}>
      <View style={{paddingHorizontal: Size.containerPadding}}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon
            type="MaterialIcons"
            name="keyboard-backspace"
            size={24}
            color={'#999999'}
          />
        </TouchableOpacity>
        <Text style={styles.heading}>Training</Text>
      </View>
      {/* Search Bar */}

      <View
        style={{
          backgroundColor: colors.background,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginHorizontal: -15,
          padding: Size.containerPadding,
        }}>
        <View style={{flex: 1, paddingHorizontal: 16}}>
          <TextInput
            leftChild={
              <Icon
                name="search1"
                type="AntDesign"
                size={21}
                color={colors.primary2}
              />
            }
            placeholder="Search..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <FlatList
          contentContainerStyle={{marginHorizontal: 16}}
          data={filteredJobs}
          removeClippedSubviews={false}
          showsVerticalScrollIndicator={false}
          keyExtractor={item => item.categoryId.toString()}
          renderItem={({item}) => (
            <View style={{}}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.jobItem}
                onPress={() => {
                  fetchTrainingJobs(item.serviceIds);
                  toggleFaq(item.categoryId);
                }}>
                <Text style={styles.jobText}>{item.categoryName}</Text>
                <Icon
                  type="Feather"
                  name={
                    selectedFaq === item.id ? 'chevron-up' : 'chevron-right'
                  }
                  size={20}
                  color={'#999'}
                />
              </TouchableOpacity>

              {selectedFaq === item.categoryId &&
                trainings.map((item, index) => {
                  return (
                    <View key={index} style={styles.expandedSection}>
                      <Text style={styles.cardTitle}>{item.TITLE}</Text>

                      <MathJax
                        horizontal={false}
                        font-size={'huge'}
                        fontCache={true}
                        html={`<div style="font-size: 14; color:${'#333333'} ">${
                          item.DESCRIPTION ? item.DESCRIPTION : '-'
                        }</div>`}
                      />

                      <TouchableOpacity
                        activeOpacity={0.7}
                        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                        onPress={() => setWebviewUrl(item.LINK)}>
                        <Text
                          style={styles.linkText}
                          onPress={() => {
                            let url =
                              item.SOURCE_TYPE === 'D'
                                ? `${BASE_URL}static/JobTrainingDocs/${item.DOC_URL}`
                                : item.LINK;
                            if (url.endsWith('.pdf')) {
                              Linking.openURL(url);
                            } else if (
                              url.endsWith('.doc') ||
                              url.endsWith('.docx') ||
                              url.endsWith('.xls') ||
                              url.endsWith('.xlsx') ||
                              url.endsWith('.ppt') ||
                              url.endsWith('.pptx')
                            ) {
                              const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
                                url,
                              )}`;
                              Linking.openURL(viewerUrl);
                            } else {
                              setWebviewUrl(url);
                            }
                          }}>
                          Check now
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}

              {/* {selectedFaq === item.id && (
                <View style={styles.expandedSection}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <MathJax
                    horizontal={false}
                    color={'#333333'}
                    font-size={'huge'}
                    fontCache={true}
                    html={`<div style="font-size: 14; color:${'#333333'} ">${
                      item.description
                    }</div>`}
                  />
                  <TouchableOpacity
                    activeOpacity={0.7}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                    onPress={() => setWebviewUrl(item.link)}>
                    <Text
                      style={styles.linkText}
                      onPress={() => setWebviewUrl(item.link)}>
                      Check now
                    </Text>
                  </TouchableOpacity>
                </View>
              )} */}
            </View>
          )}
          ListEmptyComponent={
            !loading && (
              <Text style={styles.noTrainingText}>No Training Available</Text>
            )
          }
        />
      )}
    </SafeAreaView>
  );
};

export default Training;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    marginBottom: 10,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C28',
    marginBottom: 15,
    fontFamily: fontFamily,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#092B9C',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  jobItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 15,

    marginTop: 12,

    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    elevation: 5,
    margin: 5,
    borderRadius: 8,
  },
  jobText: {
    fontSize: 14,
    fontFamily: fontFamily,
    fontWeight: '500',
    lineHeight: 16,
  },
  expandedSection: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    margin: 10,
    borderRadius: 8,
    // elevation: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    fontFamily: fontFamily,
  },
  linkText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
    fontFamily: fontFamily,
  },
  noTrainingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 20,
    fontFamily: fontFamily,
  },
});
