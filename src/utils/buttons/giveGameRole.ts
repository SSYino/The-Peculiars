import { MessageActionRow, MessageButton } from "discord.js"

export default ((state: ("waiting" | "playing" | "ended")) : MessageActionRow => {
    let button = (component: MessageButton) => new MessageActionRow().addComponents(component);

    switch (state) {
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