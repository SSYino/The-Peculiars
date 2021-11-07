import { MessageActionRow, MessageButton, MessageButtonStyleResolvable } from "discord.js"
import { GameLocations } from "../../providers/Game";

type callbackFunction = (markedOutButtonsCustomId: string[]) => void;

export default (locations: GameLocations, markOutButtonsCustomId?: string[]): MessageActionRow[] => {
    const totalLocationsSize = locations.size;
    const locationsClone = locations.clone();
    const totalActionRows = Math.ceil(totalLocationsSize / 5);
    const actionRows: MessageActionRow[] = []
    
    const parseButtonLabel = (index: string, rowNumber: number, locationName: string): string => {
        let maxLengthPerButton: number = 30;
        const number = (rowNumber - 1) * 5 + parseInt(index) + 1;
        const numberLength = number.toString().length;
        // const splitter = "    |    ";
        const splitter = "\u200b ".repeat(4);
        // console.log(splitter.length)
        // const splitter = `${"\u200b ".repeat(4)}    |    ${"\u200b ".repeat(4)}`;
        const nameLength = locationName.length;
        // const middleStringLength = numberLength + splitter.length + nameLength;
        const middleStringLength = nameLength;
        if (middleStringLength > 30) maxLengthPerButton = middleStringLength + 10;
        const trimWhiteSpace = (maxLengthPerButton - middleStringLength) / 2;

        // const finalStr = "\u200b ".repeat(Math.floor(trimWhiteSpace)) + number + "." + splitter + locationName + " \u200b".repeat(Math.ceil(trimWhiteSpace));
        const finalStr = "\u200b ".repeat(Math.floor(trimWhiteSpace)) + locationName + " \u200b".repeat(Math.ceil(trimWhiteSpace));
        // console.log(finalStr)
        return finalStr
    }

    for (let rowNum = 1; rowNum <= totalActionRows; rowNum++) {
        // console.log(rowNum)
        const locationsName: string[] = [];
        const buttonRows: MessageButton[] = [];

        locationsClone.first(5).forEach(location => {
            locationsName.push(location.name);
            locationsClone.delete(location.name);
        })

        for (const index in locationsName) {
            // console.log(index)
            const customId = `location${locationsName[index]}`;
            let buttonStyle: MessageButtonStyleResolvable = "PRIMARY";

            if (markOutButtonsCustomId?.includes(customId)) buttonStyle = "DANGER";
            
            buttonRows.push(new MessageButton()
                .setCustomId(customId)
                .setLabel(parseButtonLabel(index, rowNum, locationsName[index]))
                .setStyle(buttonStyle))
        }

        actionRows.push(new MessageActionRow().addComponents(buttonRows))
    }
    // console.log(actionRows);
    return actionRows;
}