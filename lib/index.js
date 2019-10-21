class CLIParams {
    defaultParams = {
        in: '.svg',
        viewBox: '0 -85 90 90',
        transform: 'rotate(28), scale(1, -1)',
        gName: ['rooms', 'zones'],
        main: 'shortest'        
    };

    constructor(cliParamsArr) {
        this.rawParams = cliParamsArr;
    }

    parsFromCLI() {
        let options = {};
        this.rawParams.forEach(item => {
            let pairs = item.split('=');
            
            let key = pairs[0].slice(1);
            let value = pairs[1];
        
            let analizeValue = this.analizeParams(key, value);
            options[key] = analizeValue;    
        });
        return this.addDefaults(options);
    }
    analizeParams(key, value) {
        let splitedValue;
        switch(key) {
            case 'in':
                splitedValue = value.split(',');
                this.defaultParams.out = `storey-${splitedValue[0]}`;
                break;
            // case 'out':
            //     splitedValue = value.split(',');
            //     break;
            case 'viewBox':
                splitedValue = value.replace(/,/g, ' ');
                break;
            case 'gName':
                splitedValue = value.split(',');
                break;
            default:
                splitedValue = value;            
        }
        return splitedValue;
    }
    addDefaults(options) {
        let defaultKeys = Object.keys(this.defaultParams);

        let optInWork = Object.assign({}, options);
        let keys = Object.keys(options);
        defaultKeys.forEach(defKey => {
            if(!keys.includes(defKey)) {
                optInWork[defKey] = this.defaultParams[defKey];
            }
        })
        return optInWork;
    }
}



module.exports = CLIParams;