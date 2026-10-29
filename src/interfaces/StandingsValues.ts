import { Player } from "../components/Player.js";

/**
 * Properties of standings
 */
export interface StandingsValues {
    /**
     * The player represented by the values.
     */
    player: Player,
    /**
     * Number of points earned based on games.
     */
    gamePoints: number,
    /**
     * Number of games played.
     */
    games: number,
    /**
     * Number of points earned based on matches.
     */
    matchPoints: number,
    /**
     * Number of matches played.
     */
    matches: number,
    /**
     * Values for all tiebreakers.
     */
    tiebreaks: {
        /**
         * A player's Median-Buchholz (or Harkness) score.
         */
        medianBuchholz: number,
        /**
         * A player's Solkoff score.
         */
        solkoff: number,
        /**
         * A player's Sonneborn-Berger score.
         */
        sonnebornBerger: number,
        /**
         * A player's Koya System score:
         * match points earned against opponents who have at least half the maximum number of match points.
         */
        koyaSystem: number,
        /**
         * A player's cumulative score.
         */
        cumulative: number,
        /**
         * A player's cumulative opponent's score.
         */
        oppCumulative: number,
        /**
         * Number of matches won against opponents (byes excluded).
         */
        earnedMatchWins: number,
        /**
         * Number of matches lost against opponents (byes excluded), as a negative number.
         */
        earnedMatchLosses: number,
        /**
         * Number of games won against opponents (byes excluded).
         */
        earnedGameWins: number,
        /**
         * Number of games lost against opponents (byes excluded), as a negative number.
         */
        earnedGameLosses: number,
        /**
         * Difference between games won and games lost against opponents (byes excluded).
         */
        gameWinDifferential: number,
        /**
         * Record (wins minus losses) against opponents who have the same number of match points as the player.
         */
        neighborhoodRecord: number,
        /**
         * A player's match win percentage.
         */
        matchWinPct: number,
        /**
         * A player's opponent's match win percentage.
         */
        oppMatchWinPct: number,
        /**
         * A player's opponent's opponent's match win percentage.
         */
        oppOppMatchWinPct: number,
        /**
         * A player's game win percentage.
         */
        gameWinPct: number,
        /**
         * A player's opponent's game win percentage.
         */
        oppGameWinPct: number
    } 
}