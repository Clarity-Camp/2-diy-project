
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.0/index.ts';
import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "start-vote: anyone can create and start a vote successfully",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const votingStartedBy = accounts.get("wallet_1")!.address
        const candidate1 = accounts.get("wallet_2")!.address
        const candidate2 = accounts.get("wallet_3")!.address

        let block = chain.mineBlock([
            Tx.contractCall(
                "ballot",
                "start-vote",
                [
                    types.ascii("Presidential Ballot 2024"),
                    types.uint(2000),
                    types.list([
                        types.tuple({ name: types.ascii("A"), address: types.principal(candidate1) }),
                        types.tuple({ name: types.ascii("B"), address: types.principal(candidate2) })
                    ])
                ],
                votingStartedBy
            )
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2);
        block.receipts[0].result.expectOk().expectUint(1);

        const ballotInfo = chain.callReadOnlyFn(
            "ballot",
            "vote-info",
            [types.uint(1)],
            votingStartedBy
        )
        ballotInfo.result.expectSome().expectTuple()
        assertStringIncludes(ballotInfo.result, 'startsAt: u1, status: "Active", totalVotes: u0')

        const candidateInfo1 = chain.callReadOnlyFn(
            "ballot",
            "candidate-info",
            [types.uint(1), types.principal(candidate1)],
            votingStartedBy
        )
        candidateInfo1.result.expectSome().expectTuple()
        assertEquals(candidateInfo1.result, '(some {name: "A", votes: u0})')

        const candidateInfo2 = chain.callReadOnlyFn(
            "ballot",
            "candidate-info",
            [types.uint(1), types.principal(candidate2)],
            votingStartedBy
        )
        candidateInfo2.result.expectSome().expectTuple()
        assertEquals(candidateInfo2.result, '(some {name: "B", votes: u0})')
    },
});

Clarinet.test({
    name: "start-vote: anyone can create and start a vote successfully with valid startAt block",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const votingStartedBy = accounts.get("wallet_1")!.address
        const candidate1 = accounts.get("wallet_2")!.address
        const candidate2 = accounts.get("wallet_3")!.address

        chain.mineEmptyBlockUntil(200)

        let block = chain.mineBlock([
            Tx.contractCall(
                "ballot",
                "start-vote",
                [
                    types.ascii("Presidential Ballot 2024"),
                    types.uint(2000),
                    types.list([
                        types.tuple({ name: types.ascii("A"), address: types.principal(candidate1) }),
                        types.tuple({ name: types.ascii("B"), address: types.principal(candidate2) })
                    ])
                ],
                votingStartedBy
            )
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 201);

        const ballotInfo = chain.callReadOnlyFn(
            "ballot",
            "vote-info",
            [types.uint(1)],
            votingStartedBy
        )
        ballotInfo.result.expectSome().expectTuple()
        assertStringIncludes(ballotInfo.result, 'startsAt: u200, status: "Active", totalVotes: u0')

        const candidateInfo1 = chain.callReadOnlyFn(
            "ballot",
            "candidate-info",
            [types.uint(1), types.principal(candidate1)],
            votingStartedBy
        )
        candidateInfo1.result.expectSome().expectTuple()
        assertEquals(candidateInfo1.result, '(some {name: "A", votes: u0})')

        const candidateInfo2 = chain.callReadOnlyFn(
            "ballot",
            "candidate-info",
            [types.uint(1), types.principal(candidate2)],
            votingStartedBy
        )
        candidateInfo2.result.expectSome().expectTuple()
        assertEquals(candidateInfo2.result, '(some {name: "B", votes: u0})')
    },
});

Clarinet.test({
    name: "start-vote: cannot start a vote with invalid expiry",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const votingStartedBy = accounts.get("wallet_1")!.address
        const candidate1 = accounts.get("wallet_2")!.address
        const candidate2 = accounts.get("wallet_3")!.address

        chain.mineEmptyBlockUntil(20)

        let block = chain.mineBlock([
            Tx.contractCall(
                "ballot",
                "start-vote",
                [
                    types.ascii("Presidential Ballot 2024"),
                    types.uint(2),
                    types.list([
                        types.tuple({ name: types.ascii("A"), address: types.principal(candidate1) }),
                        types.tuple({ name: types.ascii("B"), address: types.principal(candidate2) })
                    ])
                ],
                votingStartedBy
            )
        ]);
        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 21);

        const ballotInfo = chain.callReadOnlyFn(
            "ballot",
            "vote-info",
            [types.uint(1)],
            votingStartedBy
        )
        ballotInfo.result.expectNone()

        const candidateInfo1 = chain.callReadOnlyFn(
            "ballot",
            "candidate-info",
            [types.uint(1), types.principal(candidate1)],
            votingStartedBy
        )
        candidateInfo1.result.expectNone()

        const candidateInfo2 = chain.callReadOnlyFn(
            "ballot",
            "candidate-info",
            [types.uint(1), types.principal(candidate2)],
            votingStartedBy
        )
        candidateInfo2.result.expectNone()
    },
});

