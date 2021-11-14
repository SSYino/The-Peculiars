import { MessageActionRow, MessageButton } from "discord.js";

export default (): MessageActionRow => {
    return new MessageActionRow().addComponents(new MessageButton()
        .setCustomId("startNewRound")
        .setLabel("Start The Next Round")
        .setStyle("PRIMARY")
        .setEmoji("⏭️")
    )
}