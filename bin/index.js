#!/usr/bin/env node

const fs = require('fs');
const CLIParams = require('../lib/index');

let argInArr = process.argv.slice(2);
let cliParams = new CLIParams(argInArr);
let options = cliParams.parsFromCLI();
console.log(options);

let fileNamesArr = options.in instanceof Object ? options.in : readCurrentDir(options.in);
let filesRanged = checkForMain(fileNamesArr.slice());
console.log('afterReAr', filesRanged);

function reArrange(arr, from, to) {
  let data = arr[from];
  arr.splice(from, 1);
  arr.splice(to, 0, data);
  return arr;
}

function checkForMain(arr) {
  if(options.in instanceof Object) {
    return arr;
  } else {
    let fileNameLength = arr.map(item => item.length);
    let iOfMinLength = fileNameLength.indexOf(Math.min(...fileNameLength));
    return reArrange(arr, iOfMinLength, 0);    
  }
}

function readCurrentDir(template) {
  let regExp = new RegExp(template, 'g');
  return fs.readdirSync('./').filter(fileName => fileName.match(regExp));
}

function readF(name) {
  return new Promise((res, rej) => {
    fs.readFile(name, 'utf8', (err, data) => {
      if(err) rej('error in read!!!', err);
      res(data);
    })
  })
}

let promiseFilesArr = filesRanged.map(file => readF(file));

Promise.all(promiseFilesArr)
  .then(data => {
    if(data.length === 0) {
      throw new Error('*** files not found!'); 
    }
    data.forEach((val,i) => {
      console.log(i, val.length);  
      let svg = transformSvg(data);
      let outFileName = options.out || `storey-${filesRanged[0]}`;
      
      
      fs.writeFileSync(outFileName, svg);

  })})
  .catch(err => console.log(err.message)
  )

  function transformSvg(filesdata) {
    let combineSvg;
    let regExpDef = /<\/defs>[\t| |\n|\r|\s]*/;
    let regExpEmptyGroups = /<g.*?>[\t| |\n|\r]*<\/g>[\t| |\n|\r|\s]*/g;    
    let title = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${options.viewBox}"> \n`;
    
    filesdata.forEach((svg, i) => {
    
        if(i === 0) {        
          svg = svg.replace(/<\/svg>[\t| |\n|\r|\s]*/, "");
  
          if(svg.search(regExpDef)>-1) {
              svg = svg.replace(regExpDef, `</defs>\n<g id = 'wrapper' transform = '${options.transform}'> \n`);
              svg = svg.replace(/<svg.*?>[\t| |\n|\r|\s]*/gs, `${title} \n`);
          } else {
              svg = svg.replace(/<svg.*?>[\t| |\n|\r|\s]*/gs, `${title}\r<g id = 'wrapper' transform = '${options.transform}'>\n`);
          }
          combineSvg = svg;
        } else {
          //let gName = options.gName ? options.gName[i-1]: defaultParams.gName[i-1];
          svg = svg.replace(/<svg.*?>[\t| |\n|\r|\s]*/gs, "");
          svg = svg.replace(/<\/svg>[\t| |\n|\r|\s]*/, "");
          svg = `<g class = "${options.gName[i-1]}">\n` + svg + `</g>` + `\n`;
          combineSvg += svg;   
        }            
    });
    combineSvg += `</g>\n</svg>`;    
    combineSvg = combineSvg.replace(regExpEmptyGroups, '');
    combineSvg = combineSvg.replace(regExpEmptyGroups, '');
    combineSvg = combineSvg.replace(/\n[\t| |\n|\r|\s]*\n/g, ' ');
    return combineSvg;
  }


  //HOW TO RUN
//node index.js -in=4.svg,ARK_FP_Rooms_4.svg,ARK_FP_Zones_4.svg


//nodemon index.js -in=1.svg,ARK_FP_Rooms_1.svg,ARK_FP_Zones_1.svg -gName=rooms,zones -out=storey-1.svg