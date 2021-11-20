import { MessageActionRow, MessageSelectMenu, MessageSelectOptionData } from "discord.js";
import { ReadyPlayers } from "../../providers/Game";

export default (players: ReadyPlayers, tieBreaker: boolean = false) => {
    const optionsArr: MessageSelectOptionData[] = []

    players.forEach(player => {
        const playerDisplayName = player.guildMember.displayName;
        const playerUsername = player.guildMember.user.username;
        const playerId = player.guildMember.id;

        optionsArr.push(
            {
                label: playerDisplayName,
                description: playerUsername,
                value: playerId,
                emoji: "💠"
            }
        )

    })

    return new MessageActionRow().addComponents(
        new MessageSelectMenu()
            .setCustomId(tieBreaker ? "tieBreaker" : "allPlayers")
            .setPlaceholder("Who is the Spy?")
            .setMaxValues(1)
            .setOptions(optionsArr)
    )
}