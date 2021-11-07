import { ApplicationCommand, Client, Collection, CommandInteraction, GuildMemberRoleManager, MessageEmbed } from "discord.js/typings/index.js";
import SlashCommandEvent from '../providers/events/SlashCommandEvent'
import inviteMessage from "../utils/messageEmbeds/invite";
import giveGameRole from "../utils/buttons/giveGameRole";
import beginGame from "./beginGame";
import endGame from "./endGame";
import updatePlayerCount from "./updatePlayerCount";
import Game from "../providers/Game";
import redirectToGameChannel from "../utils/buttons/redirectToGameChannel";

export default async (interaction: CommandInteraction, client: Client) => {
    await interaction.reply("⏳ | Loading Game | Please Be Patient") // TODO: later change this reply to be an embed
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
        t0 = Date.now()
        slashCommands = await client.guilds.cache.get(interaction.guildId!)?.commands.fetch()
        t1 = Date.now()
    }
    if (!slashCommands || slashCommands.size === 0) return interaction.editReply("Error: Unable to fetch slash commands");

    interaction.editReply(`${interaction.user.username} started the game`)

    // Send invite message to the channel
    // Send button that gives neccassary role to play the game
    const inviteBox = await interaction.channel?.send({ embeds: [inviteMessage], components: [giveGameRole("waiting")] })
    if (!inviteBox) throw "Error: Unable to send Invite Box"

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

    // Create new Game instance
    const game = new Game(interaction.guild, gameChannel);

    // Create Event Listener for "giveGameRole" Button
    function filter(i: any) {
        return (i.customId === 'gameRole')
    }
    const buttonCollector = interaction.channel?.createMessageComponentCollector({ filter, componentType: "BUTTON", dispose: true });

    buttonCollector?.on("collect", async i => {
        const memberRoles = (i.member?.roles as GuildMemberRoleManager).cache;
        // TODO: ADD EMBEDS FOR THIS MESSAGE
        if (memberRoles.find(role => role.id === playerRole.id)) return await i.reply({ ephemeral: true, content: "Click here to get redirected to the game channel", components: [redirectToGameChannel(gameChannel.guild.id, gameChannel.id)] });
        
        i.guild?.members.cache.get(i.user.id)?.roles.add(playerRole);

        // TODO: ADD EMBEDS FOR THIS MESSAGE
        i.reply({ ephemeral: true, content: "Click here to get redirected to the game channel", components: [redirectToGameChannel(gameChannel.guild.id, gameChannel.id)] })

        const inviteMessage = await inviteBox.fetch();
        const updated = await updatePlayerCount(inviteMessage.embeds[0] as MessageEmbed, inviteMessage, i);
        if (!updated) i.channel?.send("Error: Failed to update playerCount")
    })

    // Create Event Listener for game commands in the game text channel
    SlashCommandEvent.emitter.on("gameInteraction", async (event_interaction: CommandInteraction) => {
        if (event_interaction.channelId !== gameChannel.id) return event_interaction.reply("This isn't the game channel!!... baka!");

        if (event_interaction.commandName === "begin") {
            const hasGameStarted = game.getCurrentRound()
            if (hasGameStarted) return await event_interaction.reply("The game has already started")
            else game.startCurrentRound();

            const MinimumPlayersNeeded = 3;
            const currentPlayerCount = game.getPlayers()?.size
            if (currentPlayerCount && currentPlayerCount < MinimumPlayersNeeded) return event_interaction.reply(`Cannot Begin Game!\nMinimum of ${MinimumPlayersNeeded} players needed`)
            
            inviteBox.edit({ components: [giveGameRole("playing")] })
            event_interaction.reply(`${event_interaction.user.username} started the game`);

            // Start Game
            beginGame(inviteBox, event_interaction, playerRole, gameChannel)
        }
        else if (event_interaction.commandName === "end") {
            if (!slashCommands || slashCommands.size === 0) return event_interaction.reply("Error: No Slash Commands found")

            inviteBox.edit({ components: [giveGameRole("ended")] })
            event_interaction.reply(`${event_interaction.user.username} ended the game`);
            buttonCollector?.stop();

            // End Game
            await endGame(inviteBox, event_interaction, slashCommands, everyoneRole, playerRole, gameChannel)
            SlashCommandEvent.emitter.removeAllListeners();
        }
        else
            event_interaction.reply(`${event_interaction.user.username} ran **${event_interaction.commandName}**`);
    })

    console.log(`Commands Fetch Time: ${(t1 ?? 0) - (t0 ?? 0)}`)
}