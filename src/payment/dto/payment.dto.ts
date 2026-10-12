export class PaymentDto {
    senderEmail: string;
    senderPassword: string;
    receiverEmail: string;
    /** Amount in kopiykas. 1050 means 10.50. */
    amount: number;
}
