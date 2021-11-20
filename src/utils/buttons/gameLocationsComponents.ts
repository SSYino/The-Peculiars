import { MessageActionRow } from "discord.js";
import showJob from "./showJob";
import showPrivateLocations from "./showPrivateLocations";
import startVote from "./startVote";

export default (disableAll: boolean = false, disableVote: boolean = false) => new MessageActionRow().addComponents(
    showJob(disableAll).components,
    showPrivateLocations(disableAll).components,
    startVote(disableAll || disableVote).components
);