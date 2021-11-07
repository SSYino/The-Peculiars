import { EmbedFieldData, MessageEmbed } from "discord.js";
import { GameLocations } from "../../providers/Game";

export default (locations: GameLocations): MessageEmbed => {
    let locationFields: EmbedFieldData[] = [];
    let locationNumber = 1;

    for (const location of locations) {
        locationFields.push({ name: `${locationNumber}.   ${location[0]}`, value: "=".repeat(14), inline: true })
        locationNumber++
    }

    return new MessageEmbed()
        .setColor("BLUE")
        .setTitle("GAME LOCATIONS")
        // .setDescription("Choose which location to mark out")
        .setThumbnail("https://cdn.discordapp.com/attachments/878123202621108264/901837559020277781/unknown.png")
        .setFields(locationFields)
        .setFooter(`Spy Game By Nino`, "https://cdn.discordapp.com/attachments/878123202621108264/901836949084590100/unknown.png") // Change Icon URL to later be provided from Discord User
}