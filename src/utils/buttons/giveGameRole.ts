import { MessageActionRow, MessageButton } from "discord.js"

export default ((gameState: ("waiting" | "playing" | "ended")) : MessageActionRow => {
    let button = (component: MessageButton) => new MessageActionRow().addComponents(component);

    switch (gameState) {
        case "waiting":
            return button(new MessageButton()
                .setCustomId("gameRole")
                .setLabel("Start Playing")
                .setStyle("PRIMARY"))
        case "playing":
            return button(new MessageButton()
                .setCustomId("gameRole")
                .setLabel("Game in progress")
                .setStyle("SUCCESS")
                .setDisabled(true))
        case "ended":
            return button(new MessageButton()
                .setCustomId("gameRole")
                .setLabel("Game has ended")
                .setStyle("DANGER")
                .setDisabled(true))
    }
})