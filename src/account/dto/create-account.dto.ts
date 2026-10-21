import {AccountType} from "@prisma/client";

export class CreateAccountDto {
    type: AccountType;
    currency_code: string;
}