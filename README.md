## Tournament Organizer
A Node.js module for organizing tournaments, written in TypeScript.

This is the [PlayHex](https://playhex.org) fork of [tournament-organizer](https://github.com/slashinfty/tournament-organizer) by Matt Braddock,
published as [`@playhex/tournament-organizer`](https://www.npmjs.com/package/@playhex/tournament-organizer).
It is based on version 3.9.1 and keeps the same API. See [Differences with the original library](#differences-with-the-original-library).

**Version 3 is now an ESM module.** If you don't understand what this means for you, [read this](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).

[![npm](https://img.shields.io/npm/v/@playhex/tournament-organizer?style=flat-square)](https://www.npmjs.com/package/@playhex/tournament-organizer) [![GitHub last commit](https://img.shields.io/github/last-commit/playhex/tournament-organizer?style=flat-square)](https://github.com/playhex/tournament-organizer/commits/main) [![GitHub issues](https://img.shields.io/github/issues-raw/playhex/tournament-organizer?style=flat-square)](https://github.com/playhex/tournament-organizer/issues) [![GitHub pull requests](https://img.shields.io/github/issues-pr-raw/playhex/tournament-organizer?style=flat-square)](https://github.com/playhex/tournament-organizer/pulls) [![GitHub](https://img.shields.io/github/license/playhex/tournament-organizer?style=flat-square)](https://github.com/playhex/tournament-organizer/blob/main/LICENSE) [![Ko-Fi](https://img.shields.io/badge/Ko--Fi-Buy%20Me%20a%20Coffee-a87b00)](https://ko-fi.com/mattbraddock)

### About
This JavaScript module for Node.js facilitates the organization and execution of tournaments.

The following formats are supported:
* Single elimination (with optional third place match)
* Double elimination (with grand final reset)
* Stepladder
* Round-robin
* Double round-robin
* Swiss

Round-robin and Swiss tournaments can be followed by playoffs, in one of these formats:
* Single elimination
* Double elimination
* Stepladder

For non-elimination tournaments, the following tiebreaker systems are supported (their details can be found [here](https://en.wikipedia.org/wiki/Tie-breaking_in_Swiss-system_tournaments)):
* Solkoff
* Median-Buchholz
* Sonneborn-Berger
* Koya System
* Cumulative
* Earned match wins
* Earned match losses
* Earned game wins
* Earned game losses
* Game win differential
* Neighborhood record
* Versus
* Mutual versus
* Opponent's match win percentage
* Game win percentage
* Opponent's game win percentage
* Opponent's opponent's match win percentage

### About Pairings
Pairing algorithms live in `src/pairings`, with one module per format.

## Differences with the original library

Changes made in this fork since [tournament-organizer 3.9.1](https://github.com/slashinfty/tournament-organizer/tree/v3.9.1).

### Package
- Published as `@playhex/tournament-organizer` instead of `tournament-organizer`.
- [tournament-pairings](https://github.com/slashinfty/tournament-pairings) (pairing algorithms, same author) is merged into this repository, in `src/pairings`, instead of being a dependency.
  Swiss pairings use [`edmonds-blossom-fixed`](https://www.npmjs.com/package/edmonds-blossom-fixed).
- `types` field fixed (`./dist/index.d.ts` instead of `./dist/index.d.js`).
- `prepare` script, so that installing from git builds `dist/`.

### Added
- Double elimination with 2 or 3 players (the original requires at least 4).
- Double elimination has a **grand final reset**: both grand final players go to a reset match,
  which is played only if the player coming from the losers bracket wins the grand final.
  If the winners bracket champion wins the grand final, the reset is not played and the tournament can end.
  This changes the bracket structure for every player count: one more match, and losers bracket rounds are shifted by one.
- Pairing algorithms are exported as `@playhex/tournament-organizer/pairings`, see [Pairings only](#pairings-only).
- Tests (mocha + chai): `npm test`.

### Fixed / changed
- Round robin and double round robin: all matches are active from the start,
  so results can be entered in any order, not only for the current round.
  Player scores are updated as soon as a match ends, even for a match of a later round.
  Advancing to next round is only blocked by active matches of the current round.
- Round robin: removing a player turns all their active matches into byes for their opponents (not only matches of next rounds).
- Strict TypeScript fixes: missing players or matches now throw an explicit error (e.g `Player with ID ... does not exist`)
  instead of failing later with `Cannot read properties of undefined`.

### Ported
Features of later versions of the original library:
- New tiebreakers: `koya system`, `earned match wins`, `earned match losses`, `earned game wins`,
  `earned game losses`, `game win differential`, `neighborhood record`, `mutual versus`.
- `enterResult()` and `clearResult()` return the matches they updated.
- Setting `players` or `matches` (`tournament.settings = { players }`, `player.values = { matches }`)
  updates the ones already there (same ID) instead of duplicating them.
- Generated IDs are UUIDs from `crypto.randomUUID()` instead of `randomstring`, requires Node.js 19 or later.
- Built with `tsc` only: no more rollup browser (`dist/index.module.js`) and UMD (`dist/index.umd.js`) bundles.
  Use a bundler, or a CDN that bundles ES modules like [esm.sh](https://esm.sh).

## Installation
```shell
npm i @playhex/tournament-organizer
```

### Import
In Node.js:
```ts
import TournamentOrganizer from '@playhex/tournament-organizer';
```

In the browser:
```js
import TournamentOrganizer from "https://esm.sh/@playhex/tournament-organizer";
```

## Usage

### Single elimination
Players are paired in a bracket: the winner of a match goes to the next round, the loser is eliminated.
The last player standing wins the tournament.

```ts
import TournamentOrganizer from '@playhex/tournament-organizer';

const manager = new TournamentOrganizer();
const tournament = manager.createTournament('My tournament'); // single elimination by default

const alice = tournament.createPlayer('Alice');
const bob = tournament.createPlayer('Bob');
const carol = tournament.createPlayer('Carol');
const dave = tournament.createPlayer('Dave');

tournament.start(); // players are shuffled

// Round 1: the 2 semi-finals are active
const [semiFinal1, semiFinal2] = tournament.matches.filter(match => match.active);

tournament.enterResult(semiFinal1.id, 1, 0); // player1 wins
tournament.enterResult(semiFinal2.id, 0, 1); // player2 wins

// Round 2: winners are moved to the final, which is now active
const [final] = tournament.matches.filter(match => match.active);

tournament.enterResult(final.id, 1, 0);

tournament.end();
```

A match contains the IDs of its players: `match.player1.id` and `match.player2.id`.

Losers are marked inactive (`player.active === false`): at the end, the only active player is the winner.

#### Third place match
```ts
const tournament = manager.createTournament('My tournament', {
    stageOne: {
        consolation: true, // third place match between semi-final losers
    },
});
```

Semi-final losers go to a third place match (`match.path.loss`), played in the same round as the final.

#### Seeding
Give each player a value (rank, rating...) and sort players by this value:
first seed plays against last seed, and so on.

```ts
const tournament = manager.createTournament('My tournament', {
    sorting: 'descending', // highest value is first seed. Use 'ascending' for ranks
});

tournament.createPlayer('Alice').values = { value: 2100 };
tournament.createPlayer('Bob').values = { value: 1900 };
tournament.createPlayer('Carol').values = { value: 1800 };
tournament.createPlayer('Dave').values = { value: 1500 };

tournament.start(); // Alice vs Dave, Bob vs Carol
```

With `sorting: 'none'` (default), players are shuffled.

#### Best of 3 matches
```ts
const tournament = manager.createTournament('My tournament', {
    scoring: {
        bestOf: 3, // first to win 2 games wins the match
    },
});

// ...

tournament.enterResult(match.id, 2, 1); // player1 wins 2 games to 1
tournament.enterResult(match.id, 1, 1, 1); // draws are the last parameter
tournament.enterResult(match.id, 3, 0); // throws: Players can not win more than 2 games in a match
```

#### Correct a result
```ts
const updatedMatches = tournament.enterResult(match.id, 1, 0); // returns the match and next matches where players moved

tournament.clearResult(match.id); // match is active again, winner is removed from next match
tournament.enterResult(match.id, 0, 1);
```

`enterResult()` and `clearResult()` return all matches they updated (the match, and next matches where players moved),
useful to know what to save or refresh.

#### Remove a player
```ts
tournament.removePlayer(alice.id); // their opponent wins the current match
```

The player is marked inactive. If they are in an active match, their opponent wins it and goes to the next match.
If they are waiting for their next opponent, this opponent will directly go to the match after.

#### Custom IDs and extra data
Tournaments and players get a random UUID, or the ID you give (useful to use your database IDs).
Tournaments, players and matches have a `meta` object to store anything you need.

```ts
const tournament = manager.createTournament('My tournament', {
    meta: { discordChannel: '#tournament' }, // any extra data
}, 'tournament-1'); // custom tournament ID

const alice = tournament.createPlayer('Alice', 'user-42'); // custom player ID

alice.values = {
    name: 'Alicia', // rename
    meta: { country: 'FR' }, // any extra data
};

tournament.matches[0].values = {
    meta: { table: 3 }, // any extra data
};
```

#### Maximum number of players
```ts
const tournament = manager.createTournament('My tournament', {
    stageOne: {
        maxPlayers: 16, // 0 by default: no maximum
    },
});

// throws when creating the 17th player: Maximum number of players (16) are enrolled
```

#### Save and reload
A tournament can be serialized to JSON, and reloaded later, in the same or another manager.

```ts
const json = JSON.stringify(tournament); // save it anywhere

// later...
const tournament = manager.reloadTournament(JSON.parse(json));
```

#### Remove a tournament
```ts
manager.removeTournament(tournament.id); // also ends the tournament
```

### Double elimination
Losers of the winners bracket go to the losers bracket, and players are eliminated after a second loss.
The winners bracket champion plays the losers bracket champion in the grand final. Works from 2 players.

```ts
const tournament = manager.createTournament('My tournament', {
    stageOne: {
        format: 'double-elimination', // eliminated after 2 losses
    },
});

// add players, start, enter results like single elimination
```

#### Grand final reset
The last match is the grand final reset, played only if the player coming from the losers bracket wins the grand final.

```ts
const [grandFinal] = tournament.matches.filter(match => match.active);

// Winners bracket champion wins the grand final: reset is not played,
// the loser is marked inactive, and the tournament can end.
tournament.enterResult(grandFinal.id, 1, 0);

// Or losers bracket player wins: both players now have one loss,
// and are both sent to the reset match, which becomes active.
tournament.enterResult(grandFinal.id, 0, 1);
```

### Stepladder
Lowest seeds play first, the winner plays against the next seed, and so on until the first seed.
Usually used with seeding:

```ts
const tournament = manager.createTournament('My tournament', {
    stageOne: {
        format: 'stepladder', // lowest seeds play first, the winner climbs up to the first seed
    },
    sorting: 'descending', // highest value is first seed
});

tournament.createPlayer('Alice').values = { value: 4 };
tournament.createPlayer('Bob').values = { value: 3 };
tournament.createPlayer('Carol').values = { value: 2 };
tournament.createPlayer('Dave').values = { value: 1 };

tournament.start();
// Round 1: Carol vs Dave
// Round 2: Bob vs winner
// Round 3: Alice vs winner
```

### Round-robin
Every player plays against every other player once.
The player with the most points wins.

```ts
const tournament = manager.createTournament('My tournament', {
    stageOne: {
        format: 'round-robin', // every player plays against every other player once
    },
});

tournament.createPlayer('Alice');
tournament.createPlayer('Bob');
tournament.createPlayer('Carol');
tournament.createPlayer('Dave');

tournament.start(); // creates all matches: 3 rounds of 2 matches

// Round 1
const [match1, match2] = tournament.matches.filter(match => match.round === 1);

tournament.enterResult(match1.id, 1, 0);
tournament.enterResult(match2.id, 0, 1);

tournament.next(); // goes to round 2

// ... same for rounds 2 and 3

tournament.next(); // after the last round, the tournament is complete

const standings = tournament.standings(false); // false: also include inactive players (all players are inactive once complete)

console.log(standings[0].player.name); // winner
console.log(standings[0].matchPoints);
```

With an odd number of players, one player has a bye each round.

#### Enter results in any order
All matches are active from the start, results of any round can be entered at any time.
`next()` only throws if a match of the current round is still active.

```ts
const [lastRoundMatch] = tournament.matches.filter(match => match.round === 3);

tournament.enterResult(lastRoundMatch.id, 1, 0); // player scores are updated now

tournament.next(); // throws: Can not advance rounds with active matches
```

#### Points
By default, a win gives 1 point, a draw 0.5, a loss 0, and a bye 1.

```ts
const tournament = manager.createTournament('My tournament', {
    stageOne: {
        format: 'round-robin',
    },
    scoring: {
        win: 3, // points for a win, 1 by default
        draw: 1, // 0.5 by default
        loss: 0, // 0 by default
        bye: 3, // 1 by default
    },
});

tournament.enterResult(match.id, 0, 0, 1); // a draw
```

#### Tiebreakers
Players with the same number of points are ranked by the tiebreakers, in the given order
(see [supported tiebreakers](#about)).

```ts
const tournament = manager.createTournament('My tournament', {
    stageOne: {
        format: 'round-robin',
    },
    scoring: {
        tiebreaks: ['versus', 'sonneborn berger'], // rank players with the same points, in this order
    },
});

const standings = tournament.standings();

console.log(standings[0].tiebreaks.sonnebornBerger);
```

Each standing also contains `gamePoints`, `games`, `matches`, and the values of all tiebreakers in `tiebreaks`,
even the ones not used for ranking.

#### Remove a player
```ts
tournament.removePlayer(alice.id); // their active matches become byes for their opponents
```

All active matches of the player become byes for their opponents. Matches already played are kept.

### Double round-robin
Every player plays twice against every other player, with player1 and player2 swapped in the second half.

```ts
const tournament = manager.createTournament('My tournament', {
    stageOne: {
        format: 'double-round-robin', // every player plays twice against every other player
    },
});

// same as round-robin
```

### Swiss
Each round, players are paired against players with the same score, without playing twice against the same opponent.
After a fixed number of rounds, the player with the most points wins.

```ts
const tournament = manager.createTournament('My tournament', {
    stageOne: {
        format: 'swiss', // players are paired against players with the same score
    },
});

const alice = tournament.createPlayer('Alice');
const bob = tournament.createPlayer('Bob');
const carol = tournament.createPlayer('Carol');
const dave = tournament.createPlayer('Dave');

tournament.start(); // creates round 1 matches only

// Round 1
const [match1, match2] = tournament.matches.filter(match => match.active);

tournament.enterResult(match1.id, 1, 0);
tournament.enterResult(match2.id, 0, 1);

tournament.next(); // pairs round 2: winners together, losers together

// Round 2
const [match3, match4] = tournament.matches.filter(match => match.active);

tournament.enterResult(match3.id, 1, 0);
tournament.enterResult(match4.id, 1, 0);

tournament.next(); // after the last round, the tournament is complete

const standings = tournament.standings(false);

console.log(standings[0].player.name); // winner
```

By default, the number of rounds is `ceil(log2(number of players))`, here 2.
With an odd number of players, one player gets a bye each round.

#### Number of rounds
```ts
const tournament = manager.createTournament('My tournament', {
    stageOne: {
        format: 'swiss',
        rounds: 5, // by default: ceil(log2(number of players))
        initialRound: 1, // number of the first round, 1 by default
    },
});
```

#### Seeding
With `sorting` and player values, players with the same score are preferably paired against players with a close value,
instead of randomly.

```ts
const tournament = manager.createTournament('My tournament', {
    stageOne: {
        format: 'swiss',
    },
    sorting: 'descending', // pair players with close values instead of randomly
});

tournament.createPlayer('Alice').values = { value: 2100 };
```

#### Seating
When player order matters (white/black, first player...), pairings balance how many times each player is player1 and player2,
and avoid the same side twice in a row.

```ts
const tournament = manager.createTournament('My tournament', {
    stageOne: {
        format: 'swiss',
    },
    seating: true, // balance player1 and player2 for each player
});
```

#### Tiebreakers
```ts
const tournament = manager.createTournament('My tournament', {
    stageOne: {
        format: 'swiss',
    },
    scoring: {
        tiebreaks: ['median buchholz', 'solkoff', 'cumulative'], // rank players with the same points, in this order
    },
});
```

#### Late players
In Swiss, players can join after the start. They are paired from the next round.

```ts
tournament.start();

const frank = tournament.createPlayer('Frank'); // late player, paired from the next round
```

#### Assign a bye
Give a bye to a player who has no match in a round (a late player for a missed round, for example):

```ts
tournament.assignBye(frank.id, 1); // Frank gets a bye for round 1
```

#### Assign a loss
Give a loss to a player. If they have a match in this round, the match is removed and their opponent gets a bye.

```ts
tournament.assignLoss(alice.id, tournament.round); // Alice loses this round, their opponent gets a bye
```

#### Remove a player
The player won't be paired in next rounds. In Swiss, their current match is kept:
enter its result, or assign them a loss before removing them.

```ts
tournament.assignLoss(alice.id, tournament.round); // resolve the current match first
tournament.removePlayer(alice.id); // Alice won't be paired in next rounds
```

### Playoffs
After a round-robin or Swiss stage, best players can go to a second stage,
paired by single elimination, double elimination or stepladder.

#### Top 4 in single elimination
Players not in the top 4 are marked inactive.

```ts
const tournament = manager.createTournament('My tournament', {
    stageOne: {
        format: 'swiss',
        rounds: 3,
    },
    stageTwo: { // playoffs
        format: 'single-elimination',
        advance: {
            method: 'rank', // advance by rank in the standings
            value: 4, // first 4 players of the standings
        },
    },
});

// add players, start, play Swiss rounds...

tournament.next(); // after the last Swiss round, playoffs start: 1st plays 4th, 2nd plays 3rd

// play playoffs like a single elimination tournament...

tournament.end();
```

#### Advance by points
```ts
const tournament = manager.createTournament('My tournament', {
    stageOne: {
        format: 'round-robin',
    },
    stageTwo: {
        format: 'single-elimination',
        consolation: true, // third place match in playoffs
        advance: {
            method: 'points', // advance by points
            value: 2, // players with at least 2 points
        },
    },
});
```

### TypeScript
Classes and interfaces are exported to type your code:

```ts
import type { Tournament, Player, Match } from '@playhex/tournament-organizer/components';
import type { StandingsValues, LoadableTournamentValues } from '@playhex/tournament-organizer/interfaces';
```

### Pairings only
The pairing algorithms used by the tournament organizer are also available on their own.

**Tournament organizer** (`@playhex/tournament-organizer`) manages the whole tournament for you:
players, matches, results, moving players in brackets, rounds, standings and tiebreakers.
Use it if you want a ready-to-use tournament engine.

**Pairings** (`@playhex/tournament-organizer/pairings`) are pure functions: players in, matches out.
They don't store anything, don't know about results, scores or standings.
Use them if you already have your own tournament model and database, and only need to know who plays against whom.

#### Elimination, stepladder and round-robin
Give player IDs (or a number of players to get seed numbers), get all matches of the tournament:

```ts
import { SingleElimination, DoubleElimination, Stepladder, RoundRobin } from '@playhex/tournament-organizer/pairings';

const matches = SingleElimination(['alice', 'bob', 'carol', 'dave']); // players are shuffled

// [
//   { round: 1, match: 1, player1: 'carol', player2: 'bob', win: { round: 2, match: 1 } },
//   { round: 1, match: 2, player1: 'dave', player2: 'alice', win: { round: 2, match: 1 } },
//   { round: 2, match: 1, player1: null, player2: null },
// ]
```

`win` and `loss` tell in which match the winner and the loser go. Moving players into these matches is up to you.
In round-robin, a match with `player2: null` is a bye.

```ts
SingleElimination(8); // seeds 1 to 8 instead of IDs
SingleElimination(players, 1, true); // with a third place match
SingleElimination(players, 1, false, true); // players are already sorted by seed: 1st plays last, 2nd plays second to last...
SingleElimination(players, 5); // first round is round 5

DoubleElimination(players, 1, true); // starting round, sorted by seed
Stepladder(players); // players are expected sorted by seed: last two seeds play first
RoundRobin(players, 1, true); // starting round, sorted by seed. Double round-robin: call it twice and swap player1 and player2
```

#### Swiss
Swiss pairs one round at a time, from the current state of each player:

```ts
import { Swiss } from '@playhex/tournament-organizer/pairings';

const matches = Swiss([
    { id: 'alice', score: 1, avoid: ['bob'] }, // avoid: previous opponents
    { id: 'bob', score: 0, avoid: ['alice'] },
    { id: 'carol', score: 1, avoid: ['dave'] },
    { id: 'dave', score: 0, avoid: ['carol'] },
], 2); // round number

// [
//   { round: 2, match: 1, player1: 'dave', player2: 'bob' },
//   { round: 2, match: 2, player1: 'alice', player2: 'carol' },
// ]
```

A match with `player2: null` is a bye. Other optional player properties:

```ts
Swiss([
    {
        id: 'alice',
        score: 2,
        avoid: ['bob'],
        receivedBye: true, // avoid giving another bye
        pairedUpDown: true, // already paired against a different score, avoid it again
        rating: 2100, // used when rated is true
        seating: [1, -1], // previous sides (1: player1, -1: player2), used when seating is true
    },
    // ...
], 3, true, true); // round number, rated, seating
```

## Contributing
Please submit an issue or a pull request on [playhex/tournament-organizer](https://github.com/playhex/tournament-organizer) (on main branch) if you encounter a bug in this fork.

The original library is written by Matt Braddock, a high school teacher: you can support him on [Ko-Fi](https://ko-fi.com/mattbraddock).

### Testing
```shell
npm test
```
`test/` mirrors `src/`: `test/pairings` covers the pairing algorithms, `test/components` covers `Manager`, `Tournament`, `Player` and `Match`.

## Publishing
Prerequisites (once): be a member of the [`playhex` npm organization](https://www.npmjs.com/org/playhex) with publish rights,
enable 2FA on your npm account, and log in:

```shell
npm login
npm whoami
```

Release a new version, from `main` branch with a clean working tree:

1. Bump the version (semver: `patch` for fixes, `minor` for additions, `major` for breaking changes),
   and add the changes in [Differences with the original library](#differences-with-the-original-library) if needed:

```shell
npm version patch --no-git-tag-version # or minor, major
```

2. Test and check the package content:

```shell
npm test
npm publish --dry-run # only dist/, LICENSE, README.md and package.json
```

3. Commit, publish, tag:

```shell
git commit -am "release @playhex/tournament-organizer@<version>"
npm publish # runs `prepare`, which builds dist/. Asks for 2FA confirmation
git tag v<version>
git push origin main --tags
```

4. Check that it is online: `npm view @playhex/tournament-organizer version`.
   On first publication, npm first shows a `0.0.0-stage` placeholder version, the real one appears a few minutes later.

A published version can never be republished: if something is wrong, publish a new patch version.

## License
This repository is under [MIT license](LICENSE).

## Discussion

You can discuss this repository more in Matt Braddock's [Discord](https://discord.gg/2bshFdCW4q).
