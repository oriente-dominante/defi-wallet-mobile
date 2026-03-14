import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import EnhancedPortfolioScreen from '../screens/EnhancedPortfolioScreen';
import SendScreen from '../screens/SendScreen';
import SwapScreen from '../screens/SwapScreen';
import TransactionScreen from '../screens/TransactionScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useTheme } from '../hooks/useTheme';

const Tab = createBottomTabNavigator();

const TabIcon = ({
  focused,
  icon,
  label,
  theme,
}: {
  focused: boolean;
  icon: string;
  label: string;
  theme: any;
}) => (
  <View style={styles.tabIcon}>
    <Text style={[styles.tabIconText, { fontSize: focused ? 22 : 18 }]}>
      {icon}
    </Text>
    <Text
      style={[
        styles.tabLabel,
        {
          color: focused
            ? theme.colors.tabBarActive
            : theme.colors.tabBarInactive,
        },
      ]}
    >
      {label}
    </Text>
  </View>
);

const TabNavigator: React.FC = () => {
  const theme = useTheme();

  const tabBarStyle = [
    styles.tabBar,
    {
      backgroundColor: theme.colors.tabBarBackground,
      borderTopColor: theme.colors.tabBarBorder,
    },
  ];

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.colors.tabBarActive,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
      }}
    >
      <Tab.Screen
        name="Portfolio"
        component={EnhancedPortfolioScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={'\uD83D\uDCBC'}
              label="Portfolio"
              theme={theme}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Send"
        component={SendScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={'\uD83D\uDCE4'}
              label="Send"
              theme={theme}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Swap"
        component={SwapScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={'\uD83D\uDD04'}
              label="Swap"
              theme={theme}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={'\uD83D\uDCCB'}
              label="History"
              theme={theme}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon={'\u2699\uFE0F'}
              label="Settings"
              theme={theme}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    height: 95,
    paddingBottom: 25,
    paddingTop: 15,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  tabIconText: {
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default TabNavigator;
