#!/usr/bin/env node

const fs = require('fs');
const CLIParams = require('../lib/index');

let argInArr = process.argv.slice(2);
let cliParams = new CLIParams(argInArr);
let options = cliParams.parsFromCLI();
console.log('--options', options);

let fileNamesArr = options.in instanceof Object ? options.in : readCurrentDir(options.in);
let filesRanged = checkForMain(fileNamesArr.slice());
console.log('--afterReAr', filesRanged);

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
  return fs
            .readdirSync('./')
            .filter(fileName => fileName.match(regExp))
            .filter(filename => filename !== options.out && !filename.startsWith('storey-') && !filename.startsWith('black_'));
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
    let svg = transformSvg(data);
    let blackSvg = transformSvgBlack(svg);

    let outFileName = options.out || `storey-${filesRanged[0]}`;
    let outFileNameBlack = `black_${outFileName}`;

    fs.writeFileSync(outFileName, svg);
    fs.writeFileSync(outFileNameBlack, blackSvg);
    
    data.forEach((val,i) => {
      console.log(i, val.length);  
    })
  })
  .catch(err => console.log(err.message)
  )

  function transformSvg(filesdata) {
    let combineSvg;
    let svgTitleReg = /<svg.*?>/i;
    let closeSvgReg = /<\/svg.*?>/i;
    let wrapperG = `<g id = 'wrapper' transform = '${options.transform}'>`;
    let regExpDef = /<defs>[\t| |\n|\r|\s]*.*[\t| |\n|\r|\s]*<\/defs>/;
    let regExpEmptyGroups = /<g.*?>[\t| |\n|\r]*<\/g>[\t| |\n|\r|\s]*/g;    
    let svgTitle = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${options.viewBox}"> \n`;
    
    filesdata.forEach((svg, i) => {
      if( i === 0 ) {
        
        if(svg.search(regExpDef)>-1) {
          svg = svg.replace(/<\/defs>/, `<\/defs>\n${wrapperG}`);
          svg = svg.replace(svgTitleReg, svgTitle);
        } else {
          svg = svg.replace(svgTitleReg, `${svgTitle}\r${wrapperG}`);
        }
        svg = svg.replace(closeSvgReg, "");
        combineSvg = svg;
      } else {
        svg = svg.replace(svgTitleReg, '');
        svg = svg.replace(closeSvgReg, '');
        svg = `<g class = "${options.gName[i-1]}">` + svg + `</g>`;
        combineSvg += svg;        
      }
    });    
    combineSvg = combineSvg.replace(/>/g, '>\n');
    combineSvg += '</g></svg>';
    combineSvg = combineSvg.replace(regExpEmptyGroups, '');
    combineSvg = combineSvg.replace(regExpEmptyGroups, '');
    return combineSvg
  }

  let styleReg = /<style>[\n]*.*?<\/style>/;
  let colorToChange = options.change;
  let colorReg = new RegExp(`${colorToChange}`, 'g');  
  let color1 = 'white';
  let color2 = 'black';

  function transformSvgBlack(svg) {

    svg = svg.replace(colorReg, color1); //cls-4
    svg = svg.replace(styleReg, (match) => {
      match = match.replace(/.cls-2[ ]*?{(.*?)}/, (match2, g) => {
        console.log(match2, g);
        let arr = g.split(':');
        return `.cls-2{${arr[0]}:${color2}}`;
      })
      return match;      
    })
    return svg;
  };

   


  //HOW TO RUN
//node index.js -in=4.svg,ARK_FP_Rooms_4.svg,ARK_FP_Zones_4.svg


//nodemon index.js -in=1.svg,ARK_FP_Rooms_1.svg,ARK_FP_Zones_1.svg -gName=rooms,zones -out=storey-1.svg