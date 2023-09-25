export interface AuthResponse {
  message: string;
  user: {
    name: string;
    email: string;
    avatar: string;
    twoFactorSecret?: string;
    isTwoFactorEnabled?: boolean;
  };
  accessToken: string;
}
