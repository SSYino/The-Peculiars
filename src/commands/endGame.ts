import { ApplicationCommand, Collection, CommandInteraction, MessageEmbed, Role, TextChannel } from "discord.js";

export default async (interaction: CommandInteraction, event_interaction: CommandInteraction, inviteMessageEmebed: MessageEmbed, slashCommands: Collection<string, ApplicationCommand>, everyoneRole: Role, playerRole: Role, gameChannel: TextChannel) => {
    // Lock "begin" and "end" slash commands from being used
    for (const command of slashCommands) {
        if (command[1].name === 'begin' || command[1].name === 'end') {
            await slashCommands
            .get(command[1].id)
            ?.permissions
            .set({
                permissions: [
                    {
                        id: playerRole.id,
                        type: "ROLE",
                        permission: false
                    }
                ]
            })
        }
    }
    
    // Change Invite Message Embed
    const newInviteMessageEmebed = new MessageEmbed(inviteMessageEmebed);
    const [fieldPlayerCount, fieldGameRound, fieldGameStatus] = newInviteMessageEmebed.fields;
    fieldPlayerCount.name = "**Participants**";
    fieldPlayerCount.value = fieldPlayerCount.value.match(/^\d+/)![0];
    fieldGameRound.name = "**Rounds Played**";
    fieldGameStatus.value = "Terminated";
    interaction.editReply({embeds: [newInviteMessageEmebed]});

    await event_interaction.followUp("**Deleting this channel in 5 seconds**")
    setTimeout(() => {
        gameChannel.delete();
        playerRole.delete();
    }, 5000)

    // Allow the use of the "start" slash command to start a new game
    slashCommands.find(command => command.name === "start")?.permissions.set({ permissions: [{ id: everyoneRole.id, type: "ROLE", permission: true }] })
}