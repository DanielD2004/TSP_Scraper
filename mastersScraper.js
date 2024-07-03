import axios from "axios";
import pg from 'pg'
import { dbInfo } from './dbInfo.js'

const { Client } = pg;
 
const dbConfig = dbInfo

const client = new Client(dbConfig);


const insertScoreQuery = `
INSERT INTO tsp_masters (id, date, time, venueName, homeTeamName, homeScore, awayTeamName, awayScore)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT(id) DO NOTHING;
`

const retrieveGameIdsQuery = `
    SELECT * FROM tsp_masters WHERE id = $1;
`


const updateRowQuery = `
    UPDATE tsp_masters
    SET date = $2, time = $3, venueName = $4, homeTeamName = $5, homeScore = $6, awayTeamName = $7, awayScore = $8
    WHERE id = $1;
`

async function run() {
    try {
        await client.connect();
        const data = await getData();

        for (let game of data) {
            let gameid = `${game.Date}/${game.Time}/${game.VenueName}`
            const rowid = await client.query(retrieveGameIdsQuery, [gameid])
            if (rowid.rows[0] == undefined) {
                await makeNewRow(game, gameid)
                continue;
            }
            if (((rowid.rows[0].id == gameid) && (game.HomeScore != rowid.rows[0].homescore)) || ((rowid.rows[0].id == gameid) && (game.AwayScore != rowid.rows[0].awayscore))) {
                await makeNewRow(game, gameid, `changed`)
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

function parseDate(dateString) {
    const currentYear = new Date().getFullYear();
    const fullDateString = `${currentYear} ${dateString}`;
    const parsedDate = new Date(fullDateString);
    return parsedDate;
}

async function makeNewRow(game, gameid, change = 0) {
    const values = [
        gameid,
        parseDate(game.Date),
        game.Time,
        game.VenueName,
        game.HomeTeamName,
        game.HomeScore,
        game.AwayTeamName,
        game.AwayScore
    ];
    const res = await client.query(insertScoreQuery, values);

    // if changed, pass in argument to change message
    if (change == `changed`) {
        await client.query(updateRowQuery, values);
        sendMessage(game, change);
        return;
    }
    sendMessage(game);
}

async function sendMessage(game, change=0) {
    let message;
    if (game.HomeScore > game.AwayScore) {
        message = `${game.HomeTeamName} beat ${game.AwayTeamName} ${game.HomeScore}-${game.AwayScore}`
    } else if (game.AwayScore > game.HomeScore) {
        message = `${game.AwayTeamName} beat ${game.HomeTeamName} ${game.AwayScore}-${game.HomeScore}`
    } else {
        message = `${game.AwayTeamName} tied with ${game.HomeTeamName} ${game.AwayScore}-${game.HomeScore}`
    }
    if (change == `changed`){
        message = `Score Changed: Sun ${game.Date} ${game.Time} at ${game.VenueName} - New Score is ${game.HomeTeamName} ${game.HomeScore}-${game.AwayScore} ${game.AwayTeamName}`
    }
    let response = await axios.post('https://ntfy.sh/Masters2024TSP_Games', message, {
        headers: {
            'Title': 'NEW MASTERS SCORE',
            'Tags': 'softball',
            'Content-Type': 'text/plain',
            'Priority': 'urgent',
            'Actions': 'view, Open Site, https://www.thornhillslopitch.com/Score/Standings/103'
        }
    });
}

async function getData() {
    const { data } = await axios.get('https://www.thornhillslopitch.com/Score/Standings/103')

    let startString = "let lgScheduleItems = ";
    let endString = "let SessionId";
    let startIndex = data.indexOf(startString) + startString.length;
    let endIndex = data.indexOf(endString) - 9;
    let scores = data.substring(startIndex, endIndex);
    scores = JSON.parse(scores).items;

    // ignore games with no score yet
    scores = scores.map(score => {
        if (score.HomeScore !== "") {
            return score;
        }
        else {
            return null;
        }
    })

    scores = scores.filter(n => n);
    return scores;
}

run();

