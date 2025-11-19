import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import React from 'react';
import {CompositeScreenProps} from '@react-navigation/native';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {TabRoutes} from '../routes';
import JobList from '../screens/job/JobList';
import JobDetails from '../screens/job/JobDetails';
import ChatScreen from '../screens/job/Chat/ChatScreen';
import JobFlow from '../screens/job/JobFlow';
import GenerateInvoice from '../screens/job/Invoice/GenerateInvoice';
import PartsCategories from '../screens/JobParts/PartsCategories';
import PartsSubCategories from '../screens/JobParts/PartsSubCategories';
import PartsInventory from '../screens/JobParts/PartsInventory';
import InvoiceDetails from '../screens/job/Invoice/InvoiceDetails';
import GuideHome from '../screens/job/Guide/GuideHome';
import PdfViewer from '../screens/job/Guide/PdfViewer';
import TechnicianBackOfficeChat from '../screens/job/Chat/TechnicianBackOfficeChat';
import ViewInvoice from '../screens/job/Invoice/ViewInvoice';
import B2bCustomerInvoice from '../screens/job/Invoice/B2bCustomerInvoice';
export type JobParams = {
  JobList: undefined;
  TechnicianBackOfficeChat: {jobItem: JobData};
  JobDetails: {
    item: JobData;
    isFromJobList: boolean;
  };
  ChatScreen: {jobItem: JobData};
  JobFlow: {
    item: JobData;
    isFromJobList: boolean;
  };
  InvoiceDetails: {
    item: JobData;
    partList: partListDetail[];
    data: any;
  };
  GenerateInvoice: {
    item: JobData;
    partList: partListDetail[];
  };
  B2bCustomerInvoice: {
    item: JobData;
    partList: partListDetail[];
    IS_INVOICE_GENERATED: number;
  };
  PartsCategories: {
    jobItem: JobData;
  };
  PartsSubCategories: {item: any; jobItem: JobData};
  PartsInventory: {item: any; jobItem: JobData};
  GuideHome: {
    item: JobData;
  };
  PdfViewer: {item: HELP_DOCUMENT};
  ViewInvoice: {item: JobData; partList: partListDetail[]};
};

const JobStack = createNativeStackNavigator<JobParams>();
export type JobRoutes<ScreenName extends keyof JobParams> =
  CompositeScreenProps<
    NativeStackScreenProps<JobParams, ScreenName>,
    BottomTabScreenProps<TabRoutes>
  >;
const Job: React.FC = () => {
  return (
    <JobStack.Navigator
      initialRouteName="JobList"
      screenOptions={{headerShown: false}}>
      <JobStack.Screen name="JobList" component={JobList} />
      <JobStack.Screen name="JobDetails" component={JobDetails} />
      <JobStack.Screen name="ChatScreen" component={ChatScreen} />
      <JobStack.Screen name="JobFlow" component={JobFlow} />
      <JobStack.Screen name="InvoiceDetails" component={InvoiceDetails} />
      <JobStack.Screen name="GenerateInvoice" component={GenerateInvoice} />
      <JobStack.Screen
        name="B2bCustomerInvoice"
        component={B2bCustomerInvoice}
      />
      <JobStack.Screen name="PartsCategories" component={PartsCategories} />
      <JobStack.Screen
        name="PartsSubCategories"
        component={PartsSubCategories}
      />
      <JobStack.Screen name="PartsInventory" component={PartsInventory} />
      <JobStack.Screen name="GuideHome" component={GuideHome} />
      <JobStack.Screen name="PdfViewer" component={PdfViewer} />
      <JobStack.Screen
        name="TechnicianBackOfficeChat"
        component={TechnicianBackOfficeChat}
      />
      <JobStack.Screen name="ViewInvoice" component={ViewInvoice} />
    </JobStack.Navigator>
  );
};
export default Job;
