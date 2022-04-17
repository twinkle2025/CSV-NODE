const { hooks } = require('@adonisjs/ignitor')

hooks.after.providersRegistered(() => {
    const Response = use('Adonis/Src/Response')
    Response.macro('api', function (status, body, errors) {
        let pstatus;
        if (status < 300) {
            pstatus = 'SUCCESS';
        }
        else if (status < 400) {
            pstatus = 'REDIRECT';
        }
        else {
            pstatus = 'FAILURE';
        }
        const payload = {
            status: pstatus,
            code: status,
            errors: errors
        };
        if ('undefined' !== typeof(body) && null !== body) {
            payload.body = body;
        }
        this.status(status);
        this.json(payload);
    });

    Response.macro('datatable', function (status, draw, body, recordsTotal, recordsFiltered, errors) {
        let pstatus;
        if (status < 300) {
            pstatus = 'SUCCESS';
        }
        else if (status < 400) {
            pstatus = 'REDIRECT';
        }
        else {
            pstatus = 'FAILURE';
        }
        const payload = {
            status: pstatus,
            recordsTotal: parseInt(recordsTotal),
            recordsFiltered: parseInt(recordsTotal),
            draw,
            code: status,
            errors: errors
        };
        if ('undefined' !== typeof(body) && null !== body) {
            payload.data = body;
        }
        this.status(status);
        this.json(payload);
    });

    const Validator = use('Validator')
    const Database = use('Database')
    const existsFn = async (data, field, message, args, get) => {
        const value = get(data, field)
        if (!value) {
          return;
        }
        const [table, column] = args;
        const row = await Database.table(table).where(column, value).first()
        if (!row) {
          throw message;
        }
    }
    Validator.extend('exists', existsFn)

    const isValidCountryFn = async (data, field, message, args, get) => {
        const {countries} = require('countries-list');
        const value = get(data, field)
        if (!value) {
          return;
        }
        const country = countries[value.toUpperCase()];
        if ('undefined' === typeof(country) || 'object' !== typeof(country)) {
            throw message;
        }
    }
    Validator.extend('country', isValidCountryFn)

    const isValidPhoneForCountryFn = async (data, field, message, args, get) => {
        const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
        const value = get(data, field)
        if (!value) {
          return;
        }
        const [countryField] = args;
        const country = get(data, countryField);
        if (!country || 'object' === typeof(country)) {
            throw message;
        }
        const number = phoneUtil.parseAndKeepRawInput(value, country);
        const valid = phoneUtil.isValidNumber(number);
        if (!valid) {
            throw message;
        }
    }
    Validator.extend('phonematchescountry', isValidPhoneForCountryFn);

    Validator.sanitizor.phoneNumber = function(value) {
        const importer = use('importer');
        const info = importer._getPhoneInfoWithoutIso(value);
        if (info.valid) {
            const validinfo = importer._getPhoneWithIsoInfo(value, info.iso);
            return validinfo.value;
        } else {
            if (0 == info.value.substring(0, 1)) {
                return info.value.substring(1);
            }
            return info.value;
        }
    }

    const edge = require('edge.js')

    const getMixAssetUrl = (asset) => {
        const manifest = require('../public/assets/mix-manifest.json');
        const lastSlash = asset.lastIndexOf('/');
        if (-1 === lastSlash) {
            return asset;
        }
        const manifestName = asset.substring(lastSlash);
        const manifestPath = asset.substring(0, lastSlash);
        const path = manifest[manifestName];
        if ('undefined' !== typeof(path)) {
            return `${manifestPath}${path}`;
        }
        return asset;
    }

    edge.global('mix', function (asset) {
        return getMixAssetUrl(asset);
    });
    edge.global('mixStyle', function (asset) {
        return this.safe(`<link rel="stylesheet" href="${getMixAssetUrl(`${asset}.css`)}" />`);
    });
    edge.global('mixScript', function (asset) {
        return this.safe(`<script type="text/javascript" src="${getMixAssetUrl(`${asset}.js`)}"></script>`);
    });
    edge.global('newrelic', function () {
        const newrelic = require('newrelic');
        return this.safe(newrelic.getBrowserTimingHeader());
    });
    edge.global('version', function () {
        const Helpers = use('Helpers');
        const versionPath = Helpers.appRoot('version.txt');
        const Config = use('Config');
        const fs = require('fs')
        try {
            if (fs.existsSync(versionPath)) {
                const version = fs.readFileSync(versionPath,'utf8');
                return `Official ${Config.get('app.name')} Build ${version}`;
            }
        } catch (error) {
            // do nothing. we're assuming that there's nothing to show    
        }
        return "No Build Version";
    });
});

hooks.after.httpServer( () => {
    require('../app/Controllers/Ws/socket.io');
    require('../app/Services/dashboard-data');
    require('../app/Services/queue');

    const supressionLists = require('../app/Services/supression-lists');
    setInterval(async () => {
        const res = await supressionLists.storeListsToRedis();
    }, 5000);
});