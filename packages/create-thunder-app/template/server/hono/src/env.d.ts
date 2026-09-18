declare namespace NodeJS {
  interface ProcessEnv {
    SERVER_URL?: string;
    BETTER_AUTH_URL?: string;
    BETTER_AUTH_SECRET?: string;
    CLIENT_URL?: string;
    NEXT_PUBLIC_SERVER_URL?: string;
    EXPO_PUBLIC_SERVER_URL?: string;
    DATABASE_URL?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB?: string;
    EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS?: string;
    EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID?: string;
    SMTP_EMAIL?: string;
    SMTP_APP_PASSWORD?: string;
    SMTP_NAME?: string;
    NODE_ENV?: string;
    [key: string]: string | undefined;
  }
}
