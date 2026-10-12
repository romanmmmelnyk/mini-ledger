export class TopUpDto {
    email: string;
    password: string;
    /** Amount in kopiykas. 1050 means 10.50. */
    amount: number;
}
