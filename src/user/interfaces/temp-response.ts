export interface TempAuthResponse {
    token: string;
    twoFactorEnable: boolean;
    id: string;
    email: string;
    name: string;
    pseudo: string;
    avatar: string;
    isTwoFactorEnabled: boolean;
    status: string;
}