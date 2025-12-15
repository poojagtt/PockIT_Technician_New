import React, { useEffect } from 'react';
import { NativeModules, Platform, StatusBar, Text, TextInput, View } from 'react-native';
import { useSelector } from './src/context';
import { useTheme } from './src/modules';
import SplashScreen from './src/SplashScreen';
import Routes from './src/routes';

import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';
import { Login } from './src/screens';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});
(Text as any).defaultProps = {
  ...(Text as any).defaultProps,
  allowFontScaling: false,
};

(TextInput as any).defaultProps = {
  ...(TextInput as any).defaultProps,
  allowFontScaling: false,
};

// Move this inner logic to a subcomponent so `useSafeAreaInsets()` works properly
const AppContent: React.FC = () => {
  const { splash, user } = useSelector(state => state.app);
  const color = useTheme();
  // const { HashModule } = NativeModules;

  const insets = useSafeAreaInsets();
// useEffect(() => {
//   const getHash=async()=>{
//     const hash=await HashModule.getAppHash();
//     console.log('\n\n\n\nApp Hash: ', hash);
//   }
//   getHash();
// }, []);
  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingBottom: insets.bottom,
        // backgroundColor: color.primary2, // Or 'red' if you're debugging
      }}
      edges={['top']}
    >
      {/* Optional: StatusBar styling */}
      <StatusBar
       translucent={false} 
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'dark-content'}
        backgroundColor={color.primary2}
      />
      {/* <SplashScreen /> */}
      {splash ? <SplashScreen /> : user ? <Routes /> : <Login />}
    </SafeAreaView>
  );
};

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
};

export default App;
