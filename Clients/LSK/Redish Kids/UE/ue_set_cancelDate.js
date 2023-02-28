/**
 * @NApiversion 2.1
 * @NScriptType UserEventScript
 */

define(['N/search', 'N/format'], function (search, format) {

    function beforeSubmit(context) {
        if (context.type == 'create' || context.type == 'edit') {
            var newRec = context.newRecord;
            var SOlineCount = newRec.getLineCount({ sublistId: "item" });
            // log.debug("SOlineCount : ", SOlineCount);
            for (let i = 0; i < SOlineCount; i++) {
                var cancelDateStr = newRec.getSublistValue("item", "custcolplanned_cancellation_date", i);
                // log.debug("cancleDateStr : ", cancelDateStr);
                if (cancelDateStr != "") {
                    var cancelDateArr = cancelDateStr.split("-")
                    // log.debug("cancelDateArr : ", cancelDateArr);
                    var formatedDate = + cancelDateArr[1]  + "/" + cancelDateArr[2] + "/" + cancelDateArr[0]
                    // log.debug("formatedDate : ", formatedDate);
                    var formatedDateObj = new Date(formatedDate);
                    // log.debug("formatedDateObj : ", formatedDateObj);
                    newRec.setSublistValue("item", "custcol_lsk_plancanceldate_netsuite", i, format.parse({
                        value: formatedDate,
                        type: format.Type.DATE
                    }));
                }
            }

        }
    }

    return {
        beforeSubmit: beforeSubmit,

    }
});

