import {
    createNativeStackNavigator,
    NativeStackScreenProps,
  } from '@react-navigation/native-stack';
  import React from 'react';
  import {CompositeScreenProps} from '@react-navigation/native';
  import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
  import {TabRoutes} from '../routes';
import EarningHome from '../screens/Earning/EarningHome';
  
  export type EarningParams = {
    EarningHome: undefined;
  };
  const EarningStack = createNativeStackNavigator<EarningParams>();
  
  export type EarningRoutes<ScreenName extends keyof EarningParams> =
    CompositeScreenProps<
      NativeStackScreenProps<EarningParams, ScreenName>,
      BottomTabScreenProps<TabRoutes>
    >;
  const Earning: React.FC = () => {
    return (
      <EarningStack.Navigator
        initialRouteName="EarningHome"
        screenOptions={{headerShown: false}}>
        <EarningStack.Screen name="EarningHome" component={EarningHome} />
      </EarningStack.Navigator>
    );
  };
  export default Earning;
  