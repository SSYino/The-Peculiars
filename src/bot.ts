require("dotenv").config();
// const { PrismaClient } = require('@prisma/client')
import { Client, Intents } from 'discord.js';
import runCommands from './runCommands';
import SlashCommandEvent from './providers/events/SlashCommandEvent'
import temp from './utils/temp';

// const prisma = new PrismaClient()
const client = new Client({
    partials: ['MESSAGE', 'USER', 'GUILD_MEMBER', 'REACTION'],
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_WEBHOOKS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_INTEGRATIONS]
});

client.on('ready', async () => {
    console.log(`Bot has logged in as ${client.user!.tag}`)

    // Set Activity Status
    client.user!.setActivity('for a Spy', { type: 'WATCHING' })

    // Check gameOptions.json
    // gameOptionsCheck()

    // Send Message To Channel
    // client.channels.cache.get("886996891865333811").send('Yeah fuck you Knyu');

    console.log('All Bot Commands are ready to be used')
})
client.on('messageCreate', async (message) => {
    //Test Send Message
    // if (message.content.toLowerCase() === 'shinchan') { message.channel.send("GAY!") }

    // Deployment Message
    if (message.content.toLowerCase() === `${process.env.PREFIX} deploy`) {
        await runCommands.deploySlashCommands(message, client);
    }
    else if (message.content.toLowerCase() === `${process.env.PREFIX} remove`) {
        await runCommands.removeSlashCommands(message, client);
    }
    else if (message.content.toLowerCase() === `${process.env.PREFIX} redeploy`) {
        await runCommands.removeSlashCommands(message, client);
        await runCommands.deploySlashCommands(message, client);
    }
    else if (message.content.toLowerCase() === "sfix") {
        // temp func to avoid getting limited daily by doing redeploy
        await temp(message, client);
    }
})

client.on('interactionCreate', (interaction) => {
    if (!interaction.isCommand() || !interaction.guildId) return;
    
    if (['begin', 'end'].includes(interaction.commandName)) {
        SlashCommandEvent.emitter.emit("gameInteraction", interaction);
        return;
    }

    runCommands.commandInteractions(interaction, client);
})

client.on('error', () => console.warn("client error"));

client.login(process.env.DISCORD_BOT_TOKEN);