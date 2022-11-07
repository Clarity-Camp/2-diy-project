
;; voting

;; constants
;;
(define-constant ERR_UNAUTHORIZED (err u100))
(define-constant ERR_INVALID_VOTE_EXPIRY (err u101))
(define-constant ERR_BALLOT_NOT_FOUND (err u102))
(define-constant ERR_CANDIDATE_NOT_FOUND (err u103))
(define-constant ERR_VOTED_ALREADY (err u104))
(define-constant ERR_VOTING_ENDED (err u105))
(define-constant ERR_CANNOT_END_BEFORE_EXPIRY (err u106))

;; data maps and vars
;;
(define-data-var ballotId uint u0)

(define-map Ballot uint { 
        name: (string-ascii 50), 
        startsAt: uint, 
        endsAt: uint, 
        totalVotes: uint, 
        status: (string-ascii 10),
        candidates: (list 10 { name: (string-ascii 50), address: principal }),
        owner: principal
    }
)

(define-map CandidateVotes { address: principal, ballotId: uint } { votes: uint, name: (string-ascii 50) })

(define-map Voters { address: principal, ballotId: uint } bool)

;; private functions
;; 

;; sets the candidates with unique key of their address and the ballot id to tally the total votes
(define-private (init-candidates (candidate { name: (string-ascii 50), address: principal }))
    (map-set CandidateVotes 
                { address: (get address candidate), ballotId: (+ (var-get ballotId) u1) } 
                { votes: u0, name: (get name candidate) }))

;; public functions
;;

;; @function start-vote: will start valid ballot
;; 1. Any user can start a vote
;; 2. Validates that the vote ends at a block in the future creates a new Ballot with information about the vote
;; 3. initializes the candidates
;; 4. Sets the vote related info on the ballot
;; 5. updates the ballot id 
;; @param name:string :: title describing what this vote is for. 
;; @param endsAt:uint :: when does it end
;; @param candidates:list of tuples :: list of names and wallets you can vote for
;; @response (ok uint) Return the lastest ballot id in the response
(define-public (start-vote
                    (name (string-ascii 50))
                    (endsAt uint)
                    (candidates (list 10 { name: (string-ascii 50), address: principal } ))
                )
                    (let ((newBallotId (+ (var-get ballotId) u1) ))
                        (asserts! (> endsAt block-height) ERR_INVALID_VOTE_EXPIRY)

                        (map init-candidates candidates)
                        (map-set Ballot newBallotId {
                                name: name, 
                                startsAt: block-height, 
                                endsAt: endsAt, 
                                totalVotes: u0, 
                                status: "Active",
                                candidates: candidates,
                                owner: tx-sender
                            })
                        (var-set ballotId newBallotId)
                        (ok newBallotId)
                    )
)

;; @function vote: allow users to vote for the ballot
;; 1. Any user can vote for the candidate only once.
;; 2. Validates that the the voter has not already voted
;; 3. Validates that the vote is not yet ended
;; 4. updates the voter info who has voted
;; 5. updates the total count on the ballot
;; 6. updates the total count for a candidate
;; @param id:uint :: ballot id for which you want to vote
;; @param choice:principal :: ballot id for which you want to vote
;; @response (ok bool) Returns true when vote is successful
(define-public (vote (id uint) (choice principal)) 
    ;; IMPLEMENT HERE
)

;; @function end-vote: will delete ballot that has expired
;; 1. Only the owner/admin can end vote
;; 2. cannot end before expiry is reached
;; 3. deletes the ballot from the map
;; @param id:uint :: ballot id which you want to end
;; @response (ok bool) Returns true when ballot status is updated successfully to "Ended"
(define-public (end-vote (id uint))
    ;; IMPLEMENT HERE
)

;; read-only functions
;;
(define-read-only (candidate-info (id uint) (candidate principal)) 
    (map-get? CandidateVotes { address: candidate, ballotId: id }))

(define-read-only (voter-info (id uint) (voter principal)) 
    (map-get? Voters { address: voter, ballotId: id }))

(define-read-only (vote-info (id uint)) 
    (map-get? Ballot id))

;; Making contract calls from console:

;; 1. Start a vote
;; (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.ballot start-vote "Vote 1" u20 (list {name: "A", address: 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP} {name: "B", address: 'STNHKEPYEPJ8ET55ZZ0M5A34J0R3N5FM2CMMMAZ6 }))

;; 2. Give a vote
;; (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.ballot vote u1 'ST3PF13W7Z0RRM42A8VZRVFQ75SV1K26RXEP8YGKJ)

;; 3. End a vote
;; (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.ballot end-vote u1)

;; 4. Read ballot info 
;; (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.ballot vote-info u1)

;; 5. Read first candidate 
;; (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.ballot candidate-info 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP u1)

;; 6. Read second candidate 
;; (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.ballot candidate-info 'STNHKEPYEPJ8ET55ZZ0M5A34J0R3N5FM2CMMMAZ6 u1)
