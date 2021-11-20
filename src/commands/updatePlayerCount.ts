import { GuildMember, Message, MessageComponentInteraction, MessageEmbed } from "discord.js";
import Game from "../providers/Game";

export default async (inviteMessage: Message, buttonInteraction: MessageComponentInteraction): Promise<boolean> => {
    const embed = (await inviteMessage.fetch()).embeds[0];
    const newEmbed = new MessageEmbed(embed)
    const playerCountField = newEmbed.fields.find(field => field.name === "**In Lobby**")
    if (!playerCountField) return false;

    const numMatch = playerCountField.value.match(/^\d+/)![0];
    const playerCount = parseInt(numMatch)
    playerCountField.value = `${playerCount + 1} / 10`
    
    await inviteMessage.edit({ embeds: [newEmbed] })

    const game = Game.get(inviteMessage.guildId!);
    if (!game) {console.error("Error: Unable to find game instance\nupdatePlayerCount.ts"); return false};
    game.addPlayer(buttonInteraction.member as GuildMember)
    
    return true
}