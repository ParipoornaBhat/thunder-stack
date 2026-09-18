declare const process: {
  env: {
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
  };
};

declare module "hono" {
  export interface Context<E = any> {
    env?: any;
    req: {
      raw: any;
      query: (key?: string) => string | undefined;
      header: (name?: string) => string | undefined;
    };
    json: (data: any, status?: number) => any;
    redirect: (url: string, status?: number) => any;
    set: (key: string, value: any) => void;
    get: (key: string) => any;
  }
  export type Next = () => Promise<void>;
  export type Handler<E = any> = (c: Context<E>, next: Next) => any;
  export type MiddlewareHandler<E = any> = (c: Context<E>, next: Next) => any;

  export class Hono<E = any> {
    use(path: string, ...handlers: (MiddlewareHandler<E> | any)[]): this;
    use(...handlers: (MiddlewareHandler<E> | any)[]): this;
    get(path: string, ...handlers: (Handler<E> | any)[]): this;
    post(path: string, ...handlers: (Handler<E> | any)[]): this;
    put(path: string, ...handlers: (Handler<E> | any)[]): this;
    patch(path: string, ...handlers: (Handler<E> | any)[]): this;
    delete(path: string, ...handlers: (Handler<E> | any)[]): this;
    on(methods: string | string[], path: string, ...handlers: (Handler<E> | any)[]): this;
    route(path: string, app: any): this;
  }
}

declare module "hono/cors" {
  export const cors: (options?: any) => any;
}

declare module "hono/logger" {
  export const logger: () => any;
}

declare module "hono/cookie" {
  export const getCookie: (c: any, name: string) => string | undefined;
  export const setCookie: (c: any, name: string, value: string, options?: any) => void;
}

declare module "better-auth" {
  export const betterAuth: (options: any) => any;
}

declare module "better-auth/*" {
  export const drizzleAdapter: (db: any, options: any) => any;
  export const emailOTP: (options: any) => any;
}

declare module "@thunder/db" {
  export const db: any;
  export const user: any;
  export const session: any;
  export const account: any;
  export const verification: any;
  export const userRole: any;
  export const role: any;
  export const authService: any;
}

declare module "nodemailer" {
  const nodemailer: any;
  export default nodemailer;
}

declare module "zod" {
  export const z: any;
}
