import { GuildMember, MessageEmbed } from "discord.js";

interface gameDataInterface {
    location: string
    spy: GuildMember
    playerCount: number
}

export default (winningTeam: "Spy" | "The Innocents", gameData: gameDataInterface): MessageEmbed => {
    const msgEmbed = new MessageEmbed()
        .setColor("YELLOW")
        .setFields([
            { name: "Players", value: `${gameData.playerCount}` },
            { name: "Location", value: gameData.location },
            { name: "Spy", value: `<@${gameData.spy.id}>` }
        ])
        .setTimestamp(Date.now())
        .setFooter(`Spy Game By Nino`, "https://cdn.discordapp.com/attachments/878123202621108264/901836949084590100/unknown.png") // TODO | Change Icon URL to later be provided from Discord User

    if (winningTeam === "Spy") {
        return msgEmbed
            .setTitle("SPY VICTORIOUS\nThe Spy will have a chicken dinner")
            .setDescription("The Spy guessed the location correctly\nType `/begin` or press the button below to start the next round")
            .setThumbnail(gameData.spy.displayAvatarURL())
    }
    else {
        return msgEmbed
            .setTitle("THE INNOCENTS VICTORIOUS\nThe Spy is now in horny jail")
            .setDescription("The Spy guessed the location incorrectly\nType `/begin` or press the button below to start the next round")
            .setThumbnail("https://cdn.discordapp.com/attachments/878123202621108264/901837559020277781/unknown.png")
    }
}