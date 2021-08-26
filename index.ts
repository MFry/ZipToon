import chalk from "chalk";
import boxen from "boxen";
import yargs from "yargs";
import { exec } from "child_process";
import fs from "fs";
import { formatFileSize, size } from "./util";

// const greeting = chalk.white.bold("Hello!");

// const boxenOptions = {
//   padding: 1,
//   margin: 1,
//   borderColor: "green",
//   backgroundColor: "#555555",
// };
// const msgBox = boxen(greeting, boxenOptions);

// console.log(msgBox);

const options = yargs
  .usage("Usage: -n <name>")
  .option("name", {
    alias: "n",
    describe: "Name of the series using dashes-instead-of-spaces",
    type: "string",
    demandOption: true,
  })
  .usage("Usage: -p <path>")
  .option("path", {
    alias: "p",
    describe: "Location of the files, defaults to downloads",
    type: "string",
    demandOption: false,
  }).argv;

const name = (options as any).name;
const downloadsLocation = (options as any).p
  ? (options as any).p
  : "C:\\Users\\micha\\Downloads\\";

console.log(
  `Looking in ${downloadsLocation} for chap_[0-9]+_[0-9]+.jpg to zip for ${name}`
);

/**
 * Returns all files within the search directory that match the list of file types
 *  and follow the named pattern `chap_[chapterNumber]_[pageNumber].[fileTypes]`
 * @param searchDirectory
 * @param fileTypes
 * @returns
 */
const getAllFile = (searchDirectory: string, fileTypes = [".jpg"]) => {
  const allFiles = fs.readdirSync(searchDirectory);
  const filteredFiles = allFiles.filter((file) => {
    const regex = new RegExp(`(${fileTypes.join("|").replace(/\./g, "\\.")})$`);
    return regex.test(file);
  });
  const filteredFilesWithNamedPattern = filteredFiles.filter((file) => {
    return file.indexOf("chap_") !== -1;
  });
  return filteredFilesWithNamedPattern;
};

const groupFilesByChapter = (files: string[]) => {
  const groupedFiles = {};
  files.forEach((file) => {
    const splitFileName = file.split("_");
    const chapter = splitFileName[1];
    if (!(chapter in groupedFiles)) {
      groupedFiles[chapter] = [];
    }
    groupedFiles[chapter].push(file);
  });
  return groupedFiles;
};

const addPathToGroupedFiles = (
  groupedFiles: { [key: string]: string[] },
  path: string
) => {
  for (let key of Object.keys(groupedFiles)) {
    const all_files = groupedFiles[key];
    groupedFiles[key] = all_files.map((file) => {
      return path + file;
    });
  }
  return groupedFiles;
};

const zipFiles = (
  filesToZip: string[],
  archiveName: string,
  downloadLocation = "C:\\Users\\micha\\Downloads\\"
) => {
  exec(
    '"C:\\Program Files\\PeaZip\\res\\7z\\7z.exe"' +
      " " +
      [
        "a",
        "-tzip",
        "-mm=Deflate",
        "-mmt=on",
        "-mx3", // set to -mx9 for ultra compression
        "-mfb=32", // set to mfv=128 for ultra compression
        "-mpass=1", // set to -mpass=10 for ultra
        "-sccUTF-8",
        "-mem=AES256",
        "-bb0",
        "-bse0",
        "-bsp2",
        `"-w${downloadLocation}"`,
        `${downloadLocation}${archiveName}`,
        ...filesToZip,
      ].join(" ")
  );
};

const findAllValidChapters = (allGroupedFilesByChapter: {
  [key: string]: string[];
}): string[] => {
  const validChapters = [];
  for (let key of Object.keys(allGroupedFilesByChapter)) {
    if (allGroupedFilesByChapter[key].length > 5) {
      validChapters.push(key);
    } else {
      const files = allGroupedFilesByChapter[key];
      let totalFileSize = 0;
      files.forEach((file) => {
        const fileStats = fs.statSync(file);
        totalFileSize += fileStats.size;
      });
      const file_size = formatFileSize(totalFileSize);
      if (
        file_size.unit < size.MB ||
        (file_size.size < 5 && file_size.unit >= size.MB)
      ) {
        console.warn(
          `Chapter ${key} has fever than 5 files, but with a size ${totalFileSize} converted to ${file_size.size} and with units ${file_size.unit}`
        );
      } else {
        validChapters.push(key);
      }
    }
  }
  return validChapters;
};

const zipAllValidChapters = (
  seriesName: string,
  fileLocation = downloadsLocation
) => {
  const allGroupedFilesByChapter = addPathToGroupedFiles(
    groupFilesByChapter(getAllFile(fileLocation)),
    fileLocation
  );
  const validChapters = findAllValidChapters(allGroupedFilesByChapter);
  logChaptersZipped(validChapters);
  validChapters.forEach((chapter) => {
    zipFiles(
      allGroupedFilesByChapter[chapter],
      `${seriesName}-Chapter-${chapter}`,
      fileLocation
    );
  });
};

const logChaptersZipped = (chaptersToZip: string[]) => {
  chaptersToZip.sort();
  chaptersToZip.forEach((chapter) => {
    console.debug(`${chapter} will be zipped.`);
  });
  console.info(
    `A total of ${chaptersToZip.length} from ${chaptersToZip[0]} - ${
      chaptersToZip[chaptersToZip.length - 1]
    } will be zipped.`
  );
};

const duplicateProtection = () => {
  //check if a file name has `()` for duplicates
};

const checkQualityAveragesAndStandardDeviation = () => {};

// zipAllValidChapters("The-Justice-Of-Villainous-Woman");
zipAllValidChapters(name, downloadsLocation);
