import { MessageActionRow, MessageSelectMenu, MessageSelectOptionData } from "discord.js";
import { GameLocations } from "../../providers/Game";

export default (locations: GameLocations, disable: boolean = false): MessageActionRow => {
    const optionsArr: MessageSelectOptionData[] = []
    const makeCamelCase = (string: string) => {
        return string
            .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => index === 0 ? word.toLowerCase() : word.toUpperCase())
            .replace(/\s+/g, '');
    }
    const alphabeticallySortedLocationName = locations
        .map(location => location.name)
        .sort((a, b) => a.localeCompare(b));

    alphabeticallySortedLocationName.forEach(locationName => {
        optionsArr.push({
            label: locationName,
            value: makeCamelCase(locationName),
            emoji: "💠"
        })
    })
    return new MessageActionRow().addComponents(
        new MessageSelectMenu()
            .setCustomId("spyLocation")
            .setPlaceholder("Guess The Location Here")
            .setOptions(optionsArr)
            .setDisabled(disable)
    )
}