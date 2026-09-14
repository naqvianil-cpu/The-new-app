import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type CasesStackParamList = {
  MyCases: undefined;
  CaseDetail: { id: number };
};

// Mirrors CasesStackParamList's shape (Dashboard is just a different entry
// point into the same CaseDetail screen) -- kept as a separate stack
// because each bottom-tab gets its own independent navigation history.
export type HomeStackParamList = {
  Dashboard: undefined;
  CaseDetail: { id: number };
};

export type TabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Cases: NavigatorScreenParams<CasesStackParamList>;
  Submit: undefined;
  Settings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends TabParamList {}
  }
}
