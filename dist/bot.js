"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
// const { PrismaClient } = require('@prisma/client')
const discord_js_1 = require("discord.js");
// const prisma = new PrismaClient()
const client = new discord_js_1.Client({
    partials: ['MESSAGE', 'USER', 'GUILD_MEMBER', 'REACTION'],
    intents: [discord_js_1.Intents.FLAGS.GUILDS, discord_js_1.Intents.FLAGS.GUILD_MESSAGES, discord_js_1.Intents.FLAGS.GUILD_MEMBERS,
        discord_js_1.Intents.FLAGS.GUILD_WEBHOOKS, discord_js_1.Intents.FLAGS.GUILD_MESSAGE_REACTIONS, discord_js_1.Intents.FLAGS.GUILD_INTEGRATIONS]
});
client.on('ready', async () => {
    console.log(`Bot has logged in as ${client.user.tag}`);
    //Set Activity Status
    client.user.setActivity('for a Spy', { type: 'WATCHING' });
    //Send Message To Channel
    // client.channels.cache.get("886996891865333811").send('Yeah fuck you Knyu');
    console.log('All Bot Commands are ready to be used');
});
client.on('messageCreate', (message) => {
    //Test Send Message
    // if (message.content.toLowerCase() === 'shinchan') { message.channel.send("GAY!") }
    // Deployment Message
    // if (message.content)
    //Check messages for commands
    // msgCheck(message, prisma, client, player)
});
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
