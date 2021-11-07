import { MessageActionRow } from "discord.js";
import showJob from "./showJob";
import showPrivateLocations from "./showPrivateLocations";

const showJobComponents = showJob.components;
const showPrivateLocationsComponent = showPrivateLocations.components;

export default new MessageActionRow().addComponents(showJobComponents, showPrivateLocationsComponent);