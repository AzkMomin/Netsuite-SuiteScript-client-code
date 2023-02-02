/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define([
    'N/search', 'N/record',
], function (search, record) {

    const getInputData = () => {
        //saved search which lists out the invoices where delta dollars are used
        const customrecord_loyalty_pointsSearchColId = search.createColumn({ name: 'id', sort: search.Sort.ASC });
        const customrecord_loyalty_pointsSearchColCustomer = search.createColumn({ name: 'custrecord_lp_customer' });
        const loyalty_pointsSearch = search.create({
            type: 'customrecord_loyalty_points',
            filters: [
                ['custrecord_lp_expirydate', 'after', 'today'],
            ],
            columns: [
                customrecord_loyalty_pointsSearchColId,
                customrecord_loyalty_pointsSearchColCustomer,
            ],
        });
        
        return loyalty_pointsSearch
    }

    const map = (context) => {
        var LP_RecResult = JSON.parse(context.value);
        log.debug('searchResult : ', LP_RecResult)
        log.debug('searchResult id: ', LP_RecResult.id)

        // var LP_RecId = record.submitFields({
        //     type: "customer",
        //     id: LP_RecResult.id,
        //     values: {
        //         'custitem_anc_overall_subitem_qty': overAllQty
        //     }
        // });
        // let itemRec = record.load({
        //     type: "customrecord_loyalty_points",
        //     id: LP_RecResult.id,
        //     isDynamic: true
        // })

        log.debug("Expired record LP id : ", LP_RecId)


    }

    return {
        getInputData,
        map
    }

});