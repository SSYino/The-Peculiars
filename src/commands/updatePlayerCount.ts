import { CommandInteraction, GuildMember, MessageComponentInteraction, MessageEmbed } from "discord.js";
import Game from "../providers/Game";

export default async (embed: MessageEmbed, commandInteraction: CommandInteraction, buttonInteraction: MessageComponentInteraction): Promise<boolean> => {
    const newEmbed = new MessageEmbed(embed)
    const playerCountField = newEmbed.fields.find(field => field.name === "**In Lobby**")
    if (!playerCountField) return false;

    const numMatch = playerCountField.value.match(/^\d+/)![0];
    const playerCount = parseInt(numMatch)
    playerCountField.value = `${playerCount + 1} / 10`
    
    await commandInteraction.editReply({ embeds: [newEmbed] })

    const game = Game.get(commandInteraction.guildId!);
    if (!game) {console.error("Error: Unable to find game instance\nupdatePlayerCount.ts"); return false};
    game.addPlayer(buttonInteraction.member as GuildMember)

    return true
}