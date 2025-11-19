import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {fontFamily, Size, useTheme} from '../../modules';
import {MenuRoutes} from '../../routes/Menu';
import {Header, Icon} from '../../components';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOut,
  FadeOutUp,
  LinearTransition,
  useDerivedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import PrivacyPolicyComponent from '../auth/PrivacyPolicyComponent';

interface AboutProps extends MenuRoutes<'About'> {}

const About: React.FC<AboutProps> = ({navigation}) => {
  const [expanded, setExpanded] = useState<{[key: string]: boolean}>({
    terms: false,
    licenses: false,
    privacy: false,
  });
  const Duration = 500;

  const toggleSection = (section: string) => {
    setExpanded(prev => ({...prev, [section]: !prev[section]}));
  };
const Section: React.FC<SectionProps> = ({title, contentParts}) => {
  const colors = useTheme();

  const renderBoldText = (text: string) => {
    const parts = text.split(':');
    if (parts.length > 1) {
      return (
        <Text style={[styles.sectionContent, {color: colors.text}]}>
          <Text
            style={[
              styles.sectionContent,
              {fontWeight: '700', color: '#020202'},
            ]}>
            {parts[0]}:
          </Text>
          {parts[1]}
        </Text>
      );
    }
    return (
      <Text style={[styles.sectionContent, {color: colors.text}]}>{text}</Text>
    );
  };

  const renderContent = () => {
    return contentParts.map((part, partIndex) => {
      if (part.type === 'paragraph') {
        return (
          <Text
            key={partIndex}
            style={[
              styles.sectionContent,
              {color: colors.text, marginBottom: 6},
            ]}>
            {part.text}
          </Text>
        );
      } else if (part.type === 'bulleted' || part.type === 'numbered') {
        return (
          <View key={partIndex}>
            {part.items?.map((item, index) => (
              <View key={index} style={styles.bulletItem}>
                <View style={styles.bulletPoint}>
                  <Text style={styles.bulletText}>•</Text>
                </View>
                {renderBoldText(
                  item.startsWith('• ')
                    ? item.substring(2).trim()
                    : item.trim(),
                )}
              </View>
            ))}
          </View>
        );
      }
      return null;
    });
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, {color: colors.text}]}>{title}</Text>
      {renderContent()}
    </View>
  );
};
  const rotation = {
    terms: useDerivedValue(() =>
      expanded.terms
        ? withTiming(180, {duration: Duration})
        : withTiming(0, {duration: Duration}),
    ),
    licenses: useDerivedValue(() =>
      expanded.licenses
        ? withTiming(180, {duration: Duration})
        : withTiming(0, {duration: Duration}),
    ),
    privacy: useDerivedValue(() =>
      expanded.privacy
        ? withTiming(180, {duration: Duration})
        : withTiming(0, {duration: Duration}),
    ),
  };

  const termsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${rotation.terms.value}deg`}],
  }));

  const licensesAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${rotation.licenses.value}deg`}],
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Header label={'About'} onBack={() => navigation.goBack()} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View
          layout={LinearTransition.stiffness(45).duration(Duration)}
          style={styles.card}>
          <TouchableOpacity
            onPress={() => toggleSection('terms')}
            style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Terms and Conditions</Text>
            <Animated.View style={termsAnimatedStyle}>
              <Icon
                type="MaterialIcons"
                name="expand-more"
                size={24}
                color={'#636363'}
              />
            </Animated.View>
          </TouchableOpacity>
          {expanded.terms && (
            <Animated.View
              entering={FadeInUp.stiffness(45).duration(Duration)}
              exiting={FadeOutUp.stiffness(45)}
              style={styles.cardContent}>
              <ScrollView
                       style={styles.scrollView}
                       showsVerticalScrollIndicator={false}
                       bounces={false}
                       contentContainerStyle={styles.scrollContent}>
                       <View style={styles.contentContainer}>
                         <Section
                           title="Introduction"
                           contentParts={[
                             {
                               type: 'paragraph',
                               text: `These Terms and Conditions (“Terms”) constitute a legally binding agreement between the User (“User”, “you”, or “your”) and PockIT Engineers Private Limited, a company incorporated under the Companies Act, 2013, operating under the brand name ‘PockIT Engineers’ (“Company,” “we,” “our,” or “us”) governing the access to and use of our services through our website, mobile application (App), and any associated digital platforms (collectively, the “Platform”), including IT solutions, support, and hardware products (the “Services”).
                               By accessing, browsing, or using the Services, the User confirms having read, understood and accepted these Terms in their entirety. If the User does not agree to these Terms, the User is advised to refrain from accessing or utilizing the Services.`,
                             },
                           ]}
                         />
                         <Section
                           title="Scope of Services"
                           contentParts={[
                             {
                               type: 'paragraph',
                               text: `PockIT provides professional IT hardware diagnostic, repair, and maintenance services to individual and enterprise customers. These services are subject to the terms outlined herein and any specific agreements executed between PockIT Engineers and its customers. The Company is engaged in the business of providing IT solutions and services to its clients, including but not limited to managed services, hardware (new and refurbished) procurement, repair and maintenance, spares management, and deployment of refurbished IT equipment. This Policy applies to all personal information collected or processed by us who access or use our products and services, including but not limited to the comprehensive suite of IT support services. consultancy, and hardware sales, including through our websites/ Apps or other digital platforms, support applications, support portals, and other means of interaction and other related offerings Repair and maintenance of IT hardware, network configuration, deployment, support, installation, configuration, and troubleshooting of software applications, IT consultancy and advisory services, marketing and sale of IT hardware products including computers, peripherals, and accessories in India and the UAE.`,
                             },
                           ]}
                         />
                         <Section
                           title="User Obligations and responsibilities"
                           contentParts={[
                             {
                               type: 'paragraph',
                               text: `To access certain features, you may be required to create an account. You agree to:`,
                             },
                             {
                               type: 'numbered',
                               items: [
                                 'Furnish accurate, current, and complete information when creating an account or placing an order through our website or Apps.',
                                 'Maintain the confidentiality and security of your account login credentials.',
                                 'Promptly notify the Company of any unauthorized access, usage of the User’s account or breaches.',
                                 'Use the Services solely for lawful purposes and in conformity with these Terms and applicable laws.',
                                 'Use the Platform and Services lawfully and in accordance with these Terms.',
                               ],
                             },
                           ]}
                         />
             
                         <Section
                           title="Orders and Payments"
                           contentParts={[
                             {
                               type: 'numbered',
                               items: [
                                 'Order Confirmation via Website/App: All orders placed for products or services placed through the website or mobile application are subject to acceptance by the Company. The Company reserves the right to reject or cancel any order at its sole discretion, with or without prior notice.',
                                 'Pricing Policy: Prices displayed on the website or other platforms/app are indicative and subject to revision without notice. While every effort is made to ensure accuracy in pricing, the Company reserves the right to rectify errors in pricing or product details.',
                                 'Payment Terms: Payment shall be due at the time of placing the order unless otherwise agreed in writing. Accepted payment methods will be specified on the Company’s platform or invoice (e.g., UPI, credit/debit cards, wallets, net banking).',
                               ],
                             },
                           ]}
                         />
             
                         <Section
                           title="Shipping and Delivery"
                           contentParts={[
                             {
                               type: 'numbered',
                               items: [
                                 'Shipping: Hardware products purchased through the app or website shall be shipped within the serviceable regions as specified by the Company.',
                                 'Shipping costs and delivery timelines shall be communicated at the time of purchase during the checkout process on the website or platform/app.',
                                 'Delivery Schedule: Delivery timelines are indicative and not guaranteed. The Company shall not be held liable for delays arising due to circumstances beyond its control.',
                               ],
                             },
                           ]}
                         />
             
                         <Section
                           title="Returns and Refunds"
                           contentParts={[
                             {
                               type: 'numbered',
                               items: [
                                 'Hardware returns via App/Website: Returns shall be accepted within seven (7) days from the date of purchase, subject to the condition that the product is returned unused, in original packaging, and saleable condition through your account dashboard or by contacting support.',
                                 'Refunds will be processed after verification and approval of the returned product.',
                                 'Services: In the event of dissatisfaction with any service rendered, the User may contact the Company at itsupport@pockitengineers.com. Refunds for services shall be evaluated on a discretionary, case-by-case basis via the support ticketing system available on our website or app.',
                               ],
                             },
                           ]}
                         />
             
                         
             
                         <Section
                           title="Warranty"
                           contentParts={[
                             {
                               type: 'numbered',
                               items: [
                                 'Services: The Company offers a warranty period of one hundred and eighty (180) ’service warranty for all repair services. Any recurrence of the same issue within the warranty period shall be remedied at no additional charge.',
                                 'Products: Hardware products purchased via the app or website are governed by the respective manufacturer warranties, which are covered by manufacturer warranties, the terms of which should be governed. Users are advised to refer to the respective warranty documentation provided by the manufacturer.',
                               ],
                             },
                           ]}
                         />
                         <Section
                           title="Limitation of Liability"
                           contentParts={[
                             {
                               type: 'paragraph',
                               text: 'To the maximum extent permitted by law, the Company shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to the use of its Services/Platform/App or products. The Company’s aggregate liability for any claims shall in no event exceed the amount paid by the User for the specific product or service giving rise to such a claim.',
                             },
                           ]}
                         />
                         <Section
                           title="Intellectual Property"
                           contentParts={[
                             {
                               type: 'paragraph',
                               text: 'All intellectual property, including but not limited to text, graphics, trademarks, logos, and software on the Company’s website and associated platforms/app, are the exclusive property of PockIT Engineers or its licensors. Any unauthorized use, reproduction, or distribution is strictly prohibited and may invite legal consequences.',
                             },
                           ]}
                         />
                         <Section
                           title="Privacy Policy"
                           contentParts={[
                             {
                               type: 'paragraph',
                               text: 'The Company is committed to protecting the privacy of its Users. Please refer to the Company’s Privacy Policy for details on how personal data is collected, used, and safeguarded, including through cookies and analytics tools on digital platforms.',
                             },
                           ]}
                         />
                         <Section
                           title="Mobile App-Specific Terms"
                           contentParts={[
                             {
                               type: 'paragraph',
                               text: `When using the PockIT Engineers mobile app, you may be required to grant permissions, including:`,
                             },
                             {
                               type: 'numbered',
                               items: [
                                 'Location Access: for assigning local technicians',
                                 'Camera Access: for uploading device issues or product condition',
                                 'Storage Access: for saving invoices or warranty documents',
                                 'Push Notifications: to receive updates on orders, services, or offers',
                               ],
                             },
                             {
                               type: 'paragraph',
                               text: `These permissions are optional but may affect functionality. You may manage them through your device settings.`,
                             },
                           ]}
                         />
             
                         <Section
                           title="Governing Law and Jurisdiction"
                           contentParts={[
                             {
                               type: 'paragraph',
                               text: 'These Terms shall be governed by and construed in accordance with the laws of India. All disputes arising in connection with these Terms or the Services shall be subject to the exclusive jurisdiction of the competent courts at Pune, Maharashtra, India.',
                             },
                           ]}
                         />
                         <Section
                           title="Privacy consent (for Website/App compliance)"
                           contentParts={[
                             {
                               type: 'paragraph',
                               text: `We use cookies and collect certain data to enhance your experience and provide tailored services.
             By using our website or mobile app, you consent to our use of cookies and agree to our Terms and Conditions`,
                             },
                           ]}
                         />
             
                         <Section
                           title="Downloadable legal format (PDF version)"
                           contentParts={[
                             {
                               type: 'paragraph',
                               text: `We can generate a PDF version of the Terms and Conditions for integration or download from the footer of your app/website. We can also prepare:`,
                             },
                             {
                               type: 'numbered',
                               items: [
                                 'HTML version for your website’s Terms and Conditions pages.',
                                 `Markdown version if you're using a CMS or app framework that supports it.`,
                               ],
                             },
                             {
                               type: 'paragraph',
                               text: `These permissions are optional but may affect functionality. You may manage them through your device settings.`,
                             },
                           ]}
                         />
             
                         <Section
                           title="Account Deactivation and Deletion"
                           contentParts={[
                             {
                               type: 'bulleted',
                               items: [
                                 'When a user requests account deletion, the account is deactivated — not permanently deleted..',
                                 'Deactivation means your profile and access will be temporarily disabled.',
                                 'Your data remains stored securely in our system and will not be visible to other users.',
                                 'You may reactivate your account at any time by contacting our support team.',
                                 'If you prefer not to reactivate, you may register again using a different mobile number.',
                               ],
                             },
                             {
                               type: 'bulleted',
                               items: [
                                 'Note: Some user activity or shared content may remain visible or retained for audit or compliance purposes.',
                               ],
                             },
                             {
                               type: 'paragraph',
                               text: `For assistance, please contact our support team at itsupport@pockitengineers.com.`,
                             },
                           ]}
                         />
             
                         <Section
                           title="Contact Information"
                           contentParts={[
                             {
                               type: 'paragraph',
                               text: 'For queries, complaints, or further information regarding these Terms or the Services, you may contact us at:',
                             },
                             {
                               type: 'bulleted',
                               items: [
                                 'Email: itsupport@pockitengineers.com',
                                 'Address: PockIT Engineers, Pune, India',
                               ],
                             },
                           ]}
                         />
             
                         <View style={styles.footer}>
                           <Text style={[styles.footerText, {color: '#525252'}]}>
                             Last updated on : 01-06-2025
                           </Text>
                         </View>
                       </View>
                     </ScrollView>
            </Animated.View>
          )}
        </Animated.View>

        <Animated.View
          layout={LinearTransition.stiffness(45).duration(Duration)}
          style={styles.card}>
          <TouchableOpacity
            onPress={() => toggleSection('licenses')}
            style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Privacy Policy</Text>
            <Animated.View style={licensesAnimatedStyle}>
              <Icon
                type="MaterialIcons"
                name="expand-more"
                size={24}
                color={'#636363'}
              />
            </Animated.View>
          </TouchableOpacity>
          {expanded.licenses && (
            <Animated.View
              entering={FadeInUp.stiffness(45)}
              exiting={FadeOutUp.stiffness(45)}
              style={styles.cardContent}>
              <PrivacyPolicyComponent/>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default About;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 16,
    backgroundColor: '#F6F8FF',
  },
  heading: {
    fontSize: Size.xl,
    fontWeight: '700',
    color: '#1C1C28',
    marginBottom: 16,
    fontFamily: fontFamily,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 16,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#CBCBCB',
    margin: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: Size.lg,
    fontWeight: '500',
    color: '#0E0E0E',
    fontFamily: fontFamily,
  },
  cardContent: {
    marginTop: 8,
    fontSize: 16,
    color: '#636363',
    fontWeight: '400',
    fontFamily: fontFamily,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    marginTop: 8,
    fontFamily: fontFamily,
  },
  normalText: {
    fontFamily: fontFamily,
    fontSize: 13,
  },
  title: {
    fontSize: Size.xl,
    fontWeight: '700',
    fontFamily: fontFamily,
    // flex: 1,
    marginBottom: 5,
  },
  closeButton: {
    padding: 5,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    paddingTop: 15,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    fontFamily: fontFamily,
    color: '#1C1C28',
  },
  sectionContent: {
    fontSize: 12,
    lineHeight: 22,
    fontFamily: fontFamily,
    color: '#525252',
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletPoint: {
    marginRight: 8,
    paddingTop: 2,
  },
  bulletText: {
    color: '#525252',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: fontFamily,
  },
  footer: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: fontFamily,
    lineHeight: 20,
    marginBottom: 10,
    color: '#525252',
  },
});
