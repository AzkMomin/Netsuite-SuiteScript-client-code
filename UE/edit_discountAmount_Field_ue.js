/**
 *
 * @NScriptType ClientScript
 * @NApiVersion 2.x
 */

define([], function () {
    function pageInit(context) {
        if (context.mode == 'EDIT') {

            var billRec = context.currentRecord;

            var descAmtField = billRec.getField({ fieldId: 'discountamount' })

            log.debug(descAmtField);
            
            descAmtField.isDisabled = false;

        }
    }
    return {
        pageInit: pageInit
    }

})