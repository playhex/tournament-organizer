import blossom from 'edmonds-blossom-fixed';
import { Match, PlayerID } from './Match.js';
import { shuffle } from './Shuffle.js';

export interface Player {
    id: PlayerID,
    score: number,
    pairedUpDown?: boolean,
    receivedBye? : boolean,
    avoid?: Array<PlayerID>,
    seating?: Array<-1 | 1>,
    rating?: number | null
}

/**
 * How players of a same score group are paired, when rated, from their rating rank in the group:
 * - `slide`: top half against bottom half, 1-5, 2-6, 3-7, 4-8 (Dutch system).
 * - `fold`: best against worst, 1-8, 2-7, 3-6, 4-5.
 * - `adjacent`: players with closest ratings, 1-2, 3-4, 5-6, 7-8 (Monrad system).
 */
export type SwissPairing = 'slide' | 'fold' | 'adjacent';

/** A player with the index it occupies in the matching graph handed to the blossom algorithm. */
type IndexedPlayer = Player & { index: number };

export function Swiss(players: Player[], round: number, rated: boolean = false, seating: boolean = false, pairing: SwissPairing = 'slide') : Match[] {
    const matches: Match[] = [];
    if (rated) {
        players.filter(p => !p.hasOwnProperty('rating') || p.rating === null).forEach(p => p.rating = 0);
    }
    if (seating) {
        players.filter(p => !p.hasOwnProperty('seating')).forEach(p => p.seating = []);
    }
    // Both properties are guaranteed above whenever the matching weights below read them.
    const ratingOf = (p: Player): number => p.rating ?? 0;
    const seatingOf = (p: Player): Array<-1 | 1> => p.seating ?? [];
    const playerArray: IndexedPlayer[] = shuffle(players).map((p, i) => Object.assign(p, { index: i }));
    const byIndex = (index: number): IndexedPlayer => {
        const player = playerArray.find(p => p.index === index);
        if (player === undefined) {
            throw new Error(`No player with index ${index}`);
        }
        return player;
    };
    const scoreGroups = [...new Set(playerArray.map(p => p.score))].sort((a, b) => a - b);
    const scoreSums = [...new Set(scoreGroups.map((s, i, a) => {
        const sums: number[] = [];
        for (let j = i; j < a.length; j++) {
            sums.push(s + a[j]);
        }
        return sums;
    }).flat())].sort((a, b) => a - b);
    const groupRanks = new Map<number, number>();
    const groupSizes = new Map<number, number>();
    const byeAversions = new Map<number, number>();
    if (rated) {
        // From the highest score group: when there is an odd number of players above a group,
        // the lowest of them is expected to float down and be seeded first in this group.
        let above = 0;
        [...scoreGroups].reverse().forEach(score => {
            const group = playerArray.filter(p => p.score === score).sort((a, b) => ratingOf(b) - ratingOf(a));
            const incoming = above % 2;
            groupSizes.set(score, group.length + incoming);
            group.forEach((p, rank) => {
                groupRanks.set(p.index, rank + incoming);
                // 0 for the lowest player of the lowest score group, so it is the one left for the bye.
                byeAversions.set(p.index, 1 - 1 / (playerArray.length - above - rank));
            });
            above += group.length;
        });
    }
    /**
     * How far a pair is from the ideal pairing, 0 being ideal.
     * A player paired with a lower score group is expected to be the lowest of its group (penalized otherwise),
     * and is seeded first in the lower group.
     * In a group with an odd number of players, the lowest one is expected to float down or get the bye,
     * so the others are paired as if it were not there.
     */
    const seedingDeviation = (a: IndexedPlayer, b: IndexedPlayer): number => {
        const [high, low] = a.score >= b.score ? [a, b] : [b, a];
        const cross = high.score !== low.score;
        const floaterPenalty = cross ? (groupSizes.get(high.score) ?? 0) - 1 - (groupRanks.get(high.index) ?? 0) : 0;
        const rankHigh = cross ? 0 : groupRanks.get(high.index) ?? 0;
        const rankLow = groupRanks.get(low.index) ?? 0;
        const half = Math.floor((groupSizes.get(low.score) ?? 0) / 2);
        const deviation = pairing === 'fold' ? Math.abs(rankHigh + rankLow - (2 * half - 1))
            : pairing === 'adjacent' ? Math.abs(rankHigh - rankLow) - 1
            : Math.abs(Math.abs(rankHigh - rankLow) - half)
        ;
        return floaterPenalty + deviation;
    };
    const pairs: number[][] = [];
    for (let i = 0; i < playerArray.length; i++) {
        const curr = playerArray[i];
        const next = playerArray.slice(i + 1);
        for (let j = 0; j < next.length; j++) {
            const opp = next[j];
            if (curr.avoid?.includes(opp.id)) {
                continue;
            }
            let wt = 75 - 75 / (scoreGroups.findIndex(s => s === Math.min(curr.score, opp.score)) + 2);
            wt += 5 - 5 / (scoreSums.findIndex(s => s === curr.score + opp.score) + 1);
            let scoreGroupDiff = Math.abs(scoreGroups.findIndex(s => s === curr.score) - scoreGroups.findIndex(s => s === opp.score));
            if (scoreGroupDiff === 1 && curr.pairedUpDown === false && opp.pairedUpDown === false) {
                scoreGroupDiff -= 0.65;
            } else if (scoreGroupDiff > 0 && (curr.pairedUpDown === true || opp.pairedUpDown === true)) {
                scoreGroupDiff += 0.2;
            }
            wt += 23 / (2 *(scoreGroupDiff + 2));
            if (rated) {
                wt += 4 / (seedingDeviation(curr, opp) + 2);
                // Every paired player adds its aversion once, so this only decides who gets the bye: the lowest seed.
                wt += 2 * ((byeAversions.get(curr.index) ?? 0) + (byeAversions.get(opp.index) ?? 0));
            }
            if (seating) {
                let seatingDiff = Math.abs(seatingOf(curr).reduce((sum: number, seat) => sum + seat, 0) - seatingOf(opp).reduce((sum: number, seat) => sum + seat, 0));
                if (seatingOf(curr).slice(-1)[0] !== seatingOf(opp).slice(-1)[0]) {
                    seatingDiff += 0.5;
                }
                wt += Math.pow(2, seatingDiff - 1);
            }
            if (curr.receivedBye === true || opp.receivedBye === true) {
                wt += 40;
            }
            pairs.push([curr.index, opp.index, wt]);
        }
    }
    const blossomPairs = blossom(pairs, true);
    const playerCopy = [...playerArray];
    let byeArray: IndexedPlayer[] = [];
    let match = 1;
    do {
        const indexA = playerCopy[0].index;
        const indexB = blossomPairs[indexA];
        if (indexB === -1) {
            byeArray.push(playerCopy.splice(0, 1)[0]);
            continue;
        }
        playerCopy.splice(0, 1);
        playerCopy.splice(playerCopy.findIndex(p => p.index === indexB), 1);
        let playerA = byIndex(indexA);
        let playerB = byIndex(indexB);
        if (seating) {
            const aScore = seatingOf(playerA).reduce((sum: number, seat) => sum + seat, 0);
            const bScore = seatingOf(playerB).reduce((sum: number, seat) => sum + seat, 0);
            if (
                JSON.stringify(seatingOf(playerB).slice(-2)) === '[-1,-1]' ||
                JSON.stringify(seatingOf(playerA).slice(-2)) === '[1,1]' ||
                (seatingOf(playerB).slice(-1)[0] === -1 && seatingOf(playerA).slice(-1)[0] === 1) ||
                bScore < aScore
            ) {
                [playerA, playerB] = [playerB, playerA];
            }
        }
        matches.push({
            round: round,
            match: match++,
            player1: playerA.id,
            player2: playerB.id
        });
    } while (playerCopy.length > blossomPairs.reduce((sum: number, idx: number) => idx === -1 ? sum + 1 : sum, 0));
    byeArray = [...byeArray, ...playerCopy];
    for (let i = 0; i < byeArray.length; i++) {
        matches.push({
            round: round,
            match: match++,
            player1: byeArray[i].id,
            player2: null
        })
    }
    return matches;
}
