import colors from  'colors'
import cheerio from 'cheerio'
import fs from 'fs'
import request from 'request'

const URL = 'https://www.rdr2mods.com/wiki/ped-search/'
const outputDir = './result'	// Output directory will be present in the project directory only

const parseWebsite = url => {
	console.log('Fetching URL...'.bold.green)
	console.log('This might take a while due to HTTP redirections. Please be patient.'.yellow);
    return new Promise((resolve, reject) => {
        request(url, {jar:true}, function(err,resp,body) {
            if (err) reject(err)
            resolve(body)
        })
    })
}

const writeFile = (fileName, data) => {
	let outputFile = outputDir + '/' + fileName
	if (fs.existsSync(outputFile)) {fs.unlinkSync(outputFile)}
	fs.writeFile(outputFile, data, (err) => {
		if (err) throw err
	})
}

parseWebsite(URL)
.then((body) => {
	console.log('Scraping data...'.cyan)

	let $ = cheerio.load(body)
	let animalPeds = []
	let humanPeds = []
	let unknownPeds = []

	$('#elCmsPageWrap > div > div.ipsBox > div:nth-child(2) > table > tbody > tr').each((index, element) => {

		let listElement = $(element).find('td')
		let pedType = $(listElement[1]).text()

		let pedName = $(listElement[0]).text()
		let pedGender = $(listElement[2]).text()
		pedGender == '' ? pedGender = 'unknown' : pedGender

		switch(pedType){
			case 'Animal':
				animalPeds.push({model:pedName, gender:pedGender})
				break
			case 'Human':
				humanPeds.push({model:pedName, gender:pedGender})
				break
			default:
				unknownPeds.push({model:pedName, gender:pedGender})
		}
	})

	let animalJsonString = JSON.stringify(animalPeds, null,2)
	let humanJsonString = JSON.stringify(humanPeds, null,2)
	let unknownJsonString = JSON.stringify(unknownPeds, null,2)
	
	if (!fs.existsSync(outputDir)){
		fs.mkdirSync(outputDir)
	}

	writeFile('animalPeds.json', animalJsonString)
	writeFile('humanPeds.json', humanJsonString)
	if(unknownPeds.length > 0){writeFile('unknownPeds.json', unknownJsonString)} else{console.log('Skipping unknownPeds.json since its empty')}
	console.log('Results have been saved at:'.bold.green, process.cwd()+'\\'+outputDir.slice(2))
	console.log('Process complete :)'.bold.green)

}).catch((e) => {
	console.error(e)
})
