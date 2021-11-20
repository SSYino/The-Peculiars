import { MessageActionRow, MessageSelectMenu, MessageSelectOptionData } from "discord.js";
import { GameLocations } from "../../providers/Game";

export default (locations: GameLocations, disable: boolean = false): MessageActionRow => {
    const optionsArr: MessageSelectOptionData[] = []
    const alphabeticallySortedLocationName = locations
        .map(location => location.name)
        .sort((a, b) => a.localeCompare(b));

    alphabeticallySortedLocationName.forEach(locationName => {
        optionsArr.push({
            label: locationName,
            value: locationName,
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