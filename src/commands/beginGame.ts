import { CommandInteraction, MessageEmbed, ApplicationCommand } from "discord.js";

export default async (inviteMessageInteraction: CommandInteraction, gameInteraction: CommandInteraction, inviteMessageEmbed: MessageEmbed) => {
    // Disable "begin" Slash Command
    const beginSlashCommand = gameInteraction.guild?.commands.cache.find(command => command.name === 'begin')
    if (!beginSlashCommand) return gameInteraction.channel?.send("Error: Could not find \"begin\" Slash Command in cache\nbeginGame.ts")
    beginSlashCommand.permissions.set({permissions: []})

    // Update invite message
    const newEmbed = new MessageEmbed(inviteMessageEmbed)
    const [fieldPlayerCount, fieldRound, fieldGameStatus] = newEmbed.fields
    const currentPlayerCount = fieldPlayerCount.value.match(/^\d+/)![0];

    fieldPlayerCount.name = "**Playing**";
    fieldPlayerCount.value = currentPlayerCount;
    fieldGameStatus.value = "In Progress";

    inviteMessageInteraction.editReply({ embeds: [newEmbed] })
}