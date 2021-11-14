import { MessageActionRow, MessageButton } from "discord.js";
import startNewRound from "./startNewRound";
import endGame from "./endGame";

const startNewRoundComponent = startNewRound().components;
const endGameComponent = endGame().components;

export default new MessageActionRow().addComponents(startNewRoundComponent, endGameComponent)