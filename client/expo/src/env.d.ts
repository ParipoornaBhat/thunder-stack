declare const process: {
  env: {
    EXPO_PUBLIC_SERVER_URL?: string;
    EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB?: string;
    EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS?: string;
    EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID?: string;
    [key: string]: string | undefined;
  };
};
