## Slowpitch Score Scraper & Notifier

Node.js app that scrapes slo-pitch league scores, stores them in a PostgreSQL database, and sends real-time push notifications for new results or score changes using ntfy. Runs continuously using Node-RED.

---

## Features

* **Score Scraping:** pulls game results from league website
* **Database Storage:** saves scores to PostgreSQL, prevents duplicates
* **Change Detection:** detects updated scores
* **Push Notifications:** sends game results and updates to ntfy
* **Node-RED Integration:** keeps the scraper running on an automated loop
* **Game Summaries:** clear messages for wins, losses, ties

---

## What I Used

| Layer         | Library/Tool      |
| ------------- | ----------------- |
| Scraper       | Axios, Vanilla JS |
| Database      | PostgreSQL        |
| Notifications | ntfy.sh           |
| Runtime       | Node.js           |
| Automation    | Node-RED          |

---

### Scraper

* Fetches game data from league’s website
* Builds unique game IDs using date, time, and venue
* Inserts new results or updates changed scores
* Ignores games with no scores posted yet

### Database

* Uses PostgreSQL to store game records
* Prevents duplicate entries with primary key checks
* Updates existing rows when scores change

### Node-RED

* Runs the scraper on a schedule using Node-RED flows
* Keeps the process automated and live without manual restarts

---

### TODO

* Improve error handling
* Extend support for multiple leagues
* Integration with Discord would be cool

---
