import { Client, Message } from "discord.js/typings/index.js";

export default async (message: Message, client: Client) => {
    let slashCommands = message.guild?.commands.cache;
    let t0, t1;
    if (!slashCommands || slashCommands.size === 0) {
        t0 = Date.now();
        slashCommands = await client.guilds.cache.get(message.guildId!)!.commands.fetch();
        t1 = Date.now();
    }

    if (!slashCommands || slashCommands.size === 0) return message.reply("Error: Unable to fetch slash commands");

    const everyoneRole = message.guild?.roles.cache.filter(role => role.name === '@everyone').last();
    if (!everyoneRole) return message.reply("Error: Failed to retrieve @everyone role from cache");

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
                            permission: true
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
                            id: everyoneRole.id,
                            type: "ROLE",
                            permission: false
                        }
                    ]
                })
        }
    }

    message.reply(" 🛠️ | Fixed")
    console.log(`Commands Fetch Time: ${(t1 ?? 0) - (t0 ?? 0)}`)
}