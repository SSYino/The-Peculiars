import { GuildMember, MessageAttachment, MessageEmbed } from "discord.js";

interface gameDataInterface {
    playerCount: number
    location: string
    spy: GuildMember
    spyGuess?: string
}

export default (winningTeam: "Spy" | "The Innocents" | "Draw", winningMethod: "spyGuess" | "playerVotes", gameData: gameDataInterface): { embed: MessageEmbed, files?: MessageAttachment } => {
    const msgEmbed = new MessageEmbed()
        .setColor("YELLOW")
        .setFields([
            { name: "Players", value: `${gameData.playerCount}` },
            { name: "Location", value: gameData.location },
            { name: "Spy", value: `<@${gameData.spy.id}>`, inline: true }
        ])
        .setTimestamp(Date.now())
        .setFooter(`Spy Game By Nino`, "https://cdn.discordapp.com/attachments/878123202621108264/901836949084590100/unknown.png") // TODO | Change Icon URL to later be provided from Discord User

    const spyLogo = new MessageAttachment("./assets/Images/yellowLogo.png");
    
    if (winningMethod === "spyGuess") {
        if (winningTeam === "Spy") {
            return {
                embed: msgEmbed
                    .setTitle("SPY VICTORIOUS\nThe Spy will have a chicken dinner")
                    .setDescription("The Spy guessed the location correctly\nType `/begin` or press the button below to start the next round")
                    .setThumbnail(gameData.spy.displayAvatarURL())
                    .addField("Spy Guess", gameData.spyGuess ?? "Not Provided", true)
            }
        }
        else {
            return {
                embed: msgEmbed
                    .setTitle("THE INNOCENTS VICTORIOUS\nThe Spy is now in horny jail")
                    .setDescription("The Spy guessed the location incorrectly\nType `/begin` or press the button below to start the next round")
                    .setThumbnail("attachment://yellowLogo.png")
                    .addField("Spy Guess", gameData.spyGuess ?? "Not Provided", true),
                files: spyLogo
            }
        }
    }
    else {
        if (winningTeam === "Spy") {
            return {
                embed: msgEmbed
                    .setTitle("SPY VICTORIOUS\nThe Spy will have a chicken dinner")
                    .setDescription("You just voted out an innocent player!\nType `/begin` or press the button below to start the next round")
                    .setThumbnail(gameData.spy.displayAvatarURL()),
            }
        }
        else if (winningTeam === "The Innocents") {
            return {
                embed: msgEmbed
                    .setTitle("THE INNOCENTS VICTORIOUS\nThe Spy is now in horny jail")
                    .setDescription("You have voted out the spy!\nType `/begin` or press the button below to start the next round")
                    .setThumbnail("attachment://yellowLogo.png"),
                files: spyLogo
            }
        }
        else {
            return {
                embed: msgEmbed
                    .setTitle("ITS A DRAW!\nSuch indecisive players!")
                    .setThumbnail("attachment://yellowLogo.png"),
                files: spyLogo
            }
        }
    }
}