/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define([
    'N/search', 'N/record', "N/format"
], function (search, record, format) {
    // var partnerIDs = getPartners()
    const getInputData = () => {

        var transactionSearch = search.load({
            id: 19611
        })

        return transactionSearch
    }

    const map = (context) => {
        var ZAB_RecResult = JSON.parse(context.value);
        // log.debug('ZAB_RecResult : ',ZAB_RecResult)
        var ZAB_item_rec = record.load({
            type: 'customrecordzab_subscription_item',
            id: ZAB_RecResult.id,
            isDynamic: true
        });
        var subItem = ZAB_item_rec.getValue({ fieldId: 'custrecord_nbs600_tax_code_change' });
        var sub = ZAB_item_rec.getValue({ fieldId: 'custrecordzab_si_subscription' });
        // log.debug('subItem : ',subItem)
        // log.debug('sub : ',sub)
        if (subItem == false) {
            var otherId = record.submitFields({
                type: 'customrecordzab_subscription',
                id: sub,
                values: {
                    'custrecord_nbs600_s_tax_code_change': false
                }
            });
            log.debug('otherId : ',otherId)
        }

    }



    return {
        getInputData,
        map,
        // reduce
    }

});