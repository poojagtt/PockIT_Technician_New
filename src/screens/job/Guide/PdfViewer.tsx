import {View, Image} from 'react-native';
import React, {useRef} from 'react';
import Pdf from 'react-native-pdf';
import {BASE_URL} from '../../../modules';
import {JobRoutes} from '../../../routes/Job';
import WebView from 'react-native-webview';

interface PdfViewer extends JobRoutes<'PdfViewer'> {}
const PdfViewer: React.FC<PdfViewer> = ({navigation, route}) => {
  const {item} = route.params;
  const webViewRef = useRef<any>(null);
  const fileType =
    item.TYPE == 'D'
      ? item.DOCUMENT.substring(item.DOCUMENT.lastIndexOf('.') + 1)
      : null;
  return (
    <View style={{flex: 1}}>
      {item.TYPE == 'D' ? (
        fileType == 'pdf' ? (
          <Pdf
            trustAllCerts={false}
            source={{
              cache: false,
              uri: `${BASE_URL}static/HelpDocument/${item.DOCUMENT}`,
            }}
            onLoadComplete={(numberOfPages, filePath) => {}}
            onPageChanged={(page, numberOfPages) => {}}
            onError={error => {}}
            onPressLink={uri => {}}
            style={{
              flex: 1,
              width: '100%',
              height: '100%',
            }}
            enableAnnotationRendering={true}
          />
        ) : (
          <Image
            source={{uri: `${BASE_URL}static/HelpDocument/${item.DOCUMENT}`}}
            style={{height: '100%', width: '100%'}}
            resizeMode="contain"
          />
        )
      ) : (
        <WebView
          ref={webViewRef}
          source={{uri: item.LINK}}
          style={{flex: 1}}
          startInLoadingState={true}
        />
      )}
    </View>
  );
};

export default PdfViewer;
