/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define([
    'N/search', 'N/record', "N/format"
], function (search, record, format) {

    const getInputData = () => {
        var transactionSearch = search.load({
            id: 2996
        })
        return transactionSearch
    }

    const map = (context) => {
        var comm_RecResult = JSON.parse(context.value);
        // log.debug('searchResult : ', comm_RecResult);
        const partnerId = comm_RecResult.values["GROUP(custrecord_amz_dfs_com_partner)"].value;
        const total_comm = Number(comm_RecResult.values["SUM(custrecord_amz_monthly_commission)"]);
        log.debug('partnerId : ', partnerId);
        log.debug('total_comm : ', total_comm);
        var otherId = record.submitFields({
            type: 'partner',
            id: partnerId,
            values: {
                'custentity_lsk_totalcommonemployee': total_comm
            }
        });
    }




    return {
        getInputData,
        map,
        // reduce
    }

});