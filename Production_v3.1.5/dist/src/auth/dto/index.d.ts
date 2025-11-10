export declare class LoginDto {
    email: string;
    password: string;
}
export declare class RegisterDto {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role: 'supplier' | 'approver' | 'end_user';
}
