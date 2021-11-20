import { MessageActionRow, MessageButton } from "discord.js";

export default (locationName: string, disable: boolean = false) => new MessageActionRow().addComponents(
    new MessageButton()
        .setCustomId(`confirmationYes${locationName}`)
        .setLabel("Yes, I'm sure")
        .setStyle("SUCCESS")
        .setEmoji("✔️")
        .setDisabled(disable)
    ,
    new MessageButton()
        .setCustomId(`confirmationNo${locationName}`)
        .setLabel("No, go back")
        .setStyle("DANGER")
        .setEmoji("❌")
        .setDisabled(disable)
)
