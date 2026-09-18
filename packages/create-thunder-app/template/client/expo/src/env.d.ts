declare const process: {
  env: {
    SERVER_URL?: string;
    NEXT_PUBLIC_SERVER_URL?: string;
    EXPO_PUBLIC_SERVER_URL?: string;
    EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB?: string;
    EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS?: string;
    EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID?: string;
    [key: string]: string | undefined;
  };
};

declare module "react" {
  const React: any;
  export default React;
  export const useState: any;
  export const useEffect: any;
  export const useRef: any;
  export const useMemo: any;
  export const useCallback: any;
  export const createContext: any;
  export const useContext: any;
}

declare module "react-native" {
  export const Platform: any;
  export const StyleSheet: any;
  export const Text: any;
  export const View: any;
  export const TextInput: any;
  export const FlatList: any;
  export const TouchableOpacity: any;
  export const ActivityIndicator: any;
  export const useColorScheme: any;
  export const Alert: any;
  export const ScrollView: any;
  const _default: any;
  export default _default;
}

declare module "expo-constants" {
  const Constants: any;
  export default Constants;
}

declare module "expo-router" {
  export const Stack: any;
  export const Tabs: any;
  export const Slot: any;
  export const useRouter: any;
  export const useSegments: any;
  export const useLocalSearchParams: any;
  export const Link: any;
  export const Redirect: any;
}

declare module "expo-linking" {
  export const createURL: any;
  export const useURL: any;
  export const addEventListener: any;
}

declare module "lucide-react-native" {
  const all: any;
  export = all;
}
