import { User } from '../types';
export interface CreateUserData {
    username: string;
    email?: string;
    password: string;
}
export interface LoginResult {
    user: User;
    token: string;
}
export declare class UserService {
    createUser(data: CreateUserData): Promise<User>;
    findByUsername(username: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    login(username: string, password: string): Promise<LoginResult | null>;
    updateUser(id: string, data: Partial<CreateUserData>): Promise<User | null>;
    deleteUser(id: string): Promise<boolean>;
    usernameExists(username: string): Promise<boolean>;
    emailExists(email: string): Promise<boolean>;
}
declare const _default: UserService;
export default _default;
//# sourceMappingURL=UserService.d.ts.map