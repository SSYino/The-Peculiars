require("dotenv").config();
// const { PrismaClient } = require('@prisma/client')
import { Client, Intents, GuildMember } from 'discord.js';
import deploySlashCommands  from './slashCommands';
// const prisma = new PrismaClient()
const client = new Client({
    partials: ['MESSAGE', 'USER', 'GUILD_MEMBER', 'REACTION'],
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_WEBHOOKS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_INTEGRATIONS]
});

client.on('ready', async () => {
    console.log(`Bot has logged in as ${client.user!.tag}`)

    //Set Activity Status
    client.user!.setActivity('for a Spy', { type: 'WATCHING' })

    //Send Message To Channel
    // client.channels.cache.get("886996891865333811").send('Yeah fuck you Knyu');

    console.log('All Bot Commands are ready to be used')
})
client.on('messageCreate', async (message) => {
    //Test Send Message
    // if (message.content.toLowerCase() === 'shinchan') { message.channel.send("GAY!") }

    // Deployment Message
    if (message.content.toLowerCase() === `${process.env.PREFIX} deploy`) {
        await deploySlashCommands(message, client);
    }

    //Check messages for commands
    // msgCheck(message, prisma, client, player)
})

// client.on('interactionCreate', async (interaction) => {
//     // if (!interaction.isCommand() || !interaction.guildId) return;
//     // runSlash(interaction, Commands, client, player, GuildMember);
// })

// client.on('guildMemberUpdate', async (oldMember, newMember) => {
//     // //Update type is not nickname change
//     // if (oldMember.nickname === newMember.nickname) return;
//     // onNickChange(oldMember, newMember, prisma);
// })

client.on('error', () => console.warn("client error"));

client.login(process.env.DISCORD_BOT_TOKEN);