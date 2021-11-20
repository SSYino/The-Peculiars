import { ApplicationCommand, ButtonInteraction, Collection, CommandInteraction, Message, MessageAttachment, MessageEmbed, Role, TextChannel } from "discord.js";
import { promisify } from "util";
import Game from "../providers/Game";

export default async (inviteMessage: Message, event_interaction: CommandInteraction | ButtonInteraction, slashCommands: Collection<string, ApplicationCommand>, everyoneRole: Role, playerRole: Role, gameChannel: TextChannel) => {
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
    const oldInviteMessageEmbed = (await inviteMessage.fetch()).embeds[0];
    const newInviteMessageEmebed = new MessageEmbed(oldInviteMessageEmbed);
    const [fieldPlayerCount, fieldGameRound, fieldGameStatus] = newInviteMessageEmebed.fields;
    fieldPlayerCount.name = "**Participants**";
    fieldPlayerCount.value = fieldPlayerCount.value.match(/^\d+/)![0];
    fieldGameRound.name = "**Rounds Played**";
    fieldGameStatus.value = "Terminated";

    const thumbnail = new MessageAttachment("assets/Images/redLogo.png");
    newInviteMessageEmebed.setThumbnail("attachment://redLogo.png")
    newInviteMessageEmebed.setColor("RED")

    inviteMessage.edit({ embeds: [newInviteMessageEmebed], files: [thumbnail] });
    Game.clearInstance(inviteMessage.guildId!);

    try {
        await event_interaction.followUp("**Deleting this channel in 5 seconds**")
        await promisify(setTimeout)(5000)
        await playerRole.delete();
        await gameChannel.delete();
    } catch {console.error("Error: Could not delete GameRole/GameChannel -- Possible that more than one player tried to end the game at the same time")}

    // Allow the use of the "start" slash command to start a new game
    slashCommands.find(command => command.name === "start")?.permissions.set({ permissions: [{ id: everyoneRole.id, type: "ROLE", permission: true }] })
}