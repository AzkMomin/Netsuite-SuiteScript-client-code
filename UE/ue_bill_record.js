/**
 * @NScriptName Set discount amount based on amount
 * @NScriptType UserEventScript
 * @NApiVersion 2.x
 */

 define(['N/record', ], function (record) {

    return {
        beforeSubmit: function (context) {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var newRecord = context.newRecord;
                
                var vendorId = newRecord.getValue({ 'fieldId': 'entity' });
           
                var itemLineCount = newRecord.getLineCount({ sublistId: 'item' });                

                var totalAmount = 0

                for (var i = 0; i < itemLineCount; i++) {
                    var item = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line : i
                    })
                    log.debug('itemId : ' + item)
                    if (item != 491) {
                        var itemAmt = newRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                          	line : i
                        })

                        totalAmount += itemAmt

                    }

                }
                log.debug('Total Amt : ' + totalAmount)

                var vendorRecord = record.load({
                    type: 'vendor',
                    id: vendorId
                })
                var termId = vendorRecord.getValue({ 'fieldId': 'terms' });
                
                var termRecord = record.load({
                    type: 'term',
                    id: termId
                })
                
                var discountpercent = termRecord.getValue({ 'fieldId': 'discountpercent' });
                var discountAmt = (discountpercent/100) * totalAmount
                
                newRecord.setValue({
                  fieldId : 'discountamount',
                  value : discountAmt
                })
                
    
            }

        }
    }


})