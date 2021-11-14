import { MessageActionRow, MessageButton } from "discord.js"

export default (): MessageActionRow => {
    return new MessageActionRow().addComponents(new MessageButton()
        .setCustomId("endGame")
        .setLabel("End The Game")
        .setStyle("DANGER")
        .setEmoji("🛑")
    )
}