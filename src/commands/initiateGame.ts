import { ApplicationCommand, Client, Collection, CommandInteraction, MessageEmbed } from "discord.js/typings/index.js";
import SlashCommandEvent from '../providers/events/SlashCommandEvent'
import inviteMessage from "../utils/messageEmbeds/invite";
import giveGameRole from "../utils/buttons/giveGameRole";
import beginGame from "./beginGame";
import endGame from "./endGame";
import updatePlayerCount from "./updatePlayerCount";
import fs from "fs";
import temp from "../utils/temp";

export default async (interaction: CommandInteraction, client: Client) => {
    const reply = await interaction.deferReply({ fetchReply: true })
    const clientId = process.env.CLIENT_UUID;
    if (!clientId) return interaction.editReply("Error: Unable to find clientId")

    // Create custom Role for players
    const playerRole = await interaction.guild?.roles.create({
        name: "Peculiar Player",
        color: "BLURPLE",
    })
    if (!playerRole) return interaction.editReply("Error: Unable to create role");

    const everyoneRole = interaction.guild?.roles.everyone
    if (!everyoneRole) return interaction.editReply("Error: Failed to retrieve @everyone role from cache")

    // Create new Text Channel
    const gameChannel = await interaction.guild?.channels.create("the-peculiars", {
        topic: "Find the spy! 🔎", type: "GUILD_TEXT", permissionOverwrites: [
            {
                type: "role",
                id: playerRole.id,
                allow: ["READ_MESSAGE_HISTORY", "SEND_MESSAGES", "USE_APPLICATION_COMMANDS", "VIEW_CHANNEL"],
            },
            {
                type: "role",
                id: everyoneRole.id,
                deny: ["VIEW_CHANNEL"]
            },
            {
                type: "member",
                id: clientId,
                allow: ["READ_MESSAGE_HISTORY", "SEND_MESSAGES", "USE_APPLICATION_COMMANDS", "VIEW_CHANNEL", "EMBED_LINKS", "ATTACH_FILES", "MANAGE_MESSAGES", "MENTION_EVERYONE", "MANAGE_EMOJIS_AND_STICKERS"]
            }
        ]
    })
    if (!gameChannel) return interaction.editReply("Error: Unable to create game text channel")

    // Retrieve commmands
    let slashCommands: Collection<string, ApplicationCommand> | undefined = interaction.guild?.commands.cache;
    let t0, t1;
    if (!slashCommands || slashCommands.size === 0) {
        // TODO: later change this reply to be an embed
        interaction.editReply(" ⏳ | Loading Game | Please Be Patient")
        t0 = Date.now()
        slashCommands = await client.guilds.cache.get(interaction.guildId!)?.commands.fetch()
        t1 = Date.now()
    }
    if (!slashCommands || slashCommands.size === 0) return interaction.editReply("Error: Unable to fetch slash commands");

    // Send invite message to the channel
    // Send button that gives neccassary role to play the game
    await interaction.editReply({ content: "\n", embeds: [inviteMessage], components: [giveGameRole("waiting")] })

    // Manage Slash Commands Permissions
    for (const command of slashCommands) {
        if (command[1].name === 'start') {
            slashCommands
                .get(command[1].id)
                ?.permissions
                .set({
                    permissions: [
                        {
                            id: everyoneRole.id,
                            type: "ROLE",
                            permission: false
                        }
                    ]
                })
        }
        else if (command[1].name === 'begin' || command[1].name === 'end') {
            slashCommands
                .get(command[1].id)
                ?.permissions
                .set({
                    permissions: [
                        {
                            id: playerRole.id,
                            type: "ROLE",
                            permission: true
                        }
                    ]
                })
        }
    }

    // Create Event Listener for "giveGameRole" Button
    function filter(i: any) {
        return (i.customId === 'gameRole')
    }
    const buttonCollector = interaction.channel?.createMessageComponentCollector({ filter, componentType: "BUTTON", dispose: true });

    buttonCollector?.on("collect", async i => {
        const tempDb = await JSON.parse((fs.readFileSync(`${process.cwd()}/src/providers/gamePlayers.json`) as unknown) as string);
        if (tempDb.includes(i.user.id)) return i.reply({ephemeral: true, content: `You are already a player\nGame Channel --> <#${gameChannel.id}>`});
        i.guild?.members.cache.get(i.user.id)?.roles.add(playerRole);

        // TODO: ADD EMBEDS FOR THIS MESSAGE
        i.reply({ ephemeral: true, content: `Click Here --> <#${gameChannel.id}> to move to the game text channel` })
        
        const updated = await updatePlayerCount(reply.embeds[0] as MessageEmbed, interaction);
        if (!updated) i.channel?.send("Error: Failed to update playerCount")

        tempDb.push(i.user.id)
        fs.writeFile(`${process.cwd()}/src/providers/gamePlayers.json`, JSON.stringify(tempDb, null, 2), () => {})
    })

    // Create Event Listener for game commands in the game text channel
    SlashCommandEvent.emitter.on("gameInteraction", async (event_interaction: CommandInteraction) => {
        if (event_interaction.channelId !== gameChannel.id) return event_interaction.reply("This isn't the game channel!!... baka!");

        if (event_interaction.commandName === "begin") {
            interaction.editReply({ components: [giveGameRole("playing")] })
            event_interaction.reply(`${event_interaction.user.username} started the game`);

            // Start Game
            beginGame()
        }
        else if (event_interaction.commandName === "end") {
            if (!slashCommands || slashCommands.size === 0) return event_interaction.reply("Error: No Slash Commands found")

            interaction.editReply({ components: [giveGameRole("ended")] })
            event_interaction.reply(`${event_interaction.user.username} ended the game`);

            // End Game
            await endGame(interaction, event_interaction, SlashCommandEvent.emitter, slashCommands, everyoneRole, playerRole, gameChannel, buttonCollector)
        }
        else
            event_interaction.reply(`${event_interaction.user.username} ran **${event_interaction.commandName}**`);
    })

    console.log(`Commands Fetch Time: ${(t1 ?? 0) - (t0 ?? 0)}`)
}