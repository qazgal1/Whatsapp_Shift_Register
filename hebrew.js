function extractDatesAndTimes(message) {
    // Initialize an object to store dates and their associated times
    const dateTimes = {};

    // Process the message
    const linesWithDates = message
        .split('\n')  // Split the text into lines
        .filter(line => /\b\d{1,2}\.\d{1,2}\b/.test(line))  // Filter lines containing dates
        .forEach(line => {
            // Extract date
            const dateMatch = line.match(/\b\d{1,2}\.\d{1,2}\b/);
            if (dateMatch) {
                const date = dateMatch[0];

                // Extract times, considering '/'
                const times = line.split('/').flatMap(part => part.trim().match(/\d{1,2}:\d{2}/g) || []);

                // Add times to the date entry
                if (!dateTimes[date]) {
                    dateTimes[date] = new Set(); // Use Set to avoid duplicate times
                }
                times.forEach(time => dateTimes[date].add(time));
            }
        });

    // Convert Sets to arrays
    for (const date in dateTimes) {
        dateTimes[date] = Array.from(dateTimes[date]);
    }

    return dateTimes;
}

function chooseHourBasedOnDay(date, hours) {
    // Helper function to determine the day of the week from the date
    function getDayOfWeek(date) {
        const [day, month] = date.split('.').map(Number);
        // Creating a Date object (using a fixed year to avoid issues)
        const dateObj = new Date(`2024-${month}-${day}`);
        const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        return dayOfWeek;
    }

    // Helper function to convert time strings to a comparable format
    function timeToComparableString(time) {
        return time.split(':').map(Number).reduce((acc, num) => acc * 100 + num, 0);
    }

    // Get the day of the week
    const dayOfWeek = getDayOfWeek(date);

    // Convert time strings to comparable values
    const comparableHours = hours.map(timeToComparableString);

    let chosenHour;

    switch (dayOfWeek) {
        case 'Friday': // Friday
            // Choose the later hour for Friday
            chosenHour = comparableHours.length > 1 ? Math.max(...comparableHours) : comparableHours[0];
            break;
        case 'Saturday': // Saturday
            // Choose the earlier hour for Saturday
            chosenHour = comparableHours.length > 1 ? Math.min(...comparableHours) : comparableHours[0];
            break;
        default:
            // For other days, choose the earlier hour
            chosenHour = comparableHours.length > 1 ? Math.min(...comparableHours) : comparableHours[0];
            break;
    }

    // Convert back to time string
    const chosenHourString = hours[comparableHours.indexOf(chosenHour)];

    return chosenHourString;
}


