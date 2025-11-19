import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {
  NavigationContainer,
  NavigatorScreenParams,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useState, useEffect} from 'react';
import Home, {HomeParams} from './routes/Home';
import {useTheme} from './modules';
import {SVG} from './assets';
import Earning, {EarningParams} from './routes/Earning';
import Job, {JobParams} from './routes/Job';
import Menu, {MenuParams} from './routes/Menu';
import {navigate, navigationRef} from './utils/navigationRef';
import messaging from '@react-native-firebase/messaging';
import {Reducers, useDispatch} from './context';
import {Keyboard, Platform} from 'react-native';
const Tab = createBottomTabNavigator();
export type TabRoutes = {
  Home: NavigatorScreenParams<HomeParams>;
  Job: NavigatorScreenParams<JobParams>;
  Menu: NavigatorScreenParams<MenuParams>;
  Earning: NavigatorScreenParams<EarningParams>;
};
export type TabProps<ScreenName extends keyof TabRoutes> =
  NativeStackScreenProps<TabRoutes, ScreenName>;

const Routes: React.FC = () => {
  const colors = useTheme();
  const [notificationData, setNotificationData] = useState<any>(null);

  // Check for a notification that launched the app from a killed state
  useEffect(() => {
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('App opened by notification:', remoteMessage.data?.data3);
          console.log('App opened by notification:', remoteMessage.data?.data4);
          handleNotification(remoteMessage);
        }
      });

    // Handle notification when app is in background /app in home screen
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Background notification:', remoteMessage);
      handleNotification(remoteMessage);
    });
  }, []);

  const handleNotification = (remoteMessage: any) => {
    console.log('remoteMessage.data.data3:', remoteMessage);
    const type = remoteMessage.data?.data3;
    const data = JSON.parse(remoteMessage.data?.data4 as string);
    if (type == 'C') {
      navigate('Job', {screen: 'ChatScreen', params: {jobItem: data}});
    } else if (type === 'J') {
      data[0]?.TRACK_STATUS == null ||
      data[0].TRACK_STATUS == 'ST' ||
      data[0]?.TRACK_STATUS == '-'
        ? navigate('Job', {
            screen: 'JobDetails',
            params: {item: data[0], isFromJobList: false},
          })
        : navigate('Job', {
            screen: 'JobFlow',
            params: {item: data[0], isFromJobList: false},
          });
    } else if (type === 'PJ') {
      navigate('Home', {screen: 'PendingJobList'});
    } else if (type === 'F') {
      navigate('Job', {
        screen: 'JobFlow',
        params: {item: data[0], isFromJobList: false},
      });
    }
  };
  const dispatch = useDispatch();
  const handleTabPress = (e: string) => {
    dispatch(Reducers.clearSelectedItems());
    const targetRouteName = e as keyof TabRoutes;
    const mainScreens: {[key: string]: string} = {
      Home: 'Dashboard',
      Earnings: 'EarningHome',
      Job: 'JobList',
      Profile: 'MainMenu',
    };
    const mainScreen = mainScreens[targetRouteName];
    if (mainScreen && navigationRef.current) {
      navigationRef.current.reset({
        index: 0,
        routes: [
          {
            name: targetRouteName,
            state: {
              routes: [
                {
                  name: mainScreen,
                },
              ],
            },
          },
        ],
      });
    }
  };
  return (
    <NavigationContainer ref={navigationRef}>
      <Tab.Navigator
        screenOptions={{
          tabBarHideOnKeyboard: true,
          headerShown: false,
          animation: 'shift',
          popToTopOnBlur: true,

          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: '#636363',
          tabBarStyle: {
            height: 66,
            backgroundColor: '#fff',
            paddingTop: 8,
            paddingBottom: 8,
            // marginBottom: Platform.OS === 'ios' && !Keyboard.isVisible() ? 24 : 0,
          },
        }}
        screenListeners={({navigation, route}) => ({
          tabPress: e => {
            // Ensure we can cancel the default behavior
            // In default RN TabBar, tabPress is cancelable
            e.preventDefault();

            dispatch(Reducers.clearSelectedItems());

            const mainScreens: Record<string, string> = {
              Home: 'Dashboard',
              Earnings: 'EarningHome',
              Job: 'JobList',
              Profile: 'MainMenu',
            };
            const root = mainScreens[route.name];

            if (root) {
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: route.name,
                    state: {
                      index: 0,
                      routes: [{name: root}],
                    },
                  },
                ],
              });
            } else {
              navigation.navigate(route.name);
            }
          },
        })}>
        <Tab.Screen
          name="Home"
          component={Home}
          options={{
            tabBarIcon({color, size, focused}) {
              return focused ? (
                <SVG.dashboardFilled
                  width={size}
                  height={size}
                  onPress={() => {
                    handleTabPress('Home');
                  }}
                />
              ) : (
                <SVG.dashboard
                  width={size}
                  height={size}
                  onPress={() => {
                    handleTabPress('Home');
                  }}
                />
              );
            },
          }}
        />
        <Tab.Screen
          name="Earnings"
          component={Earning}
          options={{
            tabBarIcon({color, size, focused}) {
              return focused ? (
                <SVG.earningFilled
                  width={size}
                  height={size}
                  onPress={() => {
                    handleTabPress('Earnings');
                  }}
                />
              ) : (
                <SVG.earnings
                  width={size}
                  height={size}
                  onPress={() => {
                    handleTabPress('Earnings');
                  }}
                />
              );
            },
          }}
        />
        <Tab.Screen
          name="Job"
          component={Job}
          options={{
            popToTopOnBlur: true,
            tabBarIcon({color, size, focused}) {
              return focused ? (
                <SVG.jobsFilled
                  width={size}
                  height={size}
                  onPress={() => {
                    handleTabPress('Job');
                  }}
                />
              ) : (
                <SVG.jobs
                  width={size}
                  height={size}
                  onPress={() => {
                    handleTabPress('Job');
                  }}
                />
              );
            },
          }}
        />
        <Tab.Screen
          name="Profile"
          component={Menu}
          options={{
            tabBarIcon({color, size, focused}) {
              return focused ? (
                <SVG.profileFilled
                  width={size}
                  height={size}
                  onPress={() => {
                    handleTabPress('Profile');
                  }}
                />
              ) : (
                <SVG.Profile
                  width={size}
                  height={size}
                  onPress={() => {
                    handleTabPress('Profile');
                  }}
                />
              );
            },
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
export default Routes;
