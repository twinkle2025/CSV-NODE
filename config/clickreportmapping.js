'use strict'

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env')

module.exports = {
    file_id: null,
    filetype: 'csv',
    column_delimiter: ',',
    column_quotation: '"',
    header_row: 1,
    column_settings: {
        '0': {
            name: 'transaction_id',
            type: 'general',
            options: {
                default: '',
            }
        },
        '1': {
            name: 'affiliate_id',
            type: 'general',
            options: {
                default: '',
            }
        },
        '2': {
            name: 'affiliate_manager_id',
            type: 'general',
            options: {
                default: '',
            }
        },
        '3': {
            name: 'advertiser_id',
            type: 'general',
            options: {
                default: '',
            }
        },
        '4': {
            name: 'advertiser_manager_id',
            type: 'general',
            options: {
                default: '',
            }
        },
        '5': {
            name: 'offer_id',
            type: 'general',
            options: {
                default: '',
            }
        },
        '6': {
            name: 'creative_url_id',
            type: 'general',
            options: {
                default: '',
            }
        },
        '7': {
            name: 'affiliate_click_id',
            type: 'general',
            options: {
                default: '',
            }
        },
        '8': {
            name: 'affiliate_source',
            type: 'general',
            options: {
                default: '',
            }
        },
        '9': {
            name: 'affiliate_sub1',
            type: 'general',
            options: {
                default: '',
            }
        },
        '10': {
            name: 'affiliate_sub2',
            type: 'general',
            options: {
                default: '',
            }
        },
        '11': {
            name: 'affiliate_sub3',
            type: 'general',
            options: {
                default: '',
            }
        },
        '12': {
            name: 'affiliate_sub4',
            type: 'general',
            options: {
                default: '',
            }
        },
        '13': {
            name: 'affiliate_sub5',
            type: 'general',
            options: {
                default: '',
            }
        },
        '14': {
            name: 'affiliate_unique_1',
            type: 'general',
            options: {
                default: '',
            }
        },
        '15': {
            name: 'affiliate_unique_2',
            type: 'general',
            options: {
                default: '',
            }
        },
        '16': {
            name: 'affiliate_unique_3',
            type: 'general',
            options: {
                default: '',
            }
        },
        '17': {
            name: 'affiliate_unique_4',
            type: 'general',
            options: {
                default: '',
            }
        },
        '18': {
            name: 'affiliate_unique_5',
            type: 'general',
            options: {
                default: '',
            }
        },
        '19': {
            name: 'datetime',
            type: 'general',
            options: {
                default: '',
            }
        },
        '20': {
            name: 'revenue_cents',
            type: 'general',
            options: {
                default: '',
            }
        },
        '21': {
            name: 'payout_cents',
            type: 'general',
            options: {
                default: '',
            }
        },
        '22': {
            name: 'refer',
            type: 'general',
            options: {
                default: '',
            }
        },
        '23': {
            name: 'url',
            type: 'general',
            options: {
                default: '',
            }
        },
        '24': {
            name: 'pixel_refer',
            type: 'general',
            options: {
                default: '',
            }
        },
        '25': {
            name: 'ip',
            type: 'general',
            options: {
                default: '',
            }
        },
        '26': {
            name: 'user_agent',
            type: 'general',
            options: {
                default: '',
            }
        },
        '27': {
            name: 'country_code',
            type: 'general',
            options: {
                default: '',
            }
        },
        '28': {
            name: 'browser_id',
            type: 'general',
            options: {
                default: '',
            }
        },
        '29': {
            name: 'is_click_unique',
            type: 'general',
            options: {
                default: '',
            }
        },
        '30': {
            name: 'ad_campaign_id',
            type: 'general',
            options: {
                default: '',
            }
        },
        '31': {
            name: 'ad_campaign_creative_id',
            type: 'general',
            options: {
                default: '',
            }
        },
        '32': {
            name: 'offer_file_id',
            type: 'general',
            options: {
                default: '',
            }
        },
        '33': {
            name: 'status',
            type: 'general',
            options: {
                default: '',
            }
        },
        '34': {
            name: 'offer_file_size',
            type: 'general',
            options: {
                default: '',
            }
        },
        '35': {
            name: 'currency',
            type: 'general',
            options: {
                default: '',
            }
        },
        '36': {
            name: 'payout_type',
            type: 'general',
            options: {
                default: '',
            }
        },
        '37': {
            name: 'revenue_type',
            type: 'general',
            options: {
                default: '',
            }
        },
        '38': {
            name: 'device_brand',
            type: 'general',
            options: {
                default: '',
            }
        },
        '39': {
            name: 'device_model',
            type: 'general',
            options: {
                default: '',
            }
        },
        '40': {
            name: 'device_os',
            type: 'general',
            options: {
                default: '',
            }
        },
        '41': {
            name: 'device_os_version',
            type: 'general',
            options: {
                default: '',
            }
        },
        '42': {
            name: 'device_id',
            type: 'general',
            options: {
                default: '',
            }
        },
        '43': {
            name: 'device_id_md5',
            type: 'general',
            options: {
                default: '',
            }
        },
        '44': {
            name: 'device_id_sha1',
            type: 'general',
            options: {
                default: '',
            }
        },
        '45': {
            name: 'android_id',
            type: 'general',
            options: {
                default: '',
            }
        },
        '46': {
            name: 'android_id_md5',
            type: 'general',
            options: {
                default: '',
            }
        },
        '47': {
            name: 'android_id_sha1',
            type: 'general',
            options: {
                default: '',
            }
        },
        '48': {
            name: 'mac_address',
            type: 'general',
            options: {
                default: '',
            }
        },
        '49': {
            name: 'mac_address_md5',
            type: 'general',
            options: {
                default: '',
            }
        },
        '50': {
            name: 'mac_address_sha1',
            type: 'general',
            options: {
                default: '',
            }
        },
        '51': {
            name: 'odin',
            type: 'general',
            options: {
                default: '',
            }
        },
        '52': {
            name: 'open_udid',
            type: 'general',
            options: {
                default: '',
            }
        },
        '53': {
            name: 'ios_ifa',
            type: 'general',
            options: {
                default: '',
            }
        },
        '54': {
            name: 'ios_ifa_md5',
            type: 'general',
            options: {
                default: '',
            }
        },
        '55': {
            name: 'ios_ifa_sha1',
            type: 'general',
            options: {
                default: '',
            }
        },
        '56': {
            name: 'ios_ifv',
            type: 'general',
            options: {
                default: '',
            }
        },
        '57': {
            name: 'user_id',
            type: 'general',
            options: {
                default: '',
            }
        },
        '58': {
            name: 'unknown_id',
            type: 'general',
            options: {
                default: '',
            }
        },
        '59': {
            name: 'payout_group_id',
            type: 'general',
            options: {
                default: '',
            }
        },
        '60': {
            name: 'revenue_group_id',
            type: 'general',
            options: {
                default: '',
            }
        },
        '61': {
            name: 'req_connection_speed',
            type: 'general',
            options: {
                default: '',
            }
        },
        '62': {
            name: 'google_aid',
            type: 'general',
            options: {
                default: '',
            }
        },
        '63': {
            name: 'access_control_decision',
            type: 'general',
            options: {
                default: '',
            }
        },
        '64': {
            name: 'access_control_reason_code',
            type: 'general',
            options: {
                default: '',
            }
        }
    },
    tags: '',
}
