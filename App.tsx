// import React from 'react';
// import {KeyboardAvoidingView, Platform, StatusBar, Text, View} from 'react-native';
// import {useSelector} from './src/context';
// import {BASE_URL, fontFamily, useTheme} from './src/modules';
// import SplashScreen from './src/SplashScreen';
// import Routes from './src/routes';

// import {
//   configureReanimatedLogger,
//   ReanimatedLogLevel,
// } from 'react-native-reanimated';
// import {Login} from './src/screens';
// import { SafeAreaView } from 'react-native-safe-area-context';

// declare global {
//   var RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS: boolean;
// }

// globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;
// configureReanimatedLogger({
//   level: ReanimatedLogLevel.warn,
//   strict: false,
// });



// type AppProps = {};
// const App: React.FC<AppProps> = () => {
//   const {splash, user} = useSelector(state => state.app);
//   const color = useTheme();
  
//   return (
//     <SafeAreaView style={{flex: 1, backgroundColor: color.background}}>
//       <StatusBar
//        translucent={false} 
//         barStyle={Platform.OS === 'ios' ? 'dark-content' : 'dark-content'}
//         backgroundColor={color.primary2}
//       />
//       <KeyboardAvoidingView style={{flex: 1}} behavior={'height'}>
//         {/* <View
//           style={{
//             zIndex: 1000,
//             position: 'absolute',
//             top: 0,
//             alignSelf: 'flex-end',
//             paddingVertical: 3,
//             opacity: 0.8,
//             backgroundColor:
//               BASE_URL == 'https://pockitadmin.uvtechsoft.com:8767/'
//                 ? color.primary
//                 : color.secondary,
//             justifyContent: 'center',
//             alignItems: 'center',
//             paddingHorizontal: 10,
//             borderRadius: 4,
//             borderTopRightRadius: 0,
//             shadowColor: '#000',
//             shadowOffset: {
//               width: 0,
//               height: 2,
//             },
//             shadowOpacity: 0.25,
//             shadowRadius: 3.84,
//             elevation: 5,
//           }}>
//           <Text
//             style={{
//               color: '#FFF',
//               fontWeight: 'bold',
//               fontSize: 12,
//                fontFamily: fontFamily,
//             }}>
//             Pre Release
//           </Text>
//         </View> */}
//         {splash ? <SplashScreen /> : user ? <Routes /> : <Login />}
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };
// export default App;



import React from 'react';
import { Platform, StatusBar, Text, TextInput, View } from 'react-native';
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
  const insets = useSafeAreaInsets();

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
