module.exports = async (msg, client) => {
    const clientApp = await client.application.fetch(client.application.id);

    if (msg.author.id !== clientApp.owner.id) return;

    await client.guilds.cache.get(msg.guild.id)?.commands.set([
        {
            name: 'start',
            description: 'Starts the spy game "The Peculiars"',
        },
        {
            name: 'end',
            description: 'Ends the spy game "The Peculiars"'
        }
        
    ]);
    await msg.reply('Deployed!');
}