Clarinet.test({
    name: "vote: anyone can vote for an ongoing ballot",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const votingStartedBy = accounts.get("wallet_1")!.address
        const candidate1 = accounts.get("wallet_2")!.address
        const candidate2 = accounts.get("wallet_3")!.address

        const voter1 = accounts.get("wallet_4")!.address
        const voter2 = accounts.get("wallet_5")!.address

        let block = chain.mineBlock([
            Tx.contractCall(
                "ballot",
                "start-vote",
                [
                    types.ascii("Presidential Ballot 2024"),
                    types.uint(2000),
                    types.list([
                        types.tuple({ name: types.ascii("A"), address: types.principal(candidate1) }),
                        types.tuple({ name: types.ascii("B"), address: types.principal(candidate2) })
                    ])
                ],
                votingStartedBy
            ),
            Tx.contractCall(
                "ballot",
                "vote",
                [
                    types.uint(1),
                    types.principal(candidate1)
                ],
                voter1
            ),
            Tx.contractCall(
                "ballot",
                "vote",
                [
                    types.uint(1),
                    types.principal(candidate2)
                ],
                voter2
            ),
            Tx.contractCall(
                "ballot",
                "vote",
                [
                    types.uint(1),
                    types.principal(candidate1)
                ],
                candidate1
            ),
            Tx.contractCall(
                "ballot",
                "vote",
                [
                    types.uint(1),
                    types.principal(candidate2)
                ],
                candidate2
            ),
        ]);

        assertEquals(block.receipts.length, 5);
        assertEquals(block.height, 2);

        const ballotInfo = chain.callReadOnlyFn(
            "ballot",
            "vote-info",
            [types.uint(1)],
            votingStartedBy
        )
        ballotInfo.result.expectSome().expectTuple()
        assertStringIncludes(ballotInfo.result, 'startsAt: u1, status: "Active", totalVotes: u4')

        const candidateInfo1 = chain.callReadOnlyFn(
            "ballot",
            "candidate-info",
            [types.uint(1), types.principal(candidate1)],
            votingStartedBy
        )
        candidateInfo1.result.expectSome().expectTuple()
        assertEquals(candidateInfo1.result, '(some {name: "A", votes: u2})')

        const candidateInfo2 = chain.callReadOnlyFn(
            "ballot",
            "candidate-info",
            [types.uint(1), types.principal(candidate2)],
            votingStartedBy
        )
        candidateInfo2.result.expectSome().expectTuple()
        assertEquals(candidateInfo2.result, '(some {name: "B", votes: u2})')
    },
});

Clarinet.test({
    name: "vote: cannot vote if ballot does not exist",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const votingStartedBy = accounts.get("wallet_1")!.address
        const candidate1 = accounts.get("wallet_2")!.address
        const candidate2 = accounts.get("wallet_3")!.address

        const voter1 = accounts.get("wallet_4")!.address

        let block = chain.mineBlock([
            Tx.contractCall(
                "ballot",
                "vote",
                [
                    types.uint(1),
                    types.principal(candidate1)
                ],
                voter1
            ),
        ]);

        assertEquals(block.receipts.length, 1);
        assertEquals(block.height, 2);

        block.receipts[0].result.expectErr().expectUint(102);
    },
});

