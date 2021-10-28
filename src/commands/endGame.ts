import { ApplicationCommand, Collection, CommandInteraction, InteractionCollector, Role, TextChannel } from "discord.js/typings/index.js";
import EventEmitter from "events";
import giveGameRole from "../utils/buttons/giveGameRole";

export default async (interaction: CommandInteraction, event_interaction: CommandInteraction, slashCommandEventEmitter: EventEmitter, slashCommands: Collection<string, ApplicationCommand>, everyoneRole: Role, playerRole: Role, gameChannel: TextChannel, buttonCollector: InteractionCollector<any> | undefined) => {
    for (const command of slashCommands) {
        if (command[1].name === 'start') {
            slashCommands
                .get(command[1].id)
                ?.permissions
                .set({
                    permissions: [
                        {
                            id: everyoneRole.id,
                            type: "ROLE",
                            permission: true
                        }
                    ]
                })
        }
        else if (command[1].name === 'begin' || command[1].name === 'end') {
            slashCommands
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

    interaction.editReply({ components: [giveGameRole("ended")] })
    buttonCollector?.stop();

    await event_interaction.followUp("**Deleting this channel in 5 seconds**")
    setTimeout(() => {
        gameChannel.delete();
        playerRole.delete();
    }, 5000)

    slashCommandEventEmitter.removeAllListeners();
}