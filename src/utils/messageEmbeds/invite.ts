import { MessageEmbed } from "discord.js";

export default new MessageEmbed()
    .setColor("BLUE")
    .setTitle("PLAY THE PECULIARS")
    // .setAuthor("Anonymous", "https://cdn.discordapp.com/attachments/878123202621108264/901836949084590100/unknown.png")
    .setDescription("Click the button below to recieve a role and a link to the play area")
    .setThumbnail("https://cdn.discordapp.com/attachments/878123202621108264/901837559020277781/unknown.png")
    .addFields([
        {name: "**In Lobby**", value: "0 / 10"},
        {name: "**Round**", value: "0"},
        {name: "**Game Status**", value: "Idle"}
    ])
    // .setImage("")
    .setTimestamp()
    .setFooter(`Spy Game By Nino`, "https://cdn.discordapp.com/attachments/878123202621108264/901836949084590100/unknown.png") // Change Icon URL to later be provided from Discord User