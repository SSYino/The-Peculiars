import { CommandInteraction, MessageEmbed } from "discord.js";

export default async (embed: MessageEmbed, commandInteraction: CommandInteraction): Promise<boolean> => {
    const newEmbed = new MessageEmbed(embed)
    const playerCountField = newEmbed.fields.find(field => field.name === "**In Lobby**")
    if (!playerCountField) return false;

    const numMatch = playerCountField.value.match(/^\d+/)![0];
    const playerCount = parseInt(numMatch)
    playerCountField.value = `${playerCount + 1} / 10`
    
    await commandInteraction.editReply({ embeds: [newEmbed] })
    return true
}