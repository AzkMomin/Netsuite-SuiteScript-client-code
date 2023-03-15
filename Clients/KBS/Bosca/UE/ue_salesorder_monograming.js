/**
 *
 * @NScriptType UserEventScript
 * @NApiVersion 2.1
 */

define(['N/record'], function (record) {


    function beforeSubmit(context) {
        if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
            var newRecord = context.newRecord;

            var salesOrderLineCount = newRecord.getLineCount({
                sublistId: 'item',
            })
            //log.debug('salesOrderLineCount: ', salesOrderLineCount)

            let itemExist = isItemExist(newRecord, salesOrderLineCount)

            log.debug('itemExist  ', itemExist);
            if (itemExist == false) {
                let totalQuantity = getTotalQuantity(newRecord, salesOrderLineCount);
                // log.debug('totalQuantity  ', totalQuantity);
                if (totalQuantity != 0) {
                    var rate = getRate()
                    createlIne(newRecord, rate, totalQuantity, salesOrderLineCount, itemExist)

                }
                //log.debug('monogramming  ', monogramming);
            } else {
                let totalQuantity = getTotalQuantity(newRecord, salesOrderLineCount);
                // log.debug('totalQuantity  ', totalQuantity);
                if (totalQuantity != 0) {
                    var rate = getRate()
                    createlIne(newRecord, rate, totalQuantity, salesOrderLineCount, itemExist)


                }
            }
        }
    }

    function isItemExist(newRecord, salesOrderLineCount) {
        for (var i = 0; i < salesOrderLineCount; i++) {
            var itemId = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i,

            })

            if (itemId == 11) {
                return true
            }

        }
        return false;
    }

    function getTotalQuantity(newRecord, salesOrderLineCount) {
        var totalQuantity =0;
        log.debug('salesOrderLineCount  ', salesOrderLineCount);
        for (var i = 0; i < salesOrderLineCount; i++) {
            var itemId = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i,

            });

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
            //log.debug('monogramming  ', monogramming);
            //log.debug('priceLevel  ', priceLevel);

            if (monogramming !== "" && priceLevel == 'Online Price' && itemId != 11) {
                var qty = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i,
                })
                
                totalQuantity += qty
            }

        }

        return totalQuantity;
    }

    function getRate() {
        var nonInvantoryRec = record.load({
            type: 'noninventoryitem',
            id: 11,
            isDynamic: true
        });

        var priceLineCount = nonInvantoryRec.getLineCount({
            sublistId: 'price1',
        });
        var Rate = nonInvantoryRec.getSublistValue({
            sublistId: 'price1',
            fieldId: 'price_1_',
            line: 9,

        });
        if (Rate > 0) {
            return Rate *= -1
        }

        return Rate;
    }
    function createlIne(newRecord, Rate, totalQuantity, salesOrderLineCount, itemExist) {
        if (itemExist) {
            salesOrderLineCount -= 1;
        }

         log.debug('Rate  ', Rate);
         log.debug('totalQuantity  ', totalQuantity);
         log.debug('totalQuantity * Rate  ', totalQuantity * Rate);
        newRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            line: salesOrderLineCount,
            value: 11
        })
        newRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: salesOrderLineCount,
            value: totalQuantity
        })
        newRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            line: salesOrderLineCount,
            value: Rate
        })
        newRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'amount',
            line: salesOrderLineCount,
            value: (totalQuantity * Rate)
        })
    }
    return {

        beforeSubmit: beforeSubmit
    }


})