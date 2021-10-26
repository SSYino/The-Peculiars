export default async (msg: any, client: any): Promise<void> => {
    const clientApp = await client.application.fetch(client.application.id);

    if (msg.author.id !== clientApp.owner.id) return;

    await client.guilds.cache.get(msg.guild.id)?.commands.set([]);
    await msg.reply("💣 | Removed");
}