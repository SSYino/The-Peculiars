import { MessageActionRow, MessageButton } from "discord.js"

export default (disable: boolean = false) => new MessageActionRow().addComponents(new MessageButton()
    .setCustomId("showPrivateLocations")
    .setLabel("Show Private Locations")
    .setStyle("PRIMARY")
    .setEmoji("🚩")
    .setDisabled(disable)
)
