import { MessageActionRow, MessageButton } from "discord.js";

export default new MessageActionRow().addComponents(
    new MessageButton()
        .setCustomId("vote")
        .setLabel("Vote")
        .setStyle("SUCCESS"),

    new MessageButton()
        .setCustomId("closePoll")
        .setLabel("Close This Poll")
        .setStyle("DANGER")
)