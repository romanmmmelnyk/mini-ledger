import {UserStatus} from "@prisma/client";

export class UserPublicDto {
    id: string | number;
    email: string;
    name: string | null
    status: UserStatus;
    createdAt: Date;
}