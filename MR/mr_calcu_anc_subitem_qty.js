/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define([
    'N/search', 'N/record',
], function (search, record) {

    const getInputData = () => {
        //saved search which lists out the invoices where delta dollars are used
        var itemSearch = search.load({
            id: 'customsearch_update_related_quantity'
        });
        return itemSearch
    }

    const map = (context) => {
        var itemRecResult = JSON.parse(context.value);
        log.debug('searchResult : ', itemRecResult)
        log.debug('searchResult id: ', itemRecResult.id)

        let itemRec = record.load({
            type: itemRecResult.recordType,
            id: itemRecResult.id,
            isDynamic: true
        })

        let totalQtyOnHand = itemRec.getValue({ fieldId: "custitem_anc_total_quantity_on_hand" });
        let RawQty = itemRec.getValue({ fieldId: "custitem_raw_qty_on_hand" });
       

        if(totalQtyOnHand == ""){
            totalQtyOnHand = 0
        }
        if(RawQty == ""){
            RawQty = 0
        }

        log.debug("totalQtyOnHand : ", totalQtyOnHand)
        log.debug("RawQty : ", RawQty)

        let overAllQty = parseInt(totalQtyOnHand) + parseInt(RawQty)
        log.debug("overAllQty : ", overAllQty)

        var itemID = record.submitFields({
            type: itemRecResult.recordType,
            id: itemRecResult.id,
            values: {
                'custitem_anc_overall_subitem_qty': overAllQty
            }
        });

        log.debug("itemID : ", itemID)


    }

    return {
        getInputData,
        map
    }

});