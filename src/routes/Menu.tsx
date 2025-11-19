import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import React from 'react';
import {
  MainMenu,
  Certifications,
  CertificationsForm,
  Achievements,
  AchievementsForm,
  Skills,
  AddSkills,
  Training,
  HelpAndSupport,
  Settings,
  PockItKit,
  OtpScreen,
  TimeSheet,
  EditProfile,
} from '../screens/menu';
import {CompositeScreenProps} from '@react-navigation/native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {TabRoutes} from '../routes';
import About from '../screens/menu/About';

export type MenuParams = {
  MainMenu: undefined;
  EditProfile: undefined;
  Certifications: undefined;
  CertificationsForm: undefined;
  Achievements: undefined;
  AchievementsForm: undefined;
  Skills: undefined;
  AddSkills: {
    IDs: any;
    onSuccess: () => void;
  };
  Training: undefined;
  HelpAndSupport: undefined;
  About: undefined;
  Settings: undefined;
  PockItKit: undefined;
  OtpScreen: {
    mobile: string;
    email: string;
    name: string;
    photo: string;
  };
  TimeSheet: undefined;
};
const MenuStack = createNativeStackNavigator<MenuParams>();

export type MenuRoutes<ScreenName extends keyof MenuParams> =
  CompositeScreenProps<
    NativeStackScreenProps<MenuParams, ScreenName>,
    BottomTabScreenProps<TabRoutes>
  >;
const Menu: React.FC = () => {
  return (
    <MenuStack.Navigator
      initialRouteName="MainMenu"
      screenOptions={{headerShown: false}}>
      <MenuStack.Screen name={'MainMenu'} component={MainMenu} />
      <MenuStack.Screen name={'EditProfile'} component={EditProfile} />
      <MenuStack.Screen name={'Certifications'} component={Certifications} />
      <MenuStack.Screen
        name={'CertificationsForm'}
        component={CertificationsForm}
      />
      <MenuStack.Screen name={'Achievements'} component={Achievements} />
      <MenuStack.Screen
        name={'AchievementsForm'}
        component={AchievementsForm}
      />
      <MenuStack.Screen name={'Skills'} component={Skills} />
      <MenuStack.Screen name={'AddSkills'} component={AddSkills} />
      <MenuStack.Screen name={'Training'} component={Training} />
      <MenuStack.Screen name={'Settings'} component={Settings} />
      <MenuStack.Screen name={'HelpAndSupport'} component={HelpAndSupport} />
      <MenuStack.Screen name={'About'} component={About} />
      <MenuStack.Screen name={'PockItKit'} component={PockItKit} />
      <MenuStack.Screen name={'OtpScreen'} component={OtpScreen} />
      <MenuStack.Screen name={'TimeSheet'} component={TimeSheet} />
    </MenuStack.Navigator>
  );
};
export default Menu;
