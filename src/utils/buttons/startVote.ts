import { MessageActionRow, MessageButton } from "discord.js";

export default (disable: boolean) => new MessageActionRow().addComponents(
    new MessageButton()
        .setCustomId("startVote")
        .setLabel("Start a Vote")
        .setStyle("PRIMARY")
        .setEmoji("🚨")
        .setDisabled(disable)
)