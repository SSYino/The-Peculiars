import { Client, CommandInteraction } from "discord.js/typings/index.js";
import initiateGame from "./initiateGame";

export default (interaction: CommandInteraction, client: Client) => {
    switch (interaction.commandName) {
        case 'start':
            initiateGame(interaction, client);
            break;
        default:
            interaction.reply("Error: Unknown command")
    }
}