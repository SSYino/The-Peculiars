import { ApplicationCommand, ButtonInteraction, Client, Collection, CommandInteraction, GuildMemberRoleManager } from "discord.js";
import SlashCommandEvent from '../providers/events/SlashCommandEvent'
import inviteMessage from "../utils/messageEmbeds/invite";
import giveGameRole from "../utils/buttons/giveGameRole";
import beginGame from "./beginGame";
import endGame from "./endGame";
import updatePlayerCount from "./updatePlayerCount";
import Game from "../providers/Game";
import redirectToGameChannel from "../utils/buttons/redirectToGameChannel";
import EventEmitter from "events";

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
    const inviteBox = await interaction.channel?.send({ embeds: [inviteMessage()], components: [giveGameRole("waiting")] })
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
    const game = new Game(interaction.guild, gameChannel, playerRole, inviteBox);

    // Create Event Listener for "giveGameRole" Button
    function filter(i: any) {
        return (i.customId === 'gameRole')
    }
    const buttonCollector = interaction.channel?.createMessageComponentCollector({ filter, componentType: "BUTTON" });

    let Lock = new EventEmitter();
    let updatingPlayerCount = false;

    buttonCollector?.on("collect", async i => {
        const memberRoles = (i.member?.roles as GuildMemberRoleManager).cache;
        // TODO: ADD EMBEDS FOR THIS MESSAGE
        if (memberRoles.find(role => role.id === playerRole.id)) return await i.reply({ ephemeral: true, content: "Click here to get redirected to the game channel", components: [redirectToGameChannel(gameChannel.guild.id, gameChannel.id)] });

        i.guild?.members.cache.get(i.user.id)?.roles.add(playerRole);

        // TODO: ADD EMBEDS FOR THIS MESSAGE
        i.reply({ ephemeral: true, content: "Click here to get redirected to the game channel", components: [redirectToGameChannel(gameChannel.guild.id, gameChannel.id)] })

        if (updatingPlayerCount) await new Promise(res => Lock.once("unlocked", res))

        updatingPlayerCount = true
        const updated = await updatePlayerCount(inviteBox, i);
        if (!updated) i.channel?.send("Error: Failed to update playerCount")
        updatingPlayerCount = false
        Lock.emit("unlocked");
    })

    // Create Event Listener for game commands in the game text channel
    SlashCommandEvent.emitter.on("gameInteraction", async (event_interaction: CommandInteraction | ButtonInteraction) => {
        if (event_interaction.channelId !== gameChannel.id) return event_interaction.reply("This isn't the game channel!!... baka!");

        const begin = async (interactionMethod: "SlashCommand" | "Button") => {
            const hasGameStarted = game.getCurrentRound()
            if (hasGameStarted) {
                if (interactionMethod === "SlashCommand") {
                    return event_interaction.reply("The game has already started")
                }
                else return event_interaction.followUp("The game has already started")
            }

            const MinimumPlayersNeeded = 3;
            const currentPlayerCount = game.getPlayers()?.size;
            if (currentPlayerCount && currentPlayerCount < MinimumPlayersNeeded) {
                if (interactionMethod === "SlashCommand") {
                    return event_interaction.reply(`Cannot Begin Game!\nMinimum of ${MinimumPlayersNeeded} players needed`)
                }
                else return event_interaction.followUp(`Cannot Begin Game!\nMinimum of ${MinimumPlayersNeeded} players needed`)
            }

            game.startCurrentRound();

            inviteBox.edit({ components: [giveGameRole("playing")] })
            if (interactionMethod === "SlashCommand") {
                event_interaction.reply(`${event_interaction.user.username} started the game`);
            }
            else event_interaction.followUp(`${event_interaction.user.username} started the game`);

            // Start Game
            beginGame(inviteBox, event_interaction, playerRole, gameChannel)
        }
        const end = async (interactionMethod: "SlashCommand" | "Button") => {
            if (!slashCommands || slashCommands.size === 0) return event_interaction.reply("Error: No Slash Commands found")

            inviteBox.edit({ components: [giveGameRole("ended")] })
            buttonCollector?.stop();

            if (interactionMethod === "SlashCommand") {
                event_interaction.reply(`${event_interaction.user.username} ended the game`);
            }
            else event_interaction.followUp(`${event_interaction.user.username} ended the game`);

            // End Game
            await endGame(inviteBox, event_interaction, slashCommands, everyoneRole, playerRole, gameChannel)
            SlashCommandEvent.emitter.removeAllListeners();
            Lock.removeAllListeners()
        }


        if (event_interaction.isCommand()) {
            if (event_interaction.commandName === "begin") begin("SlashCommand");
            else if (event_interaction.commandName === "end") end("SlashCommand");
            else event_interaction.reply(`${event_interaction.user.username} ran **${event_interaction.commandName}**`);
        }
        else if (event_interaction.isButton()) {
            if (event_interaction.customId === "startNewRound") begin("Button");
            else if (event_interaction.customId === "endGame") end("Button")
        }
    })

    console.log(`Commands Fetch Time: ${(t1 ?? 0) - (t0 ?? 0)}`)
}