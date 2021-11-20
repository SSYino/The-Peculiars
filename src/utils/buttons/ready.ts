import { MessageActionRow, MessageButton } from "discord.js"

export default ((state: ("waiting" | "started")): MessageActionRow => {
    let button = (component: MessageButton) => new MessageActionRow().addComponents(component);

    switch (state) {
        case "waiting":
            return button(new MessageButton()
                .setCustomId("ready")
                .setLabel("READY")
                .setStyle("PRIMARY"))
        case "started":
            return button(new MessageButton()
                .setCustomId("ready")
                .setLabel("Good Luck!")
                .setStyle("SUCCESS")
                .setDisabled(true))
    }
})