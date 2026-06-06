declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production";
      PORT: number;
      DATABASE_URL: string;
      JWT_EXPIRES_IN: string;
      JWT_COOKIE_EXPIRES_IN: string;
      JWT_SECRET: string;
    }
  }
}

export {};
