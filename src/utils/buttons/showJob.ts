import { MessageActionRow, MessageButton } from "discord.js";

export default new MessageActionRow().addComponents(new MessageButton()
    .setCustomId("showJob")
    .setLabel("Show My Job")
    .setStyle("PRIMARY")
    .setEmoji("🥼")
)