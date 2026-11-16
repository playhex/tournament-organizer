import { expect } from 'chai';
import { Swiss } from '../../src/pairings/Swiss.js';
import type { Player, SwissPairing } from '../../src/pairings/Swiss.js';

describe('Swiss', () => {
    it('9 players in round 1 yields 1 bye', () => {
        const players:Player[] = [
            {
                id: 'A',
                score: 0
            },
            {
                id: 'B',
                score: 0
            },
            {
                id: 'C',
                score: 0
            },
            {
                id: 'D',
                score: 0
            },
            {
                id: 'E',
                score: 0
            },
            {
                id: 'F',
                score: 0
            },
            {
                id: 'G',
                score: 0
            },
            {
                id: 'H',
                score: 0
            },
            {
                id: 'I',
                score: 0
            }
        ];
        expect(Swiss(players, 1).filter(match => match.player2 === null).length).to.equal(1);
    });

    it('10 players in round 2 with no draws yields 1 pair up/down', () => {
        const players = [
            {
                id: 'A',
                score: 1
            },
            {
                id: 'B',
                score: 1
            },
            {
                id: 'C',
                score: 1
            },
            {
                id: 'D',
                score: 1
            },
            {
                id: 'E',
                score: 1
            },
            {
                id: 'F',
                score: 0
            },
            {
                id: 'G',
                score: 0
            },
            {
                id: 'H',
                score: 0
            },
            {
                id: 'I',
                score: 0
            },
            {
                id: 'J',
                score: 0
            }
        ];
        expect(Swiss(players, 2).reduce((count, match) => {
            const p1 = players.find(p => p.id === match.player1);
            const p2 = players.find(p => p.id === match.player2);
            if (p1 !== undefined && p2 !== undefined) {
                return p1.score === p2.score ? count : count + 1;
            } else {
                return count;
            }
        }, 0)).to.equal(1);
    });

    describe('rated pairing', () => {
        /** Players A, B, C... with decreasing ratings, so A is first seed. */
        const ratedPlayers = (scores: number[]): Player[] => scores.map((score, i) => ({
            id: String.fromCharCode(65 + i),
            score,
            rating: 2000 - 100 * i,
        }));

        /** Pairs as sorted strings like "A-E", plus byes like "I-bye", sorted. */
        const pairsOf = (players: Player[], ...args: [boolean?, boolean?, SwissPairing?]): string[] => Swiss(players, 1, ...args)
            .map(match => match.player2 === null ? `${match.player1}-bye` : [match.player1, match.player2].sort().join('-'))
            .sort()
        ;

        /** Pairings involve shuffling, so check several times. */
        const expectPairs = (players: () => Player[], args: [boolean?, boolean?, SwissPairing?], expected: string[]): void => {
            for (let i = 0; i < 20; i++) {
                expect(pairsOf(players(), ...args)).to.deep.equal(expected);
            }
        };

        const eight = [0, 0, 0, 0, 0, 0, 0, 0];
        const cases: [string, number[], [boolean?, boolean?, SwissPairing?], string[]][] = [
            ['slide pairs top half against bottom half (Dutch)', eight, [true, false, 'slide'], ['A-E', 'B-F', 'C-G', 'D-H']],
            ['slide is the default', eight, [true], ['A-E', 'B-F', 'C-G', 'D-H']],
            ['fold pairs best against worst', eight, [true, false, 'fold'], ['A-H', 'B-G', 'C-F', 'D-E']],
            ['adjacent pairs closest ratings (Monrad)', eight, [true, false, 'adjacent'], ['A-B', 'C-D', 'E-F', 'G-H']],
            ['slide gives the bye to the lowest seed', [...eight, 0], [true, false, 'slide'], ['A-E', 'B-F', 'C-G', 'D-H', 'I-bye']],
            ['fold gives the bye to the lowest seed', [...eight, 0], [true, false, 'fold'], ['A-H', 'B-G', 'C-F', 'D-E', 'I-bye']],
            ['slide with seating in round 1', eight, [true, true, 'slide'], ['A-E', 'B-F', 'C-G', 'D-H']],
        ];
        for (const [title, scores, args, expected] of cases) {
            it(title, () => expectPairs(() => ratedPlayers(scores), args, expected));
        }

        it('slide pairs within score groups, lowest of odd group floats down and is seeded first', () => {
            expectPairs(
                () => ratedPlayers([1, 1, 1, 1, 1, 0, 0, 0, 0, 0]),
                [true, false, 'slide'],
                ['A-C', 'B-D', 'E-H', 'F-I', 'G-J'],
            );
        });
    });
});
