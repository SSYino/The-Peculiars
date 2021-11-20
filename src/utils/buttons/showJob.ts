import { MessageActionRow, MessageButton } from "discord.js";

export default (disable: boolean = false) => new MessageActionRow().addComponents(new MessageButton()
    .setCustomId("showJob")
    .setLabel("Show My Job")
    .setStyle("PRIMARY")
    .setEmoji("🥼")
    .setDisabled(disable)
)