Clarinet.test({
    name: "vote: cannot vote for a non candidate",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const votingStartedBy = accounts.get("wallet_1")!.address
        const candidate1 = accounts.get("wallet_2")!.address
        const candidate2 = accounts.get("wallet_3")!.address
        const nonCandidate = accounts.get("wallet_4")!.address

        const voter1 = accounts.get("wallet_4")!.address

        let block = chain.mineBlock([
            Tx.contractCall(
                "ballot",
                "start-vote",
                [
                    types.ascii("Presidential Ballot 2024"),
                    types.uint(2000),
                    types.list([
                        types.tuple({ name: types.ascii("A"), address: types.principal(candidate1) }),
                        types.tuple({ name: types.ascii("B"), address: types.principal(candidate2) })
                    ])
                ],
                votingStartedBy
            ),
            Tx.contractCall(
                "ballot",
                "vote",
                [
                    types.uint(1),
                    types.principal(nonCandidate)
                ],
                voter1
            ),
        ]);

        assertEquals(block.receipts.length, 2);
        assertEquals(block.height, 2);

        block.receipts[0].result.expectOk().expectUint(1);
        block.receipts[1].result.expectErr().expectUint(103);
    },
});

Clarinet.test({
    name: "vote: cannot vote if voter has already voted",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const votingStartedBy = accounts.get("wallet_1")!.address
        const candidate1 = accounts.get("wallet_2")!.address
        const candidate2 = accounts.get("wallet_3")!.address

        const voter1 = accounts.get("wallet_4")!.address
        const voter2 = accounts.get("wallet_5")!.address

        let block1 = chain.mineBlock([
            Tx.contractCall(
                "ballot",
                "start-vote",
                [
                    types.ascii("Presidential Ballot 2024"),
                    types.uint(2000),
                    types.list([
                        types.tuple({ name: types.ascii("A"), address: types.principal(candidate1) }),
                        types.tuple({ name: types.ascii("B"), address: types.principal(candidate2) })
                    ])
                ],
                votingStartedBy
            ),
            Tx.contractCall(
                "ballot",
                "vote",
                [
                    types.uint(1),
                    types.principal(candidate1)
                ],
                voter1
            ),
        ]);

        assertEquals(block1.receipts.length, 2);
        assertEquals(block1.height, 2);

        block1.receipts[0].result.expectOk().expectUint(1);
        block1.receipts[1].result.expectOk().expectBool(true);

        let block2 = chain.mineBlock([
            Tx.contractCall(
                "ballot",
                "vote",
                [
                    types.uint(1),
                    types.principal(candidate1)
                ],
                voter1
            ),
        ]);
        block2.receipts[0].result.expectErr().expectUint(104);
        
    },
});

Clarinet.test({
    name: "vote: cannot vote if ballot does not exist or has ended",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const votingStartedBy = accounts.get("wallet_1")!.address
        const candidate1 = accounts.get("wallet_2")!.address
        const candidate2 = accounts.get("wallet_3")!.address

        const voter1 = accounts.get("wallet_4")!.address
        const voter2 = accounts.get("wallet_5")!.address

        let block1 = chain.mineBlock([
            Tx.contractCall(
                "ballot",
                "start-vote",
                [
                    types.ascii("Presidential Ballot 2024"),
                    types.uint(2000),
                    types.list([
                        types.tuple({ name: types.ascii("A"), address: types.principal(candidate1) }),
                        types.tuple({ name: types.ascii("B"), address: types.principal(candidate2) })
                    ])
                ],
                votingStartedBy
            )
        ]);

        assertEquals(block1.receipts.length, 1);
        assertEquals(block1.height, 2);

        chain.mineEmptyBlockUntil(2001)

        let block2 = chain.mineBlock([
            Tx.contractCall(
                "ballot",
                "vote",
                [
                    types.uint(1),
                    types.principal(candidate1)
                ],
                voter1
            ),
        ]);

        assertEquals(block2.receipts.length, 1);
        assertEquals(block2.height, 2002);

        block2.receipts[0].result.expectErr().expectUint(105);
    },
});

Clarinet.test({
    name: "end-vote: the ballot owner can end the voting successsfuly after the endsAt block is reached",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const votingStartedBy = accounts.get("wallet_1")!.address
        const candidate1 = accounts.get("wallet_2")!.address
        const candidate2 = accounts.get("wallet_3")!.address

        const voter1 = accounts.get("wallet_4")!.address
        const voter2 = accounts.get("wallet_5")!.address

        let block1 = chain.mineBlock([
            Tx.contractCall(
                "ballot",
                "start-vote",
                [
                    types.ascii("Presidential Ballot 2024"),
                    types.uint(2000),
                    types.list([
                        types.tuple({ name: types.ascii("A"), address: types.principal(candidate1) }),
                        types.tuple({ name: types.ascii("B"), address: types.principal(candidate2) })
                    ])
                ],
                votingStartedBy
            ), 
            Tx.contractCall(
                "ballot",
                "vote",
                [
                    types.uint(1),
                    types.principal(candidate1)
                ],
                voter1
            ),
        ]);

        assertEquals(block1.receipts.length, 2);
        assertEquals(block1.height, 2);

        chain.mineEmptyBlockUntil(2001)

        let block2 = chain.mineBlock([
            Tx.contractCall(
                "ballot",
                "end-vote",
                [
                    types.uint(1)
                ],
                votingStartedBy
            ),
        ]);

        assertEquals(block2.receipts.length, 1);
        assertEquals(block2.height, 2002);

        block2.receipts[0].result.expectOk().expectBool(true);

        const ballotInfo = chain.callReadOnlyFn(
            "ballot",
            "vote-info",
            [types.uint(1)],
            votingStartedBy
        )
        ballotInfo.result.expectSome().expectTuple()
        assertStringIncludes(ballotInfo.result, 'startsAt: u1, status: "Ended", totalVotes: u1')

    },
});

