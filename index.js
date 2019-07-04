#! /usr/bin/env node

const commander = require('commander')
const Jimp = require('jimp')
const fs = require('fs')
const fsp = require('fs').promises
const path = require('path')
const acceptedFileExts = ['.png', '.jpg', '.jpeg']

commander.version('1.0.0')
    .option('-I, --input-dir <inputDir>', 'Input directory')
    .option('-O, --output-dir <outputDir>', 'Output directory')
    .parse(process.argv)

if(!commander.inputDir || !commander.outputDir){
    console.error('no input/output dir given')
    process.exit()
}

let inputDir = commander.inputDir
let outputDir = commander.outputDir

if(!fs.existsSync(inputDir)) {
    console.error('input directory not exists')
    process.exit()
}

if(!fs.existsSync(outputDir)) {
    console.error('output directory not exists')
    process.exit()
}

async function startProcessing() {
    try{
        let stat = await fsp.lstat(inputDir)
        if(!stat.isDirectory()) {
            throw new Error('input directory is not a directory')
        }

        let files = await fsp.readdir(inputDir)
        files = files.filter((f) => {
            return acceptedFileExts.indexOf(path.extname(f)) > -1
        })

        // load fonts
        await loadFonts()

        for (let i=0; i < files.length; i++) {
            let image = await Jimp.read(path.resolve(inputDir, files[i]))
            let placeholder = await new Jimp(image.getWidth(), image.getHeight(), '#f9f9f9')
            
            let text = `${placeholder.getWidth()}x${placeholder.getHeight()}`
            let suitableFont = await getSuitableFont(text, placeholder.getWidth() - 32)
            // console.log('res font', suitableFont)
            placeholder.print(suitableFont, 0, 0, {
                text: text,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
            }, placeholder.getWidth(), placeholder.getHeight())
            await placeholder.writeAsync(path.resolve(outputDir, files[i]))
        }
    }catch(e) {
        console.error(e)
    }finally {
        process.exit()
    }
}

const fontSizes = [8, 16, 32, 64, 128]
const loadedFonts = []
async function loadFonts() {
    for(let i=1; i<fontSizes.length; i++) {
        let fontPath = path.resolve('./fonts', `FreeSans${fontSizes[i]}Gray.fnt`)
        console.log(fontPath)
        let font = await Jimp.loadFont(fontPath)
        loadedFonts.push(font)
    }
}
async function getSuitableFont(text, width) {

    let previousFont = loadedFonts[0]
    for(let i=1; i<loadedFonts.length; i++) {
        let textWidth = Jimp.measureText(loadedFonts[i], text);
        // console.log(textWidth, width)
        // break;
        if(textWidth > width) return previousFont
        previousFont = loadedFonts[i]
    }
    return previousFont
}

startProcessing()