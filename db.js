import axios from "axios";
import pg from 'pg'
import { dbInfo } from './dbInfo.js'

const { Client } = pg;
 
const dbConfig = dbInfo

const client = new Client(dbConfig);

const insertScoreQuery = `
INSERT INTO tsp_games (id, date, time, venueName, homeTeamName, homeScore, awayTeamName, awayScore)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT(id) DO NOTHING;
`

const retrieveGameIdsQuery = `
    SELECT id FROM tsp_games;
`

async function run() {
    try {
        await client.connect();
        const data = await getData();
        const allIds = await client.query(retrieveGameIdsQuery)
        

        for (let game of data) {
            let gameid = `${game.Date}/${game.Time}/${game.VenueName}`
            let obj = allIds.rows.find(o => o.id === gameid)
                if (obj == undefined){
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
                    sendMessage(game)
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

async function sendMessage(game) {
    let message;
    if (game.HomeScore > game.AwayScore) {
        message = `${game.HomeTeamName} beat ${game.AwayTeamName} ${game.HomeScore}-${game.AwayScore}`
    } else if (game.AwayScore > game.HomeScore) {
        message = `${game.AwayTeamName} beat ${game.HomeTeamName} ${game.AwayScore}-${game.HomeScore}`
    } else {
        message = `${game.AwayTeamName} tied with ${game.HomeTeamName} ${game.AwayScore}-${game.HomeScore}`
    }
    let response = await axios.post('http://ntfy.gdplace.home.arpa/Tsp_Games', message, {
        headers: {
            'Title': 'NEW MIXED SCORE',
            'Tags': 'softball',
            'Content-Type': 'text/plain',
            'Priority': 'urgent',
            'Actions': 'view, Open Site, https://www.thornhillslopitch.com/Score/Standings/105'
        }
    });
}

async function getData() {
    const { data } = await axios.get('https://www.thornhillslopitch.com/Score/Standings/105')

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