Clarinet.test({
    name: "end-vote: cannot end-vote if ballot expiry has not reached",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const votingStartedBy = accounts.get("wallet_1")!.address
        const candidate1 = accounts.get("wallet_2")!.address
        const candidate2 = accounts.get("wallet_3")!.address

        const voter1 = accounts.get("wallet_4")!.address
        const voter2 = accounts.get("wallet_5")!.address

        let block1 = chain.mineBlock([
            Tx.contractCall(
                "ballot",
                "start-vote",
                [
                    types.ascii("Presidential Ballot 2024"),
                    types.uint(2000),
                    types.list([
                        types.tuple({ name: types.ascii("A"), address: types.principal(candidate1) }),
                        types.tuple({ name: types.ascii("B"), address: types.principal(candidate2) })
                    ])
                ],
                votingStartedBy
            ), 
            Tx.contractCall(
                "ballot",
                "vote",
                [
                    types.uint(1),
                    types.principal(candidate1)
                ],
                voter1
            ),
        ]);

        assertEquals(block1.receipts.length, 2);
        assertEquals(block1.height, 2);

        chain.mineEmptyBlockUntil(200)

        let block2 = chain.mineBlock([
            Tx.contractCall(
                "ballot",
                "end-vote",
                [
                    types.uint(1)
                ],
                votingStartedBy
            ),
        ]);

        assertEquals(block2.receipts.length, 1);
        assertEquals(block2.height, 201);

        block2.receipts[0].result.expectErr().expectUint(106)

        const ballotInfo = chain.callReadOnlyFn(
            "ballot",
            "vote-info",
            [types.uint(1)],
            votingStartedBy
        )
        assertStringIncludes(ballotInfo.result, 'startsAt: u1, status: "Active", totalVotes: u1')
    },
});

Clarinet.test({
    name: "end-vote: cannot vote if the vote is being ended by any other wallet other than owner",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const votingStartedBy = accounts.get("wallet_1")!.address
        const candidate1 = accounts.get("wallet_2")!.address
        const candidate2 = accounts.get("wallet_3")!.address

        const voter1 = accounts.get("wallet_4")!.address
        const voter2 = accounts.get("wallet_5")!.address

        let block1 = chain.mineBlock([
            Tx.contractCall(
                "ballot",
                "start-vote",
                [
                    types.ascii("Presidential Ballot 2024"),
                    types.uint(2000),
                    types.list([
                        types.tuple({ name: types.ascii("A"), address: types.principal(candidate1) }),
                        types.tuple({ name: types.ascii("B"), address: types.principal(candidate2) })
                    ])
                ],
                votingStartedBy
            ), 
            Tx.contractCall(
                "ballot",
                "vote",
                [
                    types.uint(1),
                    types.principal(candidate1)
                ],
                voter1
            ),
        ]);

        assertEquals(block1.receipts.length, 2);
        assertEquals(block1.height, 2);

        chain.mineEmptyBlockUntil(200)

        let block2 = chain.mineBlock([
            Tx.contractCall(
                "ballot",
                "end-vote",
                [
                    types.uint(1)
                ],
                voter1
            ),
        ]);

        assertEquals(block2.receipts.length, 1);
        assertEquals(block2.height, 201);

        block2.receipts[0].result.expectErr().expectUint(100)

        const ballotInfo = chain.callReadOnlyFn(
            "ballot",
            "vote-info",
            [types.uint(1)],
            votingStartedBy
        )
        assertStringIncludes(ballotInfo.result, 'status: "Active"')
    },
});
