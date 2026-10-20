# Project Thoughts
### Introduction
Hello. I'm writing this section after i've build the simple ledger system, based on standart double-entry approach. Keeping the balance as still columns and rows doesn't seem very promising as it makes the entity very vulnerable. On this one, i'm logging every transaction and when we need to check the balance or read it before transaction we're going through all the transactions with sender_id subtracting amount and receiver_id match is adding. Of course this is sample approach and I'm going to need to make two entries since one transaction. Why? 

First of all, number of database queries. Now we need to go through and find every transaction where id == receiver_id and another one with sender_id. Yes, Prisma ORM covers that issue for me with findMany(OR []) but under the hood it still loads our system. 
Now I need to make two entries since one transaction, with type of adding/subtracting and just to go through every entry with account_id == id . And then we're gonna have to cover this idea with reconciliation job to ensure consistency and atomicity.

But to roll through every transaction will slow down our process if we're going to have a customer with over 1m transactions, so we're gonna need snapshot system to store balance. 

### Sad news
When I was reading Accounting For Developers, Part I: The Fundamentals by Modern Treasury. I've came to idea that concurrency of payments needs to be done by participants queue, not payments queue. I mean we're going to need isolation in our services. Isolation will be based on the queue, so every transaction will be processed independently by it's order. However this queue must be based on participants entities because our main goal is to defeat inconsistency in users not in payments. 

So sad news about it, is that i've came to this idea with feeling that I've invented something, but then I googled it and found out that it was best practise long before me :(

