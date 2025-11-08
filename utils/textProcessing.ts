// Parses HH:MM:SS.ms, MM:SS.ms, SS.ms formats from a string
const parseTimecode = (timeStr: string): number => {
    // Handle both . and , for milliseconds, and reverse to handle optional parts easily
    const parts = timeStr.split(':').map(part => parseFloat(part.replace(',', '.'))).reverse(); 
    let seconds = 0;
    if (parts.length > 0) seconds += parts[0]; // seconds
    if (parts.length > 1) seconds += parts[1] * 60; // minutes
    if (parts.length > 2) seconds += parts[2] * 3600; // hours
    return seconds;
};

/**
 * Parses a string of text containing timecodes at the beginning of lines.
 * Example: `[00:10.500] Hello world`
 * @param text The raw text input.
 * @returns An object containing the text with timecodes removed, and an array
 *          of timecodes (in seconds) corresponding to each line of the cleaned text.
 */
export const parseTimecodedText = (text: string): { cleanedText: string; timecodes: Array<number | null> } => {
    // More robust regex: allows for leading/trailing whitespace and whitespace within brackets.
    const timecodeRegex = /^\s*\[\s*(.*?)\s*\]\s*/;
    const lines = text.split('\n');
    const cleanedLines: string[] = [];
    const timecodes: Array<number | null> = [];

    lines.forEach(line => {
        const match = line.match(timecodeRegex);
        if (match && match[1]) {
            const time = parseTimecode(match[1]);
            // If parsing results in a valid number, store it. Otherwise, treat it as part of the text.
            if (!isNaN(time)) {
                cleanedLines.push(line.replace(timecodeRegex, ''));
                timecodes.push(time);
            } else {
                cleanedLines.push(line);
                timecodes.push(null);
            }
        } else {
            cleanedLines.push(line);
            timecodes.push(null);
        }
    });

    return {
        cleanedText: cleanedLines.join('\n'),
        timecodes: timecodes,
    };
};
