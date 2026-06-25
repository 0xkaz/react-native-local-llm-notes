import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MainTabParamList } from './types';
import { useT } from '../i18n';
import NotesScreen from '../screens/NotesScreen';
import TrashScreen from '../screens/TrashScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const icon =
  (name: string) =>
  ({ color, size }: { color: string; size: number }) => (
    <Icon name={name} color={color} size={size} />
  );

export default function MainTabs() {
  const t = useT();
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Notes"
        component={NotesScreen}
        options={{ title: t('tab.notes'), tabBarIcon: icon('note-text-outline') }}
      />
      <Tab.Screen
        name="Pinned"
        component={NotesScreen}
        options={{ title: t('tab.pinned'), tabBarIcon: icon('pin-outline') }}
      />
      <Tab.Screen
        name="Trash"
        component={TrashScreen}
        options={{ title: t('tab.trash'), tabBarIcon: icon('trash-can-outline') }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('tab.settings'), tabBarIcon: icon('cog-outline') }}
      />
    </Tab.Navigator>
  );
}
