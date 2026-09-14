import React, { useState } from 'react';
import { I18nManager } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LookupsProvider } from '../context/LookupsContext';
import { DynexSplashScreen } from '../components/splash';
import { colors } from '../theme';

import LanguageSelectScreen from '../screens/LanguageSelectScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import MyCasesScreen from '../screens/MyCasesScreen';
import CaseDetailScreen from '../screens/CaseDetailScreen';
import SubmitGrievanceScreen from '../screens/SubmitGrievanceScreen';
import SettingsScreen from '../screens/SettingsScreen';

import type { AuthStackParamList, CasesStackParamList, HomeStackParamList, TabParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const CasesStack = createNativeStackNavigator<CasesStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

type IoniconName = keyof typeof Ionicons.glyphMap;

// One icon per tab, filled when active / outline when not -- matches the
// convention of every mainstream iOS/Android tab bar.
const TAB_ICONS: Record<keyof TabParamList, { active: IoniconName; inactive: IoniconName }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Cases: { active: 'folder-open', inactive: 'folder-open-outline' },
  Submit: { active: 'megaphone', inactive: 'megaphone-outline' },
  Settings: { active: 'settings', inactive: 'settings-outline' },
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// Home and Cases each get their own stack even though both ultimately push
// the same CaseDetailScreen -- a bottom-tab navigator keeps one independent
// navigation history per tab, so the "recent cases" shortcut on the
// Dashboard and the full list under My Cases each need their own route to
// CaseDetail rather than sharing one.
function HomeNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="CaseDetail" component={CaseDetailScreen} options={{ title: '' }} />
    </HomeStack.Navigator>
  );
}

function CasesNavigator() {
  const { strings } = useLanguage();
  return (
    <CasesStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <CasesStack.Screen
        name="MyCases"
        component={MyCasesScreen}
        options={{ title: strings.myCases.title }}
      />
      <CasesStack.Screen
        name="CaseDetail"
        component={CaseDetailScreen}
        // CaseDetailScreen sets its own header title (the case reference
        // number) via navigation.setOptions once it has loaded the case.
        options={{ title: '' }}
      />
    </CasesStack.Navigator>
  );
}

function MainTabs() {
  const { strings } = useLanguage();
  return (
    <LookupsProvider>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.textFaint,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
          tabBarIcon: ({ color, size, focused }) => {
            const icons = TAB_ICONS[route.name as keyof TabParamList];
            return <Ionicons name={focused ? icons.active : icons.inactive} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeNavigator} options={{ title: strings.dashboard.title }} />
        <Tab.Screen
          name="Cases"
          component={CasesNavigator}
          options={{ title: strings.myCases.title }}
        />
        <Tab.Screen
          name="Submit"
          component={SubmitGrievanceScreen}
          options={{ title: strings.submit.title }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: strings.settings.title }}
        />
      </Tab.Navigator>
    </LookupsProvider>
  );
}

// Gates, in order: language chosen? -> signed in? -> main app.
// Mirrors the worker's actual first-run journey (pick a language once,
// then either sign in with an existing Worker ID + PIN or register one).
export default function RootNavigator() {
  const { ready: languageReady, hasChosen, isRTL } = useLanguage();
  const { session, loading: authLoading } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  // Layout direction only matters for Urdu and Arabic today; forcing it at runtime
  // would require a full app reload in RN, so screens instead read isRTL
  // directly (see SubmitGrievanceScreen/LoginScreen) rather than relying
  // on I18nManager.forceRTL, which needs a restart to take effect.
  void I18nManager;

  // The animated launch screen owns this gate instead of a bare spinner:
  // it waits for language + auth state to resolve (same condition the
  // old `<LoadingView />` gated on) AND its own minimum on-screen time,
  // then cross-fades into the real navigation tree below.
  if (!splashDone) {
    return (
      <DynexSplashScreen
        ready={languageReady && !authLoading}
        onFinish={() => setSplashDone(true)}
      />
    );
  }

  return (
    <NavigationContainer>
      {!hasChosen ? (
        <LanguageSelectScreen />
      ) : !session ? (
        <AuthNavigator />
      ) : (
        <MainTabs />
      )}
    </NavigationContainer>
  );
}
