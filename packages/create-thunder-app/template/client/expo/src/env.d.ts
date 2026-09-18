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

declare module "react-native" {
  export const Platform: any;
  const _default: any;
  export default _default;
}

declare module "expo-constants" {
  const Constants: any;
  export default Constants;
}
