'use strict'

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env')

module.exports = {
    test: {
        name: 'Dummy API Adapter',
        config: {
            url: 'url',
        },
        fields: {
            fname: true,
            lname: true,
            email: true,
            phone: true,
            country: true,
            source: false,
        },
        defaultMapping: {
            fname: {
                leadField: 'fname',
                leadFieldFormat: null,
                leadFieldType: 'general',
                default: null,
            },
            lname: {
                leadField: 'lname',
                leadFieldFormat: null,
                leadFieldType: 'general',
                default: null,
            },
            email: {
                leadField: 'email.value',
                leadFieldFormat: null,
                leadFieldType: 'email',
                default: null,
            },
            phone: {
                leadField: 'phone.value',
                leadFieldFormat: 'raw',
                leadFieldType: 'phone',
                default: null,
            },
            country: {
                leadField: 'country.value',
                leadFieldFormat: 'raw',
                leadFieldType: 'country',
                default: null,
            },
            source: {
                leadField: '',
                leadFieldFormat: null,
                leadFieldType: 'general',
                default: null,
            },
        },
        notices: [
            {
                type: 'info',
                message: 'This API is a dummy used for test purposes. It should not be used for a real export',
            }
        ],
        max: 100000,
    },
    atompark: {
        name: 'AtomPark Subscription',
        config: {
            url: 'url',
            fnameField: 'text',
            callback: 'text',
            hash: 'text',
        },
        fields: {
            fname: true,
            phone: true,
        },
        defaultMapping: {
            fname: {
                leadField: 'fname',
                leadFieldFormat: null,
                leadFieldType: 'general',
                default: null,
            },
            phone: {
                leadField: 'phone.value',
                leadFieldFormat: 'E164',
                leadFieldType: 'phone',
                default: null,
            },
        },
        max: 100000,
    },
    panda: {
        name: 'PandaTS Trading',
        config: {
            url: 'url',
            partner_id: 'number',
            partner_secret: 'text',
            source: 'text',
        },
        fields: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            country: true,
            leadSource: false,
            referral: false,
        },
        defaultMapping: {
            email: {
                leadField: 'email.value',
                leadFieldFormat: null,
                leadFieldType: 'email',
                default: null,
            },
            firstName: {
                leadField: 'fname',
                leadFieldFormat: null,
                leadFieldType: 'general',
                default: null,
            },
            lastName: {
                leadField: 'lname',
                leadFieldFormat: null,
                leadFieldType: 'general',
                default: null,
            },
            phone: {
                leadField: 'phone.value',
                leadFieldFormat: 'raw',
                leadFieldType: 'phone',
                default: null,
            },
            country: {
                leadField: 'phone.iso',
                leadFieldFormat: 'raw',
                leadFieldType: 'country',
                default: null,
            },
            leadSource: {
                leadField: '',
                leadFieldFormat: null,
                leadFieldType: 'general',
                default: null,
            },
            referral: {
                leadField: '',
                leadFieldFormat: null,
                leadFieldType: 'general',
                default: null,
            },
        },
        notices: [
            {
                type: 'info',
                message: 'This export will create Lead entities in the PandaTS CRM. It will NOT create clients',
            },
            {
                type: 'warning',
                message: 'Please ensure that Bastion\'s IP Address has been whitelisted in the PandaTS CRM. To obtain the IP address please contact the Bastion Administrator',
            }
        ],
        max: 100000,
    }
}
