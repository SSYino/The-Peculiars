import { MessageActionRow, MessageButton } from "discord.js";
import startNewRound from "./startNewRound";
import endGame from "./endGame";

export default (disable: boolean = false) => new MessageActionRow().addComponents(
    startNewRound(disable).components,
    endGame(disable).components
)