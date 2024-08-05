const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { exec } = require('child_process');

if (process.platform === 'win32') {
    const pid = process.pid;
    exec(`wmic process where processid=${pid} CALL setpriority "high priority"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error setting priority: ${error}`);
            return;
        }
        console.log('Priority set to high on Windows.');
        exec('powercfg -change -standby-timeout-ac 0', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error preventing sleep: ${error}`);
                return;
            }
            console.log('System sleep prevented on Windows.');
        });
    });
}
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "Gal",
        dataPath: "C:\\Users\\qazga\\Desktop\\projects\\profiles"
    }),
    webVersionCache: {
        type: "remote",
        remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    },
});
client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
    // Add logic to reconnect if necessary
    client.initialize();
});
client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED');
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('ready', () => {
    console.log('Client is ready!');
    startKeepAlive();
});

client.on('message', msg => {
    console.log("Received message from:", msg.author);
    if (msg.body.includes("https://forms.gle/p6s6bD7yqFF2H3ye6") && msg.author != undefined) {
        const formattedDatesAndTimes = extractDatesAndTimes(msg.body);
        var responseMessage = "ב";

        for (const [date, hours] of Object.entries(formattedDatesAndTimes)) {
            const chosenHour = chooseHourBasedOnDay(date, hours);
            var toAdd = '';
            if (chosenHour!=""){
                toAdd="-"
            }
            responseMessage += ` ${date} ${toAdd} ${chosenHour || ""},`;
        }

        var messageToSend = `היי המייל שלי לא עובד כל כך אפשר להירשם אצלך לאירועים?\n ${responseMessage}`;
        if (responseMessage != "ב"){
            messageToSend = messageToSend.substring(0, messageToSend.length-1)
        console.log("Sending message to:", msg.author);
        console.log(messageToSend);
        setTimeout(() => {
            console.log('Delay completed after 3 seconds');
        }, 1500); // Delay of 3000 milliseconds (1.5000000s seconds)
        client.sendMessage(msg.author, messageToSend);
    }else{console.log("this is empty no dates just link")}
    }
});

function extractDatesAndTimes(message) {
    const dateTimes = {};

    message.split('\n')
        .filter(line => /\b\d{1,2}\.\d{1,2}\b/.test(line))
        .forEach(line => {
            const dateMatch = line.match(/\b\d{1,2}\.\d{1,2}\b/);
            if (dateMatch) {
                const date = dateMatch[0];
                const times = line.split('/').flatMap(part => part.trim().match(/\d{1,2}:\d{2}/g) || []);
                if (!dateTimes[date]) {
                    dateTimes[date] = new Set();
                }
                times.forEach(time => dateTimes[date].add(time));
            }
        });

    for (const date in dateTimes) {
        dateTimes[date] = Array.from(dateTimes[date]);
    }

    return dateTimes;
}

function chooseHourBasedOnDay(date, hours) {
    function getDayOfWeek(date) {
        const [day, month] = date.split('.').map(Number);
        const dateObj = new Date(`2024-${month}-${day}`);
        return dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    }

    function timeToComparableString(time) {
        return time.split(':').map(Number).reduce((acc, num) => acc * 100 + num, 0);
    }

    const dayOfWeek = getDayOfWeek(date);
    const comparableHours = hours.map(timeToComparableString);

    let chosenHour;

    switch (dayOfWeek) {
        case 'Friday':
            chosenHour = comparableHours.length > 1 ? Math.max(...comparableHours) : comparableHours[0];
            break;
        case 'Saturday':
            chosenHour = comparableHours.length > 1 ? Math.min(...comparableHours) : comparableHours[0];
            break;
        default:
            chosenHour = comparableHours.length > 1 ? Math.min(...comparableHours) : comparableHours[0];
            break;
    }

    return hours[comparableHours.indexOf(chosenHour)] || "";  // Return an empty string if no hour is chosen
}
function log(message) {
    const logStream = fs.createWriteStream('log.txt', { flags: 'a' });
    logStream.write(`${new Date().toISOString()} - ${message}\n`);
    logStream.end();
}
function startKeepAlive() {
    (function sendKeepAlive() {
        setTimeout(async () => {
            try {
                await client.sendPresenceAvailable();
                log('Sent presence available');
            } catch (err) {
                log(`Error in keep-alive: ${err}`);
            }
            sendKeepAlive(); // Schedule the next keep-alive
        }, getRandomInterval(300000, 600000)); // Random interval between 5 to 10 minutes
    })();
}

// Function to get a random interval between min and max milliseconds
function getRandomInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

client.initialize();
