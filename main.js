import { readUsers, getRandomProxy } from "./utils/helper.js";
import log from "./utils/logger.js";
import bedduSalama from "./utils/banner.js";
import {
    telegramInitCall,
} from "./utils/scripts.js";
import slapStarLib from "./utils/index-Vcf34GUr.js";

async function startBot() {
    const users = readUsers("users.txt");

    let userCount = 1;
    for (const user of users) {
        const proxy = getRandomProxy();
        console.log(`\n`)
        log.info(` === Running for user #${userCount} Using Proxy : ${proxy} ===`);
        const headers = {
            "Content-Type": "application/json",
            "tg-init-data": user,
        };

        log.info("Fetching Gatcha Bonus...");
        const gatchaBonus = await fetchGatchaBonus(headers, proxy);
        const telegramInit = await telegramInitCall(headers, proxy, { env: "prod", init_data: user, locale: "en" });
        const { current_step, is_claimed_god_power, is_claimed_dna, step_bonus_god_power, step_bonus_dna } = gatchaBonus;
        if (current_step >= step_bonus_god_power && !is_claimed_god_power) {
            log.info("Claiming God Power Bonus...");
            await claimGatchaBonus(headers, proxy, 1);
        } else if (current_step >= step_bonus_dna && !is_claimed_dna) {
            log.info("Claiming DNA Bonus...");
            await claimGatchaBonus(headers, proxy, 2);
        } else {
            log.warn("No bonus from gatcha to claim.");
        };

        let power = await getPower(headers, proxy);
        while (power >= 1) {
            log.info("God Power is enough to gatcha new pet. lets go!");
            power = await getNewPet(headers, proxy);
            await delay(1);
        };

        log.info("Fetching pet mom and dad can indehoy!❤️");
        await mergePetIds(headers, proxy);
        await delay(1);
        try {
            const missionLists = await fetchMissionList(headers, proxy);

            log.info("Checking for completed missions...");
            await delay(1);
            const missionIds = missionLists.filter(mission => mission.can_completed).map(mission => mission.mission_id);
            if (missionIds.length > 0) {
                for (const missionId of missionIds) {
                    log.info("Claiming mission with ID:", missionId);
                    await claimMission(headers, proxy, missionId);
                    await delay(1);
                }
            } else {
                log.warn("No completed missions found.");
            };
            log.info("Checking for available missions to enter...");
            await doMissions(headers, proxy)
            await delay(1);
            await checkUserReward(headers, proxy);
        } catch (error) {
            log.error("Error fetching Missions data:", error);
        }

        try {
            log.info("Checking for battle info 🔍...");
            await delay(1);
            const battleInfo = (await fetchBattleInfo(headers, proxy))?.result;
            log.info("Checking reward...");
            const not_claimed_rewards_info = battleInfo?.not_claimed_rewards_info;
            if (not_claimed_rewards_info) {
                const season_id = not_claimed_rewards_info?.season_id || "Unknown";
                await claimArenaReward(headers, proxy, { season_id: season_id });
            }
            log.info("Checking arena ticket 🔍...");
            const ticket = battleInfo?.ticket || "Unknown";
            let ticketAmount = ticket?.amount || 0;
            if (ticketAmount > 0) {
                const petData = await fetchPetList(headers, proxy);
                const { petIdsByStarAndClass, allPetIds, top3PetsStar } = petData;
                await doBattle(headers, proxy, ticketAmount, petData);
                await delay(1);
            }
        } catch (error) {
            log.error("Error fetching Battle info:", error);
        }
        userCount++;
    }
}

async function main() {
    log.debug(bedduSalama);
    await delay(1);
    while (true) {
        await startMission();
        log.warn("Waiting for 30 minutes before continue...");
        await delay(30 * 60);
    }
}

main();
