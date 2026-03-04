export type RootStackParamList = {
  // Auth screens no bottom tab
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  
  // Main app screens with bottom tab
  Main: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  AddTransaction: undefined;
  Analytics: undefined;
  Profile: undefined;
};

// For nested stack navigation within tabs
export type DashboardStackParamList = {
  DashboardHome: undefined;
};

export type TransactionsStackParamList = {
  TransactionsList: undefined;
};

export type AnalyticsStackParamList = {
  AnalyticsHome: undefined;
  Predictions: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
};