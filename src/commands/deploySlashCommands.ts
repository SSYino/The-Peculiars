import { SlashCommandBuilder } from "@discordjs/builders";

export default async (msg: any, client: any): Promise<void> => {
    const clientApp = await client.application.fetch(client.application.id);

    if (msg.author.id !== clientApp.owner.id) return;

    await client.guilds.cache.get(msg.guild.id)?.commands.set([
        new SlashCommandBuilder()
            .setName("start")
            .setDescription("Start the spy game \"The Peculiars\"")
            .setDefaultPermission(true),

        new SlashCommandBuilder()
            .setName("begin")
            .setDescription("Begin playing the \"The Peculiars\"")
            .setDefaultPermission(false),

        new SlashCommandBuilder()
            .setName("end")
            .setDescription("End the spy game \"The Peculiars\"")
            .setDefaultPermission(false)
    ]);
    await msg.reply("🥷 | Deployed");
}