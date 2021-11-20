import { EmbedFieldData, Guild, MessageEmbed } from "discord.js"

export default (nominees: { displayName: string, userID: string, voters: string[] }[], guild: Guild) => {
    const fields: EmbedFieldData[] = [];
    let nominated: { name: string, value: string, inline: boolean }[] | null = null;

    for (const user of nominees) {
        const fieldData = { name: `${user.displayName}`, value: `${user.voters.length}`, inline: true };
        fields.push(fieldData)
        if (nominated === null) nominated = [fieldData];
        else if (nominated[0].value < fieldData.value) nominated = [fieldData];
        else if (nominated[0].value === fieldData.value) nominated.push(fieldData);
    }

    const nominatedUsername = nominated![0].name;
    const nominatedUserID = nominees.find(obj => obj.displayName === nominatedUsername)!.userID
    const nominatedGuildMember = guild.members.cache.get(nominatedUserID)
    if (!nominatedGuildMember) throw "Error: Could not find member in guild cache";
    const embed = new MessageEmbed()
        .setColor("BLURPLE")
        .setTitle("POLL RESULTS")
        .setFields(fields)
        .setImage(nominatedGuildMember.displayAvatarURL({ dynamic: true, size: 1024 }))
        .setTimestamp(Date.now())
        .setFooter(`Spy Game By Nino`, "https://cdn.discordapp.com/attachments/878123202621108264/901836949084590100/unknown.png") // TODO | Change Icon URL to later be provided from Discord User

    if (nominated!.length === 1) {
        return { embed: embed.addField("**MOST VOTES**", `${nominatedUsername}`, false), nominated: { num: 1, userID: [nominatedUserID] } };
    }
    else if (nominated!.length > 1) {
        const nominatedUsernames = nominated!.map(obj => obj.name)
        const nominatedUserIDs = nominees.map(obj => {
            if (nominatedUsernames.includes(obj.displayName)) return obj.userID
        }) as string[]
        const newEmbed = embed
            .addField("**MOST VOTES**", `${nominatedUsernames.join(" & ")}`, false)
            .setImage("https://cdn.discordapp.com/attachments/878123202621108264/901837559020277781/unknown.png")
            
        return { embed: newEmbed, nominated: { num: nominated!.length, userID: nominatedUserIDs } }
    }
    else return { embed, nominated: { num: 0, userID: null } }
}