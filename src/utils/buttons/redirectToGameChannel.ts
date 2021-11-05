import { MessageActionRow, MessageButton } from "discord.js"

export default (guildId: string, channelId: string) => new MessageActionRow().addComponents(
    new MessageButton()
        .setLabel("GO TO GAME CHANNEL")
        .setURL(`discord://discordapp.com/channels/${guildId}/${channelId}`)
        .setStyle("LINK")
);