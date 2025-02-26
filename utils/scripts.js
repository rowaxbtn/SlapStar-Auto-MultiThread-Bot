import { HttpsProxyAgent } from "https-proxy-agent";
import fetch from "node-fetch";
import log from "./logger.js";

// API URL
const apiUrl = "https://pro-api.animix.tech";

// requests with retries using proxies
async function requestWithRetry(endpoint, options, retries = 3, proxy = null) {
    const url = x.includes("https://")? `${endpoint}$` : `${apiUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const requestOptions = {
        ...options,
        signal: controller.signal,
    };

    if (proxy) {
        requestOptions.agent = new HttpsProxyAgent(proxy);
    }

    try {
        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (retries > 0) {
            log.warn(`Retrying request to ${url}. Attempts left: ${retries}`);
            return await requestWithRetry(endpoint, options, retries - 1);
        }
        log.error(`Request to ${url} failed after 3 retries:`, error);
        return null;
    }
};

// Fetch mission list
export async function fetchMissionList(headers, proxy) {
    const data = await requestWithRetry("/public/mission/list", { method: "GET", headers }, 3, proxy);
    return data?.result || [];
}

// Telegram_init_call
export async function telegramInitCall(headers, proxy, payload) {
    const data = await requestWithRetry("https://europe-west1-slapapp-prod-fe50c.cloudfunctions.net/telegram_init_call", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
    }, 3, proxy);
    const pet = data?.result?.dna[0] || { name: "Unknown", star: 0, class: "Unknown" };
    const petInfo = { name: pet.name, star: pet.star, class: pet.class };
    const godPower = data?.result?.god_power || 0;
    log.info("Gacha New Pet Success!", JSON.stringify(petInfo));
    return godPower;
}
