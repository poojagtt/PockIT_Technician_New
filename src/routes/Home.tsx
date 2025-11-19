import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import React from 'react';
import {Dashboard} from '../screens';
import {CompositeScreenProps} from '@react-navigation/native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {TabRoutes} from '../routes';
import PendingJobList from '../screens/home/pendingJobs/PendingJobList';
import Notification from '../screens/home/Notification/Notification';

export type HomeParams = {
  Dashboard: undefined;
  PendingJobList: undefined;
  Notification:undefined;
};
const HomeStack = createNativeStackNavigator<HomeParams>();

export type HomeRoutes<ScreenName extends keyof HomeParams> =
  CompositeScreenProps<
    NativeStackScreenProps<HomeParams, ScreenName>,
    BottomTabScreenProps<TabRoutes>
  >;
const Home: React.FC = () => {
  return (
    <HomeStack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{headerShown: false}}>
      <HomeStack.Screen name="Dashboard" component={Dashboard} />
      <HomeStack.Screen name="PendingJobList" component={PendingJobList} />
      <HomeStack.Screen name="Notification" component={Notification} />
    </HomeStack.Navigator>
  );
};
export default Home;
