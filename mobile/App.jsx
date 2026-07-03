import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Landing from './screens/Landing.jsx';
import Login from './screens/Login.jsx';
import Register from './screens/Register.jsx';
import Dashboard from './screens/Dashboard.jsx';
import ProfileTab from './tabs/ProfileTab.jsx';
import BillingTab from './tabs/BillingTab.jsx';

import { isAuthenticated } from './utils/auth.js';

const AuthStack = createNativeStackNavigator();
const AppTab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Landing" component={Landing} />
      <AuthStack.Screen name="Login" component={Login} />
      <AuthStack.Screen name="Register" component={Register} />
    </AuthStack.Navigator>
  );
}

function AppTabNavigator() {
  return (
    <AppTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          backgroundColor: '#fff',
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <AppTab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{ tabBarLabel: 'Home', tabBarIcon: ({ color }) => <TabIcon icon="⊞" color={color} /> }}
      />
      <AppTab.Screen
        name="Profile"
        component={ProfileTab}
        options={{ tabBarLabel: 'Profile', tabBarIcon: ({ color }) => <TabIcon icon="👤" color={color} /> }}
      />
      <AppTab.Screen
        name="Billing"
        component={BillingTab}
        options={{ tabBarLabel: 'Billing', tabBarIcon: ({ color }) => <TabIcon icon="💳" color={color} /> }}
      />
    </AppTab.Navigator>
  );
}

function TabIcon({ icon }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 18 }}>{icon}</Text>;
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    isAuthenticated().then((auth) => {
      setInitialRoute(auth ? 'AppTabs' : 'Auth');
    });
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <RootStack.Screen name="Auth" component={AuthNavigator} />
        <RootStack.Screen name="AppTabs" component={AppTabNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
