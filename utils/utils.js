import moment from "moment";
import { invoke } from '@tauri-apps/api/tauri';

let idleCounter = 0;
let achievementCounter = 0;

export function minutesToHoursCompact(number) {
    const durationInMinutes = number;
    const duration = moment.duration(durationInMinutes, 'minutes');
    const hours = Math.floor(duration.asHours());
    return hours;
}

export async function startIdler(appId, appName, quiet = false) {
    try {
        const steamRunning = await invoke('check_status');
        if (steamRunning) {
            const path = await invoke('get_file_path');
            const fullPath = path.replace('Steam Game Idler.exe', 'libs\\SteamUtility.exe');
            await invoke('start_idle', { filePath: fullPath, appId: appId.toString(), quiet: quiet.toString() });
            idleCounter++;
            updateIdleStats();
            logEvent(`Started idling ${appName}`);
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log(error);
    }
};

export async function stopIdler(appId) {
    try {
        await invoke('stop_idle', { appId: appId.toString() });
        logEvent(`Stopped idling ${appId}`);
    } catch (error) {
        console.log(error);
    }
};

export async function unlockAchievement(appId, achievementId, unlockAll) {
    const steamRunning = await invoke('check_status');
    if (steamRunning) {
        const path = await invoke('get_file_path');
        const fullPath = path.replace('Steam Game Idler.exe', 'libs\\SteamUtility.exe');
        await invoke('unlock_achievement', {
            filePath: fullPath,
            appId: appId.toString(),
            achievementId: achievementId,
            unlockAll: unlockAll
        });
        achievementCounter++;
        updateAchievementStats();
        logEvent(`Unlocked achievement ${achievementId} (${appId})`);
    } else {
        logEvent(`[Error] Achievement failed - Steam is not running`);
    }
}

export async function checkDrops(steamId, appId, sid, sls) {
    const response = await fetch('https://apibase.vercel.app/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route: 'drops', steamId: steamId, appId: appId, sid: sid, sls: sls }),
    })
    if (response.status !== 500) {
        const data = await response.json();
        if (data.remaining) {
            return data.remaining;
        } else {
            return 0;
        }
    } else {
        return 0;
    }
}

export async function getAllGamesWithDrops(steamId, sid, sls) {
    const response = await fetch('https://apibase.vercel.app/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route: 'games-with-drops', steamId: steamId, sid: sid, sls: sls }),
    })
    if (response.status !== 500) {
        const data = await response.json();
        return data.games;
    } else {
        return 0;
    }
}

export async function logEvent(message) {
    try {
        await invoke('log_event', { message });
    } catch (error) {
        console.error('Failed to log event:', error);
    }
};

export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const updateIdleStats = debounce(async () => {
    try {
        await fetch('https://apibase.vercel.app/api/route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ route: 'statistics', type: 'idle', count: idleCounter }),
        });
        idleCounter = 0;
    } catch (error) {
        console.log('Error contacting statistics endpoint: ', error);
    }
}, 5000);

const updateAchievementStats = debounce(async () => {
    try {
        console.log('updating db..', achievementCounter);
        await fetch('https://apibase.vercel.app/api/route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ route: 'statistics', type: 'achievement', count: achievementCounter }),
        });
        achievementCounter = 0;
    } catch (error) {
        console.log('Error contacting statistics endpoint: ', error);
    }
}, 5000);

export async function updateLaunchedStats(type) {
    try {
        fetch('https://apibase.vercel.app/api/route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ route: 'statistics', type: type, count: 1 }),
        });
    } catch (error) {
        console.log('Error contacting statistics endpoint: ', error);
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}