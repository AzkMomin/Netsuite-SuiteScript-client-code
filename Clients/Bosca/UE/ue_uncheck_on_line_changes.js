/**
 *
 * @NScriptType UserEventScript
 * @NApiVersion 2.1
 */

define(['N/record'], function (record) {
    function beforeSubmit(context) {
        if (context.type == context.UserEventType.EDIT) {
            var newRecord = context.newRecord;
            var oldRecord = context.oldRecord;

            var newSalesOrderLineCount = newRecord.getLineCount({
                sublistId: 'item',
            })

            var onlinePriceIndex = newRecord.findSublistLineWithValue({
                sublistId: 'item',
                fieldId: 'price_display',
                value: "Online Price"
            });
            
            log.debug("onlinePriceIndex : " ,onlinePriceIndex)

            if (onlinePriceIndex != -1) {
                log.debug("found online price")
                newRecord.setValue({ fieldId: "custbody_mono_line_added", value: false })
            }
            else {
                for (var i = 0; i < newSalesOrderLineCount; i++) {
                    var itemId = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i,

                    });

                    log.debug('itemId: ', itemId);
                    var monogramming = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_hb_monogramming',
                        line: i,
                    });
                    var priceLevel = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'price_display',
                        line: i,
                    });

                    if (monogramming !== "" && priceLevel == 'Online Price' && itemId != 11) {
                        var newAmount = newRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            line: i,
                        });

                        log.debug('newAmount: ', newAmount);
                        var lineIdItem = oldRecord.findSublistLineWithValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            value: itemId
                        });
                        log.debug('lineIdItem: ', lineIdItem);
                        if (lineIdItem != -1) {
                            var oldAmount = oldRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'amount',
                                line: lineIdItem,
                            });
                            log.debug('oldAmount: ', oldAmount);
                            if (newAmount != oldAmount) {
                                log.debug('Amount Is Different : ');
                                newRecord.setValue({ fieldId: "custbody_mono_line_added", value: false })
                            }
                        }
                    }

                }
            }
        }

    }
    return {

        beforeSubmit: beforeSubmit
    }


})