import { MessageEmbed } from "discord.js";

export default (state: ("waiting" | "started"), currentPlayers?: number, maxPlayers?: number): MessageEmbed => {
    if (state === "waiting") return new MessageEmbed()
        .setColor("BLUE")
        .setTitle("Press button when ready")
        .setDescription("Everyone needs to be ready before game can start")
        .setThumbnail("https://cdn.discordapp.com/attachments/878123202621108264/901837559020277781/unknown.png")
        .setFields([
            { name: "**Ready**", value: `${currentPlayers} / ${maxPlayers}` }
        ])
        .setTimestamp()
        .setFooter(`Spy Game By Nino`, "https://cdn.discordapp.com/attachments/878123202621108264/901836949084590100/unknown.png") // TODO | Change Icon URL to later be provided from Discord User
    else return new MessageEmbed()
        .setColor("BLUE")
        .setTitle("Recruit Greets You")
        .setAuthor("NotFakeRainbowSixSiege", "https://cdn.discordapp.com/attachments/878123202621108264/903638713282732052/b4d710c6bc6c9009e8b88d9e2326ddec.png")
        .setImage("https://cdn.discordapp.com/attachments/878123202621108264/903639304927051786/unknown.png")
        .setTimestamp(Date.now())
        .setFooter(`Spy Game By Nino`, "https://cdn.discordapp.com/attachments/878123202621108264/901836949084590100/unknown.png") // TODO | Change Icon URL to later be provided from Discord User
}