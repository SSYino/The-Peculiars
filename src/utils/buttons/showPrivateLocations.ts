import { MessageActionRow, MessageButton } from "discord.js"

export default new MessageActionRow().addComponents(new MessageButton()
    .setCustomId("showPrivateLocations")
    .setLabel("Show Private Locations")
    .setStyle("PRIMARY")
    .setEmoji("🚩")
)
