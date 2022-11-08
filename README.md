# 2-lets-vote

### Description
This contract is responsible for starting a vote, voting duration the voting period and ending the vote. 

As a starter, we have already completed the implementatiion of the function of starting the vote `start-vote`. Take a read carefully of what it does to start the vote. 

### Tasks

#### TASK 1: Complete implementation of the function `vote`
As a user if you make a call to this function, you can vote with your choice for an ongoing vote
- [ ] Any user can vote for the candidate only once.
- [ ] Validates that the voter has not already voted
- [ ] Validates that the vote is not yet ended
- [ ] updates the voter info who has voted - this will help us to know if users have already voted or not
- [ ] updates the new total count on the ballot
- [ ] updates the new total count for a candidate

#### TASK 2: Complete implementation of the function `end-vote`
As an authorized user (who started the vote) if you make a call to this function, you can end the vote
- [ ] Validates that only the owner/admin can end vote
- [ ] cannot end before expiry is reached
- [ ] updates the ballot with the correct status to `Ended`


## TESTING
Now, the unit tests for the functions in the contract have already been written. You should be able to test the implementation of the functions by running the command in your terminal for this project: `clarinet test`. If all the test cases pass with `ok` response, that means you code works. 
We have not only success scenarios but failure scenarios captured in the unit tests. 

Also, there are contract call commands added at the end of the contract which you can use to test your functions manually. 
