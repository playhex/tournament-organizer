## Tournament Organizer
A Node.js module for organizing tournaments, written in TypeScript.

This is the [PlayHex](https://playhex.org) fork of [tournament-organizer](https://github.com/slashinfty/tournament-organizer) by Matt Braddock,
published as [`@playhex/tournament-organizer`](https://www.npmjs.com/package/@playhex/tournament-organizer).
It is based on version 3.9.1 and keeps the same API. See [Differences with the original library](#differences-with-the-original-library).

**Version 3 is now an ESM module.** If you don't understand what this means for you, [read this](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).

[![npm](https://img.shields.io/npm/v/@playhex/tournament-organizer?style=flat-square)](https://www.npmjs.com/package/@playhex/tournament-organizer) [![GitHub last commit](https://img.shields.io/github/last-commit/playhex/tournament-organizer?style=flat-square)](https://github.com/playhex/tournament-organizer/commits/main) [![GitHub issues](https://img.shields.io/github/issues-raw/playhex/tournament-organizer?style=flat-square)](https://github.com/playhex/tournament-organizer/issues) [![GitHub pull requests](https://img.shields.io/github/issues-pr-raw/playhex/tournament-organizer?style=flat-square)](https://github.com/playhex/tournament-organizer/pulls) [![GitHub](https://img.shields.io/github/license/playhex/tournament-organizer?style=flat-square)](https://github.com/playhex/tournament-organizer/blob/main/LICENSE) [![Ko-Fi](https://img.shields.io/badge/Ko--Fi-Buy%20Me%20a%20Coffee-a87b00)](https://ko-fi.com/mattbraddock)

### About
This JavaScript module for Node.js facilitates the organization and execution of tournaments.

Tournaments can be paired by single elimination, double elimination, stepladder, round-robin, double round-robin, and Swiss. Playoffs can be paired by single elimination, double elimination, and stepladder.

For non-elimination tournaments, the following tiebreaker systems are supported (their details can be found [here](https://en.wikipedia.org/wiki/Tie-breaking_in_Swiss-system_tournaments)):
* Solkoff
* Median-Buchholz
* Sonneborn-Berger
* Cumulative
* Versus
* Opponent's match win percentage
* Game win percentage
* Opponent's game win percentage
* Opponent's opponent's match win percentage

### About Pairings
Pairing algorithms live in `src/pairings`, with one module per format.

### Testing
```shell
npm test
```
`test/` mirrors `src/`: `test/pairings` covers the pairing algorithms, `test/components` covers `Manager`, `Tournament`, `Player` and `Match`.

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
- Tests (mocha + chai): `npm test`.

### Fixed / changed
- Round robin and double round robin: all matches are active from the start,
  so results can be entered in any order, not only for the current round.
  Player scores are updated as soon as a match ends, even for a match of a later round.
  Advancing to next round is only blocked by active matches of the current round.
- Round robin: removing a player turns all their active matches into byes for their opponents (not only matches of next rounds).
- Strict TypeScript fixes: missing players or matches now throw an explicit error (e.g `Player with ID ... does not exist`)
  instead of failing later with `Cannot read properties of undefined`.

## Contributing
Please submit an issue or a pull request on [playhex/tournament-organizer](https://github.com/playhex/tournament-organizer) (on main branch) if you encounter a bug in this fork.

The original library is written by Matt Braddock, a high school teacher: you can support him on [Ko-Fi](https://ko-fi.com/mattbraddock).

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
import TournamentOrganizer from "https://esm.sh/@playhex/tournament-organizer/dist/index.module.js";
```

## Documentation
Documentation of the original library: [https://slashinfty.github.io/tournament-organizer/](https://slashinfty.github.io/tournament-organizer/)

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
[MIT](LICENSE)

## Discussion

You can discuss this repository more in Matt Braddock's [Discord](https://discord.gg/2bshFdCW4q).
