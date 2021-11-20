import { MessageEmbed } from "discord.js";

export default (displayName: string, userIconURL: string, maxVoted: number | string) => new MessageEmbed()
    .setColor("BLURPLE")
    .setAuthor(displayName, userIconURL)
    .setThumbnail(userIconURL)
    .setTitle(`${displayName.toUpperCase()} CREATED A POLL`)
    .setDescription("Vote the player who you most suspect to be a spy")
    .setFields([
        {
            name: "**VOTED**",
            value: `0 / ${maxVoted}`
        }
    ])
    .setTimestamp(Date.now())
    .setFooter("Spy Game By Nino", "https://cdn.discordapp.com/attachments/878123202621108264/901836949084590100/unknown.png")